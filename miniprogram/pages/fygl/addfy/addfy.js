// miniprogram/pages/fygl/addfy/addfy.js
Page({

  /**
   * 页面的初始数据
   */
  data: {

  },

  formSubmit: function(e){
    console.log('form发生了submit事件，携带数据为：', e.detail.value)
    wx.cloud.callFunction({
      name: 'fygl',
      data: e.detail.value,
      success: res => {
        wx.showToast({
          title: '调用成功',
        })
        console.log(res.result);
        // this.setData({
        //   result: JSON.stringify(res.result)
        // })
      },
      fail: err => {
        wx.showToast({
          icon: 'none',
          title: '调用失败',
        })
        console.error('[云函数] [fygl] 调用失败：', err)
      }
    })


  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {

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