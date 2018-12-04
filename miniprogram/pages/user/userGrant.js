const utils = require('../../utils/utils.js');
const fyglService = require('../../services/fyglServices.js');
// const commService = require('../../services/commServices.js');
const CONSTS = require('../../utils/constants.js');
const app = getApp()
Page({

  /**
   * 页面的初始数据
   */
  data: {
    rights:{},
    user: app.globalData.user
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {
    // console.log('usergrant onload');
    fyglService.checkAuthority(CONSTS.BUTTON_USERGRANT);
    this.setData({ user: app.globalData.user }); 
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
  cancelGrant: function(e){
    const { item: sjhm } = e.currentTarget.dataset;
    const formObject = {sjhm};
    e.detail.value = formObject;
    e.cancelGrant = true;
    this.formSubmit(e);
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
    const self = this;
    let tsinfo;
    if (e.cancelGrant){
      tsinfo = `确定取消${sjhm}的权限吗?`;
    }else{
      tsinfo = `你确定将我的房源授权给${sjhm}操作吗？`;
    }
    utils.showModal('权限管理',tsinfo, () => { self.handleSubmit(e); });      
  },

  handleSubmit: function (e) {
    const formObject = e.detail.value;
    const response = fyglService.postData(CONSTS.BUTTON_USERGRANT, formObject); 
    fyglService.handleAfterRemote(response, '用户授权',
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