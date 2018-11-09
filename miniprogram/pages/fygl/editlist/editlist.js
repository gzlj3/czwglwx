// miniprogram/pages/fygl/addfy/addfy.js
import * as CONSTS from '../../../utils/constants.js';
import * as fyglService from '../../../services/fygl.js'; 
const initialState = {
  status: CONSTS.REMOTE_SUCCESS, // 远程处理返回状态
  msg: '', // 远程处理返回信息
  sourceList: [],
  CONSTS,
  // checkboxItems: [
  //   { name: 'standard is dealt for u.', value: '0', checked: true },
  //   { name: 'standard is dealicient for u.', value: '1' }
  // ],  
  buttonAction: CONSTS.BUTTON_NONE, // 当前处理按钮（动作）
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
    const response = fyglService.postData(buttonAction, this.data.sourceList);
    // console.log(buttonAction+"===:"+CONSTS.getButtonActionInfo(buttonAction));
    fyglService.handleAfterRemote(response, CONSTS.getButtonActionInfo(buttonAction),
      (resultData)=>{
        getApp().setPageParams(buttonAction, resultData);
        wx.navigateBack();
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
    // let queryListAction;
    // if (buttonAction === CONSTS.BUTTON_CB) {
    //   queryListAction = CONSTS.BUTTON_QUERYSDB;
    // } else if (buttonAction === CONSTS.BUTTON_LASTZD) {
    //   queryListAction = CONSTS.BUTTON_QUERYLASTZD;
    // } else if (buttonAction === CONSTS.BUTTON_MAKEZD) {
    //   queryListAction = CONSTS.BUTTON_QUERYMAKEZD;
    // }
console.log('editlist:'+buttonAction);
console.log(params);
    const response = fyglService.queryData(buttonAction, params);
    fyglService.handleAfterRemote(response, null,
      (resultData) => { 
        getApp().setPageParams(CONSTS.BUTTON_NONE, null);
        this.setData({
          buttonAction,
          sourceList: resultData,
        }); 
      }
    );
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
  },
  
  // onInputBlur: function(e) {
  //   // console.log(e);
  //   console.log(e.currentTarget);
  //   const idarr = e.currentTarget.id.split('.');
  //   const index =  Number.parseInt(idarr[0]);
  //   const name = idarr[1];
  //   this.data.sourceList[index][name] = e.detail.value;
  //   this.setData({
  //     sourceList: this.data.sourceList
  //   })
  // },

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