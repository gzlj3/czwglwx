const CONSTS = require('../utils/constants.js');
export function handleAfterRemote(response, tsinfo, successCallback) {
  if (!response) return;
  // const { buttonAction } = this.data;
  // const tsinfo = CONSTS.getButtonActionInfo(buttonAction);
  // console.log("tsinfo:"+tsinfo);
  if (!tsinfo) tsinfo = "";
  response.then(res => {
    wx.hideLoading();
    console.log(res);
    const { status = CONSTS.REMOTE_SUCCESS, msg, data } = res.result;
    // this.changeState({ status, msg });

    if (status === CONSTS.REMOTE_SUCCESS) {
      if (tsinfo.length > 0) {
        wx.showToast({
          title: `${tsinfo}成功！`,
        });
      };
      if (successCallback) successCallback(data);
    } else {
      wx.showToast({
        title: `${tsinfo}失败！${msg}`,
        icon: 'none',
        duration: 5000,
      });
    }
  }).catch(err => {
    wx.hideLoading();
    console.log(err);
    wx.showToast({
      title: `${tsinfo}处理失败！${err.errMsg}`,
      icon: 'none',
      duration: 5000,
    });
  })
}
