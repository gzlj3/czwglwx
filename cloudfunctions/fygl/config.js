const production = false;
exports.conf = {
  env: production ? 'jjczwgl-bc6ef9' : 'jjczwgl-test-2e296e',
  yzmYxq: 2 * 60,   //验证码有效期，2分钟
}
exports.production = production;
exports.queryPhoneInterval = 10*1000; //手机短信结果查询时间间隔，10秒