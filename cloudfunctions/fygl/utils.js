const moment = require('moment.min.js');
const rp = require('request-promise');

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

//取当前时间毫秒值
exports.currentTimeMillis = () => {
  return (new Date()).getTime();
}

function newException (message,code){
  return {message,code};
}
exports.newException = newException;

//通过榛子云短信平台发送手机短信（http://smsow.zhenzikj.com）
//其中的appId,appSecret为榛子云平台注册的帐号信息
exports.sendPhoneMessage = async (sjhm,message)=>{
  const options = {
    method: 'POST',
    uri: 'http://sms_developer.zhenzikj.com/sms/send.do',
    form: {
      appId: '100127',
      appSecret: '4d8234e0-9771-4d1c-a673-83c88f943b92',
      message,
      number:sjhm
    },
    headers: {
      'content-type': 'application/x-www-form-urlencoded',
    }
  };
  console.log(options);
  let result = await rp(options);
  result = JSON.parse(result);
  console.log(result); 
  if(result.code!==0)
    throw newException("短信发送失败:【"+result.code+"】"+result.data);
  return result;
}

//生成n位数的随机数
exports.getRandom = (n) => { 
  let result = "";
  for (var i = 0; i < n; i++)
    result += Math.floor(Math.random() * 10);
  return result;
}
