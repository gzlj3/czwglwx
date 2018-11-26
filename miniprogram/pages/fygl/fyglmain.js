import * as CONSTS from '../../utils/constants.js';
// import moment from '../../utils/moment-with-locales.min.js';
import moment from '../../utils/moment.min.js';
import * as fyglService from '../../services/fyglServices.js'; 
const utils = require('../../utils/utils.js');

const initialState = {
  status: CONSTS.REMOTE_SUCCESS, // 远程处理返回状态
  msg: '', // 远程处理返回信息
  emptyAvatarUrl: '../../images/avatar-empty.png',
  fyList: [], // 当前操作的房源列表数据
  allFyList:[], //总房源列表数据
  currentObject: {}, // 当前form操作对象
  sourceList: [], // 保存列表
  selectedRowKeys: [], // 列表选中行
  buttonAction: CONSTS.BUTTON_NONE, // 当前处理按钮（动作）
  modalVisible: false, // 显示弹框
  modalTitle: '', // 弹框属性标题
  modalWidth: 1000, // 弹框属性宽度
  modalOkText: '确定', // 弹框属性确定按钮文本
  modalCancelText: '取消', // 弹框属性确定按钮文本
  modalOkDisabled: false, // 弹框属性确定按钮可点击状态
}; 

Page({

  /**
   * 页面的初始数据
   */
  data: initialState,

  onAddfy(){
    wx.navigateTo({
      url: 'addfy/addfy?buttonAction='+CONSTS.BUTTON_ADDFY,
    }) 
  }, 

  onMoreAction(e){
    const { item,fyitem } = e.currentTarget.dataset;
    // console.log("moreAction:",item);
    let itemList;
    if(utils.isEmpty(item.zhxm)){
      this.actionSheet2(e);
    }else{
      this.actionSheet1(e);
    }
  },

  actionSheet2: function (e) {
    const { item, fyitem } = e.currentTarget.dataset;
    const itemList = ['删除房源', '取消']; 
    const self = this;
    wx.showActionSheet({
      itemList,
      success: function (res) {
        if (res.cancel) return;
        const index = res.tapIndex;
        console.log(index);
        switch (index) {
          case 0:
            utils.showModal('删除房源', '删除后将不能恢复，你真的确定删除房源(' + item.fwmc + ')吗？', () => { self.deletefy(item._id); });
            break;
        }
      }
    });
  },

  actionSheet1: function(e){
    const { item, fyitem } = e.currentTarget.dataset;
    const itemList = ['抄表', '出帐单', '删除房源', '退房', '取消']; 
    const self = this;
    wx.showActionSheet({
      itemList,
      success: function (res) {
        if (res.cancel) return;
        const index = res.tapIndex;
        console.log(index);
        switch (index) {
          case 0:
          case 1:
            if (index === 1 && item.sfsz === CONSTS.SFSZ_WJQ) {
              utils.showToast('当前帐单未结清，不能出新帐单！');
              return;
            }
            const s = JSON.stringify({ houseid: item._id, collid: fyitem });
            const action = index === 0 ? CONSTS.BUTTON_CB : CONSTS.BUTTON_MAKEZD;
            wx.navigateTo({
              url: './editlist/editlist?buttonAction=' + action + '&item=' + s
            });
            break;
          case 2:
            utils.showModal('删除房源', '删除后将不能恢复，你真的确定删除房源(' + item.fwmc + ')吗？', () => { self.deletefy(item._id); });
            break;
          case 3:
            const { sfsz, zdlx } = item;
            if (CONSTS.ZDLX_TFZD === zdlx && CONSTS.SFSZ_YJQ === sfsz) {
              utils.showModal('退房', '退房后将不能恢复，你真的确定退房(' + item.fwmc + ')吗？', () => { self.tffy(item._id) });
            } else {
              const tfrq = moment().format('YYYY-MM-DD');
              self.setData({
                tfrq,
                tfItem: item,
                modalVisible: true,
                modalTitle: '请输入退房截止日期',
              });
            }
            break;
          case 4:
            return;
        }
      }
    });
  },

  modalConfirm: function(){
    this.setData({modalVisible:false});
    const self = this;
    const {tfItem:item,tfrq} = this.data;
    utils.showModal('退房', '退房步骤（1.生成退房帐单,2.结清退房帐单)。你真的确定退房(' + item.fwmc + ')吗？', () => { self.exitfy(item._id,tfrq); });
  },

  tffy: function(houseid) {
    console.log("tffy:", houseid);
    const response = fyglService.postData(CONSTS.BUTTON_EXITFY, { houseid});
    fyglService.handleAfterRemote(response, '退房',
      (resultData) => {
        this.refreshFyList(resultData)
      });
  },

  exitfy(houseid,tfrq) {
    console.log("exitfy:",houseid,tfrq);
    const response = fyglService.queryData(CONSTS.BUTTON_EXITFY, { houseid,tfrq });
    fyglService.handleAfterRemote(response, '退房',
      (resultData) => {
        this.refreshFyList(resultData)
      });
  },

  deletefy(houseid){
    console.log("deletefy:"+houseid);
    const response = fyglService.postData(CONSTS.BUTTON_DELETEFY, { houseid });
    fyglService.handleAfterRemote(response, '删除房源',
      (resultData) => {
        this.refreshFyList(resultData)      
    });
  },

  onEditfy(e){
    // console.log(e);
    const { item, fyitem} = e.currentTarget.dataset;
    const s = JSON.stringify({house:item, collid: fyitem });
    // console.log(s);
    // console.log('addfy/addfy?buttonAction=' + CONSTS.BUTTON_EDITFY + '&item=' + s);
    wx.navigateTo({
      url: 'addfy/addfy?buttonAction='+CONSTS.BUTTON_EDITFY+'&item='+s,
    }) 
  },

  onLastzd(e){
    const { item } = e.currentTarget.dataset;
    const { fyitem } = e.currentTarget.dataset;
    console.log('fyitem:',fyitem);
    const s = JSON.stringify({houseid:item,collid:fyitem});
    // console.log(s);
    console.log('editlist/editlist?buttonAction=' + CONSTS.BUTTON_LASTZD + '&item=' + s);
    wx.navigateTo({
      url: 'editlist/editlist?buttonAction=' + CONSTS.BUTTON_LASTZD + '&item=' + s,
    }) 
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {
    const response = fyglService.queryFyglList(); 
    fyglService.handleAfterRemote(response, null,
      (resultData) => { 
        getApp().setFyListDirty(false);
        this.refreshFyList(resultData);
      }
    );   
  },

  refreshFyList: function(resultData) {
    //计算房源进度条显示数据
    // console.log(resultData);
    resultData.map(value=>{
      fyglService.refreshProgessState(value.sourceList);
    });

    this.setData({
      // fyList: resultData,
      allFyList: resultData,
      isFd: getApp().globalData.user.userType === CONSTS.USERTYPE_FD,
      isZk: getApp().globalData.user.userType === CONSTS.USERTYPE_ZK,
    }); 

  },

  onTfInputBlur: function(e) {
    const name = e.target.id;
    this.setData({tfrq:e.detail.value});
  },

  modalCancel: function(){
    this.setData({modalVisible:false});
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
    // 检查返回值，刷新数据
    const {fyListDirty} = getApp().globalData;
    console.log('fyListDirty:', fyListDirty);
    if (fyListDirty) {
      this.onLoad();
    }
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
    this.onLoad();
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