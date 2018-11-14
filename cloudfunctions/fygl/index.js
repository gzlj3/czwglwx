// 云函数入口文件
const results = require('results.js');
const CONSTS = require('constants.js');
const services = require('services.js');
const userServices = require('UserServices.js');
const utils = require('utils.js');

const curUser = {
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
  const {action,method,data} = event;
  if(!action) return results.getErrorResults('未确定动作！');
  console.log("action:"+action+"   method:"+method);
  // console.log(data);
  // console.log(context);
  // console.log(CONSTS.BUTTON_EDITFY);
  // console.log(action === CONSTS.BUTTON_EDITFY);
  try {
    let result;
    switch(action){
      case CONSTS.BUTTON_QUERYUSER:
        result = await userServices.queryUser(event.userInfo);
        return results.getSuccessResults(result);
      case CONSTS.BUTTON_QUERYFY:
        // console.log('queryfy');
          result = await services.queryFyList(curUser.yzhid);
          return results.getSuccessResults(result.data);
      case CONSTS.BUTTON_ADDFY:
        // console.log('addfy');
          data.yzhid = curUser.yzhid;
          data.lrr=curUser.userid;
          data.lrsj=utils.getCurrentTimestamp();
          data.zhxgr=curUser.userid;
          data.zhxgsj=data.lrsj;
          result = await services.saveFy(data);
          return results.getSuccessResults(result);
        break;
      case CONSTS.BUTTON_EDITFY:
        console.log("editfy");
        data.zhxgr=curUser.userid;
        data.zhxgsj=utils.getCurrentTimestamp();
        result = await services.saveFy(data);
        return results.getSuccessResults(result);
        break;
      case CONSTS.BUTTON_CB:
        if(method==='POST'){
          console.log("cb");
          result = await services.updateSdb(data);
        }else{
          console.log("querysdb");
          result = await services.querySdbList(curUser.yzhid);
          result = result.data;
        }
        return results.getSuccessResults(result);
        break;
      case CONSTS.BUTTON_MAKEZD:
        if (method === 'POST') {
          console.log("makezd");
          result = await services.updateZdList(data);
        }else{
          console.log("querymakezd");
          result = await services.queryZdList(curUser.yzhid);
        }
        return results.getSuccessResults(result);
      case CONSTS.BUTTON_LASTZD:
        if (method === 'POST') {
          console.log("post lastzd");
          result = await services.processQrsz(data,curUser);
          result = result.data;
        } else {
          console.log("querylastzd");
          result = await services.queryLastzdList(data);
          result = result.data;
        }
        return results.getSuccessResults(result);
      default:
        return results.getErrorResults('未确定动作！');
    }
  } catch (e) {
    console.log(e);
    return results.getErrorResults(e.message);
  }
}