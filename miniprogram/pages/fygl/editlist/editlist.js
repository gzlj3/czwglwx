// miniprogram/pages/fygl/addfy/addfy.js
import * as CONSTS from '../../../utils/constants.js';
import * as fyglService from '../../../services/fyglServices.js'; 
const utils = require('../../../utils/utils.js');

const app = getApp()

const initialState = {
  status: CONSTS.REMOTE_SUCCESS, // 远程处理返回状态
  msg: '', // 远程处理返回信息
  sourceList: [],
  CONSTS,
  buttonAction: CONSTS.BUTTON_NONE, // 当前处理按钮（动作）
  showDetailZd:[],
  showSaveButton:false,
  saveButtonText:'保存',
  pageTitle: '',
  pageDesc: '',
}

Page({

  /**
   * 页面的初始数据
   */
  data: initialState,
  changeState: function(newState) {
    this.setData({
      ...this.data,
      ...newState,
    });
  },

  formSubmit: function(e){
    // console.log('form发生了submit事件，携带数据为：', e.detail.value)
    console.log('form发生了submit事件，携带数据为：')
    console.log(this.data.sourceList);
    const {buttonAction} = this.data;
    if(buttonAction===CONSTS.BUTTON_MAKEZD){
      const self = this;
      utils.showModal('创建帐单', '帐单创建成功后，会给已注册系统的租客发出帐单提醒，您确定创建帐单吗？', () => { self.handleSubmit(); });      
    }else{
      this.handleSubmit();
    }
  },

  handleSubmit(){
    const { buttonAction, sourceList } = this.data;
    const response = fyglService.postData(buttonAction,sourceList);
    // console.log(buttonAction+"===:"+CONSTS.getButtonActionInfo(buttonAction));
    fyglService.handleAfterRemote(response, CONSTS.getButtonActionInfo(buttonAction),
      (resultData) => {
        getApp().setPageParams(buttonAction, resultData);
        wx.navigateBack();
      }
    );    
  },

  onToggleDetailZd: function(e) {
    console.log(e);
    const { item: index } = e.currentTarget.dataset;
    let {showDetailZd} = this.data;
    showDetailZd[index] = !showDetailZd[index];
    this.setData({
      showDetailZd
    });
  },

  onQrsz: function (e) {
    const { id: flag } = e.currentTarget;
    let title,content;
    if("qrsz"===flag){
      title = "确认收租";
      content = "确认收到租金了吗？"
    } else if ("sjdx" === flag) {
      title = "发短信";
      content = "将向租户发送帐单信息，确认发送吗？"
    }else if("jzzd"===flag){
      title = "结转下月";
      content = "本月租金未缴费，确认将本月帐单结转到下月吗？"
    } else if ("sxzd" === flag) {
      title = "刷新帐单";
      content = "确定刷新当前帐单吗？"
    }else{
      return;
    }
    let self = this;
    wx.showModal({
      title,
      content,
      // confirmText: "确认操作",
      // cancelText: "取消",
      success: function (res) {
        console.log(res);
        if (res.confirm) {
          self.onQrszCz(e);
        } else {
          // console.log('用户点击辅助操作')
        }
      }
    });
  },

  onQrszCz: function (e) {
    console.log(e);
    const { item:housefyid } = e.currentTarget.dataset;
    const {id:flag} = e.currentTarget;
    const { buttonAction } = this.data;
    
    const response = fyglService.postData(buttonAction,{housefyid,flag});
    fyglService.handleAfterRemote(response, CONSTS.getButtonActionInfo(buttonAction),
      (resultData) => {
        getApp().setPageParams(buttonAction, resultData);
        this.setData({
          sourceList: resultData,
        }); 
      }
    );
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {
    const params = options.item?JSON.parse(options.item):{};
    let buttonAction = options.buttonAction;
    if(buttonAction){
      buttonAction = Number.parseInt(buttonAction);
    }
    // console.log('editlist:'+buttonAction);
    // console.log(params);
    const response = fyglService.queryData(buttonAction, params);
    fyglService.handleAfterRemote(response, null,
      (resultData) => { 
        getApp().setPageParams(CONSTS.BUTTON_NONE, null);
        let showDetailZd=null;
        if(buttonAction === CONSTS.BUTTON_LASTZD){
          showDetailZd = this.refreshShowDetailZd(resultData);
        }
        this.setData({
          buttonAction,
          sourceList: resultData,
          showDetailZd,
          isFd: app.globalData.user.userType === CONSTS.USERTYPE_FD,
          isZk: app.globalData.user.userType === CONSTS.USERTYPE_ZK,
          isFdZk: app.globalData.user.userType === CONSTS.USERTYPE_FDZK,
          params,
        }); 
        this.refreshState();
      }
    );
  },

  refreshShowDetailZd(sourceList){
    // const {sourceList} = this.data;
    let showDetailZd=new Array(sourceList.length);
    sourceList.map((value,index)=>{
      if(value.sfsz === CONSTS.SFSZ_WJQ) showDetailZd[index] = true;
      else showDetailZd[index] = false;
    });
    return showDetailZd;
  },

  refreshState(){
    let { buttonAction, sourceList, saveButtonText, pageTitle, pageDesc, params} = this.data;
    let showSaveButton = CONSTS.BUTTON_LASTZD !== buttonAction && sourceList && sourceList.length > 0;
    if(buttonAction === CONSTS.BUTTON_MAKEZD){
      showSaveButton = false;
      saveButtonText = '创建帐单';
      sourceList.map((value, index) => {
        if (value.checked){
           showSaveButton = true;
        }
        return;
      });
      if(params && !utils.isEmpty(params.houseid)){
        pageTitle = '单户创建帐单';
        pageDesc = '上月帐单已经结清，单户可在任意时间创建下月新帐单';
      }else{
        pageTitle = '集中创建帐单';
        pageDesc = '上月帐单已经结清，且已接近收租日期的房源在此创建下月新帐单';                
      }
    } else if (buttonAction === CONSTS.BUTTON_CB) {
      if (params && !utils.isEmpty(params.houseid)) {
        pageTitle = '单户抄表';
        pageDesc = '单户可在任意时间抄表。';
      } else {
        pageTitle = '集中抄表';
        pageDesc = '上月帐单已经结清，且已接近收租日期的房源在此抄水电表。';
      }
    }
    // console.log('refreshState:',showSaveButton,buttonAction);
    this.setData({ showSaveButton, saveButtonText,pageTitle,pageDesc});
  },

  checkboxChange: function (e) {
    console.log('checkbox发生change事件，携带value值为：', e.detail.value);

    var sourceList = this.data.sourceList, values = e.detail.value;
    for (var i = 0, lenI = sourceList.length; i < lenI; ++i) {
      sourceList[i].checked = false;

      for (var j = 0, lenJ = values.length; j < lenJ; ++j) {
        if (sourceList[i]._id == values[j]) {
          sourceList[i].checked = true;
          break;
        }
      }
    }

    this.setData({
      sourceList
    });
    this.refreshState();
 },
  
  onInputBlur: function(e) {
    console.log(e);
    // console.log(e.currentTarget);
    const idarr = e.currentTarget.id.split('.');
    const index =  Number.parseInt(idarr[0]);
    const name = idarr[1];
    this.data.sourceList[index][name] = e.detail.value;
    this.setData({
      sourceList: this.data.sourceList
    })
  },

  // // bindSzrqChange: function(e){
  //   this.setData({
  //     currentObject:{
  //       ...this.data.currentObject,
  //       szrq: e.detail.value
  //     }
  //   })
  // },
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