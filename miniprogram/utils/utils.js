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
exports.roundNumber = (number, precision) => {
  try {
    const result = Number.parseFloat(number.toFixed(precision));
    if (isNaN(result)) return 0;
    return result;
  } catch (e) {
    return 0;
  }
}

exports.getString = (value) => {
  return value?value:"";
}

const isEmpty = (value) => {
  return !value;
  // return !(value && value.length>0);
}
exports.isEmpty = isEmpty;

const isEmptyObj = (obj) => {
  if(!obj) return true;
  for (var key in obj) {
    return false
  }
  return true;
}
exports.isEmptyObj = isEmptyObj;

exports.showLoading = (info) => {
  wx.showLoading({
    title:info?info:'加载中',
    mask: true,
  });
}

exports.showToast = (info) => {
  wx.showToast({
    title: info,
    icon: 'none',
    duration: 5000,
  });  
}

exports.showModal = (title, content, callback) => {
  wx.showModal({
    title,
    content,
    success: function (res) {
      if (res.confirm) {
        callback();
      }
    }
  });
}

exports.checkSjhm = (sjhm) => {
  const myreg = /^(14[0-9]|13[0-9]|15[0-9]|17[0-9]|18[0-9])\d{8}$$/;
  return myreg.test(sjhm);
}

//生成n位数的随机数
exports.getRandom = (n) => {
  let result  = "";
  for (var i = 0; i < n; i++)
    result += Math.floor(Math.random() * 10);
  return result;
}

exports.redirectToSuccessPage = (pageDesc, buttonText,returnUrl,returnAction,returnItem) => {
  const button2Obj = {
    buttonText,
    returnUrl,
    returnAction,
    returnItem
  }
  wx.redirectTo({
    url: '/pages/fygl/msg/msg_success?pageDesc=' + pageDesc + '&button2=' + JSON.stringify(button2Obj)
  });
}

//取当前时间毫秒值
exports.currentTimeMillis = () => {
  return (new Date()).getTime();
}

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
exports.newYzhid = ()=>{
  return uuid(16,10);
}
