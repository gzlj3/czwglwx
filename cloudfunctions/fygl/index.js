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
  console.log(action);
  console.log(CONSTS.BUTTON_EDITFY);
  console.log(action === CONSTS.BUTTON_EDITFY);
  try {
    switch(action){
      case CONSTS.BUTTON_QUERYFY:
        // console.log('queryfy');
          const result1 = await services.queryFyList(userb.yzhid);
          return results.getSuccessResults(result1);
        break;
      case CONSTS.BUTTON_ADDFY:
        // console.log('addfy');
          data.yzhid = userb.yzhid;
          const result2 = await services.addFy(data);
          return results.getSuccessResults(result2);
        break;
      case CONSTS.BUTTON_EDITFY:
        console.log("editfy");
        console.log(data);
        const result3 = await services.updateFy(data);
        return results.getSuccessResults(result3);
        break;
      default:
        return results.getErrorResults('未确定动作！');
    }
  } catch (e) {
    return results.getErrorResults(e.message);
  }
}