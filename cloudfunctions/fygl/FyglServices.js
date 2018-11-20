const moment = require('moment.min.js');
const utils = require('utils.js');
const cloud = require('wx-server-sdk')
const CONSTS = require('constants.js');
const config = require('config.js')
const commService = require('CommServices.js')
cloud.init({
  env: config.conf.env,   //'jjczwgl-bc6ef9'
  // env: 'jjczwgl-test-2e296e'
})
const db = cloud.database();
const _ = db.command;

// cloud.init({
//   env: 'jjczwgl-bc6ef9'
//   // env: 'jjczwgl-test-2e296e'
// })

exports.queryFyList = async (yzhid) => {
  //查询房源列表
  // const db = cloud.database();
  const result = db.collection('house').orderBy('fwmc', 'asc').where({
    yzhid
  }).get();
  return result;
}

async function queryLastzdList (params) {
  const {houseid} = params;
  const db = cloud.database();
  const _ = db.command;
  const result = db.collection('housefy').orderBy('sfsz','asc').orderBy('szrq','desc').limit(6).where({
    houseid,
  }).get();
  return result;
}
exports.queryLastzdList = queryLastzdList;

async function querySdbList (yzhid,data) {  
  const db = cloud.database();  
  const _ = db.command;
  let result;
  if(data && !utils.isEmpty(data.houseid)){
    result = await commService.queryPrimaryDoc('house',data.houseid);
    if(result) result = Array.of(result);
  }else{
    const szrqCond = moment().startOf('day').add(4, 'days').format('YYYY-MM-DD');
    console.log('szrqcond:'+szrqCond);
    result = await db.collection('house').where({
      yzhid,
      sfsz: _.in([CONSTS.SFSZ_YJQ, CONSTS.SFSZ_YJZ]),
      szrq: _.lte(szrqCond),
    }).get();
    // console.log('querysdb list:',result);
    result = result.data;
  }
  return result;
}
exports.querySdbList = querySdbList;

async function queryZdList(yzhid,data) {
  console.log('===queryzdlist:',data);
  const fyList = await querySdbList(yzhid,data);
  const resultList = fyList;
  let zdList = new Array(resultList.length);
  resultList.map((house,index)=>{
    if(house.sfsz === CONSTS.SFSZ_WJQ)
      throw utils.newException('当前帐单未结清，不能创建新帐单！');
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


exports.saveFy = async (house,curUser) => {
  let result;
  // 检查房屋名称是否重复
  result = await commService.querySingleDoc('house',{yzhid:curUser.yzhid,_id:_.neq(house._id),fwmc:house.fwmc});
  // console.log(result); 
  if(result)
    throw utils.newException("房屋名称已经存在！");
  let isAddDoc;
  if(utils.isEmpty(house._id)){
    isAddDoc = true;
    house._id = utils.id();
  }else{
    isAddDoc = false;
  }
// console.log('savefy:',isAddDoc,house._id);
  let { _id: saveHouseid, dhhm, avatarUrl } = house;
  if (utils.isEmpty(house.housefyid) && !utils.isEmpty(house.zhxm)) {
    // 如果为新签约，则自动生成合同帐单
    const newHousefy = makeHousefy(house, null,CONSTS.ZDLX_HTZD);
    await commService.addDoc('housefy',newHousefy);
  }
  // console.log('save house:',house);
  if(isAddDoc){
    await commService.addDoc('house', house);
  }else{
    await commService.updateDoc('house', house);
  }  

  //关联用户注册的手机号
  if(utils.isEmpty(avatarUrl) && !utils.isEmpty(dhhm)){
    result = await commService.querySingleDoc('userb', { sjhm:dhhm });
    if(result){
      await commService.updateDoc('house', { _id: saveHouseid, avatarUrl:result.avatarUrl});
      // console.log('关联租户头像：',updatedNum);
    }
  }
  return null;
}
// exports.saveFy = async (house, curUser) => {
//   let result;
//   // 检查房屋名称是否重复
//   result = await commService.querySingleDoc('house', { yzhid: curUser.yzhid, _id: _.neq(house._id), fwmc: house.fwmc });
//   // console.log(result); 
//   if (result)
//     throw utils.newException("房屋名称已经存在！");

//   if (utils.isEmpty(house.housefyid) && !utils.isEmpty(house.zhxm)) {
//     // 如果为新签约，则自动生成合同帐单
//     const newHousefy = makeHousefy(house, null, CONSTS.ZDLX_HTZD);
//     // 结转房屋数据
//     const housefyResult = await commService.addDoc('housefy', newHousefy);
//     house.housefyid = housefyResult._id;
//     if (utils.isEmpty(house.housefyid))
//       throw utils.newException("生成签约帐单失败！");
//   }
//   let { _id: saveHouseid, dhhm, avatarUrl } = house;
//   if (utils.isEmpty(house._id)) {
//     //如果是添加房源，则先保存房屋数据，以便拿到ID
//     result = await commService.addDoc('house', house);
//     house._id = result._id;
//     if (utils.isEmpty(house._id))
//       throw utils.newException("添加房源失败！");
//     console.log("===house.housefyid:" + house.housefyid + ",house._id:" + house._id);
//     saveHouseid = house._id;
//     if (!utils.isEmpty(house.housefyid)) {
//       //更新housefy中的houseid
//       const updatedNum = await commService.updateDoc('housefy', { _id: house.housefyid, houseid: house._id });
//       console.log(updatedNum);
//       if (updatedNum === 0) {
//         throw utils.newException("关联签约帐单表失败！");
//       }
//     }
//   } else {
//     //更新房源
//     const updatedNum = await commService.updateDoc('house', house);
//     // console.log(result);
//     // const updatedNum = result.stats.updated;
//     if (updatedNum === 0) {
//       throw utils.newException("更新房屋表失败！");
//     }
//   }

//   //关联用户注册的手机号
//   if (utils.isEmpty(avatarUrl)) {
//     result = await commService.querySingleDoc('userb', { sjhm: dhhm });
//     if (result) {
//       const updatedNum = await commService.updateDoc('house', { _id: saveHouseid, avatarUrl: result.avatarUrl });
//       console.log('关联租户头像：', updatedNum);
//     }
//   }

//   return null;
// }

exports.exitFy = async (data,curUser) => {
  const { houseid,tfrq } = data;
  let house = await commService.queryPrimaryDoc('house',houseid);
  if(!house)
    throw utils.newException("未查到房屋数据!");

  if(utils.isEmpty(house.dbcds) || utils.isEmpty(house.sbcds))  
    throw utils.newException("请先抄当前的水电表再退房!");
  const {sfsz} = house;
  let housefy=null;
  if (sfsz === CONSTS.SFSZ_WJQ){
    //当前帐单未结清，则刷新当前帐单为退房帐单
    housefy = await commService.queryPrimaryDoc('housefy',house.housefyid);
    if (!housefy)
      throw utils.newException("未查到房屋当前的帐单数据!");
    if(housefy.zdlx === CONSTS.ZDLX_HTZD)
      throw utils.newException("签约帐单未结清，不能退房!");
  } else if (sfsz === CONSTS.SFSZ_YTF) {
    //帐单状态为已退房 ，则直接办理退房
    return;
  }else{
    //帐单状态为已结清或已结转 ，则生成新的退房帐单
  }
  newHousefy = makeHousefy(house, housefy, CONSTS.ZDLX_TFZD,tfrq);
  house.zhxgr = curUser.userid;
  house.zhxgsj = utils.getCurrentTimestamp();
  newHousefy.zhxgr = curUser.userid;
  newHousefy.zhxgsj = house.zhxgsj;

  console.log('exitfy sfsz:',sfsz);

  if (sfsz === CONSTS.SFSZ_WJQ) {
    //未结清，刷新当前帐单
    const housefyNum = await commService.updateDoc('housefy', newHousefy);
    if (housefyNum === 0)
      throw utils.newException("退房帐单数据更新失败！");
  }else{
    //已结清，生成新的退房帐单
    const housefyResult = await commService.addDoc('housefy', newHousefy);
    console.log('生成新的退房帐单ID:', housefyResult);
    house.housefyid = housefyResult;
    if (utils.isEmpty(house.housefyid))
      throw utils.newException("生成退房帐单失败！");
  }
  const houseNum = await commService.updateDoc('house', house);
  if (houseNum === 0)
    throw utils.newException("房源数据更新失败！");
}


// exports.addFy = async (house) => {
//   //添加房源
//   // return saveDoc('house',house);
//   const db = cloud.database();
//   const result = db.collection('house').add({
//     data:house
//   });
//   return result;
// }

// exports.updateFy = async (house) => {
//   const db = cloud.database();
//   const {_id} = house;
//   delete house._id;
//   // house.szrq = db.serverDate();
//   const result = db.collection('house').doc(_id).update({
//     data: house
//   });
//   return result;
// }

exports.deleteFy = async (house) => {
  const { houseid } = house;
  const num = await commService.removeDoc('house',houseid);
  if(num<1)
    throw utils.newException('房源ID:'+houseid);
  //删除对应的帐单数据
  const housefyList = await commService.queryDocs('housefy', { houseid });
  if (housefyList) {
    for (let i = 0; i < housefyList.length; i++) {
      await commService.removeDoc('housefy', housefyList[i]._id);
    } 
  }
}

exports.tfFy = async (data) => {
  const { houseid } = data;
  const house = await commService.queryPrimaryDoc('house', houseid);
  // console.log('tffy:',houseid);
  const housefyList = await commService.queryDocs('housefy',{houseid});
  console.log('tffy:', houseid,housefyList);
  if(housefyList){
    for(let i=0;i<housefyList.length;i++){
      await commService.addDoc('housefy_tf', housefyList[i]);
    }
  }
  await commService.addDoc('house_tf', house);
  // 房源数据保存进退房表扣，删除再数据
  await commService.removeDoc('house',house._id);
  if (housefyList) {
    for (let i = 0; i < housefyList.length; i++) {
      await commService.removeDoc('housefy', housefyList[i]._id);
    }
  }
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

  console.log('makezd ids:',selectedRowkeys);
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
      const housefyResult = await commService.addDoc('housefy',newHousefy); 
      console.log("makezd housefyid:",housefyResult); 
      house.housefyid = housefyResult;
      const houseNum = await commService.updateDoc('house',house);
      if(houseNum===0)
        throw utils.newException("更新房源信息失败！");      
      //生成帐单完成，发送短信提醒
      await sendZdMessage(house);

    }catch(e){
      errMsg += house.fwmc+','+e.message;
    }
  };
  if(!utils.isEmpty(errMsg)) throw utils.newException(errMsg);
  return null;
}

const sendZdMessage= async (house,flag)=>{
  const {dhhm,fwmc,zhxm,fyhj,zdlx} = house;
  //只发送月结帐单短信
  if(zdlx !== CONSTS.ZDLX_YJZD)
    throw utils.newException('只发送月结帐单短信！');

  // const result = await commService.querySingleDoc('userb', { sjhm:dhhm });
  // if (!result) return;
  // let info;
  // if(flag==='sxzd') 
  //   info = '发生变动';
  // else
  //   info = '已出';
  const message =  getZdMessage(house);
  // const message = fwmc + '房租户,' + zhxm + ',您好!您本月帐单'+info+',应缴费用为:' + fyhj + '元，帐单详情请进入极简出租系统查看。【极简出租】';
  console.log('sendzdmessage:',dhhm,message);
  // await utils.sendPhoneMessage(dhhm,message);
}

const getZdMessage = (house) => {
  const s = `${house.fwmc}房租户`;
  return s;
  // dfhj='合计: { { item.dfhj } } 元(上次: {{ item.dscds }}, 本次: {{ item.dbcds }}, 实用: { { item.dsyds } }, 公摊: { { item.dgtds ? item.dgtds : 0 } }, 单价: { { item.ddj } } 元)
}

exports.processQrsz = async (params,userb) => {
  const { housefyid, flag } = params;
  const db = cloud.database();
  const _ = db.command;

  let housefy = await commService.queryPrimaryDoc('housefy',housefyid);// db.collection('housefy').doc(housefyid).get();
  // const housefy = result.data;
  if (!housefy) throw utils.newException("未查到房源帐单记录：" + housefyid);
  const {houseid} = housefy;
  // result = await db.collection('house').doc(houseid).get();
  // const house = result.data;
  let house = await commService.queryPrimaryDoc('house', houseid);
  if (!house) throw utils.newException("未查到房源记录：" + houseid);

  if ("sxzd" === flag && housefyid !== house.housefyid)
    throw utils.newException("帐单数据与主房屋不匹配，刷新帐单失败！");
  let lastFyhj;
  if ("sxzd" === flag) {
    // 刷新帐单
    // console.log("qrsz zdlx:", housefy.zdlx);
    lastFyhj = house.fyhj;
    makeHousefy(house, housefy, null);
  }else if ("sjdx" === flag) {
    await sendZdMessage(house);
    return queryLastzdList({ houseid });
  } else {
    jzHouse(house, housefy, flag);
  }

  house.zhxgr=userb.userid;
  house.zhxgsj = utils.getCurrentTimestamp();
  housefy.zhxgr=userb.userid;
  housefy.zhxgsj = house.zhxgsj;
  const housefyNum = await commService.updateDoc('housefy',housefy);
  if(housefyNum===0)
    throw utils.newException("帐单数据更新失败！");
  const houseNum = await commService.updateDoc('house',house);
  if (houseNum === 0)
    throw utils.newException("房源数据更新失败！");
  console.log("processQrsz:",flag,houseid);

  if ("sxzd" === flag && lastFyhj!==house.fyhj) {
  //帐单有变动，发出短信提醒
    // await sendZdMessage(house,'sxzd');
  }
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
  return utils.roundNumber(df, 1);
}

function jssf(house) {
  const ssyds = utils.getInteger(house.sbcds)
    - utils.getInteger(house.sscds)
    + utils.getInteger(house.sgtds);
  const sf = ssyds * utils.getFloat(house.sdj);
  return utils.roundNumber(sf,1);
}

function jsqtfhj(house) {
  const qtfy = utils.getInteger(house.czje)
    + utils.getInteger(house.wlf)
    + utils.getInteger(house.glf)
    + utils.getInteger(house.ljf)
    + utils.getFloat(house.qtf)
    + utils.getFloat(house.syjzf);
  return utils.roundNumber(qtfy, 1);
}

function makeHousefy(house, housefy, zdlx,tfrq){
  // 计算收租范围
  let szrq = moment(house.szrq);
  if (!szrq.isValid()) throw utils.newException("收租日期不合法！");

  if (!housefy) {
    housefy = {
      _id: utils.id(),
      lrr:house.lrr,
      lrsj:utils.getCurrentTimestamp(),
    };
  } else {
    if(!zdlx) zdlx = housefy.zdlx;
  }
  // console.log('makehousefy zdlx:', CONSTS.ZDLX_HTZD === zdlx);
  let xcszrq, rq1, rq2,yffrq1,yffrq2;
  // console.log('housefy tsinfo:', housefy.daysinfo, housefy.monthNum);
  housefy.daysinfo = "";
  housefy.monthNum = "";
  // console.log('housefy tsinfo after assign:', housefy.daysinfo, housefy.monthNum);
  if (CONSTS.ZDLX_TFZD === zdlx) {
    const { sfsz } = house;
    if(!tfrq) 
      throw utils.newException("请在房源列表功能页中重新执行退房操作！");

    tfrq = moment(tfrq);
    console.log('tfrq:',tfrq,house.rq1);

    // 退房帐单的收租日期为退房日期
    xcszrq = tfrq;
    szrq = tfrq;
    if(sfsz === CONSTS.SFSZ_WJQ){
      // 未结清，起始日期不变
      yffrq1 = moment(house.yffrq1);
    }else{
      // 已结清，起始日期为上段未
      yffrq1 = moment(house.yffrq2);
    }
    yffrq2 = szrq.clone();//.subtract(1, 'days');
    const days = yffrq2.diff(yffrq1, 'days');
    console.log('yffrq2 - yffrq1:',days);
    let yzj,daysinfo=null;
    if (days == 30 || days == 31){
      yzj = house.czje;
      daysinfo = '补1个月租金';
    }else if (days == -30 || days == -31) {
      yzj = -house.czje;
      daysinfo = '退1个月租金';
    }else{
      yzj = Math.round((utils.getFloat(house.czje) / 30) * days); // 计算合同退房时月租金
      daysinfo = (days>0?'补':'退')+(Math.abs(days))+'天租金';
    }
    housefy.daysinfo = daysinfo;
    housefy.czje = yzj; // 按天计算已住月租金
    // 电费数据
    housefy.dbcds = house.dbcds;
    housefy.dscds = house.dscds;
    housefy.dsyds = utils.getInteger(housefy.dbcds) - utils.getInteger(housefy.dscds);
    housefy.dgtds = house.dgtds;
    housefy.ddj = house.ddj;
    housefy.dfhj = jsdf(house);

    // 水费数据
    housefy.sbcds = house.sbcds;
    housefy.sscds = house.sscds;
    housefy.ssyds = utils.getInteger(housefy.sbcds) - utils.getInteger(housefy.sscds);
    housefy.sgtds = house.sgtds;
    housefy.sdj = house.sdj;
    housefy.sfhj = jssf(house);
    
    housefy.yj = -house.yj; // 退押金
    housefy.syjzf = house.syjzf;
    housefy.qtf = house.qtf;

    //后付费时间范围
    if (sfsz === CONSTS.SFSZ_WJQ) {
      // 未结清，起始日期不变
      rq1 = moment(house.rq1);
    } else {
      // 已结清，起始日期为当前收租日期
      // rq1 = moment(house.rq2).add;
      rq1 = moment(house.rq2);//.add(1, 'days');
    }
    rq2 = yffrq2;
    const qtfDays = rq2.diff(rq1, 'days');
    console.log('js qtfdays:', rq2,rq1,qtfDays);
    let monthNum = Math.ceil((qtfDays - 3) / 30);  //按月为单位计算其它费用（留3天的退房时间),超过3天，则按1月计
    console.log('monthNum:',monthNum);
    if(monthNum<0) monthNum = 0;
    housefy.glf = utils.getInteger(house.glf) * monthNum;
    housefy.wlf = utils.getInteger(house.wlf) * monthNum;
    housefy.ljf = utils.getInteger(house.ljf) * monthNum;
    if(monthNum>1){
      housefy.monthNum = monthNum+"";
    }

    // 房屋合计费
    housefy.fyhj = utils.roundNumber(utils.getFloat(housefy.dfhj)
      + utils.getFloat(housefy.sfhj) + utils.getInteger(housefy.yj) + jsqtfhj(housefy), 1);
    // housefy.qtf = house.qtf;
    // housefy.dbcds = house.dscds;
    // housefy.Sbcds = house.Sscds;
    // 房屋合计费
    // housefy.fyhj = utils.getInteger(housefy.czje)
    //   + utils.getInteger(housefy.yj)
    //   + utils.getFloat(housefy.qtf);
  }else if (CONSTS.ZDLX_HTZD === zdlx) {
    console.log('htzd');    
    // 合同帐单的下次收租日期为当前录入的时间
    xcszrq = szrq;
    yffrq1 = moment(house.htrqq); // 收租范围起始时间为合同日期起
    if(!yffrq1.isValid()) 
      throw utils.newException("合同起始日期不合法！");
    yffrq2 = szrq.clone();//.subtract(1,'days');
    const days = yffrq2.diff(yffrq1,'days');// + 1;
    if (days < 0)
      throw utils.newException("下次收租日期不能小于合同起始日期！");
    let yzj;
    if (days == 30 || days == 31){
      yzj = house.czje;
    }else{
      yzj = Math.round((utils.getFloat(house.czje) / 30) * days); // 计算合同签约时月租金
      housefy.daysinfo = '收'+days+'天租金';
    }
    //合同帐单，赋值后付费与预付费时间范围相同
    rq1 = yffrq1;
    rq2 = yffrq2;

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
    //后付费时间范围
    rq1 = szrq.clone().subtract(1, 'months');
    if(rq1.format('YYYY-MM-DD')<house.htrqq){
      rq1 = moment(house.htrqq);
    }
    rq2 = szrq.clone();//.subtract(1, 'days');
    //预付费时间范围
    yffrq1 = szrq.clone();
    yffrq2 = xcszrq.clone();//.subtract(1, 'days');

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
    housefy.fyhj = utils.roundNumber(utils.getFloat(housefy.dfhj)
      + utils.getFloat(housefy.sfhj) + jsqtfhj(house),1);
  }

  // 日期范围
  housefy.szrq = xcszrq.format('YYYY-MM-DD');
  housefy.rq1 = rq1.format('YYYY-MM-DD');
  housefy.rq2 = rq2.format('YYYY-MM-DD');
  housefy.yffrq1 = yffrq1.format('YYYY-MM-DD');
  housefy.yffrq2 = yffrq2.format('YYYY-MM-DD');

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
  house.yffrq1 = housefy.yffrq1;
  house.yffrq2 = housefy.yffrq2;
  house.fyhj=housefy.fyhj;
  house.housefyid = housefy._id;
  // console.log('housefy tsinfo end:', housefy.daysinfo, housefy.monthNum);
  return housefy;
}

/**
 * 更新表的记录，返回更新成功的记录数
 */
// const updateDoc = async (tableName,docObj) => {
//   const db = cloud.database();
//   const { _id } = docObj;
//   delete docObj._id;
//   const result = await db.collection(tableName).doc(_id).update({
//     data: docObj
//   });
//   const updatedNum = result.stats.updated;

//   return updatedNum;
// }

// const addDoc = async (tableName, docObj) => {
//   const db = cloud.database();
//   const result = db.collection(tableName).add({
//     data: docObj
//   });
//   return result;
// }
