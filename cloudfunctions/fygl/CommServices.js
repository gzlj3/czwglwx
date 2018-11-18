const cloud = require('wx-server-sdk')
const config = require('config.js')
const CONSTS = require('constants.js');

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

exports.addDoc = async (tableName, docObj) => {
  const db = cloud.database();
  const result = await db.collection(tableName).add({
    data: docObj
  });
  return result;
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
