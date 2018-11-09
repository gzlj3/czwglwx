const moment = require('moment.min.js');
const utils = require('utils.js');
const cloud = require('wx-server-sdk')
const CONSTS = require('constants.js');

cloud.init()

exports.queryFyList = async (yzhid) => {
  //查询房源列表
  const db = cloud.database();
  const result = db.collection('house').where({
    yzhid
  }).get();
  return result;
}

exports.queryLastzdList = async (params) => {
  const {houseid} = params;
  const db = cloud.database();
  const _ = db.command;
  const result = db.collection('housefy').where({
    houseid,
  }).get();
  return result;
}

async function querySdbList (yzhid) {
  const db = cloud.database();  
  const _ = db.command;
  const szrqCond = moment().startOf('day').add(4, 'days').format('YYYY-MM-DD');
  console.log('szrqcond:'+szrqCond);
  const result = db.collection('house').where({
    yzhid,
    sfsz: _.in(['1','2']),
    szrq: _.lte(szrqCond),
  }).get();
  return result;
}
exports.querySdbList = querySdbList;

exports.queryZdList = async (yzhid) => {
  const fyList = await querySdbList(yzhid);
  const resultList = fyList.data;
  let zdList = new Array(resultList.length);
  resultList.map((house,index)=>{
    zdList[index] = {};
    zdList[index]._id = house._id;
		try {
      const fwfy = jsFwfy(house);
      zdList[index].tsinfo = house.fwmc+',帐单费用:'+fwfy+'元';
      zdList[index].checked = true;
      zdList[index].disabled = false;
    } catch (e) {
      // console.log(e);
      zdList[index].tsinfo = house.fwmc +","+(e.message?e.message:e);
      zdList[index].disabled = true;
    }
  });
  return zdList;
}

exports.addFy = async (house) => {
  //添加房源
  const db = cloud.database();
  const result = db.collection('house').add({
    data:house
  });
  return result;
}

exports.updateFy = async (house) => {
  const db = cloud.database();
  const {_id} = house;
  delete house._id;
  // house.szrq = db.serverDate();
  const result = db.collection('house').doc(_id).update({
    data: house
  });
  return result;
}

exports.updateSdb = async (houseList) => {
  const db = cloud.database();
  let tasks = [];
  const _ = db.command;
  houseList.map((house)=>{
    const { _id } = house;
    const promise = db.collection('house').doc(_id).update({
      data: {
        dbcds: house.dbcds && house.dbcds !== '' ? house.dbcds : _.remove(),
        sbcds: house.sbcds && house.sbcds !== '' ? house.sbcds : _.remove(),
      }
    });
    tasks.push(promise);
  });
  return Promise.all(tasks);
}

exports.updateZdList = async (zdList) => {
  const db = cloud.database();
  const _ = db.command;
  const houseTable = db.collection('house');
  const housefyTable = db.collection('housefy');
  let selectedRowkeys = [];
  zdList.map((zd) => {
    const { _id, checked } = zd;
    if(checked) selectedRowkeys.push(_id);
  });

  // console.log(selectedRowkeys);
  const list = await houseTable.where({
    _id: _.in(selectedRowkeys),
  }).get();

  const houseList = list.data;

  let tasks = [];
  houseList.map((house)=>{ 
    // 生成新帐单
    const {_id} = house;
    const newHousefy = makeHousefy(house, null,
      CONSTS.ZDLX_YJZD);
    console.log(newHousefy);
    const housefyPromise = housefyTable.add({ data: newHousefy });
    delete house._id;
    const housePromise = houseTable.doc(_id).set({data:house});
    tasks.push(housefyPromise);
    tasks.push(housePromise);
  });
  return Promise.all(tasks);
}

function jsFwfy(house){
  if (!house.sbcds || !house.dbcds)
    throw "未抄水电表";

  // 计算电费
  const df = jsdf(house);
  if (df < 0)
    throw "电费计算小于0";
  // 计算水费
  const sf = jssf(house);
  if (sf < 0)
    throw "水费计算小于0";
  // 计算合计费
  const fwfy = df + sf + jsqtfhj(house);
  if (fwfy <= 0)
    throw "无帐单费用";
  return fwfy;
}

function jsdf(house) {
  const dsyds = utils.getInteger(house.dbcds)
    - utils.getInteger(house.dscds)
    + utils.getInteger(house.dgtds);
  const df = dsyds * utils.getFloat(house.ddj);
  return df;
}

function jssf(house) {
  const ssyds = utils.getInteger(house.sbcds)
    - utils.getInteger(house.sscds)
    + utils.getInteger(house.sgtds);
  const sf = ssyds * utils.getFloat(house.sdj);
  return sf;
}

function jsqtfhj(house) {
  const qtfy = utils.getInteger(house.czje)
    + utils.getInteger(house.wlf)
    + utils.getInteger(house.glf)
    + utils.getInteger(house.ljf)
    + utils.getFloat(house.qtf)
    + utils.getFloat(house.syjzf);
  return qtfy;
}

function makeHousefy(house, housefy, zdlx){
  // 计算收租范围
  const szrq = moment(house.szrq);
  if (!szrq.isValid()) throw "收租日期不合法！";

  if (!housefy) {
    housefy = {};
  } else {
    zdlx = housefy.zdlx;
  }

  let xcszrq, rq1, rq2;
  if (CONSTS.ZDLX_HTZD === zdlx) {
    // 合同帐单的下次收租日期为当前录入的时间
    xcszrq = szrq;
    rq1 = moment(house.htrqq); // 收租范围起始时间为合同日期起
    if(!rq1.isValid()) 
      throw "合同起始日期不合法！";
    rq2 = szrq.subtract(1,'days');
    const days = rq2.diff(rq1,'days') + 1;
    if (days < 0)
      throw "下次收租日期不能小于合同起始日期！";
    let yzj;
    if (days == 30 || days == 31)
      yzj = house.Czje();
    else
      yzj = Math.round((utils.getFloat(house.czje) / 30) * days); // 计算合同签约时月租金
    housefy.czje = yzj; // 月租金
    housefy.yj = house.yj; // 押金
    housefy.qtf=house.qtf;
    housefy.dbcds=house.dscds;
    housefy.Sbcds=house.Sscds;
    // 房屋合计费
    housefy.fyhj = utils.getInteger(housefy.czje)
      + Utils.getInteger(housefy.yj)
      + Utils.getFloat(housefy.qtf);
  } else {
    xcszrq = szrq.add(1,'months');
    rq1 = szrq.subtract(1, 'months'); 
    rq2 = szrq.subtract(1, 'days');

    housefy.czje=house.czje;
    // 电费数据
    housefy.dbcds=house.dbcds;
    housefy.dscds=house.dscds;
    housefy.dsyds = utils.getInteger(housefy.dbcds) - utils.getInteger(housefy.dscds);
    housefy.dgtds=house.dgtds;
    housefy.ddj=house.ddj;
    housefy.dfhj = jsdf(house);

    // 水费数据
    housefy.sbcds=house.sbcds;
    housefy.sscds=house.sscds;
    housefy.ssyds = utils.getInteger(housefy.sbcds) - utils.getInteger(housefy.sscds);
    housefy.sgtds=house.sgtds;
    housefy.sdj=house.sdj;
    housefy.sfhj = jssf(house);
    // 房屋其它费用
    housefy.glf=house.glf;
    housefy.wlf=house.wlf;
    housefy.ljf=house.ljf;
    housefy.syjzf=house.syjzf;
    housefy.qtf=house.qtf;

    // 房屋合计费
    housefy.fyhj = utils.getFloat(housefy.dfhj)
      + utils.getFloat(housefy.sfhj) + jsqtfhj(house);
  }

  // 日期范围
  housefy.szrq = xcszrq.format('YYYY-MM-DD');
  housefy.rq1 = rq1.format('YYYY-MM-DD');
  housefy.rq2 = rq2.format('YYYY-MM-DD');

  // 房屋信息
  housefy.houseid=house._id;
  housefy.fwmc=house.fwmc;
  housefy.zhxm=house.zhxm;

  // 是否收租
  housefy.sfsz = "0";
  housefy.zdlx = zdlx;

  // 生成更新人和时间
  housefy.yzhid=house.yzhid;
  housefy.zhxgr=house.zhxgr;
  housefy.zhxgsj=house.zhxgsj;

  // 更新房屋数据
  house.sfsz = "0"; // 设置房屋为未收租
  house.zdlx = zdlx;
  house.rq1 = housefy.rq1;
  house.rq2= housefy.rq2;
  house.fyhj=housefy.fyhj;
  house.housefyid = housefy._id;
  return housefy;
}
