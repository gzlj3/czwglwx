const moment = require('moment.min.js');
const utils = require('utils.js');
const phone = require('phone.js');
const cloud = require('wx-server-sdk')
const CONSTS = require('constants.js');
const config = require('config.js')
const commService = require('CommServices.js')
cloud.init({
  env: config.conf.env, 
})
const db = cloud.database();
const _ = db.command;

let USER;
exports.setUser = (curUser)=>{
  USER = curUser;
};

// cloud.init({
//   env: 'jjczwgl-bc6ef9'
//   // env: 'jjczwgl-test-2e296e'
// })

exports.queryFyList = async (curUser) => {
  //查询房源列表
  const {sjhm,yzhid,userType,collid} = curUser;
  let { granted} = curUser;
  let result;
  if(commService.isZk(userType)){
    const sjhmCond = ','+sjhm+',';
    result = await commService.queryAllDoc('house', { querySjhm: db.RegExp({ regexp: sjhmCond})});
  }else{
    if(!granted) granted = [];
    granted.unshift({collid:curUser.collid,nickName:null,yzhid:curUser.yzhid});
    let resultList = [];
    for (let i = 0; i < granted.length; i++) {
      if (!granted[i]) continue;
      const { collid, nickName, yzhid, rights } = granted[i];
      try{
        result = await db.collection(commService.getTableName('house', collid)).field({htdata:false}).orderBy('sfsz','asc').orderBy('fwmc', 'asc').where({
          yzhid
        }).get(); 
      }catch(e){
        if (e.errCode === -502005) {
          result = null;
        }else{
          throw e;
        }
      }
      //计算费用合计数
      // let czjehj=0,sfhj=0,dfhj=0,fyhj=0;
      // result.data.map(value=>{
      //   czjehj += utils.getInteger(value.czje);
      //   sfhj += utils.getFloat(value.sfhj);
      //   dfhj += utils.getFloat(value.dfhj);
      //   fyhj += utils.getFloat(value.fyhj);
      // });
      // fyhj = utils.roundNumber(fyhj,1);
      // dfhj = utils.roundNumber(dfhj,1);
      // sfhj = utils.roundNumber(sfhj,1);
      if (result && result.data.length > 0) {
        resultList.push({ collid, nickName,yzhid,rights,sourceList: result.data });
      }
    }
    result = resultList;
  }
  //计算费用合计数
  // result.map(onefd=>{
  //   let czjehj = 0, sfhj = 0, dfhj = 0, fyhj = 0;
  //   onefd.sourceList.map(value => {
  //     czjehj += utils.getInteger(value.czje);
  //     sfhj += utils.getFloat(value.sfhj);
  //     dfhj += utils.getFloat(value.dfhj);
  //     fyhj += utils.getFloat(value.fyhj);
  //   });
  //   fyhj = utils.roundNumber(fyhj, 1);
  //   dfhj = utils.roundNumber(dfhj, 1);
  //   sfhj = utils.roundNumber(sfhj, 1);
  //   onefd.czjehj = czjehj;
  //   onefd.sfhj = sfhj;
  //   onefd.dfhj = dfhj;
  //   onefd.fyhj = fyhj;
  // });

  return result;
}

async function queryLastzdWithGrantcode(params, userInfo) {
  const {grantcode} = params;
  let result = await commService.queryGrantcode(grantcode, config.grantcodeYxq,userInfo.openId);
  // let result = await commService.querySingleDoc('grantcode',{grantcode});
  // // console.log('querygrantcode:',result);
  // if(!result)
  //   throw utils.newException('授权码错误或已失效！');
  const { housefyid, createtime, collid, flag, sjhm, nickName,registered} = result;
  // if (utils.currentTimeMillis() - createtime >= config.grantcodeYxq){
  if (!result.isValid){
    result = [];
    // throw utils.newException('授权码已失效！');
  }else{
    result = await commService.queryPrimaryDoc(commService.getTableName('housefy',collid), housefyid);
    if (!result)
      throw utils.newException('帐单数据不存在！');

    //租客查看帐单后，更新帐单状态为已查看
    if (!utils.isEmpty(collid) && !utils.isEmpty(housefyid)) {
      const zkSawZdSj = utils.getCurrentTimestamp();
      await db.collection(commService.getTableName('housefy', collid)).doc(housefyid).update({
        data: {
          wxzdState: 'sawzd',
          zkSawZdSj,
          zkSawZdUser: userInfo.openId
        }
      });
    }

    result = [result];
  }
  //检查查帐单用户是否已经注册系统
  // const userb = await commService.querySingleDoc('userb',{openId:userInfo.openId});
  // let registered = userb!==null;
  // registered = false;
  return {sourceList:result,registered,grantcodeParas:{flag,sjhm,nickName}};
}
exports.queryLastzdWithGrantcode = queryLastzdWithGrantcode;

async function queryLastzdList(params, userInfo) {
  // const {collid} = curUser;
  const {houseid,collid,grantcode} = params;
  //根据授权码查询数据
  if(!utils.isEmpty(grantcode))
    return await queryLastzdWithGrantcode(params, userInfo);
  //检查刷帐单标志，是否先刷新当前帐单
  if(params.refreshzd==='1'){
    // try{
      const house = await commService.queryPrimaryDoc(commService.getTableName('house',collid),houseid);
      if(!house)
        throw utils.newException('查询数据异常！');
      let copyParams = {...params};
      copyParams.housefyid = house.housefyid;
      copyParams.flag = 'sxzd';
      console.log('refreshzd:',copyParams);
      await processQrsz(copyParams,USER);
    // }catch(e){
    //   // 初始刷新帐单失败，不抛出异常
    //   console.log('初始刷新帐单异常：',e);
    // }
  }

  if(utils.isEmpty(houseid))
    throw utils.newException('查询数据异常！');
  const db = cloud.database();
  const _ = db.command;
  let result = await db.collection(commService.getTableName('housefy',collid)).orderBy('zdlx','desc').orderBy('szrq','desc').limit(6).where({
    houseid,
  }).get();
  result = result.data;
  //处理帐单发送短信状态
  for(let i=0;i<result.length;i++){
    let tmpHousefy=result[i];
    if (!utils.isEmpty(tmpHousefy.messageId) && tmpHousefy.messageId.length>1){
      const messageId = utils.getInteger(tmpHousefy.messageId);
      if (utils.currentTimeMillis() - messageId >= config.queryPhoneInterval){
        const status = await phone.queryPhoneMessageStatus(tmpHousefy.messageId);
        if(status.code!==0){
          //短信发送失败
          tmpHousefy.messageId = 'x';
        }else{
          tmpHousefy.messageId = '';
        }
        await commService.updateDoc(commService.getTableName('housefy', collid), tmpHousefy);        
      }
    }
  }
  return result;
}
exports.queryLastzdList = queryLastzdList;

async function querySdbList (curUser,data) {  
  const {yzhid,collid} = curUser
  const db = cloud.database();  
  const _ = db.command;
  let result;
  if(data && !utils.isEmpty(data.houseid)){
    result = await commService.queryPrimaryDoc(commService.getTableName('house',collid),data.houseid);
    if(result) result = Array.of(result);
  }else{
    const szrqCond = moment().startOf('day').add(4, 'days').format('YYYY-MM-DD');
    // console.log('szrqcond:'+szrqCond);
    try{
      result = await db.collection(commService.getTableName('house', collid)).orderBy('fwmc', 'asc').where({
        yzhid,
        sfsz: _.in([CONSTS.SFSZ_YJQ, CONSTS.SFSZ_YJZ]),
        szrq: _.lte(szrqCond),
      }).get();
      result = result.data;
    }catch (e) {
      if (e.errCode === -502005) {
        result = [];
      } else {
        throw e;
      }
    }
  }
  return result;
}
exports.querySdbList = querySdbList;

async function queryZdList(curUser,data) {
  // console.log('===queryzdlist:',data);
  const fyList = await querySdbList(curUser,data);
  const resultList = fyList;
  let zdList = new Array(resultList.length);
  resultList.map((house,index)=>{
    if(house.sfsz === CONSTS.SFSZ_WJQ)
      throw utils.newException('当前帐单未结清，不能出新帐单！');
    zdList[index] = {};
    zdList[index]._id = house._id;
		try {
      // const fwfy = jsFwfy(house);
      const newHousefy = makeHousefy(house,null,CONSTS.ZDLX_YJZD);
      const s = getZdMessage(newHousefy);
      zdList[index].tsinfo = s;  //house.fwmc+','+house.zhxm+',帐单:'+fwfy+'元';
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

const queryHtdataWithGrantcode = async (data,curUser) => {
  const { grantcode } = data;
  let grantcodeParas = await commService.queryGrantcode(grantcode, config.grantcodeHtqyYxq,curUser.openId);
  // console.log('grantcodeParas', grantcodeParas);
  const { htid, isValid } = grantcodeParas;
  let htdata;
  if (!isValid) {
    htdata = null;
  } else {
    let session = await commService.querySingleDoc('session', {htid});
    if (!session)
      throw utils.newException('未查到合同数据，可能合同已经更新，请与房东确认！');
    htdata = session.htdata;
  }
  return { htdata, grantcodeParas};
}

const queryHtdataWithHouse = async (data, curUser) => {
  const { houseid,collid } = data;
  const house = await commService.queryPrimaryDoc(commService.getTableName('house',collid),houseid);
  if(!house)
    throw utils.newException('房屋数据查询有误！');
  const {htdata} = house;
  if (!htdata)
    throw utils.newException('未查到房屋的合同数据！');
  return htdata;
}

exports.queryHtdata = async (data, curUser) => {
  const { grantcode, seeHouseHt} = data;
  if (!utils.isEmpty(grantcode))
    return await queryHtdataWithGrantcode(data,curUser);
  if (seeHouseHt === "1")
    return await queryHtdataWithHouse(data, curUser);

  const { openId,yzhid } = curUser;
  // const { formObject, flag } = data;
  let session = await commService.querySingleDoc('session', { openId });
  if (!session)
    throw utils.newException('会话数据错误！');
  let htdata = session.htdata;
  if (!htdata){
    //如无缓存数据，则读取合同模板数据
    let sysconfig = await commService.querySingleDoc('sysconfig', { yzhid,code:'htmb' });
    if(!sysconfig){
      sysconfig = await commService.querySingleDoc('sysconfig', { yzhid: config.defaultname, code: 'htmb' });
    }
    if (sysconfig) {
      htdata = sysconfig.value;
    }
  }
  return htdata;
}

const saveHtmb = async (formObject, curUser) => {
  const { fdxm, fdsfzh, fdsjhm, fwdz, fwpt, fwpts,zzqx, jzr, jzqx, sdj, sgtds, ddj, dgtds, wlf, ljf, glf, httk, fdQmCloudPath} = formObject;
  const htmb = { fdxm, fdsfzh, fdsjhm, fwdz, fwpt,fwpts, zzqx, jzr, jzqx, sdj, sgtds, ddj, dgtds, wlf, ljf, glf, httk, fdQmCloudPath };
  const {yzhid} = curUser;
  let result = await commService.querySingleDoc('sysconfig',{yzhid,code:'htmb'});
  if(!result){
    result = {yzhid,code:'htmb',name:'合同模板',value:htmb}
    await commService.addDoc('sysconfig',result);
  }else{
    result.value = htmb;
    await commService.updateDoc('sysconfig',result);
  }
}

const processSxqm = async (data, curUser) => {
  const { formObject, flag } = data;
  // console.log('processSxqm:',formObject);
  if (!utils.isEmpty(formObject.zkQmTempCloudPath)){
    if (!utils.isEmpty(formObject.zkQmCloudPath)){
      await cloud.deleteFile({ fileList: [formObject.zkQmCloudPath] });
    }
    formObject.zkQmCloudPath = formObject.zkQmTempCloudPath;
    formObject.zkQmTempCloudPath = '';
  }
  if (!utils.isEmpty(formObject.fdQmTempCloudPath)) {
    if (!utils.isEmpty(formObject.fdQmCloudPath)) {
      //房东签名暂不能删除
      // await cloud.deleteFile({ fileList: [formObject.fdQmCloudPath] });
    }
    formObject.fdQmCloudPath = formObject.fdQmTempCloudPath;
    formObject.fdQmTempCloudPath = '';
  }
}

const processOcrsfz = async (data, curUser) => {
  // 身份证图片解析
  const { formObject, flag, tempSfzhCloudFileId } = data;
  if (flag !== 'ocrsfz') return;
  try {
    const result = await commService.ocrSfz(tempSfzhCloudFileId);
    if (result.errcode !== 0)
      throw utils.newException(result.errmsg, result.errcode);    
    if (result.type === "Front") {
      formObject.zkSfzhFront = tempSfzhCloudFileId;
      formObject.zhxm = result.name;
      formObject.sfzh = result.id;
      // console.log(result);
      // formObject.zhxm = result.
    } else if (result.type === "Back"){
      formObject.zkSfzhBack = tempSfzhCloudFileId;
    }else{
      throw utils.newException("身份证解析失败！");    
    }
  } catch (e) {
    await cloud.deleteFile({ fileList: [tempSfzhCloudFileId] });
    throw e;
  }
}

exports.processHt = async (data, curUser) => {
  const { openId, collid, yzhid, nickName} = curUser;
  const { formObject, flag, grantcodeParas, sfzhCloudFileId} = data;

  if(flag==='htmb'){
    //先处理签名图片
    await processSxqm(data, curUser);
  //存为合同模板
    await saveHtmb(formObject,curUser);
    return formObject;
  } else if (flag === 'savezkqm') {
    //保存租客签名
    // console.log('savezkqm:', grantcodeParas);
    const {grantcode} = grantcodeParas;
    let curGrantcodeParas = await commService.queryGrantcode(grantcode, config.grantcodeHtqyYxq, curUser.openId);
    let session = await commService.querySingleDoc('session', { htid: curGrantcodeParas.htid });
    if (!session || utils.isEmptyObj(session.htdata)) 
      throw utils.newException('未查到合同数据，可能合同已经更新，请与房东确认！');
    //先处理签名图片
    await processSxqm(data, curUser);

    session.htdata.zkQmCloudPath = formObject.zkQmCloudPath;
    const updatedNum = await commService.updateDoc('session', session);
    // console.log('savezkqm:',updatedNum);
    return formObject;
  } else if (flag === 'hthc' || flag === 'sendzkht' || flag === 'htsave' || flag==='ocrsfz'){
  //合同缓存
    let session = await commService.querySingleDoc('session', { openId});
    if(!session)
      throw utils.newException('会话数据错误！');
    const sessionid = session._id;
    //先处理签名图片
    await processSxqm(data, curUser);
    //处理ocr身份证
    await processOcrsfz(data, curUser);

    //房东不能修改租客签名
    if(!utils.isEmptyObj(session.htdata) && !utils.isEmpty(session.htdata.zkQmCloudPath)){
      formObject.zkQmCloudPath = session.htdata.zkQmCloudPath;
    }
    session.htdata = formObject;
    const htid = utils.uuid(16);
    if (flag === 'sendzkht'){
      session.htid = htid;
    }

    const updatedNum = await commService.updateDoc('session',session);
    if (flag === 'hthc' || flag === 'ocrsfz') 
      return formObject;
    if(flag==='sendzkht')
      return commService.createGrantcode('个人房屋租赁合同\r\n租客签名确认！\r\n\r\n请在30分钟内确认。', { page:'/pages/fygl/htqy/htqy',htid,flag,sjhm:formObject.dhhm,collid,yzhid,nickName,noclipboard:'1'});
    if (flag === 'htsave') {
      //签约完成
      //计算下次收租日期
      let htrqq1 = moment(formObject.htrqq);
      if(!htrqq1.isValid())
        throw utils.newException('合同起始日期不合法！');
      const jzday = utils.getInteger(formObject.jzr);
      htrqq1 = htrqq1.add(1,'months');
      const szrq = moment([htrqq1.year(), htrqq1.month(), jzday]);
      if(!szrq.isValid)
        throw utils.newException('计算下次收租日期错误，可能是每月交租日输入有误：' + formObject.jzr);
      //计算房屋押金
      const yj = utils.getInteger(formObject.fwyj) + utils.getInteger(formObject.ysyj);

      const {fwmc,zhxm,sfzh,dhhm,czje,htrqq,htrqz,dscds,sscds,ddj,sdj,dgtds,sgtds,wlf,ljf,glf,fwpt} = formObject;
      let house = { fwmc, zhxm, sfzh, dhhm, czje, htrqq, htrqz, dscds, sscds, ddj, sdj, dgtds, sgtds, wlf, ljf, glf,fwpt };
      house.szrq = szrq.format('YYYY-MM-DD');
      house.yj = yj + "";
      house.htdata = formObject;
      const resultData = await saveFy(house, curUser.collid,curUser);
      //保存完成，删除当前合同
      await db.collection('session').doc(sessionid).update({
        data: {
          htdata: _.remove(),
          htid: _.remove(),
        }
      });
      return resultData;
    }
  }else{
    throw utils.newException('未确定合同处理动作：'+flag);
  }
}

const saveFy = async (house,collid,curUser) => {
  let isAddDoc;
  if (utils.isEmpty(house._id)) {
    isAddDoc = true;
    house.yzhid = curUser.yzhid;
    house.lrr = curUser.openId;
    house.lrsj = utils.getCurrentTimestamp();
    house.zhxgr = curUser.openId;
    house.zhxgsj = house.lrsj;
    house._id = utils.id();
  } else {
    house.zhxgr = curUser.openId;
    house.zhxgsj = utils.getCurrentTimestamp();       
    isAddDoc = false;
  }
  //如果是添加房源，则检查集合是否存在，不存在，则创建
  if(isAddDoc){
    try{
      const coll = await db.collection(commService.getTableName('house', collid)).limit(1).get();
    }catch(e){
      if (e.errCode === -502005){
        console.log('create savefy:', e);
        await db.createCollection(commService.getTableName('house',collid));
        await db.createCollection(commService.getTableName('housefy', collid));
      }
    }
  }

  let result;
  const yzhid = house.yzhid;
  // 检查房屋名称是否重复
  // console.log('querysingleDoc:', commService.getTableName('house', collid), { yzhid, _id: _.neq(house._id), fwmc: house.fwmc })
  result = await commService.querySingleDoc(commService.getTableName('house',collid),{yzhid,_id:_.neq(house._id),fwmc:house.fwmc});
  // console.log(result); 
  if(result){
    //如果是新增房源，如果原房屋为未出租，则可以覆盖原房屋(先删除此房屋)
    if(utils.isEmpty(result.zhxm)){
      const num = await commService.removeDoc(commService.getTableName('house', collid), result._id);
      if(num<1) 
        throw utils.newException("房屋编号已经存在，删除处理异常！");
    }else{
      throw utils.newException("房屋编号已经存在！");
    }
  }
  let { _id: saveHouseid, dhhm, avatarUrl } = house;
  //处理所有租户查询手机号码
  let querySjhm = ',';
  if(!utils.isEmpty(house.dhhm)){
    querySjhm+=house.dhhm+',';
  }
  if(house.moreZh){
    house.moreZh.map(value=>{
      if(!utils.isEmpty(value.dhhm) && querySjhm.indexOf(','+value.dhhm+',')<0) 
        querySjhm+=value.dhhm+',';      
    })
  }
  house.querySjhm = querySjhm;

  //如果网络费为空，则清空wlfys,wlfnum
  if(utils.isEmpty(house.wlf)){
    house.wlfys = "";
    house.wlfnum = "";
  }
  //清除house的avatarUrl,重新关联
  avatarUrl = '';
  house.avatarUrl = "";
  if (utils.isEmpty(house.housefyid) && !utils.isEmpty(house.zhxm)) {
    // 如果为新签约，则自动生成合同帐单
    const newHousefy = makeHousefy(house, null,CONSTS.ZDLX_HTZD);
    await commService.addDoc(commService.getTableName('housefy',collid),newHousefy);
  }
  // console.log('save house:',house);
  if(isAddDoc){
    await commService.addDoc(commService.getTableName('house',collid), house);
  }else{
    await commService.updateDoc(commService.getTableName('house',collid), house);
  }  

  //关联用户注册的手机号
  if(utils.isEmpty(avatarUrl) && !utils.isEmpty(dhhm)){
    result = await commService.querySingleDoc('userb', { sjhm:dhhm });
    if(result){
      await commService.updateDoc(commService.getTableName('house',collid), { _id: saveHouseid, avatarUrl:result.avatarUrl});
      // console.log('关联租户头像：',updatedNum);
    }
  }
  return {_id:saveHouseid};
}
exports.saveFy = saveFy;

exports.exitFy = async (data,curUser) => {
  const { houseid,tfrq } = data;
  const {collid} = curUser;
  let house = await commService.queryPrimaryDoc(commService.getTableName('house',collid),houseid);
  if(!house)
    throw utils.newException("未查到房屋数据!");

  if(utils.isEmpty(house.dbcds) || utils.isEmpty(house.sbcds))  
    throw utils.newException("请先抄当前的水电表再退房!");
  const {sfsz} = house;
  let housefy=null;
  if (sfsz === CONSTS.SFSZ_WJQ){
    //当前帐单未结清，则刷新当前帐单为退房帐单
    housefy = await commService.queryPrimaryDoc(commService.getTableName('housefy',collid),house.housefyid);
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
  house.zhxgr = curUser.openId;
  house.zhxgsj = utils.getCurrentTimestamp();
  newHousefy.zhxgr = curUser.openId;
  newHousefy.zhxgsj = house.zhxgsj;

  if (sfsz === CONSTS.SFSZ_WJQ) {
    //未结清，刷新当前帐单
    const housefyNum = await commService.updateDoc(commService.getTableName('housefy',collid), newHousefy);
    if (housefyNum === 0)
      throw utils.newException("退房帐单数据更新失败！");
  }else{
    //已结清，生成新的退房帐单
    const housefyResult = await commService.addDoc(commService.getTableName('housefy',collid), newHousefy);
    console.log('生成新的退房帐单ID:', housefyResult);
    house.housefyid = housefyResult;
    if (utils.isEmpty(house.housefyid))
      throw utils.newException("生成退房帐单失败！");
  }
  const houseNum = await commService.updateDoc(commService.getTableName('house',collid), house);
  if (houseNum === 0)
    throw utils.newException("房源数据更新失败！");
}

const deleteFy = async (house,curUser) => { 
  const {collid} = curUser;
  const { houseid} = house;
  const deleteHouse = await commService.queryPrimaryDoc(commService.getTableName('house', collid), houseid);
  if(!deleteHouse)
    throw utils.newException('房源ID:' + houseid);

  const num = await commService.removeDoc(commService.getTableName('house',collid),houseid);
  if(num<1)
    throw utils.newException('房源ID:'+houseid);
  //删除对应的帐单数据
  const housefyList = await commService.queryDocs(commService.getTableName('housefy',collid), { houseid });
  if (housefyList) {
    for (let i = 0; i < housefyList.length; i++) {
      await commService.removeDoc(commService.getTableName('housefy',collid), housefyList[i]._id);
    } 
  }
  //删除房屋图片
  if (deleteHouse.photos && deleteHouse.photos.length>0){
    // console.log('deletefile:', deleteHouse.photos);
    await cloud.deleteFile({ fileList: deleteHouse.photos});
  }
}
exports.deleteFy = deleteFy;

async function tfFy(data,curUser){
  const {collid} = curUser;
  const { houseid } = data;
  const house = await commService.queryPrimaryDoc(commService.getTableName('house',collid), houseid);
  if(!house)
    throw utils.newException('未查询到房源数据：'+houseid);
  const housefyList = await commService.queryDocs(commService.getTableName('housefy',collid),{houseid});

  if(housefyList){
    for(let i=0;i<housefyList.length;i++){
      await commService.addDoc('housefy_tf', housefyList[i]);
    }
  }
  await commService.addDoc('house_tf', house);
  //由于新加了合同签约，因此，退房后，直接将房屋数据删除
  // console.log('tffy:',house);
  // await deleteFy(data,curUser);

  // 房源数据保存进退房表后，再删除数据
  await commService.removeDoc(commService.getTableName('house',collid),house._id);
  if (housefyList) {
    for (let i = 0; i < housefyList.length; i++) {
      await commService.removeDoc(commService.getTableName('housefy',collid), housefyList[i]._id);
    }
  }
  //删除房屋图片
  if (house.photos && house.photos.length > 0) {
    await cloud.deleteFile({ fileList: house.photos });
  }

  //保留现有房屋数据，但将其置为空房
  const clearFields = ['aratarUrl', 'bz', 'dbcds', 'dfhj', 'dhhm', 'dscds', 'fyhj', 'housefyid', 'htrqq', 'htrqz', 'lrr', 'lrsj','moreZh','photos','qtf','querySjhm','rq1','rq2','sbcds','sfhj','sfsz','sfzh','sscds','syjzf','szrq','yffrq1','yffrq2','zdlx','zdmonth','zhxgr','zhxgsj','zhxm'];
  let newHouse = house;
  clearFields.map(value=>{
    delete newHouse[value];
  })
  newHouse._id = utils.id();
  console.log('tffy:',newHouse);
  await commService.addDoc(commService.getTableName('house',curUser.collid),newHouse);
}
exports.tfFy = tfFy;

exports.updateSdb = async (houseList,curUser) => {
  const {collid} = curUser;
  const db = cloud.database();
  let tasks = [];
  const _ = db.command;
  houseList.map((house)=>{
    const { _id } = house;
    const promise = db.collection(commService.getTableName('house',collid)).doc(_id).update({
      data: {
        dbcds: house.dbcds && house.dbcds !== '' ? house.dbcds : _.remove(),
        sbcds: house.sbcds && house.sbcds !== '' ? house.sbcds : _.remove(),
      }
    });
    tasks.push(promise);
  });
  return Promise.all(tasks);
}

exports.updateZdList = async (zdList,autoSendMessage,curUser) => {
  const {collid} = curUser;
  const db = cloud.database();
  const _ = db.command;
  const houseTable = db.collection(commService.getTableName('house',collid));
  const housefyTable = db.collection(commService.getTableName('housefy',collid));
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
      const housefyResult = await commService.addDoc(commService.getTableName('housefy',collid),newHousefy); 
      console.log("makezd housefyid:",housefyResult); 
      house.housefyid = housefyResult;
      const houseNum = await commService.updateDoc(commService.getTableName('house',collid),house);
      if(houseNum===0)
        throw utils.newException("更新房源信息失败！");      
      if (autoSendMessage){
        //生成帐单完成，发送短信提醒
        await sendZdMessage(house,newHousefy,collid,curUser.openId);
      }
    }catch(e){
      errMsg += house.fwmc+','+e.message;
    }
  };
  if(!utils.isEmpty(errMsg)) throw utils.newException(errMsg);
  return null;
}

const sendZdMessage= async (house,housefy,collid,openId)=>{
  const {dhhm,fwmc,zhxm,fyhj,zdlx} = house;
  let message = getPhoneMessage(housefy);
  message = message.replace(/\r\n/g,'\n');
  // if(message.endsWith('\n')) message = message.substring(0,message.length - 1);  
  message += '微信搜索“极简出租”关注，查看帐单详情。';
  //发送短信
  const messageId = utils.currentTimeMillis()+"";
  await phone.sendPhoneMessage(dhhm,message,messageId);
  //发送短信成功，更新帐单表发送次数
  await db.collection(commService.getTableName('housefy',collid)).doc(housefy._id).update({
    data: {
      messageNum: _.inc(1),
      messageId,
    }
  });
  //发送短信成功，更新用户表当前帐户发送次数
  await db.collection('userb').where({openId}).update({
    data: {
      messageNum: _.inc(1)
    }
  });
}

const getFyts = (fyts,fy,lineChar) => {
  if(!lineChar) lineChar = ';\r\n';
  let ts = '';
  if(fy && fy<0){ 
    ts='(退)';
    fy = Math.abs(fy);
  }
  return !utils.isEmpty(fy)?fyts+ts+':'+fy+'元'+lineChar:'';
}

const getDfts = (housefy) => {
  if(housefy.dfhj){
    let dgtdsts='';
    if (!utils.isEmpty(housefy.dgtds)) dgtdsts = `,公摊:${housefy.dgtds}`;
    return `电费:${housefy.dfhj}元(上月:${housefy.dscds},本月:${housefy.dbcds}${dgtdsts},单价:${housefy.ddj}元);\r\n`;
  }
  return '';
}
const getSfts = (housefy) => {
  if (housefy.sfhj){
    let sgtdsts = '';
    if (!utils.isEmpty(housefy.sgtds)) sgtdsts = `,公摊:${housefy.sgtds}`;
    return `水费:${housefy.sfhj}元(上月:${housefy.sscds},本月:${housefy.sbcds}${sgtdsts},单价:${housefy.sdj}元);\r\n`;
  }
  return '';
}

const getZdMessage = (housefy,flag) => {
  let rq1 = housefy.rq1;
  if (!rq1 || rq1.length < 10) return '';
  let zdlxinfo;
  if (housefy.zdlx == '0') zdlxinfo = '(签约帐单),';
  else if (housefy.zdlx == '2') zdlxinfo = '(退房帐单),';
  else zdlxinfo = housefy.zdmonth ? housefy.zdmonth:rq1.substring(0, 4) + '年' + rq1.substring(5, 7) + '月';
  const ts1 = housefy.fyhj<0?'退':'缴';
  const ts2 = housefy.czje<0?'(退)':'';
  let s = `${housefy.fwmc}房,${housefy.zhxm},您好:\r\n${zdlxinfo}应${ts1}费用:${Math.abs(housefy.fyhj)}元。\r\n`;
  if(flag === 'wxyjzd'){
    //生成已结清帐单信息
    if(CONSTS.SFSZ_WJQ===housefy.sfsz)
      throw utils.newException('帐单未结清，不能发送已结信息！');
    if (CONSTS.SFSZ_YJZ===housefy.sfsz) s += '已结转下月';
    else s += '已结清';
  }else{
    s = s+
        `${getFyts('月租费', housefy.czje, ';\r\n')}`+
        `${getFyts('押金', housefy.yj,';\r\n')}`+getDfts(housefy)+getSfts(housefy)+
        `${getFyts('网络费', housefy.wlf)}${getFyts('卫生费', housefy.ljf)}${getFyts('管理费', housefy.glf)}`+
        `${getFyts('其它费', housefy.qtf)}${getFyts('上月结转费', housefy.syjzf)}`;
  }
  return s;   
}

const getPhoneMessage = (housefy) => {
  let rq1 = housefy.rq1;
  if (!rq1 || rq1.length < 10) return '';
  let zdlxinfo;
  if (housefy.zdlx == '0') zdlxinfo = '(签约帐单),';
  else if (housefy.zdlx == '2') zdlxinfo = '(退房帐单),';
  else zdlxinfo = housefy.zdmonth ? housefy.zdmonth : rq1.substring(0, 4) + '年' + rq1.substring(5, 7) + '月';
  const ts1 = housefy.fyhj < 0 ? '退' : '缴';
  const ts2 = housefy.czje < 0 ? '(退)' : '';
  const s = `${housefy.fwmc}房,${housefy.zhxm},您好:${zdlxinfo}应${ts1}费用:${Math.abs(housefy.fyhj)}元。`;
  return s;
}

const processQrsz = async (params,curUser) => {
  const {nickName} = curUser;
  const { housefyid, flag,collid } = params;
  const db = cloud.database();
  const _ = db.command;

  let housefy = await commService.queryPrimaryDoc(commService.getTableName('housefy',collid),housefyid);
  if (!housefy) throw utils.newException("未查到房源帐单记录：" + housefyid);
  const {houseid} = housefy;
  let house = await commService.queryPrimaryDoc(commService.getTableName('house',collid), houseid);
  if (!house) throw utils.newException("未查到房源记录：" + houseid);

  if ("sxzd" === flag && housefyid !== house.housefyid)
    throw utils.newException("帐单数据与主房屋不匹配，刷新帐单失败！");
  if ("sxzd" === flag && housefy.sfsz!==CONSTS.SFSZ_WJQ)
    throw utils.newException("只能刷新未结帐单！");
  if ("htzd" === flag && housefyid !== house.housefyid)
    throw utils.newException("只能回退当期帐单！");
  let lastFyhj;
  if ("sxzd" === flag) {
    // 刷新帐单
    lastFyhj = house.fyhj;
    makeHousefy(house, housefy, null,null,flag);
  }else if ("sjdx" === flag) {
    const message = getPhoneMessage(housefy);
    return message;
  } else if ("wxzd" === flag || "wxyjzd"===flag) {
    const message = getZdMessage(housefy,flag);
    //生成授权查询码，通过此码查当前帐单，不需要注册
    // const grantcode = utils.uuid(16);
    // const createtime = utils.currentTimeMillis();
    return commService.createGrantcode(message, {
      page: '/pages/fygl/editlist/editlist', collid, nickName,housefyid: housefy._id,flag,sjhm:house.dhhm});
    // return { message, collid, housefyid: housefy._id, grantcode, createtime, flag, sjhm: house.dhhm };
  } else if ("sendsjdx" === flag) {
    await sendZdMessage(house, housefy, collid, curUser.openId);
    return queryLastzdList({ houseid, collid});
  } else if ("htzd" === flag) {
    await htHouse(house, housefy, collid);
    return queryLastzdList({ houseid, collid });
  } else if ("sczd" === flag) {
    if(house.sfsz===CONSTS.SFSZ_WJQ)
      throw utils.newException("帐单未结清，不能删除！");
    await commService.removeDoc(commService.getTableName('housefy', collid), housefy._id);
    return queryLastzdList({ houseid, collid });
  } else {
    jzHouse(house, housefy, flag);
  }  
  house.zhxgr=curUser.openId;
  house.zhxgsj = utils.getCurrentTimestamp();
  housefy.zhxgr=curUser.openId;
  housefy.zhxgsj = house.zhxgsj;
  const housefyNum = await commService.updateDoc(commService.getTableName('housefy',collid),housefy);
  if(housefyNum===0)
    throw utils.newException("帐单数据更新失败！");
  const houseNum = await commService.updateDoc(commService.getTableName('house',collid),house);
  if (houseNum === 0)
    throw utils.newException("房源数据更新失败！");
  if ("qrsz" === flag && house.zdlx === CONSTS.ZDLX_TFZD){
    //退房帐单的确认收费成功，则直接退房
    await tfFy({ houseid },curUser);
    return null;
  }
  return queryLastzdList({ houseid, collid});
}
exports.processQrsz = processQrsz;

const htHouse = async (house, housefy, collid) => {
  const housefyList = await queryLastzdList({houseid:house._id,collid});
  if(housefyList.length<2) 
    throw utils.newException('已经是最后一个帐单，不能再回退了！');
  const lastHousefy = housefyList[1];

  house.sfsz = lastHousefy.sfsz;
  house.zdlx = lastHousefy.zdlx;
  house.rq1 = lastHousefy.rq1;
  house.rq2 = lastHousefy.rq2;
  house.yffrq1 = lastHousefy.yffrq1;
  house.yffrq2 = lastHousefy.yffrq2;
  house.sfhj = lastHousefy.sfhj;
  house.dfhj = lastHousefy.dfhj;
  house.fyhj = lastHousefy.fyhj;
  house.ssyds = lastHousefy.ssyds;
  house.dsyds = lastHousefy.dsyds;
  //回退收租日期
  house.szrq = lastHousefy.yffrq2;

  //回退水电数据
  house.dscds = lastHousefy.dscds;
  house.dbcds = lastHousefy.dbcds;
  house.sscds = lastHousefy.sscds;
  house.sbcds = lastHousefy.sbcds;

  //回退其它费用
  if (lastHousefy.zdlx!==CONSTS.ZDLX_HTZD){
    house.wlf = lastHousefy.wlf;
    house.glf = lastHousefy.glf;
    house.ljf = lastHousefy.ljf;
  }
  house.qtf = housefy.qtf;
  house.syjzf = housefy.syjzf;

  house.housefyid = lastHousefy._id;

  //更新房屋数据
  const updatedNum = await commService.updateDoc(commService.getTableName('house',collid),house);
  if(updatedNum===0)
    throw utils.newException('更新房屋数据出错！');
  //删除当前帐单
  await commService.removeDoc(commService.getTableName('housefy', collid),housefy._id);
}

function jzHouse(house, housefy, flag) {
  // 更新房源上次收租日期
  house.szrq = housefy.szrq;
  // 更新房源结转数据
  house.dscds=housefy.dbcds;
  house.sscds=housefy.sbcds;
  house.dbcds="";
  house.sbcds="";
  //上月水电使用数
  house.ssyds = housefy.ssyds;
  house.dsyds = housefy.dsyds;
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


// function jsFwfy(house){
//   if (!house.sbcds || !house.dbcds)
//     throw utils.newException("未抄水电表");

//   // 计算电费
//   const df = jsdf(house);
//   if (df < 0)
//     throw utils.newException("电费计算小于0");
//   // 计算水费
//   const sf = jssf(house);
//   if (sf < 0)
//     throw utils.newException("水费计算小于0");
//   // 计算合计费
//   const fwfy = df + sf + jsqtfhj(house);
//   if (fwfy <= 0)
//     throw utils.newException("无帐单费用");
//   return fwfy;
// }

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

function makeHousefy(house, housefy, zdlx,tfrq,flag){
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
  if (CONSTS.ZDLX_TFZD === zdlx) {
    const { sfsz } = house;
    if(!tfrq) 
      throw utils.newException("请在房源列表功能页中重新执行退房操作！");
    if (utils.isEmpty(house.dbcds) || utils.isEmpty(house.sbcds))
      throw utils.newException("请先抄当前的水电表再退房!");

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
    // console.log('js qtfdays:', rq2,rq1,qtfDays);
    assignFwqtf(house, housefy, zdlx, flag, days,qtfDays);
   
    // let monthNum = Math.ceil((qtfDays - 3) / 30);  //按月为单位计算其它费用（留3天的退房时间),超过3天，则按1月计
    // console.log('monthNum:',monthNum);
    // if(monthNum<0) monthNum = 0;
    // housefy.glf = utils.getInteger(house.glf) * monthNum;
    // housefy.wlf = utils.getInteger(house.wlf) * monthNum;
    // housefy.ljf = utils.getInteger(house.ljf) * monthNum;
    // if(monthNum>1){
    //   housefy.monthNum = monthNum+"";
    // }

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

    assignFwqtf(house,housefy,zdlx,flag);

    housefy.dbcds = house.dbcds;
    housefy.dscds = house.dscds;
    housefy.sbcds = house.sbcds;
    housefy.sscds = house.sscds;
    // 房屋合计费
    // housefy.fyhj = utils.getInteger(housefy.czje)
    //   + utils.getInteger(housefy.yj)
    //   + utils.getFloat(housefy.qtf);
    housefy.fyhj = utils.roundNumber(utils.getInteger(housefy.yj) + jsqtfhj(housefy), 1);
  } else {
    if (utils.isEmpty(house.dbcds) || utils.isEmpty(house.sbcds))
      throw utils.newException("未抄水电表!");
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
    // housefy.glf=house.glf;
    // housefy.wlf=house.wlf;
    // housefy.ljf=house.ljf;
    housefy.syjzf=house.syjzf;
    housefy.qtf=house.qtf;
    assignFwqtf(house,housefy,zdlx,flag);
    // 房屋合计费
    housefy.fyhj = utils.roundNumber(utils.getFloat(housefy.dfhj)
      + utils.getFloat(housefy.sfhj) + jsqtfhj(housefy),1);
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
  house.sfhj = housefy.sfhj;
  house.dfhj = housefy.dfhj;
  house.fyhj=housefy.fyhj;
  house.housefyid = housefy._id;
  // console.log('makehousefy:',housefy.ssyds,housefy.dsyds);
  // if(flag !== 'sxzd'){
  //   house.ssyds = housefy.ssyds;
  //   house.dsyds = housefy.dsyds;
  // }
  //根据当前配置，生成帐单显示月份提示（用后付费或预付费显示）
  let zdlxinfo;
  if (house.zdlx == CONSTS.ZDLX_HTZD) zdlxinfo = '签约';
  else if (house.zdlx == CONSTS.ZDLX_TFZD) zdlxinfo = '退房';
  else{
    let zdrq;
    // const { userConfig} = USER;
    // console.log('userconfig:',userConfig);
    if (USER && USER.config && USER.config.zdmonth === '1') {
      zdrq = house.yffrq1;
    }else{
      zdrq = house.rq1;
    }
    zdlxinfo = zdrq.substring(0, 4) + '年' + zdrq.substring(5, 7) + '月';
  }
  house.zdmonth = zdlxinfo;
  housefy.zdmonth = zdlxinfo;
  ///////////////////////////////////

  return housefy;
}

function assignFwqtf(house,housefy,zdlx,flag,yffdays,hffdays){
  housefy.ljfyff = isYff(house.ljfyff);
  housefy.glfyff = isYff(house.glfyff);
  housefy.wlfyff = isYff(house.wlfyff);
  if (zdlx === CONSTS.ZDLX_HTZD){
    housefy.ljf = isYff(house.ljfyff)? house.ljf : "";  
    housefy.glf = isYff(house.glfyff) ? house.glf : ""; 
    housefy.wlf = isYff(house.wlfyff) ? house.wlf : ""; 
    if(!utils.isEmpty(housefy.wlf)){
      house.wlfnum = utils.getInteger(house.wlfys) - 1;
      if(house.wlfnum<0) house.wlfnum = 0;
    }
  } else if (zdlx === CONSTS.ZDLX_YJZD){
    housefy.ljf = house.ljf;
    housefy.glf = house.glf;
    if (flag !== 'sxzd' || utils.getInteger(house.wlfys) < 2) {
      //刷新帐单不刷月数大于1的网络费
      if (utils.getInteger(house.wlfnum)<=0) {
        housefy.wlf = house.wlf;
        house.wlfnum = utils.getInteger(house.wlfys) - 1;
        if (house.wlfnum < 0) house.wlfnum = 0;
      }else{
        housefy.wlf = "";
        house.wlfnum = utils.getInteger(house.wlfnum) - 1;
        if (house.wlfnum < 0) house.wlfnum = 0;
      }
    }
  } else if (zdlx === CONSTS.ZDLX_TFZD) {
    let yffMonthNum = Math.ceil((yffdays - 3) / 30);  //按月为单位计算其它费用（留3天的退房时间),超过3天，则按1月计
    let hffMonthNum = Math.ceil((hffdays - 3) / 30);  //按月为单位计算其它费用（留3天的退房时间),超过3天，则按1月计
    // if (monthNum < 0) monthNum = 0;
    const glfMonthNum = isYff(house.glfyff) ? yffMonthNum : hffMonthNum;
    housefy.glf = utils.getInteger(house.glf) * glfMonthNum;
    if (glfMonthNum !== 0) {
      housefy.glfMonthNum = glfMonthNum + "";
    }
    const ljfMonthNum = isYff(house.ljfyff) ? yffMonthNum : hffMonthNum;
    housefy.ljf = utils.getInteger(house.ljf) * ljfMonthNum;
    if (ljfMonthNum !== 0) {
      housefy.ljfMonthNum = ljfMonthNum + "";
    }
    if(utils.getInteger(house.wlfys)<2){
      //网络只处理网络费月数小于2的情况
      const wlfMonthNum = isYff(house.wlfyff) ? yffMonthNum : hffMonthNum;
      housefy.wlf = utils.getInteger(house.wlf) * wlfMonthNum;
      if (wlfMonthNum !== 0) {
        housefy.wlfMonthNum = wlfMonthNum + "";
      }
    }
  }
}

function isYff(yff){
  return yff && yff.length>0;
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
