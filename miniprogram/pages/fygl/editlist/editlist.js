// miniprogram/pages/fygl/addfy/addfy.js
import * as CONSTS from '../../../utils/constants.js';
import * as fyglService from '../../../services/fygl.js'; 
const initialState = {
  status: CONSTS.REMOTE_SUCCESS, // 远程处理返回状态
  msg: '', // 远程处理返回信息
  sourceList: {},
  // targetList: [], //列表编辑保存对象
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
    const response = fyglService.saveFy(buttonAction, this.data.sourceList);
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
    // const currentObject = options.item?JSON.parse(options.item):{};
    let buttonAction = options.buttonAction;
    if(buttonAction){
      buttonAction = Number.parseInt(buttonAction);
    }

    const response = fyglService.queryFyglList(); 
    fyglService.handleAfterRemote(response, null,
      (resultData) => { 
        getApp().setPageParams(CONSTS.BUTTON_NONE, null);
        // let targetList = new Array(resultData.length); 
        // resultData.map((value,index)=>{
        //   targetList[index] = {_id:value._id}
        // });
        this.setData({
          buttonAction,
          sourceList: resultData,
          // targetList,
        }); 
      }
    );
  },
  onInputBlur: function(e) {
    // console.log(e);
    console.log(e.currentTarget);
    const idarr = e.currentTarget.id.split('.');
    const index =  Number.parseInt(idarr[0]);
    const name = idarr[1];
    this.data.sourceList[index][name] = e.detail.value;
    this.setData({
      sourceList: this.data.sourceList
    })
  },
  // bindSzrqChange: function(e){
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