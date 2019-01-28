const utils = require('../../utils/utils.js');
const urls = ["http://mp.weixin.qq.com/s?__biz=MzU4MDc1NDE5NQ==&mid=100000001&idx=1&sn=ed50e595f33e0af13d83a8f338a1ee3d&chksm=7d534f7d4a24c66bc61b44203896eb48cdb2a393c3f643db4d77f285dd82739da3c340939200#rd","http://mp.weixin.qq.com/s?__biz=MzU4MDc1NDE5NQ==&mid=100000010&idx=1&sn=870369006f34d8234f6b32d50d849e69&chksm=7d534f764a24c660e96493aec23d43d5166a9a03729c1fc4445054d59be52a2cf5ebda94fd3e#rd"
]


Page({

  /**
   * 页面的初始数据
   */
  data: {

  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {
    const index = utils.getInteger(options.item);
    this.setData({ url: urls[index]});
    // console.log('options:',options.item);
    // const s = JSON.parse(options.url);
    // console.log('showwebview onload:',s);
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