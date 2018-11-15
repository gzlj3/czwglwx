const cloud = require('wx-server-sdk')
const commService = require('CommServices.js')
// const rp = require('request-promise')
const utils = require('utils.js');
// const CONSTS = require('constants.js');
const config = require('config.js')
cloud.init({
  env: config.conf.env,   //'jjczwgl-bc6ef9'
  // env: 'jjczwgl-test-2e296e'
})

exports.sendSjyzm = async (data,userInfo) => {
  const { sjhm } = data;
  const { openId } = userInfo;
  console.log(sjhm);
  if(utils.isEmpty(sjhm) || sjhm.length!==11)
    throw utils.newException('手机号码非法！');
  //取上次发送的验证码数据
  const lastYzm = getCachedSjyzm(openId);
  if(lastYzm.isValid)
    throw utils.newException('上次发送的验证码还处于有效期！');
  
  const yzm = utils.getRandom(6);
  const message="【极简出租】验证码："+yzm+",您正在注册极简出租，验证码2分钟内有效。";
  utils.sendPhoneMessage(sjhm,message);  //短信发送失败会抛出异常
  //短信发送成功，则将验证码写入缓存
  const yzmCreateTime = utils.currentTimeMillis();
  setSessionData(openId, { yzm, yzmCreateTime});
}

const setSessionData = async (openId,data) => {
  const db = cloud.database();
  const result = await db.collection('session').where({
    openId
  }).update({data});
  const updatedNum = result.stats.updated;
  if(updatedNum<1) throw utils.newException('会话数据写入错误!'); 
  return updatedNum;
}

//取上次发送的验证码数据,返回验证码和有效状态
const getCachedSjyzm = async (openId)=>{
  const db = cloud.database();
  const result = await db.collection('session').field({ yzm: true, yzmCreateTime: true }).where({
    openId
  }).get();
  if (result && result.data.length > 0){
    const {yzm,yzmCreateTime} = result.data[0];
    if(!utils.isEmpty(yzm)){
      const current = utils.currentTimeMillis();
      const isValid = (current - yzmCreateTime)<config.conf.yzmyxq;
      return {yzm,isValid};
    } 
  }else{
    //插入一条会话记录
    commService.addDoc('session',{openId});
  }
  return {yzm:null,isValid:false}
}

//根据用户的openid查询用户表数据
exports.queryUser = async (userInfo) => {
  const {openId} = userInfo;
  const db = cloud.database();
  const result = await db.collection('userb').field({userType:true}).where({
    openId
  }).get();
  return result.data;
}

exports.registerUser = async (data,userInfo) => {
  const { frontUserInfo,sjData} = data;
  const { openId } = userInfo;
  const db = cloud.database();
  const userb = {
    openId,
    nickName:frontUserInfo.nickName,
    avatarUrl: frontUserInfo.avatarUrl,
    sjhm:sjData.sjhm,
    userType:sjData.userType,
    userRawData:frontUserInfo,
  }
  console.log(userb);
  const result = await commService.addDoc('userb',userb);
  return result;
}
