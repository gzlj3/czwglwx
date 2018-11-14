const cloud = require('wx-server-sdk')
const commService = require('CommServices.js')
// const moment = require('moment.min.js');
// const utils = require('utils.js');
// const CONSTS = require('constants.js');

cloud.init({
  env: 'jjczwgl-bc6ef9'
  // env: 'jjczwgl-test-2e296e'
})

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
  // console.log(data);
  // console.log(userInfo);

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

/**
 * 更新表的记录，返回更新成功的记录数
 */
// const updateDoc = async (tableName, docObj) => {
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
