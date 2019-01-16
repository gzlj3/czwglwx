import * as CONSTS from '../../../utils/constants.js';
import * as fyglService from '../../../services/fyglServices.js';
import * as commService from '../../../services/commServices.js';
const config = require('../../../config.js');
const utils = require('../../../utils/utils.js');

const tsinfo = {
  'hthc':'合同缓存', 
  'htmb':'保存模板',
  'htsave':'合同签约',
  'savezkqm': '上传签名',
  'ocrsfz':'上传身份证',
}

const zkTempFilePath = 'zkTempFilePath';
const fdTempFilePath = 'fdTempFilePath';
const fwptObjectname = 'fwpt';

const httk = '7、乙方租住满三个月后发生的房屋设施（如灯、水龙头、油烟机、洗衣机等）坏，由乙方负责更换或修理。由于乙方原因造成的下水道堵塞由乙方负责清理。\r\n8、乙方要注意安全，搞好环境卫生，不得从高处乱扔垃圾，未经甲方同意，不得养猫狗等动物。\r\n9、未经甲方同意，乙方不得转租、转卖、改变房屋结构，如因乙方管理不善发生水灾、火灾、盗窃及人为破坏行为，法律责任及经济损失由乙方承担。\r\n10、租赁期满时，双方对所租房屋、家具及其它设施进行验收，如有损坏者，由乙方负责修复或照价赔偿，退租时把房屋卫生打扫干净，否则从押金扣除房屋清洁费用100元。\r\n';
const fwptattr = [{ label: '空调(台)', name: 'kt' }, { label: '热水器(套)', name: 'rsq' }, { label: '抽油烟机(台)', name: 'yyj' }, { label: '大门钥匙(条)', name: 'dmys' }, { label: '房间钥匙(条)', name: 'fjys' }, { label: '洗衣机(台)', name: 'xyj' }, { label: '冰箱(台)', name: 'bx' }, { label: '沙发(张)', name: 'sf' }, { label: '茶几(张)', name: 'cj' }, { label: '床(张)', name: 'c' }, { label: '衣柜(个)', name: 'yg' }, { label: '书桌(张)', name: 'sz' }, { label: '凳子(张)', name: 'dz' }];
const fyxxMetas = {
  fdxm:{label:'甲方姓名'},
  fdsjhm: { label: '甲方手机号' },
  fwmc: { label: '房屋编号', name: 'fwmc', require: true },
  zhxm: { label: '乙方姓名', name: 'zhxm' },
  sfzh: { label: '身份证号', name: 'sfzh', type: 'idcard' },
  dhhm: { label: '乙方手机号码', name: 'dhhm', type: "number" },
  czje: { label: '出租金额', name: 'czje', type: "number" },
  fwyj: { label: '房屋押金', name: 'yj', type: "number" },
  htrqq: { label: '合同日期起', name: 'htrqq', type: 'date' },
  htrqz: { label: '合同日期止', name: 'htrqz', type: 'date' },
  jzr: { label: '每月交租日', name: 'szrq', type: 'date' },
  dscds: { label: '电初始读数', name: 'dscds', type: "number" },
  sscds: { label: '水初始读数', name: 'sscds', type: "number" },
  ddj: { label: '电费单价', name: 'ddj', type: "digit" },
  sdj: { label: '水费单价', name: 'sdj', type: "digit" },
  dgtds: { label: '电公摊度数', name: 'dgtds', type: "digit" },
  sgtds: { label: '水公摊度数', name: 'sgtds', type: "digit" },
  // dbcds: { label: '电本次读数', name: 'dbcds', type: "number" },
  // sbcds: { label: '水本次读数', name: 'sbcds', type: "number" },
  wlf: { label: '网络费', name: 'wlf', type: "digit" },
  ljf: { label: '卫生费', name: 'ljf', type: "digit" },
  glf: { label: '管理费', name: 'glf', type: "digit" },
  qtf: { label: '其它费', name: 'qtf' },
  syjzf: { label: '上月结转费', name: 'syjzf', type: "digit" },
  bz: { label: '备注', name: 'bz' },
}

const blx = ['fdxm','fdsjhm','fwmc','zhxm','dhhm', 'czje', 'fwyj', 'htrqq', 'htrqz', 'jzr', 'dscds', 'sscds', 'ddj', 'sdj'];
let flag;
let tempSfzhCloudFileId='';
Page({

  /**
   * 页面的初始数据
   */
  data: {
    currentObject:null,  //当前编辑的合同对象
    grantcode:null,
    grantcodeParas:{},
    seeHt:false,
    seeHouseHt:null,
    sendzkhted:'',
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {
    // console.log('htqy:', options);
    const params = options.item ? JSON.parse(options.item) : {};
    let { grantcode='', seeHouseHt=''} = params;
    // if (!grantcode) grantcode = '';
    // console.log('===:',grantcode);

    const response = fyglService.queryData(CONSTS.BUTTON_HTQY, params);
    const tsinfo = '';
    fyglService.handleAfterRemote(response, tsinfo,
      (resultData) => {
        // console.log('htqy resultdata:',resultData);
        let currentObject = resultData;
        let grantcodeParas = {};
        let seeHt = false;
        if(!utils.isEmpty(grantcode)){
          currentObject = resultData.htdata;
          grantcodeParas = resultData.grantcodeParas;
          seeHt = true;
        } else if (seeHouseHt==='1'){
          //查询合同入口
          currentObject = resultData;
          seeHt = true;
        }else{
          if(!currentObject) currentObject = {httk};
        }
        this.setData({ currentObject, grantcodeParas, grantcode, seeHt, seeHouseHt,options});
      },
      ()=>{
        // console.log('err:',grantcode);
        this.setData({ currentObject: null, grantcode});
      }
    );
  },
  
  onRefreshHt: function(e){
    this.onLoad(this.data.options);
  },

  validForm: function(e) {
    // const {flag} = this.data;
    if(utils.isEmpty(flag)){
      utils.showToast('点击异常！');
      return false;
    }
    const formObject = e.detail.value;
    const {currentObject} = this.data;
    if(flag === 'sendzkht'){
      //发送租客确认，需要输入租客手机号
      if(!utils.checkSjhm(formObject.dhhm)){
        utils.showToast('租客手机号未输入或输入有误！')
        return false;
      }
      if (this.data.sendzkhted==='1'){
        utils.showModal('发送租客确认', `你已经发送过租客，租客点击刷新即可查看合同最新数据。\r\n是否确认再次发送？`, () => this.formSubmit(e, true));
        return false;
      }
    }else if (flag === 'savezkqm') {
      //上传租客签名，验证是否有录入签名
      if(utils.isEmpty(currentObject.zkQmFilePath)){
        utils.showToast('点击签名图片，签名后再上传！')
        return false;
      }
    } else if (flag === 'htsave') {
      const formObject = e.detail.value;
      let errorFields = '';
      blx.map(value => {
        if (utils.isEmpty(formObject[value])) {
          errorFields += fyxxMetas[value].label + ',';
        }
      });
      if (!utils.isEmpty(errorFields)) {
        utils.showToast(errorFields + '未录入!');
        return false;
      }
      //校验是否签名
      if(utils.isEmpty(formObject.zkQmFilePath) && utils.isEmpty(formObject.zkQmCloudPath)){
        utils.showToast('乙方未签名！');
        return false;
      }
      if (utils.isEmpty(formObject.fdQmFilePath) && utils.isEmpty(formObject.fdQmCloudPath)) {
        utils.showToast('甲方未签名！');
        return false;
      }
      //校验手机号
      const { dhhm,fdsjhm } = formObject;
      if (!utils.checkSjhm(dhhm) || !utils.checkSjhm(fdsjhm)) {
        utils.showToast('甲方手机号或乙方手机号输入有误');
        return false;
      }
      utils.showModal('签约确认', `合同签约完成后，将不能被修改！\r\n请确认合同是否签约完成？`,()=>this.formSubmit(e,true));
      return false;
    }
    return true;
  },

  formSubmit: function (e,noValid) {
    // console.log(e);
    // const {flag} = this.data;
    // console.log('formsubmit:', flag);
    if (!noValid && !this.validForm(e)) return;
    const {currentObject} = this.data;
    //房屋配套需要单独处理
    e.detail.value.fwpt = currentObject.fwpt;

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
    // console.log('htqy formsubmit:', e.detail.value);
    const formObject = e.detail.value;
    const response = fyglService.postData(CONSTS.BUTTON_HTQY, { formObject, flag, grantcodeParas, tempSfzhCloudFileId});
    fyglService.handleAfterRemote(response, tsinfo[flag],
      (resultData) => {
        if (flag ==='sendzkht'){
          this.setData({ sendzkhted:'1'});
          const s = JSON.stringify(resultData);
          wx.navigateTo({
            url: '../sendzd/sendzd?item=' + s,
          })
          return;
        }else if(flag==='htsave'){
          const s = JSON.stringify({ houseid: resultData._id });
          let pageDesc = '合同签约完成后，可进入帐单详细页查看签约帐单。';
          const {collid,yzhid} = getApp().globalData.user;
          utils.redirectToSuccessPage(pageDesc, '查看帐单详情', '/pages/fygl/editlist/editlist', CONSTS.BUTTON_LASTZD, { houseid: resultData._id, collid, yzhid});
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
    // this.setData({flag:'sendzkht'});
    const {seeHt,grantcode,grantcodeParas} = this.data;
    // console.log('onsendzk',seeHt,grantcode);
    if(seeHt && !grantcode) return;
    if(grantcode){
      if(grantcodeParas.registered){
        utils.showToast('您已经注册系统，合同签约完成后，可进入【我的房源列表】查看正式合同！');
      }else{
        this.toIndex(e);
      }
    }else{
      flag = 'sendzkht';
      e.detail.value = this.data.currentObject;
      this.formSubmit(e);
    }
  },

  htClick: function(e) {
    flag = e.currentTarget.id;
    // this.setData({ flag: e.currentTarget.id});
    console.log('htclick:',flag);
  },

  getZkQmPath : function (item) {
    if (item.zkQmFilePath) return item.zkQmFilePath;
    if (item.zkQmCloudPath) return item.zkQmCloudPath;
    return '../../../images/qm.png';
  },
  getFdQmPath : function (item) {
    if (item.fdQmFilePath) return item.fdQmFilePath;
    if (item.fdQmCloudPath) return item.fdQmCloudPath;
    return '../../../images/qm.png';
  },

  onsxqm_zk: function(e){
    const { currentObject,grantcode,seeHt } = this.data;
    if (utils.isEmpty(grantcode)) return;

    getApp().globalData[zkTempFilePath] = null;
    // const lastQmFilePath = !utils.isEmpty(currentObject.zkQmFilePath) ? currentObject.zkQmFilePath : '';
    const lastQmFilePath = this.getZkQmPath(currentObject);
    wx.navigateTo({
      url: '/pages/sxqm/sxqm?qmTempFilePath=' + zkTempFilePath + '&lastQmFilePath=' + lastQmFilePath,
    })
  },
  onsxqm_fd: function (e) {
    const { currentObject, grantcode, seeHt } = this.data;
    if (!utils.isEmpty(grantcode) || seeHt) return;
    getApp().globalData[fdTempFilePath] = null;
    // const lastQmFilePath = !utils.isEmpty(currentObject.fdQmFilePath) ? currentObject.fdQmFilePath:'';
    const lastQmFilePath = this.getFdQmPath(currentObject);
    wx.navigateTo({
      url: '/pages/sxqm/sxqm?qmTempFilePath=' + fdTempFilePath + '&lastQmFilePath=' + lastQmFilePath,
    })
  },

  /**
   * 生命周期函数--监听页面初次渲染完成
   */
  onReady: function () {

  },

  onFwpt: function (e) {
    let { currentObject } = this.data;
    if (!currentObject.fwpt) currentObject.fwpt = {};
    getApp().globalData[fwptObjectname] = {...currentObject.fwpt};
    wx.navigateTo({
      url: '/pages/pageform/pageform?formname=FmFwpt&objectname=' + fwptObjectname,
    })
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

    //房屋配套返回值
    const fwptObject = getApp().globalData[fwptObjectname + CONSTS.globalRetuSuffix];
    // console.log('htqy onshow:',fwptObject);
    if(fwptObject){
      getApp().globalData[fwptObjectname + CONSTS.globalRetuSuffix] = null;
      let {currentObject} = this.data;
      currentObject.fwpt = fwptObject;
      let fwpts = '';
      fwptattr.map(({label,name})=>{
        const value = fwptObject[name];
        if(!utils.isEmpty(value)){
          fwpts += label+':'+value+';';
        }
      });
      if(!utils.isEmpty(fwptObject['qtpt'])){
        fwpts += '其它配套:' + fwptObject['qtpt'];
      }
      // fwpts += '\r\n';      
      currentObject.fwpts = fwpts;
      this.setData({currentObject});
    }
  },

  onPhotoZksfz: function (e) {
    const { seeHt, grantcode,currentObject} = this.data;
    if (seeHt || grantcode){
      let photos = [];
      if (!utils.isEmpty(currentObject.zkSfzhFront)){
        photos.push(currentObject.zkSfzhFront);
      }
      if (!utils.isEmpty(currentObject.zkSfzhBack)) {
        photos.push(currentObject.zkSfzhBack);
      }
      //查看身份证照
      if (photos.length===0){
        utils.showToast('身份证还未拍照！');
        return;
      }
      wx.previewImage({
        // current,
        urls: photos,
      });
    }else{
      //拍照
      const yzhid = getApp().globalData.user.yzhid;
      const cloudPath = yzhid + '/sfzh/' + utils.uuid(10);
      const self = this;
      commService.chooseImage(cloudPath, (sfzhCloudFileId) => { 
          tempSfzhCloudFileId = sfzhCloudFileId;
          this.ocrsfz(e)
        }
      );
    }
  },

  ocrsfz:function(e){
    flag = 'ocrsfz';
    // tempSfzhCloudFileId = sfzhCloudFileId;
    e.detail.value = this.data.currentObject;
    this.formSubmit(e);
    // flag = 'ocrsfz'
    // const response = fyglService.postData(CONSTS.BUTTON_HTQY, { sfzhCloudFileId, flag});
    // fyglService.handleAfterRemote(response, tsinfo[flag],
    //   (resultData) => {
    //     console.log(resultData);
    //   }
    // );    
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