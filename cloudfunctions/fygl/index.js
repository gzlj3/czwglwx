// 云函数入口文件
const cloud = require('wx-server-sdk')

cloud.init()

// 云函数入口函数
exports.main = async (event, context) => {
  console.log("insert start!");
  const db = cloud.database();
  console.log("insert start1!");
  const house = db.collection('house');
  // console.log(house);
  await house.add({
    data: event,
    // success: function (res) {
    //   // res 是一个对象，其中有 _id 字段标记刚创建的记录的 id
    //   console.log("insert success!");
    //   console.log(res)
    // },
    // fail: function(e){
    //   console.log("insert failure!");
    //   console.error(e);
    // }
  })
  .then(res =>{
    console.log("insert success."); 
    console.log(res)
  })
  .catch(error=>console.log(error));

}