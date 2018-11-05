import * as CONSTS from '../../utils/constants.js';
import * as fyglService from '../../services/fygl.js'; 
const initialState = {
  status: CONSTS.REMOTE_SUCCESS, // 远程处理返回状态
  msg: '', // 远程处理返回信息
  fyList: [], // 房源列表数据
  currentObject: {}, // 当前form操作对象
  sourceList: [], // 保存列表
  selectedRowKeys: [], // 列表选中行
  buttonAction: CONSTS.BUTTON_NONE, // 当前处理按钮（动作）
  modalVisible: false, // 显示弹框
  modalTitle: null, // 弹框属性标题
  modalWidth: 1000, // 弹框属性宽度
  modalOkText: '保存', // 弹框属性确定按钮文本
  modalOkDisabled: false, // 弹框属性确定按钮可点击状态
};

Page({

  /**
   * 页面的初始数据
   */
  data: initialState,

  onAddfy(){
    wx.navigateTo({
      url: 'addfy/addfy',
    }) 
  }, 

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {
    const response = fyglService.queryFyglList(); 
    response.then(res=>{
      this.setData({ 
        fyList:res.data,
      });
    });
    // yield handleAfterRemote(response, put, select);
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