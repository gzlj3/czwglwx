const CONSTS=require('constants.js');


// let results = {
//   status: CONSTS.REMOTE_SUCCESS,
//   msg:'',
//   errCode:'',
//   data:null
// }

exports.getErrorResults = (msg,errCode) => {
  let results = {};
  results.status = CONSTS.REMOTE_ERROR;
  results.msg = msg;
  results.errCode = errCode;
  // results.data = null;
  return results;
}

exports.getSuccessResults = (data=null) => {
  let results = {};
  results.status = CONSTS.REMOTE_SUCCESS;
  // results.msg = '';
  results.data = data;
  return results;
}
