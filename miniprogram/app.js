//const fyglService = require('./services/fyglServices.js');
const config = require('config.js')
App({
  onLaunch: function () {
     
    if (!wx.cloud) {
      console.error('请使用 2.2.3 或以上的基础库以使用云能力')
    } else {
      wx.cloud.init({
        env: config.conf.env,
        traceUser: true,
      }) 
    }

    this.globalData = {
      fyListDirty:false,  //房源列表是否有更新
      user: { wxgranted: true, userType:'', nickName:'', avatarUrl:'',collid:'',rights:'', }  //用户登录基本信息
    }
  },

  setGlobalData: function(newData){
    this.globalData = {
      ...this.globalData,
      ...newData
    }
  },

  setFyListDirty: function (fyListDirty){
    this.setGlobalData({fyListDirty});
  }
})
