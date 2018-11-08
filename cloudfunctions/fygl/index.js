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
  console.log("action:"+action);
  // console.log(data);
  // console.log(context);
  // console.log(CONSTS.BUTTON_EDITFY);
  // console.log(action === CONSTS.BUTTON_EDITFY);
  try {
    let result;
    switch(action){
      case CONSTS.BUTTON_QUERYFY:
        // console.log('queryfy');
          result = await services.queryFyList(userb.yzhid);
          return results.getSuccessResults(result.data);
        break;
      case CONSTS.BUTTON_ADDFY:
        // console.log('addfy');
          data.yzhid = userb.yzhid;
          result = await services.addFy(data);
          return results.getSuccessResults(result);
        break;
      case CONSTS.BUTTON_EDITFY:
        console.log("editfy");
        result = await services.updateFy(data);
        return results.getSuccessResults(result);
        break;
      case CONSTS.BUTTON_CB:
        console.log("cb");
        result = await services.updateSdb(data);
        return results.getSuccessResults(result);
        break;
      case CONSTS.BUTTON_MAKEZD:
        console.log("makezd");
        result = await services.updateZdList(data);
        return results.getSuccessResults(result);
        break;
      case CONSTS.BUTTON_QUERYSDB:
        console.log("querysdb");
        result = await services.querySdbList(userb.yzhid);
        return results.getSuccessResults(result.data);
        break;
      case CONSTS.BUTTON_QUERYMAKEZD:
        console.log("querymakezd");
        result = await services.queryZdList(userb.yzhid);
        return results.getSuccessResults(result);
        break;
      default:
        return results.getErrorResults('未确定动作！');
    }
  } catch (e) {
    console.log(e);
    return results.getErrorResults(e.message);
  }
}