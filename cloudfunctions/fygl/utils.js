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

//对number四舍五入，保留指定位置，并返回数值型
exports.roundNumber = (number,precision) => {
  try{
    const result = Number.parseFloat(number.toFixed(precision));
    if (isNaN(result)) return 0;
    return result;
  }catch(e){
    return 0;
  }
}

exports.isEmpty = (value) => {
  return !(value && value.length > 0);
}

exports.getCurrentTimestamp = ()=>{
  // return moment().format('YYYY-MM-DD HH:mm:ss');
  return moment().utcOffset(+8).format('YYYY-MM-DD HH:mm:ss')
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
  // console.log(options);
  let result = await rp(options);
  result = JSON.parse(result);
  // console.log(result); 
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

//生成UUID
function uuid(len, radix) {
  var chars = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz'.split('');
  var uuid = [], i;
  radix = radix || chars.length;

  if (len) {
    // Compact form
    for (i = 0; i < len; i++) uuid[i] = chars[0 | Math.random() * radix];
  } else {
    // rfc4122, version 4 form
    var r;

    // rfc4122 requires these characters
    uuid[8] = uuid[13] = uuid[18] = uuid[23] = '-';
    uuid[14] = '4';

    // Fill in random data. At i==19 set the high bits of clock sequence as
    // per rfc4122, sec. 4.1.5
    for (i = 0; i < 36; i++) {
      if (!uuid[i]) {
        r = 0 | Math.random() * 16;
        uuid[i] = chars[(i == 19) ? (r & 0x3) | 0x8 : r];
      }
    }
  }

  return uuid.join('');
}
exports.uuid = uuid;
exports.newYzhid = () => {
  return uuid(16, 10);
}
exports.id = () => {
  return uuid(16);
}
