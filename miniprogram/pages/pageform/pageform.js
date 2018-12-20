// miniprogram/pages/pageform/pageform.js
import * as CONSTS from '../../utils/constants.js';
Page({

  /**
   * 页面的初始数据
   */
  data: {
    formname:'FmFwpt',
    objectname:'',
    currentObject:null
  },

  /**
   * 生命周期函数--监听页面加载
   * 入口参数：formname，表单名
   * objectname,存储在globalData上的对象名
   */
  onLoad: function (options) {
    // console.log('onload:',options);
    const {formname,objectname} = options;
    this.setData({formname,objectname,currentObject:getApp().globalData[objectname]});
    getApp().globalData[objectname] = null;
    getApp().globalData[objectname + CONSTS.globalRetuSuffix]  = null;
    // console.log(this.data);
  },

  formSubmit: function (e) {
    const { objectname } = this.data;    
    getApp().globalData[objectname + CONSTS.globalRetuSuffix] = e.detail.value;
    console.log(objectname + CONSTS.globalRetuSuffix,e);
    wx.navigateBack();
  },

  onInputBlur: function (e) {
    // const name = e.target.id;
    // let { currentObject } = this.data;
    // currentObject[name] = e.detail.value;
    // console.log('oninputblur:', name, e.detail.value, currentObject[name]);
    // this.setData({ currentObject });
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