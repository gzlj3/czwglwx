// miniprogram/pages/fygl/sendzd/sendzd.js
import * as fyglService from '../../../services/fyglServices.js'; 
import * as CONSTS from '../../../utils/constants.js';
const utils = require('../../../utils/utils.js');

Page({

  /**
   * 页面的初始数据
   */
  data: {
    params:null
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {
    const params = options.item? JSON.parse(options.item) : {};
    // console.log('sendzd:', params);
    const { message } = params;
    wx.setClipboardData({ data: message });
    this.setData({ params});
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
  // onCopyzd: function (e) {
  //   const {message} = this.data.params;
  //   wx.setClipboardData({ data: message });
  // },
  /**
   * 用户点击按钮分享
   */
  onShareAppMessage: function (e) {
    // console.log(e);
    // if (e.from !== 'button') {
    //   // 不是来自页面内转发按钮
    //   return;
    // }
    const {grantcode,page} = this.data.params;
    const s = JSON.stringify({grantcode});
    let path = '/pages/fygl/editlist/editlist';
    if(!utils.isEmpty(page)) path = page;
    if(path.indexOf('?')>=0) path += '&';
    else path += '?';
    path += 'item='+s;

    //由于发送结果信息截获不到，因此先保存发送信息
    const response = fyglService.postData(CONSTS.BUTTON_GRANTCODE, this.data.params);
    fyglService.handleAfterRemote(response, null);

    return {
      title: '查看详情>',
      path,
      // imageUrl:'../../images/czwgl.jpg'
      // success: function (res) { 
      //   utils.showToast('发送成功！');
      //   wx.navigateBack();
      // },
      // fail: function (res) {
      //   // 转发失败
      //   utils.showToast("转发失败:" + JSON.stringify(res));
      // }
    }
  },
})