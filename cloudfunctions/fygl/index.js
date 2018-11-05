// 云函数入口文件
const results = require('results.js');
const CONSTS = require('constants.js');
const services = require('services.js');

const userb = {
  userid:'admin',
  username:'管理员',
  dhhm:'13332875650',
  yzhid:'1',
}

// 云函数入口函数
/* event 参数对象：
{ action:页面触发动作
  data:  页面上传的数据
}
*/
exports.main = async (event, context) => {
  const {action,data} = event;
  if(!action) return results.getErrorResults('未确定动作！');
  // console.log(action);
  // console.log(CONSTS.BUTTON_QUERYFY);
  // console.log(action === CONSTS.BUTTON_QUERYFY);
  switch(action){
    case CONSTS.BUTTON_QUERYFY:
      console.log('queryfy');
      try{
        const result = await services.queryFyList(userb.yzhid);
        return results.getSuccessResults(result);
      }catch(e){
        console.log(e);
        return results.getErrorResults(e);
      }
      break;
    case CONSTS.BUTTON_ADDFY:
      console.log('addfy');
      try {
        data.yzhid = userb.yzhid;
        const result = await services.addFy(data);
        return results.getSuccessResults(result);
      } catch (e) {
        console.log(e);
        return results.getErrorResults(e);
      }
      break;
  }
  // if (!action) return {msg:'未输入动作'};

  // console.log("insert start!");
  // const db = cloud.database();
  // console.log("insert start1!");
  // const house = db.collection('house');
  // return house.add({
  //   data: event,
  // });

  // console.log(house);
  // const result = await house.add({
  //   data: event,
  // })
  // .then(res =>{
  //   console.log("insert success."); 
  //   console.log(res)
  //   return res;
  // })
  // .catch(error=>console.log(error));
  // return result;
}