const utils = require('../../../utils/utils.js');
const fyglService = require('../../../services/fyglServices.js');
const CONSTS = require('../../../utils/constants.js');
const app = getApp()
Page({

  /**
   * 页面的初始数据
   */
  data: {
    user: null,
    config:null
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {
    // console.log('sysconfg onload');
    fyglService.checkAuthority(CONSTS.BUTTON_SYSCONFIG);
    this.setData({ user: app.globalData.user, config: {...app.globalData.user.config} });
  },

  onCheckboxChange: function (e) {
    // console.log('checkbox发生change事件，携带value值为：', e.detail.value);
    const allChecked = e.detail.value;
    let config = {zdmonth:'0'};
    allChecked.map(value => {
      config[value] = '1';
    })
    this.setData({ config });
  },
  formSubmit: function (e) {
    console.log('配置数据：', this.data.config);
    this.handleSubmit(this.data.config);
  },

  handleSubmit: function (formObject) {
    // const formObject = e.detail.value;
    const response = fyglService.postData(CONSTS.BUTTON_SYSCONFIG, formObject);
    fyglService.handleAfterRemote(response, '系统配置',
      (resultData) => {
        app.setUserData(resultData);
        this.setData({ user: app.globalData.user });
        // console.log(resultData);
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