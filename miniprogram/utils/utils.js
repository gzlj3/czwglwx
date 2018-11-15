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

const isEmpty = (value) => {
  return !(value && value.length>0);
}
exports.isEmpty = isEmpty;

exports.showLoading = (info) => {
  wx.showLoading({
    title:info?info:'加载中',
    mask: true,
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
