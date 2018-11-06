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

  handleAfterRemote: function(response) {
    if(!response) return;
    response.then(res => {
      const { status = CONSTS.REMOTE_SUCCESS, msg, data } = res.result;
      const { buttonAction } = this.data;
      const tsinfo = CONSTS.getButtonActionInfo(buttonAction);
      this.changeState({status,msg});
      
      if (status === CONSTS.REMOTE_SUCCESS) {
        if (tsinfo.length > 0) {
          wx.showToast({
            title: `${tsinfo}成功完成！${msg}`,
          });
        };
      } else {
        wx.showToast({
          title: `${tsinfo}处理失败！${msg}`,
          icon: 'none',
        });
      }
    });
  },

  formSubmit: function(e){
    console.log('form发生了submit事件，携带数据为：', e.detail.value)
    const response = fyglService.addFy(e.detail.value);
    this.handleAfterRemote(response);
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {
    console.log(options);
    const currentObject = options.item?JSON.parse(options.item):{};
    const buttonAction = options.buttonAction;
    console.log(currentObject);
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