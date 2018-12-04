// miniprogram/pages/fygl/addfy/addfy.js
import * as CONSTS from '../../../utils/constants.js';
import * as utils from '../../../utils/utils.js';
import * as fyglService from '../../../services/fyglServices.js'; 
import moment from '../../../utils/moment.min.js';
const commService = require('../../../services/commServices.js');
const config = require('../../../config.js');

const fyxxMetas = {
  fwmc: { label: '房屋名称', name: 'fwmc', require: true },
  zhxm: { label: '租户姓名', name: 'zhxm'},
  sfzh: { label: '身份证号', name: 'sfzh', type:'idcard' },
  dhhm: { label: '手机号码', name: 'dhhm', type:"number"},
  czje: { label: '出租金额', name: 'czje', type:"number" },
  yj: { label: '押金', name: 'yj', type: "number"},
  htrqq: { label: '合同日期起', name: 'htrqq', type: 'date' },
  htrqz: { label: '合同日期止', name: 'htrqz', type: 'date' },
  szrq: { label: '下次收租日期', name: 'szrq',type:'date' },
  dscds: { label: '电上次读数', name: 'dscds', type: "number" },
  sscds: { label: '水上次读数', name: 'sscds', type: "number" },
  ddj: { label: '电费单价', name: 'ddj', type: "digit" },
  sdj: { label: '水费单价', name: 'sdj', type: "digit" },
  dgtds: { label: '电公摊', name: 'dgtds', type: "digit" },
  sgtds: { label: '水公摊', name: 'sgtds', type: "digit" },
  // dbcds: { label: '电本次读数', name: 'dbcds', type: "number" },
  // sbcds: { label: '水本次读数', name: 'sbcds', type: "number" },
  wlf: { label: '网络费', name: 'wlf', type: "digit" },
  ljf: { label: '卫生费', name: 'ljf', type: "digit" },
  glf: { label: '管理费', name: 'glf', type: "digit" },
  qtf: { label: '其它费', name: 'qtf'},
  syjzf: { label: '上月结转费', name: 'syjzf', type: "digit" },
  bz: { label: '备注', name: 'bz' },
}

const initialState = {
  status: CONSTS.REMOTE_SUCCESS, // 远程处理返回状态
  msg: '', // 远程处理返回信息
  currentObject: {},
  fmMetas:fyxxMetas,
  buttonAction: CONSTS.BUTTON_NONE, // 当前处理按钮（动作）
  pageTitle:'',
  pageDesc:'',
  tabs: ["基本信息", "更多信息","图片"],
  activeIndex: 0,
  sliderOffset: 0,
  sliderLeft: 0
}

const refreshFmMetas = (fmMetas,currentObject) => {
  Object.keys(fmMetas).map(value => {
    if (fmMetas[value].require) {
      fmMetas[value].isEmpty = utils.isEmpty(currentObject[value]);
    }
  });
  // console.log('currentobject:',currentObject);
  // console.log('fmMetas:',fmMetas);
}
const sliderWidth = 96; // 需要设置slider的宽度，用于计算中间位置

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
    // return;
    // console.log('formid：', e.detail.formId);
    const {buttonAction} = this.data;
    // 校验必录项
    let { fmMetas } = this.data;
    const formObject = e.detail.value;
    let errorFields = '';
    Object.keys(fmMetas).map(value => {
      if (fmMetas[value].require) {
        if (utils.isEmpty(formObject[value])){
          errorFields += fmMetas[value].label+',';
        } 
      }
    });
    if(!utils.isEmpty(errorFields)){
      wx.showToast({
        title: errorFields + '未录入!',
        icon: 'none',
        duration: 5000,
      })
      return;
    }
    //校验手机号
    const { dhhm } = formObject;
    if (!utils.isEmpty(dhhm) && !utils.checkSjhm(dhhm)){
      wx.showToast({
        title: '请输入正确的手机号码！',
        icon: 'none',
        duration: 5000,
      })
      return;
    }
    const { currentObject } = this.data; 
    //检查更多租户输入信息的完整性
    if(currentObject.moreZh){
      for (let zhIndex=0;zhIndex<currentObject.moreZh.length;zhIndex++){
        const value = currentObject.moreZh[zhIndex];
        if (utils.isEmpty(value.zhxm) || (!utils.isEmpty(value.dhhm) && !utils.checkSjhm(value.dhhm))){
          utils.showToast(`更多信息中，第${zhIndex+1}个租户的姓名为空或手机号码输入有误！`);
          return;
        }
      };
    }

    //处理更多信息
    formObject.moreZh = currentObject.moreZh;
    formObject.fwpt = currentObject.fwpt;
    formObject.photos = currentObject.photos;
    console.log('提交存储数据：',formObject);

    // const response = fyglService.saveFy(buttonAction, formObject);
    const response = fyglService.postData(buttonAction, formObject,this.data.collid);
    // console.log(buttonAction+"===:"+CONSTS.getButtonActionInfo(buttonAction));
    fyglService.handleAfterRemote(response, CONSTS.getButtonActionInfo(buttonAction),
      (resultData)=>{
        // console.log('savefy return:',resultData);
        getApp().setFyListDirty(true);
        if(!utils.isEmpty(formObject.zhxm)){
          const s = JSON.stringify({ houseid: resultData._id });
          let pageDesc;
          if(buttonAction===CONSTS.BUTTON_EDITFY){
            pageDesc = '数据修改完成后，如帐单数据有变动，可进入帐单详情页查看并刷新帐单。';
          }else{ 
            pageDesc = '房源新建完成后，可进入帐单详细页查看签约帐单。';
          }
          utils.redirectToSuccessPage(pageDesc, '查看帐单详情', '/pages/fygl/editlist/editlist', CONSTS.BUTTON_LASTZD, { houseid: resultData._id, collid: this.data.collid, yzhid: formObject.yzhid });
        }else{
          wx.navigateBack();
        }
      }
    );
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {
    const item = options.item?JSON.parse(options.item):null;
    let currentObject,collid;
    if(item){
      currentObject = item.house;
      collid = item.collid;
    }else{
      currentObject = {};
      collid = getApp().globalData.user.collid;
    }
    if(!currentObject.fwpt){
      currentObject.fwpt = {};
    }

    let buttonAction = options.buttonAction;
    if(buttonAction){
      buttonAction = Number.parseInt(buttonAction);
    } 
    //调试程序用。。。。
    buttonAction = CONSTS.BUTTON_ADDFY;

    var that = this;
    wx.getSystemInfo({
      success: function (res) {
        that.setData({
          sliderLeft: (res.windowWidth / that.data.tabs.length - sliderWidth) / 2,
          sliderOffset: res.windowWidth / that.data.tabs.length * that.data.activeIndex
        });
      }
    });

    this.setData({
      buttonAction, 
      collid,
      currentObject,
    });

    if(buttonAction === CONSTS.BUTTON_EDITFY){
      //编辑房源进入，刷新必录项
      const zhxm = currentObject.zhxm;
      this.onInputBlur({ detail: { value: zhxm},target:{id:'zhxm'}});      
      //刷新必录项颜色
      let { fmMetas } = this.data;
      refreshFmMetas(fmMetas,currentObject);
      // Object.keys(fmMetas).map(value => {
      //   if (fmMetas[value].require) {
      //     fmMetas[value].isEmpty = utils.isEmpty(currentObject[value]);
      //   }
      // });
      let pageDesc;
      if(utils.isEmpty(currentObject.zhxm)){
        pageDesc = '输入租户姓名及必要信息，即表示房屋出租了，存盘完成会自动生成一张签约帐单。';
      }else{
        pageDesc = '数据修改后，帐单未结前如需刷新帐单，请在帐单处理页面进行操作。';
      }
      this.setData({
        pageTitle: '查看/修改房源',
        pageDesc,
        fmMetas
      });     
    }else{
      this.setData({
        pageTitle:'新建房源',
        pageDesc:'输入租户姓名及必要信息，即表示房屋出租了，存盘完成会自动生成一张签约帐单。',
      })
    }
  },

  tabClick: function (e) {
    this.setData({
      sliderOffset: e.currentTarget.offsetLeft,
      activeIndex: e.currentTarget.id
    });
  },

  onCheckboxChange: function(e){
    const name = e.target.id;
    let { currentObject} = this.data;
    currentObject[name] = e.detail.value;
    this.setData({currentObject});
  },

  onAddMorezh:function(e){
    let { currentObject } = this.data;
    if(!currentObject.moreZh) currentObject.moreZh = []; 
    currentObject.moreZh.push({});
    this.setData({
      currentObject
    })
  },
  
  onAddMorePhoto: function (e) {
    let { currentObject } = this.data;
    if(utils.isEmpty(currentObject.fwmc)){
      utils.showToast('需要输入房屋名称后才能上传照片！');
      return;
    }
    if (currentObject.photos && currentObject.photos.length>=config.uploadFileMaxCount){
      utils.showToast('超过每个房间最大上传照片数：'+config.uploadFileMaxCount);
      return;
    }
    this.doUpload(getApp().globalData.user.yzhid, currentObject.fwmc);
  },

  onPreviewPhotos: function (e) {
    const { item:current} = e.currentTarget.dataset;
    const {photos} = this.data.currentObject;
    wx.previewImage({
      current,
      urls:photos,
    })
  }, 


  onDeleteMorezh: function (e) {
    utils.showModal('删除租户', '你确定删除当前租户吗？', () => this.startDeleteMorezh(e));
  }, 

  startDeleteMorezh:function(e){
    const { item: index } = e.currentTarget.dataset;
    let { currentObject } = this.data;
    currentObject.moreZh.splice(index, 1);
    this.setData({ currentObject });
  },

  onDeletePhoto: function(e){
    utils.showModal('删除图片','你确定删除当前图片吗？',()=>this.startDeletePhoto(e));
  }, 

  startDeletePhoto: function (e) {
    const { item: index } = e.currentTarget.dataset;
    let { currentObject } = this.data;
    const fileid = currentObject.photos[index];
    let self = this;
    utils.showLoading('删除中');
    wx.cloud.deleteFile({
      fileList: [fileid],
      success: res => {
        let { currentObject } = self.data;
        currentObject.photos.splice(index, 1);
        self.setData({ currentObject });
      },
      fail: err => {
        utils.showToast('删除图片失败！' + err);
      },
      complete: res => {
        wx.hideLoading();
      }
    })
  },

  
  // 上传图片
  doUpload: function (yzhid,fwmc) {
    // 选择图片
    let self = this;
    wx.chooseImage({
      count: 1,
      sizeType: ['compressed'],
      sourceType: ['album', 'camera'],
      success: function (res) {
        //检查文件大小
        const fileSize = res.tempFiles[0].size;
        if (fileSize > config.uploadFileMaxSize){
          utils.showToast('上传文件大小不能超过：' + (config.uploadFileMaxSize/1024)+'k');
          return;
        }

        wx.showLoading({
          title: '上传中',
        })

        const filePath = res.tempFilePaths[0]
        // 上传图片
        const fileType = filePath.match(/\.[^.]+?$/)[0];
        const cloudPath = yzhid + '/'+fwmc+'/'+utils.uuid(5)+fileType;
        console.log('chooseImage Path:', filePath, cloudPath);
        // return; 

        wx.cloud.uploadFile({
          cloudPath,
          filePath,
          success: res => {
            // console.log('[上传文件] 成功111：', res)
            // console.log(this.data.currentObject);
            let { currentObject } = self.data;
            if (!currentObject.photos) currentObject.photos = [];
            currentObject.photos.push(res.fileID);
            self.setData({currentObject});
          },
          fail: e => {
            console.error('[上传文件] 失败：', e)
            wx.showToast({
              icon: 'none',
              title: '上传失败',
            })
          },
          complete: () => {
            wx.hideLoading()
          }
        })
      },
      fail: e => {
        console.error(e)
      }
    })
  },

  onMorezhBlur: function (e) {
    const idarr = e.currentTarget.id.split('.');
    const index = Number.parseInt(idarr[0]);
    const name = idarr[1];
    let {currentObject} = this.data;
    currentObject.moreZh[index][name] = e.detail.value;
    this.setData({
      currentObject
    })
  },
  onFwptBlur: function (e) {
    const name = e.currentTarget.id;
    let { currentObject } = this.data;
    currentObject.fwpt[name] = e.detail.value;
    this.setData({
      currentObject
    })
  },

  onInputBlur: function(e) {
    const name = e.target.id;
    let { currentObject,fmMetas } = this.data;
    currentObject[name] = e.detail.value;
    if(name === 'zhxm'){
      const isRequire = !utils.isEmpty(e.detail.value);
      // const {fmMetas} = this.data;
      ['dhhm','czje','yj','htrqq','htrqz','szrq','dscds','sscds','ddj','sdj'].map(value=>{
        if (fmMetas[value]){
          fmMetas[value].require = isRequire;
          if(isRequire){
            fmMetas[value].isEmpty = utils.isEmpty(currentObject[value]);
          }
        } 
      })
    }else if(name==='htrqq'){
      const htrqq = moment(e.detail.value);
      // console.log('htrqq:',htrqq);
      const szrq = currentObject.szrq;
      if (utils.isEmpty(szrq)) {
        // 根据合同日期起自动生成下次收租日期,加1月
        currentObject.szrq = htrqq.clone().add(1, 'months').format('YYYY-MM-DD');
      }
      const htrqz = currentObject.htrqz;
      if (utils.isEmpty(htrqz)) {
        // 根据合同日期起自动生成下次收租日期，加1年
        currentObject.htrqz = htrqq.clone().add(1, 'years').subtract(1,'days').format('YYYY-MM-DD');
      }
      refreshFmMetas(fmMetas, currentObject);
    } else if (fmMetas[name]){
      fmMetas[name].isEmpty = utils.isEmpty(currentObject[name]);
    }
    this.setData({
      currentObject,
      fmMetas,
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

