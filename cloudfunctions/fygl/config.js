const production = true;
exports.conf = {
  env: production ? 'jjczwgl-bc6ef9' : 'jjczwgl-test-2e296e',
  yzmYxq: 2 * 60,   //验证码有效期，2分钟
}
exports.production = production;
exports.queryPhoneInterval = 10*1000; //手机短信结果查询时间间隔，10秒
exports.grantcodeYxq = 3 * 24 * 3600 * 1000; //帐单查看授权码有效期（3天）
exports.defaultname = 'default'; //缺省设置名
exports.grantcodeHtqyYxq = 30 * 60 * 1000; //合同签约授权码有效期（30分钟）
