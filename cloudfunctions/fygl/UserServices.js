const cloud = require('wx-server-sdk')
// const moment = require('moment.min.js');
// const utils = require('utils.js');
// const CONSTS = require('constants.js');

cloud.init({
  env: 'jjczwgl-bc6ef9'
  // env: 'jjczwgl-test-2e296e'
})

exports.queryUser = async (userInfo) => {
  //根据用户的openid查询用户表数据
  const {openId} = userInfo;
  const db = cloud.database();
  const result = await db.collection('userb').field({userType:true}).where({
    openId
  }).get();
  return result.data;
}
