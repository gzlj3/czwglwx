const moment = require('moment.min.js');
const rp = require('request-promise');
const request = require('request');
const CONSTS = require('constants.js');

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
  return !value;
  // return !(value && value.length > 0);
}

const isEmptyObj = (obj) => {
  if (!obj) return true;
  for (var key in obj) {
    return false
  }
  return true;
}
exports.isEmptyObj = isEmptyObj;

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
function codeException(errCode) {
  // console.log('exception:', errCode, CONSTS.EXCEPTION[errCode]);
  let msg = CONSTS.EXCEPTION[errCode];
  if(!msg) msg = errCode;
  return newException(msg,errCode);
}
exports.codeException = codeException;

//通过榛子云短信平台发送手机短信（http://smsow.zhenzikj.com）
//其中的appId,appSecret为榛子云平台注册的帐号信息
exports.sendPhoneMessage = async (sjhm,message)=>{
  // throw newException("短信发送失败:【帐户金额不足】");
  return;
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
  console.log('发送手机短信:',options);
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
exports.yzhid = () => {
  return uuid(16, 10);
}
exports.collid = () => {
  return uuid(5);
}
exports.id = () => {
  return uuid(16);
}

// exports.sendTemplateMessage = async (data) => {
//   let _access_token = '15_lOtjmRgNqoJ8wGuUOJyyYgjqLQeEHf7bW44PkYk0OqLZkOhp-MfOGDfmdmzdiGhf9DIPKFuO_dU6x5HxsOhAETVNDzmKSPL5r5J35BYRC_DcHqw5KYf1WL9SSAn5WDblD6kNSBRBjNFhyK4fUGFfAFAMYX';
//   data.access_token = _access_token;
//   let url = 'https://api.weixin.qq.com/cgi-bin/message/wxopen/template/send?access_token=' + _access_token; 
//   let openid = 'on_Li5Pa4d5XQklE_NCiI2IoPKsM';
//   // let openid = 'on_Li5OH1iiBDfHuushKvYL_P9qQ';
//   let jsonData = {
//     access_token: _access_token,
//     touser: openid,
//     template_id: '50_-U2e4vq8STuhhDTqEWVywu1RQYFSzujZv_NG2h6k',
//     form_id: data.form_id,
//     page: "pages/index/index",
//     data: {
//       "keyword1": { "value": "测试数据一"},
//       "keyword2": { "value": "测试数据二"},
//       "keyword3": { "value": "测试数据三"},
//       "keyword4": { "value": "测试数据四"},
//       "keyword5": { "value": "测试数据五"},
//     }
//   }
//   const s = JSON.stringify(jsonData);

//   // request.post();
//   const data1 =
//     {
//       "touser": "on_Li5Pa4d5XQklE_NCiI2IoPKsM",
//       "template_id": "50_-U2e4vq8STuhhDTqEWVywu1RQYFSzujZv_NG2h6k",
//       "page": "index",
//       "form_id": "FORMID",
//       "data": {
//         "keyword1": {
//           "value": "339208499"
//         },
//         "keyword2": {
//           "value": "2015年01月05日 12:30"
//         },
//         "keyword3": {
//           "value": "腾讯微信总部"
//         },
//         "keyword4": {
//           "value": "广州市海珠区新港中路397号"
//         }
//       },
//       "emphasis_keyword": "keyword1.DATA"
//     }
  
//   const options = {
//     method: 'POST',
//     uri: url,
//     body:s,
//     // form: data1,
//     // headers: {
//     //   'content-type': 'application/x-www-form-urlencoded',
//     // }
//   };
//   console.log('发送模板消息:', options);
//   let result = await rp(options);
//   // result = JSON.parse(result);
//   console.log(result);
//   // if (result.code !== 0)
//   //   throw newException("短信发送失败:【" + result.code + "】" + result.data);
//   return result;
// }
