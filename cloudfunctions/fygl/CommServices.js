const cloud = require('wx-server-sdk')
const config = require('config.js')
const CONSTS = require('constants.js');
const utils = require('utils.js');

cloud.init({
  env: config.conf.env,   //'jjczwgl-bc6ef9'
  // env: 'jjczwgl-test-2e296e'
})
/**
 * 更新表的记录，返回更新成功的记录数
 */
exports.updateDoc = async (tableName, docObj) => {
  const db = cloud.database();
  const { _id } = docObj;
  delete docObj._id;
  const result = await db.collection(tableName).doc(_id).update({
    data: docObj
  });
  const updatedNum = result.stats.updated;
  if(updatedNum===0){
    console.log('updateDoc result failure:', _id,tableName,docObj,result);
    // throw utils.newException('更新数据失败！');
  }else{
    // console.log('updateDoc result success:', _id,tableName, docObj);    
  }
  return updatedNum;
}
/**
 * 删除表的记录，返回删除成功的记录数
 */
exports.removeDoc = async (tableName, _id) => {
  const db = cloud.database();
  const result = await db.collection(tableName).doc(_id).remove();
  const removedNum = result.stats.removed;
  return removedNum;
}

/**
 * 添加记录，返回添加成功的_ID，错误抛出异常
 */
exports.addDoc = async (tableName, docObj) => {
  const db = cloud.database();
  const result = await db.collection(tableName).add({
    data: docObj
  });
  if(!result || utils.isEmpty(result._id))
    throw new utils.newException('插入数据失败！');
  return result._id;
}

exports.querySingleDoc = async (tableName, whereObj) => {
  const db = cloud.database();
  const result = await db.collection(tableName).where(whereObj).get();
  if(result && result.data.length>0)
    return result.data[0];
  return null;
}

exports.queryPrimaryDoc = async (tableName, _id) => {
  const db = cloud.database();
  const result = await db.collection(tableName).doc(_id).get();
  if (result) return result.data;
  return null;
}

exports.queryDocs = async (tableName, whereObj) => {
  const db = cloud.database();
  const result = await db.collection(tableName).where(whereObj).get();
  if (result && result.data.length > 0)
    return result.data;
  return null;
}

//是否为租客
exports.isZk = async (userType) => {
  return userType === CONSTS.USERTYPE_ZK;
}
//是否为房东
exports.isFd = async (userType) => {
  return userType === CONSTS.USERTYPE_FD;
}
//是否为房东租客
exports.isFdZk = async (userType) => {
  return userType === CONSTS.USERTYPE_FDZK;
}

//如果记录已经存在，则更新，否则插入
// exports.saveDoc = async (tableName, docObj) => {
//   const db = cloud.database();
//   const result = await db.collection(tableName).add({
//     data: docObj
//   });
//   return result;
// }
