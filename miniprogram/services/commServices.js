const CONSTS = require('../utils/constants.js');
const utils = require('../utils/utils.js');
export function handleAfterRemote(response, tsinfo, successCallback,failCallback) {
  if (!response) return;
  // const { buttonAction } = this.data;
  // const tsinfo = CONSTS.getButtonActionInfo(buttonAction);
  // console.log("tsinfo:"+tsinfo);
  if (!tsinfo) tsinfo = "";
  response.then(res => {
    wx.hideLoading(); 
    // console.log('handle return:',res);
    const { status = CONSTS.REMOTE_SUCCESS, msg, errCode,data } = res.result;
    if (status === CONSTS.REMOTE_SUCCESS) {
      if (tsinfo.length > 0) {
        wx.showToast({
          title: `${tsinfo}成功！`,
        });
      }; 
      if (successCallback) successCallback(data);
    } else {
      if (errCode === 100 || errCode === 101 || errCode===102) {
        //用户未注册或用户数据异常，回到主页面
        wx.reLaunch({
          url: '/pages/index/index',
        })
      } else if (errCode === -502005 && isFd()) {
        //系统初始化需录入1条房源数据
        wx.navigateTo({
          url: '/pages/fygl/addfy/addfy?buttonAction=' + CONSTS.BUTTON_ADDFY,
        }) 
      }else{
        wx.showToast({
          title: `${tsinfo}失败！${msg}`,
          icon: 'none',
          duration: 5000,
        });
      }
    }
  }).catch(err => {
    wx.hideLoading();
    console.log(err);
    wx.showToast({
      title: `${tsinfo}处理失败！${err.errMsg}`,
      icon: 'none',
      duration: 5000,
    });
    if (failCallback) failCallback(err);
  })
}

const isZk = ()=>{
  return getApp().globalData.user.userType === CONSTS.USERTYPE_ZK;
}

const isFd = ()=> {
  return getApp().globalData.user.userType === CONSTS.USERTYPE_FD;
}
export { isZk, isFd };

export function checkAuthority(action){
  if (!checkRights(action)){
    wx.redirectTo({
      url: '/pages/index/index',
    })
  }
}

const checkRights = (action,right,yzhid,showts)=>{
  if (!isZk() && !isFd()) {
    //用户未注册或用户数据异常，回到主页面
    return false;
  }
  if (isZk()) {
    if ([CONSTS.BUTTON_CB, CONSTS.BUTTON_MAKEZD, CONSTS.BUTTON_ADDFY, CONSTS.EDITFY, CONSTS.DELETEFY, CONSTS.BUTTON_EXITFY, CONSTS.BUTTON_USERGRANT, CONSTS.BUTTON_SYSCONFIG].indexOf(action) >= 0) {
      return false;
    }
  }
  if (isFd() && !utils.isEmpty(right) && !utils.isEmpty(yzhid)) {
    const user = getApp().globalData.user;
    const {granted} = user;
    if(user.yzhid === yzhid){
       //自己的房源
       return true;
    }
    let haveRight = false;
    // console.log('checkright:',granted,right,yzhid);
    if(granted && granted.length>0){
      for(let i=0;i<granted.length;i++){
        const value = granted[i];
        const {yzhid:grantYzhid,rights} = value;
        if (grantYzhid===yzhid && rights.includes(right)){
          haveRight = true;
          break;
        }
      };
    }
    if (showts && !haveRight ) utils.showToast('你无权操作此功能！');
    return haveRight;
  } 
  return true;
}
export {checkRights}
