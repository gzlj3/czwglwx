const CONSTS=require('constants.js');

let results = {
  status: CONSTS.REMOTE_SUCCESS,
  msg:'',
  data:null
}

exports.getErrorResults = (msg) => {
  results.status = CONSTS.REMOTE_ERROR;
  results.msg = msg;
  return results;
}

exports.getSuccessResults = (data=null) => {
  results.data = data;
  return results;
}
