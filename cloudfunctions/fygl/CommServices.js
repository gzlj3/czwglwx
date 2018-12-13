const cloud = require('wx-server-sdk')
const CONSTS = require('constants.js');
const utils = require('utils.js');
const config = require('config.js')

cloud.init({
  env: config.conf.env,
})
const db = cloud.database();
const _ = db.command;
/**
 * 更新表的记录，返回更新成功的记录数
 */
exports.updateDoc = async (tableName, docObj) => {
  // if (utils.isEmptyObj(docObj))
  //   throw utils.newException('参数异常！');
  const db = cloud.database();
  const { _id } = docObj;
  delete docObj._id;
  const result = await db.collection(tableName).doc(_id).update({
    data: docObj
  });
  const updatedNum = result.stats.updated;
  if (updatedNum === 0) {
    console.log('updateDoc result failure:', _id, tableName, docObj, result);
    // throw utils.newException('更新数据失败！');
  } else {
    // console.log('updateDoc result success:', _id,tableName, docObj);    
  }
  return updatedNum;
}
/**
 * 删除表的记录，返回删除成功的记录数
 */
exports.removeDoc = async (tableName, _id) => {
  if (utils.isEmpty(_id))
    throw utils.newException('参数异常！');
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
  if (!result || utils.isEmpty(result._id))
    throw new utils.newException('插入数据失败！');
  return result._id;
}

exports.querySingleDoc = async (tableName, whereObj) => {
  if (utils.isEmptyObj(whereObj))
    throw utils.newException('参数异常！');

  const db = cloud.database();
  const result = await db.collection(tableName).where(whereObj).get();
  if (result && result.data.length > 0)
    return result.data[0];
  return null;
}

exports.queryPrimaryDoc = async (tableName, _id) => {
  if(utils.isEmpty(_id)) return null;
  const db = cloud.database();
  const result = await db.collection(tableName).doc(_id).get();
  if (result) return result.data;
  return null;
}

exports.queryDocs = async (tableName, whereObj) => {
  if (utils.isEmptyObj(whereObj))
    throw utils.newException('参数异常！');
  const db = cloud.database();
  const result = await db.collection(tableName).where(whereObj).get();
  if (result && result.data.length > 0)
    return result.data;
  return null;
}

//是否为租客
exports.isZk = (userType) => {
  // console.log('iszk:', userType, utils.isEmpty(userType));
  if (utils.isEmpty(userType))
    throw utils.newException('用户身份判断异常！');
  return userType === CONSTS.USERTYPE_ZK;
}
//是否为房东
exports.isFd = (userType) => {
  if (utils.isEmpty(userType))
    throw utils.newException('用户身份判断异常！');
  return userType === CONSTS.USERTYPE_FD;
}
//是否为房东租客
exports.isFdZk = (userType) => {
  if (utils.isEmpty(userType))
    throw utils.newException('用户身份判断异常！');
  return userType === CONSTS.USERTYPE_FDZK;
}

//查询所有房东collid
async function queryAllCollids() {
  const db = cloud.database();
  const result = await db.collection('userb').field({ collid: true, yzhid:true,nickName: true }).where({ userType: '1' }).get();
  // const result = await db.collection('userb').field({ collid: true, yzhid: true, nickName: true }).get();
  if (result && result.data.length > 0)
    return result.data;
  return null;
}
exports.queryAllCollids = queryAllCollids;

exports.updateAllDoc = async (tablename, whereObj, updateObj) => {
  if (utils.isEmptyObj(whereObj) || utils.isEmptyObj(updateObj))
    throw utils.newException('参数异常！');
  const collids = await queryAllCollids();
  if (!collids) return;
  let updatedNum = 0;
  let updatedCollids = [];
  for (let i = 0; i < collids.length; i++) {
    let collid = collids[i].collid;
    // if (utils.isEmpty(collid)) collid = '';
    // else collid = '_' + collid;
    if (updatedCollids.includes(collid)) continue;
    else{
      updatedCollids.push(collid);
    }
    try {
      const result = await db.collection(getTableName(tablename, collid)).where(whereObj).update({ data: updateObj });
      // console.log('updateAllDoc:', result, getTableName(tablename, collid),whereObj,updateObj);
      updatedNum += result.stats.updated;
    } catch (e) {
      //更新批表如果出错，暂不抛出异常
      console.log('updateAllDoc:', e);
    }
  }
  return updatedNum;
}

exports.queryAllDoc = async (tablename, whereObj) => {
  if (utils.isEmptyObj(whereObj))
    throw utils.newException('参数异常！');
  const collids = await queryAllCollids();
  if (!collids) return;
  console.log('collids:', collids);
  let resultList = [];
  for (let i = 0; i < collids.length; i++) {
    const { collid, nickName,yzhid } = collids[i];
    try {
      const newWhereObj = {yzhid,...whereObj};
      // console.log('query cond:', getTableName(tablename, collid),newWhereObj);
      result = await db.collection(getTableName(tablename, collid)).where(newWhereObj).get();
      if (result && result.data.length > 0) {
        resultList.push({ collid, nickName, sourceList: result.data });
      }
    } catch (e) {
      //批表查询如果出错，暂不抛出异常
      console.log('queryAllDoc:', e);
    }
  }
  return resultList;
}

const getTableName = (tableName, collid) => {
  if (utils.isEmpty(collid)) collid = '';
  else collid = '_' + collid;
  return tableName + collid;
}
exports.getTableName = getTableName;

exports.testService = async (data) => {
  //doc(undefined)
  //置为null, string：失败，number:成功
  //置为undefined
  let sfhj=null,sdj=null,sbcds=null;
  const result = await db.collection('house_1').doc('GVe1ZTXFeQ8zzHJG').update({data:{sbcds,sdj,sfhj}});
  console.log('test:', result);
  return result;
}
