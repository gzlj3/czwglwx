const cloud = require('wx-server-sdk')
const commService = require('CommServices.js')
// const rp = require('request-promise')
const utils = require('utils.js');
const phone = require('phone.js');
const CONSTS = require('constants.js');
const config = require('config.js')
cloud.init({
  env: config.conf.env,
})
const db = cloud.database();
const _ = db.command;

//检查权限，成功返回用户基本数据(userType,yzhid)
exports.checkAuthority = async(action,method,userInfo,data) => {

  const { openId } = userInfo;
  if ([CONSTS.BUTTON_QUERYUSER, CONSTS.BUTTON_REGISTERUSER,CONSTS.BUTTON_SENDSJYZM].indexOf(action)>=0){
    //用户注册等基本操作不检查权限
    return {};
  }
  if ([CONSTS.BUTTON_LASTZD].indexOf(action) >= 0 && method==='GET' && data && !utils.isEmpty(data.grantcode)) {
    //根据注册码查询帐单数据不检查权限
    return {};
  }

  // throw utils.codeException(100);
  const db = cloud.database();
  const result = await commService.querySingleDoc('userb', { openId })
  // db.collection('userb').
  //       field({ userType: true, yzhid: true,sjhm:true,collid:true,granted:true,nickName:true,grantedSjhm:true }).where({
  //   openId
  // }).get();
  if(!result)
    throw utils.codeException(100);
  // let curUser = { userid: openId, ...result.data[0] };
  let curUser = result;
  if(utils.isEmpty(curUser.collid)) curUser.collid='';
  const { userType, yzhid, sjhm, collid} = curUser;
  if (utils.isEmpty(userType) || utils.isEmpty(yzhid) || utils.isEmpty(sjhm) || utils.isEmpty(openId))
    throw utils.codeException(101);

  // if ([CONSTS.BUTTON_ZK_SEELASTZD,].indexOf(action) >= 0) {
  //   //租客功能
  //   if(!commService.isZk(userType) && !commService.isZkFd(userType))
  //     throw utils.newException('你无权操作此功能！');
  // }

  if(commService.isZk(userType)){
    if ([CONSTS.BUTTON_CB, CONSTS.BUTTON_MAKEZD, CONSTS.BUTTON_ADDFY, CONSTS.EDITFY, CONSTS.DELETEFY, CONSTS.BUTTON_EXITFY, CONSTS.BUTTON_USERGRANT, CONSTS.BUTTON_SYSCONFIG].indexOf(action) >= 0) {
      throw utils.codeException(101);
    }
    if ([CONSTS.BUTTON_LASTZD].indexOf(action) >= 0 && method === 'POST') {
      throw utils.codeException(101);
    }
  }  
  return curUser;
}

// exports.seeLastzd = async (curUser) => {
//   const { sjhm } = curUser;
//   console.log(sjhm);

//   const result = await commService.querySingleDoc('house', { dhhm:sjhm });
//   if (!result)
//     throw utils.newException('未查到你的租房数据，请找房东确认手机号是否输入正确！');
//   return {houseid:result._id}
// }

exports.sendSjyzm = async (data,userInfo) => {
  const { sjhm } = data;
  const { openId } = userInfo;
  console.log(sjhm);
  if(utils.isEmpty(sjhm) || sjhm.length!==11)
    throw utils.newException('手机号码非法！');
  //取上次发送的验证码数据
  const lastYzm = await getCachedSjyzm(openId);
  console.log(lastYzm);
  if(lastYzm.isValid)
    throw utils.newException('上次发送的验证码还处于有效期，请稍候再发送！');

  //检查手机号是否已经注册
  const result = await commService.querySingleDoc('userb',{sjhm});
  if(result)
    throw utils.newException('此手机号已经注册，如果非你本人操作，请联系管理员！');
  
  const yzm = utils.getRandom(6);
  const message="【极简出租】验证码："+yzm+",您正在注册极简出租，验证码2分钟内有效。";
  console.log(message);
  // try{ 
    await phone.sendPhoneMessage(sjhm,message);  //短信发送失败会抛出异常
  // }catch(e){
  //   console.log(e);
  // }
  //短信发送成功，则将验证码写入缓存
  const yzmCreateTime = utils.currentTimeMillis();
  console.log(yzmCreateTime);
  await setSessionData(openId, { yzm, yzmCreateTime});
}

const setSessionData = async (openId,data) => {
  const db = cloud.database();
  const result = await db.collection('session').where({
    openId
  }).update({data});
  // console.log('setsessiondata');  
  // console.log(result);
  const updatedNum = result.stats.updated;
  if(updatedNum<1) throw utils.newException('会话数据写入错误!'); 
  return updatedNum;
}

const getSessionData = async (openId) => {
  const db = cloud.database();
  const result = await db.collection('session').where({
    openId
  }).get();
  // console.log('query session');
  // console.log(result);
  if (result && result.data.length > 0) {
    return result.data[0];
  }else{
    //插入一条会话记录
    commService.addDoc('session', { openId });
  }
  return {}
}

//取上次发送的验证码数据,返回验证码和有效状态
const getCachedSjyzm = async (openId)=>{
  const result = await getSessionData(openId);
  console.log(result); 
  const {yzm,yzmCreateTime} = result;
  if(!utils.isEmpty(yzm)){
    const current = utils.currentTimeMillis();
    // console.log(current);
    // console.log(current - yzmCreateTime);    
    const isValid = (current - yzmCreateTime) < (config.conf.yzmYxq*1000);
    return {yzm,isValid};
  }
  return {yzm:null,isValid:false}
}

//根据用户的openid查询用户表数据
const queryUser = async (userInfo) => {
  const {openId} = userInfo;
  const db = cloud.database();
  let result = await db.collection('userb').field({ userType: true, nickName:true,avatarUrl:true,collid:true,yzhid:true,granted:true,grantedSjhm:true,config:true}).where({
    openId
  }).get();
  if(result && result.data.length>0){
    result = result.data[0];
    // if(result.granted){
    //   result.rights = [...result.granted.rights];
    //   delete result.granted;
    // }
    // console.log('queryuser:', result);
    return result;
  }
  return null;
}
exports.queryUser = queryUser;


exports.grantUser = async (data, curUser) => {
  const { sjhm,rights } = data;
  const { yzhid:sourceYzhid } = curUser;
  const userb = await commService.querySingleDoc('userb', { sjhm });
  if (!userb)
    throw utils.newException(`手机号(${sjhm})还未注册！`);
  if(sourceYzhid === userb.yzhid)
    throw utils.newException(`不能授权给本人！`);
  
  const oldGranted = userb.granted
  let newGranted = [];
  let found = false;
  let newGrantedSjhm = [];
  let grantedState = '';
  if (oldGranted){
    oldGranted.map(value=>{
      if(!value) return;
      const {yzhid} = value;
      console.log('1:',yzhid,sourceYzhid);
      if (sourceYzhid === yzhid){
        if (rights && rights.length > 0){
          //之前已经有授权，且本次有授权，则修改授权
          found = true;
          newGranted.push(getNewGrant(curUser,rights));
          grantedState = 'modify';
        }
      }else{
        newGranted.push(value);
      }
    })
  }
  if (!found){
    if (rights && rights.length>0){
      //新授权
      newGranted.push(getNewGrant(curUser, rights));
      grantedState = 'add';
    }else{
      //删除授权
      grantedState = 'delete';
    }
  }
  userb.granted = newGranted;
  // console.log('granted userb:',userb);
  userb.zhxgr = curUser.openId;
  userb.zhxgsj = utils.getCurrentTimestamp;
  let updatedNum = await commService.updateDoc('userb', userb);
  if(updatedNum===0){
    throw utils.newException('本次授权无修改！');  
  }else{
    //修改本次授权的手机号
    let {grantedSjhm} = curUser;
    if(!grantedSjhm) grantedSjhm = [];
    if(grantedState==='delete'){
      grantedSjhm.splice(grantedSjhm.indexOf(sjhm), 1)
    } else if (grantedState === 'add') {
      grantedSjhm.push(sjhm);
    }
    curUser.grantedSjhm = grantedSjhm;
    curUser.zhxgsj = utils.getCurrentTimestamp();
    updatedNum = await commService.updateDoc('userb', curUser);
  }
  return await queryUser({ openId:curUser.openId });
}

const getNewGrant = (curUser,rights)=>{
//{"collid":null,"nickName":"馨馨","rights":['101','102','103']],"yzhid":"0598194113654221"}
  const { collid, nickName, yzhid } = curUser;
  return {collid,nickName,yzhid,rights};
}

exports.registerUser = async (data,userInfo) => {
  const { frontUserInfo,sjData} = data;
  const { openId } = userInfo;

  //取上次发送的验证码数据
  const lastYzm = await getCachedSjyzm(openId);
  console.log(lastYzm);
  if (!lastYzm.isValid)
    throw utils.newException('验证码已经失效！');
  if(lastYzm.yzm!==sjData.sjyzm)
    throw utils.newException('验证码不正确！');

  const db = cloud.database();
  const lrsj = utils.getCurrentTimestamp();
  const zhxgsj = lrsj;
  const yzhid = utils.yzhid();
  const collid = utils.collid();
  const userb = {
    openId,
    yzhid,
    collid,
    nickName:frontUserInfo.nickName,
    avatarUrl: frontUserInfo.avatarUrl,
    sjhm:sjData.sjhm,
    userType:sjData.userType,
    userData:frontUserInfo,
    lrsj,
    zhxgsj
  }
  console.log('新用户注册：',userb);
  let result = await commService.addDoc('userb',userb);
  if (commService.isFd(sjData.userType)){
    //房东注册，则创建新用户的集合表
    await db.createCollection('house_' + collid);
    await db.createCollection('housefy_' + collid);
  }

  //租客注册完成，关联房屋头像数据
  const avatarUrl = userb.avatarUrl;
  if (commService.isZk(sjData.userType) && !utils.isEmpty(avatarUrl) && !utils.isEmpty(userb.sjhm)) {
    // result = await db.collection('house').where({ dhhm: userb.sjhm }).update({ data:{avatarUrl}});
    result = await commService.updateAllDoc('house',{ dhhm: userb.sjhm },{ avatarUrl });
    console.log('关联房屋数：', result);
  }
  
  return await queryUser({ openId});
}

exports.sysconfig = async (data, curUser) => {
  curUser.config = { ...curUser.config,...data};
  updatedNum = await commService.updateDoc('userb', curUser);
  return await queryUser({ openId: curUser.openId });
}

exports.grantcode = async (data, curUser) => {
  console.log('grantcode:',data);
  return await commService.addDoc('grantcode',data);
}
