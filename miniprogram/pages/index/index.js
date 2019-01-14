//index.js
import moment from '../../utils/moment.min.js';
const CONSTS = require('../../utils/constants.js');
const utils = require('../../utils/utils.js');
const fyglService = require('../../services/fyglServices.js');
const config = require('../../config.js');
const app = getApp()

const menuList = [
  {
    id: 'form',  
    name: '我的房源列表',
    open: false,
    page: '../fygl/fyglmain'
  },
  {
    id: 'nav',
    name: '面对面签约',
    open: false,
    page: '../fygl/htqy/htqy'
  },
  {
    id: 'widget',
    name: '集中抄表',
    open: false,
    page: '../fygl/editlist/editlist?buttonAction=' + CONSTS.BUTTON_CB
  },
  {
    id: 'special',
    name: '出帐单',
    open: false,
    page: '../fygl/editlist/editlist?buttonAction=' + CONSTS.BUTTON_MAKEZD
  },
  {
    id: 'z-index',
    name: '房源授权',
    open: false,
    page: '../user/userGrant'
  },
  {
    id: 'feedback',
    name: '系统配置',
    open: false,
    page: '../sysmanager/sysconfig/sysconfig'
  },
];
const zkMenuList = [
  {
    id: 'widget',
    name: '查看我的帐单',
    open: false, 
    page: '../fygl/fyglmain'
  },
] 

Page({
  data: {
    user: null,
    // avatarUrl: './user-unlogin.png',
    // userInfo: {},
    // wxgranted: false,  //是否获得用户公共信息的授权    
    // registered: false, // 用户是否已经注册
    // userType:'0', // 用户身份,0:未注册，1：房东，2：租客
    // logged: false,
    // takeSession: false,
    // requestResult: '',
    list:menuList,
    zkMenuList,
    sjhm:'',
    sendingYzm:false,
    second:config.conf.yzmYxq,
    CONSTS,
    radioItems: [ 
      { name: '我是房东，想管理我的房源', value: '1', checked: true  },
      { name: '我是租客，想查询我的帐单', value: '2'}
    ], 
    waitingCloud:true,
    requestUserType:'',  //用户请求入口身份（房东或租客）
    disabledSjhm: false,  //如果手机号码是带入的，则不允许修改，而且默认为是租客注册
  },
  
  onLoad: function (options) {
    // console.log(moment([moment().year(),moment().month(),0]).isValid());    
    
    let requestUserType = options.requestUserType ? options.requestUserType:'';
    const sjhm = !utils.isEmpty(options.sjhm) ? options.sjhm : '';
    let {radioItems,disabledSjhm} = this.data;
    if (requestUserType === CONSTS.USERTYPE_ZK){
      radioItems[0].checked = false;
      radioItems[1].checked = true;
    }
    if(!utils.isEmpty(sjhm) && utils.checkSjhm(sjhm)){
      disabledSjhm = true;
      if (utils.isEmpty(requestUserType)) requestUserType = CONSTS.USERTYPE_ZK;
    }
    this.setData({ requestUserType, sjhm, disabledSjhm });
    this.waitingCloudNormal();
  },  

  waitingCloudNormal: function () {
    let waitingCloudNum = 0;
    this.setData({waitingCloud:true});
    let promise = new Promise((resolve, reject) => {
      let setTimer = setInterval(
        () => { 
          waitingCloudNum++; 
          if (app.globalData.cloudNormal){
            this.setData({
              user: app.globalData.user              
            });
            resolve(setTimer);
          } 
          if (waitingCloudNum>20){
            //等待10秒
            resolve(setTimer);
          } 
        },500)
    });
    promise.then((setTimer) => {
      clearInterval(setTimer)
      this.setData({ waitingCloud: false });
    });
  },

  refreshUser:function(){
    app.queryUser();
    this.waitingCloudNormal();
  },


  // getWxGrantedData: function(){
  //   if (!this.data.user.wxgranted) {
  //     //获取用户信息
  //     wx.getSetting({
  //       success: res => {
  //         if (res.authSetting['scope.userInfo']) {
  //           // 已经授权，可以直接调用 getUserInfo 获取头像昵称，不会弹框
  //           wx.getUserInfo({
  //             success: res => {
  //               this.setUserData(res.userInfo);
  //             }
  //           })
  //         }
  //       }
  //     })
  //   }    
  // },

  radioChange: function (e) {
    // console.log('radio发生change事件，携带value值为：', e.detail.value);
    var radioItems = this.data.radioItems;
    for (var i = 0, len = radioItems.length; i < len; ++i) {
        radioItems[i].checked = radioItems[i].value == e.detail.value;
    }
    this.setData({
        radioItems: radioItems
    });
  },
 

  onGetUserInfo: function(e) {
    this.setUserData(e.detail.userInfo);
  },


  // onGetOpenid: function() {
  //   // 调用云函数
  //   wx.cloud.callFunction({
  //     name: 'login',
  //     data: {},
  //     success: res => {
  //       console.log('[云函数] [login] user openid: ', res.result.openid)
  //       app.globalData.openid = res.result.openid
  //       wx.navigateTo({
  //         url: '../userConsole/userConsole',
  //       })
  //     },
  //     fail: err => {
  //       console.error('[云函数] [login] 调用失败', err)
  //       wx.navigateTo({
  //         url: '../deployFunctions/deployFunctions',
  //       })
  //     }
  //   })
  // }, 

  onInputSjhm: function(e){
    this.setData({sjhm:e.detail.value});
  },

  onSendSjyzm: function(e){ 
    const {sjhm} = this.data;
    if(!utils.checkSjhm(sjhm)){
      wx.showToast({
        title: '请先输入正确的手机号',
        icon: 'none',
      });
      return;
    };
    const response = fyglService.postData(CONSTS.BUTTON_SENDSJYZM,{sjhm});
    fyglService.handleAfterRemote(response, '发送验证码',
      (resultData) => {
        this.setData({ sendingYzm:true});
        this.timer();
      }
    );
  },

  timer: function () {
    let promise = new Promise((resolve, reject) => {
      let setTimer = setInterval(
        () => {
          this.setData({
            second: this.data.second - 1
          });
          if (this.data.second <= 0) {
            this.setData({
              second: config.conf.yzmYxq,
              sendingYzm: false,
            });
            resolve(setTimer);
          }
        }
        , 1000)
    });
    promise.then((setTimer) => {
      clearInterval(setTimer)
    });
  },

  onRegister: function(e) { 
    const {requestUserType} = this.data;
    if(!utils.isEmpty(requestUserType)){
      e.detail.value.userType = requestUserType;
    }
    console.log(e.detail.value);

    const {sjhm,sjyzm} = e.detail.value;
    if (!utils.checkSjhm(sjhm) || utils.isEmpty(sjyzm) || sjyzm.length!==6) {
      wx.showToast({ 
        title: '请先输入手机号和验证码',
        icon: 'none',
      });
      return;
    };
    const response = fyglService.postData(CONSTS.BUTTON_REGISTERUSER,
                                          {frontUserInfo:this.data.user,
                                          sjData:e.detail.value});
    fyglService.handleAfterRemote(response, '用户注册',
      (resultData) => { 
        this.setUserData(resultData);
      }
    );
  }, 
 
  // queryUser: function(){
  //   const response = fyglService.queryData(CONSTS.BUTTON_QUERYUSER);
  //   fyglService.handleAfterRemote(response, null,
  //     (resultData) => { 
  //       // console.log('queryuser:',resultData);
  //       this.setData({onLoadState:'onLoadSuccess'});
  //       // this.setUserData(resultData && resultData.length > 0 ? resultData[0]:null);
  //       this.setUserData(resultData);
  //       this.getWxGrantedData();
  //     },
  //     err => {
  //       this.setData({ onLoadState: 'onLoadFail' });
  //     }
  //   );
  // }, 

  //设置用户数据，入口对象userInfo:{userType,nickName,avatarUrl,...}或为空
  setUserData: function(userData){
    app.setUserData(userData);
    this.setData({ user: app.globalData.user });
    // if (userData) {
    //   // let { userType, nickName, avatarUrl } = userData;
    //   app.setGlobalData({ user: { wxgranted: true, userType: CONSTS.USERTYPE_NONE,...userData}});
    //   this.setData({ user: app.globalData.user});
    //   // console.log(this.data.user);
    // } else {
    //   const userType = CONSTS.USERTYPE_NONE;
    //   const nickName = '',avatarUrl = '',wxgranted=false;
    //   app.setGlobalData({ user: { wxgranted, userType, nickName, avatarUrl } });
    //   this.setData({ user: app.globalData.user });
    // }
  },  

  // seeLastzd: function(){
  //   wx.navigateTo({
  //     url: '../fygl/fyglmain',
  //   })

  // },

  kindToggle: function (e) {
    const page = e.currentTarget.id;

    // if (page === 'seeLastzd'){
    //   this.seeLastzd();
    //   return;
    // }

    wx.navigateTo({
      url: page,
    });
    // var id = e.currentTarget.id, list = this.data.list;
    // for (var i = 0, len = list.length; i < len; ++i) {
    //   if (list[i].id == id) {
    //     list[i].open = !list[i].open
    //   } else {
    //     list[i].open = false
    //   }
    // }
    // this.setData({
    //   list: list
    // });
  },
  doDelete: function () {
    wx.cloud.deleteFile({
      fileList: ['cloud://jjczwgl-test-2e296e.6a6a-jjczwgl-test-2e296e/test/my-image.jpg'],
      success: res => {
        // handle success
        console.log(res)
      },
      fail: err => {
        // handle error
        console.log(err)
      }
    })    
  },

  testSubmit: function(e){
    // console.log('testsubmit:',e);
    // const response = fyglService.postData(300, { form_id:e.detail.formId });
    // fyglService.handleAfterRemote(response, '测试服务',
    //   (resultData) => {
    //     console.log(resultData)
    //   }
    // );
    const buffer = new ArrayBuffer(1)
    const dataView = new DataView(buffer)
    dataView.setUint8(0, 0)
    wx.startHCE({
      aid_list: ['0322510487'],
      success(res) {
        console.log('starthce success.',res);
        utils.showToast('start hce success.');
        wx.onHCEMessage(function (res) {
          console.log('onHCEMessage.', res);
          utils.showToast('onHCEMessage callback:' + res.messageType);
          if (res.messageType === 1) {
            wx.sendHCEMessage({ data: buffer })
          }
        })
      },
      fail(res) {
        console.log('starthce fail.', res);
        utils.showToast('start hce fail.');
      }     
    })
  },
  testPage: function (e) { 
    const buffer = new ArrayBuffer(1)
    const dataView = new DataView(buffer)
    dataView.setUint8(0, 0)
    wx.startHCE({
      aid_list: ['F223344556'],
      success(res) {
        console.log('starthce success.', res);
        utils.showToast('start hce success.'); 
        wx.onHCEMessage(function (res) {
          console.log('onHCEMessage.', res);
          utils.showToast('onHCEMessage callback:' + res.messageType);
          if (res.messageType === 1) {
            wx.sendHCEMessage({ data: buffer })
          }
        })
      },
      fail(res){
        console.log('starthce fail.', res);
        utils.showToast('start hce fail.');
      }
    })
  },

  onShareAppMessage: function(e){
  },
  onbindload:function(e){
    // console.log('onbindload:',e);
  },
  onbinderror: function (e) {
    // console.log('onbinderror:',e);
  },
})
