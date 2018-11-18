import * as CONSTS from '../../utils/constants.js';
// import moment from '../../utils/moment-with-locales.min.js';
import moment from '../../utils/moment.min.js';
import * as fyglService from '../../services/fyglServices.js'; 
const utils = require('../../utils/utils.js');
 
const initialState = {
  status: CONSTS.REMOTE_SUCCESS, // 远程处理返回状态
  msg: '', // 远程处理返回信息
  emptyAvatarUrl: '../../images/avatar-empty.png',
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
      url: 'addfy/addfy?buttonAction='+CONSTS.BUTTON_ADDFY,
    }) 
  }, 

  onMakezd(){
    wx.navigateTo({
      url: 'editlist/editlist?buttonAction=' + CONSTS.BUTTON_MAKEZD,
    }) 
  }, 
  onCb() {
    wx.navigateTo({
      url: 'editlist/editlist?buttonAction=' + CONSTS.BUTTON_CB,
    })
  }, 

  onMoreAction(e){
    const { item } = e.currentTarget.dataset;
    console.log("moreAction:",item);
    const self = this;
    wx.showActionSheet({
      itemList: ['删除房源', '退房'],
      success: function (res) {
        if (res.cancel) return;
        console.log(res.tapIndex);
        if(res.tapIndex===0){
          utils.showModal('删除房源', '删除后将不能恢复，你真的确定删除房源('+item.fwmc+')吗？', () => { self.deletefy(item._id);});
        }else if(res.tapIndex=== 1){
          utils.showModal('退房', '退房步骤（1.生成退房帐单,2.结清退房帐单,3.再次退房)。你真的确定退房(' + item.fwmc + ')吗？', () => { self.exitfy(item._id); });
        }
      }
    });
  },

  exitfy(houseid) {
    console.log("exitfy:" + houseid);
    const response = fyglService.postData(CONSTS.BUTTON_DELETEFY, { houseid });
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
    const {item} = e.currentTarget.dataset;
    const s = JSON.stringify(item);
    // console.log(s);
    // console.log('addfy/addfy?buttonAction=' + CONSTS.BUTTON_EDITFY + '&item=' + s);
    wx.navigateTo({
      url: 'addfy/addfy?buttonAction='+CONSTS.BUTTON_EDITFY+'&item='+s,
    }) 
  },

  onLastzd(e){
    const { item } = e.currentTarget.dataset;
    const s = JSON.stringify({houseid:item});
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
    // this.setData({
    //   fyList: [
    //     {
    //       _id: '1',
    //       fwmc:'101',
    //       zhxm:'张三',
    //       szrq:'2018-11-01',
    //       avatarUrl:'../../images/avatar-empty.png',
    //     },
    //     {
    //       _id: '2',
    //       fwmc: '102',
    //       zhxm: '李四',
    //       avatarUrl: '../../images/avatar-empty.png',
    //     },
    //     {
    //       _id: '3',
    //       fwmc: '103',
    //       zhxm: '王五',
    //       avatarUrl: '../../images/avatar-empty.png',
    //     },
    //   ]
    // });

    // console.log(moment('2018-01-31','YYYY-MM-DD').add(1,'months').format('YYYY-MM-DD'));
    // console.log(moment().startOf('day').add(4, 'days').format('YYYY-MM-DD'));
    // console.log(utils.getInteger('fff')); 
    // console.log(moment('2018-11-aa','YYYY-MM-DD')); 
    // let sszrq = '2018-11-15';
    // const szrq = moment(sszrq);
    // const xcszrq = szrq.clone();
    // szrq.subtract(1, 'days');
    // console.log(xcszrq.format('YYYY-MM-DD'));
    const response = fyglService.queryFyglList(); 
    fyglService.handleAfterRemote(response, null,
      (resultData) => { 
        this.refreshFyList(resultData);
        //计算房源进度条显示数据
        // fyglService.refreshProgessState(resultData);

        // getApp().setPageParams(CONSTS.BUTTON_NONE, null);
        // this.setData({
        //   fyList: resultData,
        // }); 
      }
    );   
  },

  refreshFyList: function(resultData) {
    //计算房源进度条显示数据
    fyglService.refreshProgessState(resultData);
    getApp().setPageParams(CONSTS.BUTTON_NONE, null);
        this.setData({
      fyList: resultData,
    }); 

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
    const {buttonAction,currentObject} = getApp().globalData;
    console.log(buttonAction);
    // if ([CONSTS.BUTTON_ADDFY, CONSTS.BUTTON_EDITFY, CONSTS.BUTTON_CB].includes(buttonAction)){
    if (![CONSTS.BUTTON_NONE].includes(buttonAction)) {
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