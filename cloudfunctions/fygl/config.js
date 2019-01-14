const production = true;
exports.conf = {
  env: production ? 'jjczgl-2d82f0' : 'jjczgl-test-aca51e',
  yzmYxq: 2 * 60,   //验证码有效期，2分钟
}
exports.production = production;
exports.queryPhoneInterval = 10*1000; //手机短信结果查询时间间隔，10秒
exports.grantcodeYxq = 3 * 24 * 3600 * 1000; //帐单查看授权码有效期（3天）
exports.defaultname = 'default'; //缺省设置名
exports.grantcodeHtqyYxq = 30 * 60 * 1000; //合同签约授权码有效期（30分钟）

exports.accessTokenYxq = 118 * 60 * 1000; //accesstoken有效期（118分钟）
