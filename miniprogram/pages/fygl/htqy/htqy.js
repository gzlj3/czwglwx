import * as CONSTS from '../../../utils/constants.js';
import * as fyglService from '../../../services/fyglServices.js';
import * as commService from '../../../services/commServices.js';
const config = require('../../../config.js');
const utils = require('../../../utils/utils.js');

let flag='';
const tsinfo = {
  'hthc':'合同缓存', 
  'htmb':'保存模板',
  'htsave':'合同签约'
}

const zkTempFilePath = 'zkTempFilePath';
const fdTempFilePath = 'fdTempFilePath';

const httk = '7、乙方租住满三个月后发生的房屋设施（如灯、水龙头、油烟机、洗衣机等）坏，由乙方负责更换或修理。由于乙方原因造成的下水道堵塞由乙方负责清理。\r\n8、乙方要注意安全，搞好环境卫生，不得从高处乱扔垃圾，未经甲方同意，不得养猫狗等动物。\r\n9、未经甲方同意，乙方不得转租、转卖、改卖房屋结构，如因乙方管理不善发生水灾、火灾、盗窃及人为破坏行为，法律责任及经济损失由乙方承担。\r\n10、租赁期满时，双方对所租房屋、家具及其它设施进行验收，如有损坏者，由乙负责修复或照价赔偿，退租时把房屋卫生打扫干净，否则从押金扣除房屋清洁费用100元。\r\n\r\n\r\n\r\n\r\n\r\n';

Page({

  /**
   * 页面的初始数据
   */
  data: {
    currentObject:{},  //当前编辑的合同对象
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {
    console.log('htqy:',options);
    const response = fyglService.queryData(CONSTS.BUTTON_HTQY);
    const self = this;
    const tsinfo = '';
    fyglService.handleAfterRemote(response, tsinfo,
      (resultData) => { 
        let currentObject = resultData;
        if(!currentObject) currentObject = {httk};
        this.setData({currentObject});
      }
    );
  },

  formSubmit: function (e) {
    //如果有签名图片，先上传图片
    // let fdQmTempCloudPath = '', zkQmTempCloudPath='';
    const {currentObject} = this.data;
    const yzhid = getApp().globalData.user.yzhid;
    if(!utils.isEmpty(currentObject.fdQmFilePath)){
      const cloudPath = yzhid + '/fdqm/' + utils.uuid(5);
      commService.uploadCloudFile(currentObject.fdQmFilePath, cloudPath,(resultData)=>{
        e.detail.value.fdQmTempCloudPath = resultData;
        //上传租客签名图片
        if (!utils.isEmpty(currentObject.zkQmFilePath)) {
          const cloudPath = yzhid + '/zkqm/' + utils.uuid(5);
          commService.uploadCloudFile(currentObject.zkQmFilePath, cloudPath, (resultData) => {
            e.detail.value.zkQmTempCloudPath = resultData;
            this.handleSubmit(e);
          })
        } else this.handleSubmit(e);
      })
    }else this.handleSubmit(e);
  },

  handleSubmit: function(e){
    console.log('htqy formsubmit:', e);
    const formObject = e.detail.value;
    const response = fyglService.postData(CONSTS.BUTTON_HTQY, {formObject,flag});
    const self = this;
    fyglService.handleAfterRemote(response, tsinfo[flag],
      (resultData) => {
        console.log(resultData);
      }
    );
  },

  htClick: function(e) {
    flag = e.currentTarget.id;
  },

  onsxqm_zk: function(e){
    getApp().globalData[zkTempFilePath] = null;
    wx.navigateTo({
      url: '/pages/sxqm/sxqm?qmTempFilePath=' + zkTempFilePath,
    })
  },
  onsxqm_fd: function (e) {
    getApp().globalData[fdTempFilePath] = null;
    wx.navigateTo({
      url: '/pages/sxqm/sxqm?qmTempFilePath=' + fdTempFilePath,
    })
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
    //检查签名返回值
    const zkQmFilePath = getApp().globalData[zkTempFilePath];
    const fdQmFilePath = getApp().globalData[fdTempFilePath];
// console.log('htqy onshow:',zkQmFilePath,fdQmFilePath);
    let {currentObject} = this.data;
    if(!utils.isEmpty(zkQmFilePath)){
      getApp().globalData[zkTempFilePath] = null;
      currentObject.zkQmFilePath = zkQmFilePath;
      this.setData({ currentObject});
    }    
    if (!utils.isEmpty(fdQmFilePath)) {
      getApp().globalData[fdTempFilePath] = null;
      currentObject.fdQmFilePath = fdQmFilePath;
      this.setData({ currentObject });
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