// miniprogram/pages/fygl/addfy/addfy.js
import * as CONSTS from '../../../utils/constants.js';
import * as fyglService from '../../../services/fygl.js'; 
const initialState = {
  status: CONSTS.REMOTE_SUCCESS, // 远程处理返回状态
  msg: '', // 远程处理返回信息
  currentObject: {},
  buttonAction: CONSTS.BUTTON_NONE, // 当前处理按钮（动作）
}

Page({

  /**
   * 页面的初始数据
   */
  data: initialState,
  changeState: function(newState) {
    this.setData({
      ...this.data,
      ...newState,
    });
  },

  // handleAfterRemote: function(response) {
  //   if(!response) return;
  //   const { buttonAction } = this.data;
  //   const tsinfo = CONSTS.getButtonActionInfo(buttonAction);
  //   response.then(res => {
  //     console.log(res);
  //     const { status = CONSTS.REMOTE_SUCCESS, msg, data } = res.result;
  //     this.changeState({status,msg});
      
  //     if (status === CONSTS.REMOTE_SUCCESS) {
  //       if (tsinfo.length > 0) {
  //         wx.showToast({
  //           title: `${tsinfo}成功完成！${msg}`,
  //         });
  //       };
  //       // 传递返回参数
  //       getApp().setPageParams(buttonAction,data);
  //       wx.navigateBack();
  //     } else {
  //       wx.showToast({
  //         title: `${tsinfo}处理失败！${msg}`,
  //         icon: 'none',
  //         duration: 5000,
  //       });
  //     }
  //   }).catch(err=>{
  //     console.log(err);
  //     wx.showToast({
  //       title: `${tsinfo}处理失败！${err.errMsg}`,
  //       icon: 'none',
  //       duration: 5000,
  //     });
  //   })
  // },

  formSubmit: function(e){
    console.log('form发生了submit事件，携带数据为：', e.detail.value)
    const {buttonAction} = this.data;
    const response = fyglService.saveFy(buttonAction,e.detail.value);
    // console.log(buttonAction+"===:"+CONSTS.getButtonActionInfo(buttonAction));
    fyglService.handleAfterRemote(response, CONSTS.getButtonActionInfo(buttonAction),
      (resultData)=>{
        getApp().setPageParams(buttonAction, resultData);
        wx.navigateBack();
      }
    );
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {
    const currentObject = options.item?JSON.parse(options.item):{};
    let buttonAction = options.buttonAction;
    if(buttonAction){
      buttonAction = Number.parseInt(buttonAction);
    }
    this.setData({
      buttonAction,
      currentObject
    })
  },
  onInputBlur: function(e) {
    // console.log(e);
    // console.log(e.target);
    this.data.currentObject[e.target.id] = e.detail.value;
    this.setData({
      currentObject: this.data.currentObject
    })
  },
  // bindSzrqChange: function(e){
  //   this.setData({
  //     currentObject:{
  //       ...this.data.currentObject,
  //       szrq: e.detail.value
  //     }
  //   })
  // },
  /**
   * 生命周期函数--监听页面初次渲染完成
   */
  onReady: function () {

  },

  /**
   * 生命周期函数--监听页面显示
   */
  onShow: function () {

  },

  /**
   * 生命周期函数--监听页面隐藏
   */
  onHide: function () {

  },

  /**
   * 生命周期函数--监听页面卸载
   */
  onUnload: function () {

  },

  /**
   * 页面相关事件处理函数--监听用户下拉动作
   */
  onPullDownRefresh: function () {

  },

  /**
   * 页面上拉触底事件的处理函数
   */
  onReachBottom: function () {

  },

  /**
   * 用户点击右上角分享
   */
  onShareAppMessage: function () {

  }
})