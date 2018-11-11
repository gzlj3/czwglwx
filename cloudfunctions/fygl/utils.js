const moment = require('moment.min.js');

exports.getInteger = (value) => {
  try{
    const result = Number.parseInt(value);
    if(isNaN(result)) return 0;
    return result;
  }catch(e){
    return 0;
  }
}

exports.getFloat = (value) => {
  try {
    const result = Number.parseFloat(value);
    if (isNaN(result)) return 0;
    return result;
  } catch (e) {
    return 0;
  }
}

exports.isEmpty = (value) => {
  return !(value && value.length > 0);
}

exports.getCurrentTimestamp = ()=>{
  return moment().format('YYYY-MM-DD HH:mm:ss');
}