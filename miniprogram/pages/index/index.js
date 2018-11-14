//index.js
const CONSTS = require('../../utils/constants.js');
const userService = require('../../services/userServices.js');
const app = getApp()

const menuList = [
  {
    id: 'form', 
    name: '我的房源列表',
    open: false,
    // pages: ['button', 'list', 'input', 'slider', 'uploader']
    page: '../fygl/fyglmain'
  },
  // {
  //   id: 'widget',
  //   name: '基础组件',
  //   open: false,
  //   pages: ['article', 'badge', 'flex', 'footer', 'gallery', 'grid', 'icons', 'loadmore', 'panel', 'preview', 'progress']
  // },
  // {
  //   id: 'feedback',
  //   name: '操作反馈',
  //   open: false,
  //   pages: ['actionsheet', 'dialog', 'msg', 'picker', 'toast']
  // },
  // {
  //   id: 'nav',
  //   name: '导航相关',
  //   open: false,
  //   pages: ['navbar', 'tabbar']
  // },
  // {
  //   id: 'search',
  //   name: '搜索相关',
  //   open: false,
  //   pages: ['searchbar']
  // }
];

Page({
  data: {
    avatarUrl: './user-unlogin.png',
    userInfo: {},
    granted: false,  //是否获得用户公共信息的授权    
    registered: false, // 用户是否已经注册
    userType:'0', // 用户身份,0:未注册，1：房东，2：租客
    logged: false,
    takeSession: false,
    requestResult: '',
    list:menuList,
    CONSTS
  },

  onLoad: function() {
    // wx.redirectTo({
    //  url: '../fygl/fyglmain',
    // })
    // return; 
// console.log(this.data.list);
    if (!wx.cloud) {
      wx.redirectTo({
        url: '../chooseLib/chooseLib',
      })
      return
    }
    // console.log('========='); 
    // wx.makePhoneCall({
    //   phoneNumber: '13332875650',
    //   fail:res=>{
    //     console.log(res);
    //   },
    //   complete:(para1)=>{
    //     console.log(para1);
    //     // console.log(para2);
    //   }
    // })
    // const result = wx.getAccountInfoSync();
    // console.log(result);

    // wx.chooseAddress({ 
    //   success(res) {
    //     console.log(res.userName)
    //     console.log(res.postalCode)
    //     console.log(res.provinceName)
    //     console.log(res.cityName)
    //     console.log(res.countyName)
    //     console.log(res.detailInfo)
    //     console.log(res.nationalCode)
    //     console.log(res.telNumber)
    //   }
    // })
    // wx.openSetting({
    //   success(res) {
    //     console.log(res.authSetting)
    //     res.authSetting = {
    //       "scope.userInfo": true,
    //       "scope.userLocation": true
    //     }
    //   }
    // })

    // 获取用户信息
    wx.getSetting({
      success: res => {
        console.log('getSetting success.');
        console.log(res);
        if (res.authSetting['scope.userInfo']) {
          // 已经授权，可以直接调用 getUserInfo 获取头像昵称，不会弹框
          wx.getUserInfo({ 
            success: res => {
              console.log(res); 
              this.setData({
                granted:true,
                avatarUrl: res.userInfo.avatarUrl,
                userInfo: res.userInfo
              })
              this.queryUser();
            }
          })
        }
      }
    })
  },

  onGetUserInfo: function(e) {
    // console.log(e);
    if (!this.data.granted && e.detail.userInfo) {
      this.setData({
        granted: true,
        avatarUrl: e.detail.userInfo.avatarUrl,
        userInfo: e.detail.userInfo
      })
      this.queryUser();
    }
  },

  onGetOpenid: function() {
    // 调用云函数
    wx.cloud.callFunction({
      name: 'login',
      data: {},
      success: res => {
        console.log('[云函数] [login] user openid: ', res.result.openid)
        app.globalData.openid = res.result.openid
        wx.navigateTo({
          url: '../userConsole/userConsole',
        })
      },
      fail: err => {
        console.error('[云函数] [login] 调用失败', err)
        wx.navigateTo({
          url: '../deployFunctions/deployFunctions',
        })
      }
    })
  },

  queryUser: function(){
    if(!this.data.granted) return;
    const response = userService.queryUser();
    // const response = fyglService.queryFyglList();
    userService.handleAfterRemote(response, null,
      (resultData) => {
        //计算房源进度条显示数据
        // fyglService.refreshProgessState(resultData);
        console.log('======query user result:');
        console.log(resultData);
        let userType;
        if(resultData && resultData.length>0){
          userType = resultData[0].userType;
        }else{
          userType = CONSTS.USERTYPE_NONE;
        }
        this.setData({ userType });
        // getApp().setPageParams(CONSTS.BUTTON_NONE, null);
        // this.setData({
        //   fyList: resultData,
        // });
      }
    );
  },

  kindToggle: function (e) {
    const page = e.currentTarget.id;
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

  // 上传图片
  doUpload: function () {
    // 选择图片
    wx.chooseImage({
      count: 1,
      sizeType: ['compressed'],
      sourceType: ['album', 'camera'],
      success: function (res) {

        wx.showLoading({
          title: '上传中',
        })

        const filePath = res.tempFilePaths[0]
        
        // 上传图片
        const cloudPath = 'my-image' + filePath.match(/\.[^.]+?$/)[0]
        wx.cloud.uploadFile({
          cloudPath,
          filePath,
          success: res => {
            console.log('[上传文件] 成功：', res)

            app.globalData.fileID = res.fileID
            app.globalData.cloudPath = cloudPath
            app.globalData.imagePath = filePath
            
            wx.navigateTo({
              url: '../storageConsole/storageConsole'
            })
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

})
