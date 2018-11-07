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
//select u from House u where u.yzhid =? 1 and sfsz <> '0' and u.szrq <=? 2 order by u.fwmc
exports.querySdbList = async (yzhid) => {
  //查询房源列表
  const db = cloud.database();
  const _ = db.command;
  try {
    const result = db.collection('house').orderBy('fwmc').where({
      yzhid,
      sfsz: _.neq('0')
    }).get()
      .then(res => {
        return res.data
      })
    return result;
  } catch (ex) {
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
    const {_id} = house;
    delete house._id;
    const result = db.collection('house').doc(_id).update({
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

exports.updateSdb = async (houseList) => {
  const db = cloud.database();
  let tasks = [];
  const _ = db.command;
  houseList.map((house)=>{
    const { _id } = house;
    const promise = db.collection('house').doc(_id).update({
      data: {
        dbcds: house.dbcds && house.dbcds !== '' ? house.dbcds : _.remove(),
        sbcds: house.sbcds && house.sbcds !== '' ? house.sbcds : _.remove(),
      }
    });
    tasks.push(promise);
  });
  return Promise.all(tasks);
}
