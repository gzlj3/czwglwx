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

async function queryLastzdList (params) {
  const {houseid} = params;
  const db = cloud.database();
  const _ = db.command;
  const result = db.collection('housefy').orderBy('szrq','desc').limit(6).where({
    houseid,
  }).get();
  return result;
}
exports.queryLastzdList = queryLastzdList;

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

async function queryZdList(yzhid) {
  const fyList = await querySdbList(yzhid);
  const resultList = fyList.data;
  let zdList = new Array(resultList.length);
  resultList.map((house,index)=>{
    zdList[index] = {};
    zdList[index]._id = house._id;
		try {
      const fwfy = jsFwfy(house);
      zdList[index].tsinfo = house.fwmc+','+house.zhxm+',帐单:'+fwfy+'元';
      zdList[index].checked = true;
      zdList[index].disabled = false;
    } catch (e) {
      // console.log(e);
      zdList[index].tsinfo = house.fwmc +","+e.message;
      zdList[index].disabled = true;
    }
  });
  return zdList;
}
exports.queryZdList = queryZdList;


exports.saveFy = async (house) => {
  let result;
  // 检查房屋名称是否重复

  if (utils.isEmpty(house.housefyid) && !utils.isEmpty(house.zhxm)) {
    // 如果为新签约，则自动生成合同帐单
    const newHousefy = makeHousefy(house, null,CONSTS.ZDLX_HTZD);
    // 结转房屋数据
    const housefyResult = await addDoc('housefy',newHousefy);
    house.housefyid = housefyResult._id;
    if(utils.isEmpty(house.housefyid))
      throw utils.newException("生成签约帐单失败！");
  }
  if (utils.isEmpty(house._id)) {
    //如果是添加房源，则先保存房屋数据，以便拿到ID
    result = await addDoc('house', house);
    house._id = result._id;
    if (utils.isEmpty(house._id))
      throw utils.newException("添加房源失败！");
    if(!utils.isEmpty(house.housefyid)){
      //更新housefy中的houseid
      const updatedNum  = updateDoc('housefy', {_id:house.housefyid,houseid:house._id});
      if(updatedNum===0){
        throw utils.newException("关联签约帐单表失败！");
      }
    }
  } else {
    //更新房源
    const updatedNum = updateDoc('house', house);
    // console.log(result);
    // const updatedNum = result.stats.updated;
    if (updatedNum === 0) {
      throw utils.newException("更新房屋表失败！");
    }
  } 
  return null;
}


exports.addFy = async (house) => {
  //添加房源
  // return saveDoc('house',house);
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

  console.log(selectedRowkeys);
  const list = await houseTable.where({
    _id: _.in(selectedRowkeys),
  }).get();

  const houseList = list.data;
  // console.log(houseList);

  let errMsg = '';
  for(i=0;i<houseList.length;i++){
  // houseList.map(async (house)=>{
    let house = houseList[i];
    try{
      // 生成新帐单
      const {_id} = house;
      const newHousefy = makeHousefy(house, null,CONSTS.ZDLX_YJZD);
      // console.log(newHousefy);
      const housefyResult = await addDoc('housefy',newHousefy); 
      console.log("======="+housefyResult._id); 
      house.housefyid = housefyResult._id;
      const houseNum = updateDoc('house',house);
      if(houseNum===0)
        throw utils.newException("更新房源信息失败！");      
    }catch(e){
      errMsg += e.message;
    }
  };
  if(!utils.isEmpty(errMsg)) throw utils.newException(errMsg);
  return null;
}

exports.processQrsz = async (params,userb) => {
  const { housefyid, flag } = params;
  const db = cloud.database();
  const _ = db.command;

  let result = await db.collection('housefy').doc(housefyid).get();
  const housefy = result.data;
  if (!housefy) throw utils.newException("未查到房源帐单记录：" + housefyid);
  const {houseid} = housefy;
  result = await db.collection('house').doc(houseid).get();
  const house = result.data;
  if (!house) throw utils.newException("未查到房源记录：" + houseid);

  if ("sxzd" === flag && housefyid !== house.housefyid)
    throw utils.newException("帐单数据与主房屋不匹配，刷新帐单失败！");

  if ("sxzd" === flag) {
    // 刷新帐单
    makeHousefy(house, housefy, null);
  } else {
    jzHouse(house, housefy, flag);
  }

  house.zhxgr=userb.userid;
  house.zhxgsj = utils.getCurrentTimestamp();
  housefy.zhxgr=userb.userid;
  housefy.zhxgsj = house.zhxgsj;
  const housefyNum = updateDoc('housefy',housefy);
  if(housefyNum===0)
    throw utils.newException("帐单数据更新失败！");
  const houseNum = updateDoc('house',house);
  if (houseNum === 0)
    throw utils.newException("房源数据更新失败！");
  console.log("=====:" + houseid);
  return queryLastzdList({houseid});
}

function jzHouse(house, housefy, flag) {
  // 更新房源上次收租日期
  house.szrq = housefy.szrq;
  // 更新房源结转数据
  house.dscds=housefy.dbcds;
  house.sscds=housefy.sbcds;
  house.dbcds="";
  house.sbcds="";
  if ("jzzd"===flag) {
    // 结转帐单
    house.syjzf=housefy.fyhj;
    house.sfsz="2";
    housefy.sfsz="2";
  } else if ("qrsz"===flag) {
    // 确认收租
    house.syjzf="";
    house.sfsz="1";
    housefy.sfsz="1";
  } else {
    throw utils.newException("未知的帐单处理动作，帐单处理失败！");
  }
}


function jsFwfy(house){
  if (!house.sbcds || !house.dbcds)
    throw utils.newException("未抄水电表");

  // 计算电费
  const df = jsdf(house);
  if (df < 0)
    throw utils.newException("电费计算小于0");
  // 计算水费
  const sf = jssf(house);
  if (sf < 0)
    throw utils.newException("水费计算小于0");
  // 计算合计费
  const fwfy = df + sf + jsqtfhj(house);
  if (fwfy <= 0)
    throw utils.newException("无帐单费用");
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
  if (!szrq.isValid()) throw utils.newException("收租日期不合法！");

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
      throw utils.newException("合同起始日期不合法！");
    rq2 = szrq.clone().subtract(1,'days');
    const days = rq2.diff(rq1,'days') + 1;
    if (days < 0)
      throw utils.newException("下次收租日期不能小于合同起始日期！");
    let yzj;
    if (days == 30 || days == 31)
      yzj = house.czje;
    else
      yzj = Math.round((utils.getFloat(house.czje) / 30) * days); // 计算合同签约时月租金
    housefy.czje = yzj; // 月租金
    housefy.yj = house.yj; // 押金
    housefy.qtf=house.qtf;
    housefy.dbcds=house.dscds;
    housefy.Sbcds=house.Sscds;
    // 房屋合计费
    housefy.fyhj = utils.getInteger(housefy.czje)
      + utils.getInteger(housefy.yj)
      + utils.getFloat(housefy.qtf);
  } else {
    xcszrq = szrq.clone().add(1,'months');
    rq1 = szrq.clone().subtract(1, 'months'); 
    if(rq1.format('YYYY-MM-DD')<house.htrqq){
      rq1 = moment(house.htrqq);
    }

    rq2 = szrq.clone().subtract(1, 'days');

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

/**
 * 更新表的记录，返回更新成功的记录数
 */
const updateDoc = async (tableName,docObj) => {
  const db = cloud.database();
  const { _id } = docObj;
  delete docObj._id;
  const result = await db.collection(tableName).doc(_id).update({
    data: docObj
  });
  const updatedNum = result.stats.updated;

  return updatedNum;
}

const addDoc = async (tableName, docObj) => {
  const db = cloud.database();
  const result = db.collection(tableName).add({
    data: docObj
  });
  return result;
}
