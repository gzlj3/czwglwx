const utils = require('../../utils/utils.js');
const fyglService = require('../../services/fyglServices.js');
const CONSTS = require('../../utils/constants.js');
Page({

  /**
   * 页面的初始数据
   */
  data: {
    rights:{}
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {
  },

  grantCheckboxChange: function (e) {
    // console.log('checkbox发生change事件，携带value值为：', e.detail.value);
    const rightsChecked = e.detail.value;
    let rights={};
    rightsChecked.map(value=>{
      rights[value] = true;
    })
    this.setData({rights});
  },

  formSubmit: function (e) {
    console.log('form提交数据：', e.detail.value)
    const formObject = e.detail.value;
    const {sjhm} = formObject;
    if (!utils.checkSjhm(sjhm)) {
      wx.showToast({
        title: '请先输入正确的手机号',
        icon: 'none',
      });
      return;
    };
    const response = fyglService.postData(CONSTS.BUTTON_USERGRANT, formObject);
    fyglService.handleAfterRemote(response, '用户授权',
      (resultData) => {
        console.log(resultData);
        // this.setData({ sendingYzm: true });
        // this.timer();
      }
    );
  },

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