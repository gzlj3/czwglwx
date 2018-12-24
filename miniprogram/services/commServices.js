const CONSTS = require('../utils/constants.js');
const utils = require('../utils/utils.js');
const config = require('../config.js');

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
        if (failCallback) failCallback(data);
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

const chooseImage = (cloudPath, successCallback, failCallback) => {
  wx.chooseImage({
    count: 1,
    sizeType: ['compressed'],
    sourceType: ['album', 'camera'],
    success: function (res) {
      const filePath = res.tempFilePaths[0];
      uploadCloudFile(filePath,cloudPath,successCallback,failCallback);
    }
  });
}
export { chooseImage };

const uploadCloudFile = (filePath, cloudPath, successCallback, failCallback) =>{
  let self = this;
  wx.getFileInfo({
    filePath: filePath,
    success: function (res) {
      //检查文件大小
      const fileSize = res.size;
      if (fileSize > config.uploadFileMaxSize) {
        utils.showToast('上传文件大小不能超过：' + (config.uploadFileMaxSize / 1024) + 'k');
        return;
      }
      wx.showLoading({
        title: '上传中',
      })
      // const filePath = res.tempFilePaths[0]
      // 给云文件加上源文件一样的后缀
      if(cloudPath.indexOf('.')<0){
        const fileType = filePath.match(/\.[^.]+?$/)[0];
        cloudPath += fileType;
      }
      console.log('upload file:', filePath, cloudPath);
      wx.cloud.uploadFile({
        cloudPath,
        filePath,
        success: res => {
          if(successCallback) successCallback(res.fileID);
        },
        fail: e => {
          // console.error('[上传文件] 失败：', e)
          wx.showToast({
            icon: 'none',
            title: '上传失败',
          })
          if(failCallback) failCallback(e);
        },
        complete: () => {
          wx.hideLoading()
        }
      })
    },
    fail: e => {
      // console.error(e)
      if (failCallback) failCallback(e);
    }
  })
}
export { uploadCloudFile};

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
