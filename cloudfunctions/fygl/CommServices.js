const cloud = require('wx-server-sdk')
cloud.init({
  env: 'jjczwgl-bc6ef9'
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

exports.addDoc = async (tableName, docObj) => {
  const db = cloud.database();
  const result = db.collection(tableName).add({
    data: docObj
  });
  return result;
}
