import * as CONSTS from '../../../utils/constants.js';
import * as fyglService from '../../../services/fyglServices.js';
import * as commService from '../../../services/commServices.js';
const config = require('../../../config.js');
const utils = require('../../../utils/utils.js');

let flag='';
const tsinfo = {
  'hthc':'合同缓存', 
  'htmb':'保存模板',
  'htsave':'合同签约',
  'savezkqm': '上传签名'
}

const zkTempFilePath = 'zkTempFilePath';
const fdTempFilePath = 'fdTempFilePath';

const httk = '7、乙方租住满三个月后发生的房屋设施（如灯、水龙头、油烟机、洗衣机等）坏，由乙方负责更换或修理。由于乙方原因造成的下水道堵塞由乙方负责清理。\r\n8、乙方要注意安全，搞好环境卫生，不得从高处乱扔垃圾，未经甲方同意，不得养猫狗等动物。\r\n9、未经甲方同意，乙方不得转租、转卖、改卖房屋结构，如因乙方管理不善发生水灾、火灾、盗窃及人为破坏行为，法律责任及经济损失由乙方承担。\r\n10、租赁期满时，双方对所租房屋、家具及其它设施进行验收，如有损坏者，由乙负责修复或照价赔偿，退租时把房屋卫生打扫干净，否则从押金扣除房屋清洁费用100元。\r\n';

Page({

  /**
   * 页面的初始数据
   */
  data: {
    currentObject:null,  //当前编辑的合同对象
    grantcode:null,
    grantcodeParas:{},
    seeHt:false,
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {
    console.log('htqy:', options);
    const params = options.item ? JSON.parse(options.item) : {};
    let { grantcode} = params;
    if (!grantcode) grantcode = '';

    const response = fyglService.queryData(CONSTS.BUTTON_HTQY, params);
    const self = this;
    const tsinfo = '';
    fyglService.handleAfterRemote(response, tsinfo,
      (resultData) => {
        console.log('htqy resultdata:',resultData);
        let currentObject = resultData;
        let grantcodeParas = {};
        let seeHt = false;
        if(!utils.isEmpty(grantcode)){
          currentObject = resultData.htdata;
          grantcodeParas = resultData.grantcodeParas;
          seeHt = true;
        }else{
          if(!currentObject) currentObject = {httk};
        }
        this.setData({ currentObject, grantcodeParas, grantcode, seeHt});
      }
    );
  },
  onRefreshHt: function(e){
    
  },

  validForm: function(e) {
    const formObject = e.detail.value;
    const {currentObject} = this.data;
    if(flag === 'sendzkht'){
      //发送租客确认，需要输入租客手机号
      if(utils.isEmpty(formObject.dhhm) || !utils.checkSjhm(formObject.dhhm)){
        utils.showToast('租客手机号未输入或输入有误！')
        return false;
      }
    }else if (flag === 'savezkqm') {
      //上传租客签名，验证是否有录入签名
      if(utils.isEmpty(currentObject.zkQmFilePath)){
        utils.showToast('点击签名图片，签名后再上传！')
        return false;
      }
    }
    return true;
  },

  formSubmit: function (e) {
    if (!this.validForm(e)) return;
    // if(flag === 'sxht'){
    //   //租客刷新合同
    //   const {grantcode} = this.data;
    //   const s = JSON.stringify({ grantcode})
    //   this.onLoad({item:s});
    //   return;
    // }
    const {currentObject} = this.data;
    const yzhid = getApp().globalData.user.yzhid;
    if(!utils.isEmpty(currentObject.fdQmFilePath)){
      const cloudPath = yzhid + '/fdqm/' + utils.uuid(5);
      commService.uploadCloudFile(currentObject.fdQmFilePath, cloudPath,(resultData)=>{
        e.detail.value.fdQmTempCloudPath = resultData;
        this.uploadZkqm(e);
      })
    } else this.uploadZkqm(e);
  }, 

  uploadZkqm: function(e){
    const { currentObject } = this.data;
    const yzhid = getApp().globalData.user.yzhid;
    if (!utils.isEmpty(currentObject.zkQmFilePath)) {
      const { currentObject } = this.data;
      const cloudPath = yzhid + '/zkqm/' + utils.uuid(10);
      commService.uploadCloudFile(currentObject.zkQmFilePath, cloudPath, (resultData) => {
        e.detail.value.zkQmTempCloudPath = resultData;
        this.handleSubmit(e);
      });
    } else this.handleSubmit(e);
  },

  handleSubmit: function(e){
    const { grantcodeParas} = this.data;
    console.log('htqy formsubmit:', e.detail.value);
    const formObject = e.detail.value;
    const response = fyglService.postData(CONSTS.BUTTON_HTQY, { formObject, flag, grantcodeParas});
    const self = this;
    fyglService.handleAfterRemote(response, tsinfo[flag],
      (resultData) => {
        if (flag ==='sendzkht'){
          const s = JSON.stringify(resultData);
          wx.navigateTo({
            url: '../sendzd/sendzd?item=' + s,
          })
          return;
        }
        this.setData({ currentObject:resultData });
      }
    );
  },

  onInputBlur: function (e) {
    const name = e.target.id;
    let { currentObject} = this.data;
    currentObject[name] = e.detail.value;
    // console.log('oninputblur:', name, e.detail.value, currentObject[name]);
    this.setData({currentObject});
  },

  onsendzk: function(e){
    flag = 'sendzkht';
    e.detail.value = this.data.currentObject;
    // console.log('sendzk',e.detail.value);
    this.formSubmit(e);
  },

  htClick: function(e) {
    flag = e.currentTarget.id;
  },

  onsxqm_zk: function(e){
    const { currentObject,grantcode,seeHt } = this.data;
    if (utils.isEmpty(grantcode)) return;

    getApp().globalData[zkTempFilePath] = null;
    const lastQmFilePath = !utils.isEmpty(currentObject.zkQmFilePath) ? currentObject.zkQmFilePath : '';
    wx.navigateTo({
      url: '/pages/sxqm/sxqm?qmTempFilePath=' + zkTempFilePath + '&lastQmFilePath=' + lastQmFilePath,
    })
  },
  onsxqm_fd: function (e) {
    const { currentObject, grantcode, seeHt } = this.data;
    if (!utils.isEmpty(grantcode) || seeHt) return;
    getApp().globalData[fdTempFilePath] = null;
    const lastQmFilePath = !utils.isEmpty(currentObject.fdQmFilePath) ? currentObject.fdQmFilePath:'';
    wx.navigateTo({
      url: '/pages/sxqm/sxqm?qmTempFilePath=' + fdTempFilePath + '&lastQmFilePath=' + lastQmFilePath,
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

  toIndex: function (e) {
    let { grantcodeParas } = this.data;
    let { sjhm, registered } = grantcodeParas;
    let url;
    if (registered){
      url = '/pages/index/index';
    }else{
      url='/pages/index/index?requestUserType=' + CONSTS.USERTYPE_ZK + '&sjhm=' + sjhm      
    }
    wx.reLaunch({url});
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