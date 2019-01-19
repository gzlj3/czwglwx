const utils = require('utils.js');
const config = require('config.js')
const rp = require('request-promise');
const request = require('request');

//通过榛子云短信平台发送手机短信（http://smsow.zhenzikj.com）
//其中的appId,appSecret为榛子云平台注册的帐号信息
// uri: 'http://sms_developer.zhenzikj.com/sms/send.do',
// appId: '100127',
//   appSecret: '4d8234e0-9771-4d1c-a673-83c88f943b92',


exports.sendPhoneMessage = async (sjhm, message,messageId) => {
  console.log('sendmessagelength:',message.length);
  // if(!config.production) {
  //   //测试环境不真正发短信
  //   return;
  // }
  if(!messageId) messageId = utils.currentTimeMillis()+"";
  const options = {
    method: 'POST',
    uri: 'http://sms.zhenzikj.com/sms/send.do',
    form: {
      appId: '100019',
      appSecret: '8379f582-35f4-48c2-9f8a-8cd0f2a60a01',
      message,
      messageId,
      number: sjhm
    },
    headers: {
      'content-type': 'application/x-www-form-urlencoded',
    }
  };
  console.log('发送手机短信:',options);
  let result = await rp(options);
  result = JSON.parse(result);
  console.log('发送短信结果：', result); 
  if (result.code !== 0)
    throw utils.newException("短信发送失败:【" + result.code + "】" + result.data);
  return result;
}

exports.queryPhoneMessageStatus = async (messageId) => {
  const options = {
    method: 'POST',
    uri: 'http://sms.zhenzikj.com/smslog/findSmsByMessageId.do',
    form: {
      appId: '100019',
      appSecret: '8379f582-35f4-48c2-9f8a-8cd0f2a60a01',
      messageId,
    },
    headers: {
      'content-type': 'application/x-www-form-urlencoded',
    }
  };
  console.log('获取短信发送状态:',options);
  let result = await rp(options);
  result = JSON.parse(result);
  console.log('获取结果：', result); 
  // if (result.code !== 0)
  //   throw utils.newException("短信发送失败:【" + result.code + "】" + result.data);
  return result;
}
