//const fyglService = require('./services/fyglServices.js');
const config = require('config.js')
const CONSTS = require('./utils/constants.js');
// const utils = require('../../utils/utils.js');
const fyglService = require('./services/fyglServices.js');

App({
  onLaunch: function () {
    console.log('onLaunch');
    if (!wx.cloud) {
      console.error('请使用 2.2.3 或以上的基础库以使用云能力')
    } else {
      wx.cloud.init({
        env: config.conf.env,
        traceUser: true,
      }) 
    }

    this.globalData = {
      cloudNormal:false,
      fyListDirty:false,  //房源列表是否有更新
      user: { wxgranted: true, userType:'', nickName:'', avatarUrl:'',collid:'',granted:[],grantedSjhm:[], }  //用户登录基本信息
    }

    this.queryUser();
  },

  setGlobalData: function(newData){
    this.globalData = {
      ...this.globalData,
      ...newData
    }
  },

  setFyListDirty: function (fyListDirty){
    this.setGlobalData({fyListDirty});
  },

  queryUser: function () {
    const response = fyglService.queryData(CONSTS.BUTTON_QUERYUSER);
    fyglService.handleAfterRemote(response, null,
      (resultData) => {
        console.log('onLaunch queryuser success!');
        this.setUserData(resultData);
        this.getWxGrantedData();
        if(this.globalData.user.wxgranted){
          this.setGlobalData({ cloudNormal: true });
        }
      },
      err => {
        this.setGlobalData({ cloudNormal: false });
      }
    );
  },

  //设置用户数据，入口对象userInfo:{userType,nickName,avatarUrl,...}或为空
  setUserData: function (userData) {
    if (userData) {
      this.setGlobalData({ user: { wxgranted: true, userType:CONSTS.USERTYPE_NONE,...userData } });
    } else {
      const userType = CONSTS.USERTYPE_NONE;
      const nickName = '', avatarUrl = '', wxgranted = false;
      this.setGlobalData({ user: { wxgranted, userType, nickName, avatarUrl } });
    }
  },  

  getWxGrantedData: function () {
    if (!this.globalData.user.wxgranted) {
      //获取用户信息
      wx.getSetting({
        success: res => {
          if (res.authSetting['scope.userInfo']) {
            // 已经授权，可以直接调用 getUserInfo 获取头像昵称，不会弹框
            wx.getUserInfo({
              success: res => {
                // console.log('getSetting success:',res);
                this.setUserData(res.userInfo);
              },
              complete: res => {
                // console.log('getSetting complete:', res);
                this.setGlobalData({ cloudNormal: true });
              }
            })
          }
        },
        complete: res => {
          // console.log('getWxGrantedData complete:', res);
          if (!res.authSetting['scope.userInfo']) {
            this.setGlobalData({ cloudNormal: true });
          }
        }
      })
    }
  },

})
