// miniprogram/pages/fygl/addfy/addfy.js
import * as CONSTS from '../../../utils/constants.js';
import * as fyglService from '../../../services/fyglServices.js'; 
const utils = require('../../../utils/utils.js');

const app = getApp()

const initialState = {
  status: CONSTS.REMOTE_SUCCESS, // 远程处理返回状态
  msg: '', // 远程处理返回信息
  sourceList: [],
  autoSendMessage: false,
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
      let tsinfo = '';
      if (this.data.autoSendMessage) tsinfo = '出帐单成功后，会自动发出帐单短信，';
      else tsinfo = '出帐单成功后，可在帐单处理页面中发送短信，';
      utils.showModal('出帐单', `${tsinfo}您确定出帐单吗？`, () => { self.handleSubmit(); });      
    }else{
      this.handleSubmit();
    }
  },

  handleSubmit(){
    const { buttonAction, sourceList, autoSendMessage} = this.data;
    const response = fyglService.postData(buttonAction, sourceList, autoSendMessage);
    // console.log(buttonAction+"===:"+CONSTS.getButtonActionInfo(buttonAction));
    fyglService.handleAfterRemote(response, CONSTS.getButtonActionInfo(buttonAction),
      (resultData) => {
        getApp().setFyListDirty(true);
        if(buttonAction === CONSTS.BUTTON_CB){
          utils.redirectToSuccessPage('抄表完成后，如果帐单已经结清，可以出新帐单。', '开始出帐单','/pages/fygl/editlist/editlist',CONSTS.BUTTON_MAKEZD,this.data.params);
        }else if (buttonAction === CONSTS.BUTTON_MAKEZD && !utils.isEmptyObj(this.data.params)) {
          utils.redirectToSuccessPage('出帐单完成后，可以进入帐单处理页面查看或处理新出的帐单。', '查看帐单详情', '/pages/fygl/editlist/editlist', CONSTS.BUTTON_LASTZD, this.data.params);
        }else{
          wx.navigateBack();
        }
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
    let { id: flag } = e.currentTarget;
    if(!utils.isEmpty(e.flag)) flag = e.flag;

    let title,content;
    if("qrsz"===flag){
      title = "确认收费";
      content = "确认收到租金了吗？"
    // } else if ("sjdx" === flag) {
    //   title = "发短信";
    //   content = "将向租户发送帐单信息，确认发送吗？"
    } else if ("sendsjdx" === flag) {
      title = "发短信";
      content = e.dxcontent + '内容已写入剪贴板。是否确定向租户发送此帐单短信？';
    }else if("jzzd"===flag){
      title = "结转下月";
      content = "本月租金未缴费，确认将本月帐单结转到下月吗？"
    } else if ("sxzd" === flag) {
      title = "刷新帐单";
      content = "确定刷新当前帐单吗？"
    }else{
      return;
    }
    e.title = title;
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
    let {id:flag} = e.currentTarget;
    const { buttonAction } = this.data;
    if (!utils.isEmpty(e.flag)){
       flag = e.flag;
       e.flag = null;
    }
    const response = fyglService.postData(buttonAction,{housefyid,flag});
    const self = this;
    const tsinfo = e.title;
    e.title = null;
    fyglService.handleAfterRemote(response, tsinfo,
      (resultData) => {
        if(flag==='sjdx'){
          //取手机短信返回，提示确认
          wx.setClipboardData({ data: resultData});
          e.flag = 'sendsjdx';
          e.dxcontent = resultData;
          self.onQrsz(e);
          return;
        }
        getApp().setFyListDirty(true);
        if(resultData === null){
          wx.navigateBack();
        }else{
          this.setData({
            sourceList: resultData,
          }); 
        }
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
      saveButtonText = '出帐单';
      sourceList.map((value, index) => {
        if (value.checked){
           showSaveButton = true;
        }
        return;
      });
      if(params && !utils.isEmpty(params.houseid)){
        pageTitle = '单户出帐单';
        pageDesc = '上月帐单已经结清，单户可在任意时间出下月新帐单';
      }else{
        pageTitle = '出帐单';
        pageDesc = '上月帐单已经结清，且已接近收租日期的房源在此出下月新帐单';                
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
  autoSendMessageChange:function(e){
    console.log('autoSendMessageChange:', e.detail.value);
    const checked = e.detail.value.length>0;
    this.setData({ autoSendMessage:checked});
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