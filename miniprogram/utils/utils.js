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
  return !(value && value.length>0);
}

exports.showLoading = (info) => {
  wx.showLoading({
    title:info?info:'加载中',
    mask: true,
  });
}
