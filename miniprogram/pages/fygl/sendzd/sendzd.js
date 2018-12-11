// miniprogram/pages/fygl/sendzd/sendzd.js
import * as fyglService from '../../../services/fyglServices.js'; 
import * as CONSTS from '../../../utils/constants.js';
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
    console.log('sendzd:', params);
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
  onCopyzd:function(e){
    const {message} = this.data.params;
    wx.setClipboardData({ data: message });
  },
  /**
   * 用户点击按钮分享
   */
  onShareAppMessage: function (e) {
    console.log(e);
    if (e.from !== 'button') {
      // 不是来自页面内转发按钮
      return;
    }
    const {grantcode} = this.data.params;
    const self = this;
    const s = JSON.stringify({grantcode});

    //由于发送结果信息经常截获不到，因此先保存发送信息
    const response = fyglService.postData(CONSTS.BUTTON_GRANTCODE, self.data.params);
    fyglService.handleAfterRemote(response, null);

    return {
      title: '查看帐单详情>',
      path: '/pages/fygl/editlist/editlist?buttonAction='+CONSTS.BUTTON_LASTZD+'&item='+s,
      // imageUrl:'../../images/czwgl.jpg'
      success: function (res) { 
        utils.showToast('发送成功！');
        wx.navigateBack();
        // 转发成功,更新授权码
        // console.log("转发成功:" + JSON.stringify(res));
        // const response = fyglService.postData(CONSTS.BUTTON_GRANTCODE, self.data.params);
        // fyglService.handleAfterRemote(response, '发送帐单');
      },
      fail: function (res) {
        // 转发失败
        utils.showToast("转发失败:" + JSON.stringify(res));
      }
    }
  },
})