const cloud = require('wx-server-sdk')

cloud.init()

exports.queryFyList = async (yzhid) => {
  //查询房源列表
  const db = cloud.database();
  try{
    const result = db.collection('house').where({
      yzhid
    }).get()
    .then(res => {
      return res.data
    })
    return result;
  }catch(ex){
    console.log(ex);
    throw ex;
  }
}

exports.addFy = async (house) => {
  //添加房源
  const db = cloud.database();
  try {
    const result = db.collection('house').add({
      data:house
    }).then(res => {
        return res
      })
    return result;
  } catch (ex) {
    console.log(ex);
    throw ex;
  }
}

exports.updateFy = async (house) => {
  //添加房源
  const db = cloud.database();
  // try {
    const result = db.collection('house').doc(house._id).update({
      data: house
    });
    // .then(res => {
    //   return res
    // })
    return result;
  // } catch (ex) {
  //   console.log(ex);
  //   throw ex;
  // }
}
