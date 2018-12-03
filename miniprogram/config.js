const production = false;
exports.conf = {
  env: production ? 'jjczwgl-bc6ef9' : 'jjczwgl-test-2e296e',
  yzmYxq: 2 * 60,   //验证码有效期，2分钟
} 
exports.uploadFileMaxCount = 10;       //每个房间上传文件最大数
exports.uploadFileMaxSize = 200*1024;  //上传文件大小最大值：200k
