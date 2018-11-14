//app.js
App({
  onLaunch: function () {
    
    if (!wx.cloud) {
      console.error('请使用 2.2.3 或以上的基础库以使用云能力')
    } else {
      wx.cloud.init({
        // env:'jjczwgl-test-2e296e',
        env: 'jjczwgl-bc6ef9',
        traceUser: true,
      }) 
    }

    this.globalData = {
      buttonAction:0, // 页面之间传递参数的动作
      currentObject: null, // 页面之间传递参数的对象
    } 
  },
 
  setGlobalData: function(newData){
    this.globalData = {
      ...this.globalData,
      ...newData
    }
  },

  setPageParams: function(buttonAction,currentObject){
    this.setGlobalData({ buttonAction, currentObject});
  }
})
