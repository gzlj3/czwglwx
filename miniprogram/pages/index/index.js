//index.js
import moment from '../../utils/moment.min.js';
const CONSTS = require('../../utils/constants.js');
const utils = require('../../utils/utils.js');
// const userService = require('../../services/userServices.js');
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
    id: 'widget',
    name: '集中抄表',
    open: false,
    page: '../fygl/editlist/editlist?buttonAction=' + CONSTS.BUTTON_CB
  },
  {
    id: 'special',
    name: '集中创建帐单',
    open: false,
    page: '../fygl/editlist/editlist?buttonAction=' + CONSTS.BUTTON_MAKEZD
  },
];
const zkMenuList = [
  {
    id: 'widget',
    name: '查看我的帐单',
    open: false,
    page: 'seeLastzd'
  },
]

Page({
  data: {
    user: app.globalData.user,
    avatarUrl: './user-unlogin.png',
    userInfo: {},
    granted: false,  //是否获得用户公共信息的授权    
    registered: false, // 用户是否已经注册
    userType:'0', // 用户身份,0:未注册，1：房东，2：租客
    logged: false,
    takeSession: false,
    requestResult: '',
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
  },
  
  onLoad: function() { 
    // const obj = {
    //   100:'aaaaaaaaa',
    //   aaa:'bbbbbbbb',
    // }
    // const b=1000;
    // console.log(obj[b]);
    // console.log('====sfsz:',CONSTS.getSfszInfo('2'));
    // const zdlx=null;
    // const newzdlx = zdlx | 100;
    // console.log('取整:',Math.ceil(33 / 30));
    // console.log(moment().startOf('day'));
    // wx.showModal({
    //   title: 'aaa',
    //   content: '<view>aaaaaa</view>',
    // })
    // wx.navigateTo({
    //   url: '../fygl/fyglmain',
    //   // url: '../fygl/editlist/editlist?buttonAction=' + CONSTS.BUTTON_LASTZD + '&item={"houseid":"W-6zxOJyfGvOuo9u"}',
    // })
    // console.log(moment().utcOffset(+8).format('YYYY-MM-DD HH:mm:ss'));
    // const uuid = utils.uuid(16,10);
    // console.log(uuid);
    // console.log(uuid.length);  
    // console.log(utils.getFloat((4.0).toFixed(1)));
    this.queryUser();
 
  },

  getWxGrantedData: function(){
    if (!this.data.user.granted) {
      //获取用户信息
      wx.getSetting({
        success: res => {
          // console.log('getSetting success.');
          // console.log(res);
          if (res.authSetting['scope.userInfo']) {
            // 已经授权，可以直接调用 getUserInfo 获取头像昵称，不会弹框
            wx.getUserInfo({
              success: res => {
                console.log('get granted userinfo');
                console.log(res.userInfo);
                this.setUserData(res.userInfo);
              }
            })
          }
        }
      })
    }    
  },

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
    console.log('getuserinfo');
    console.log(e);
    this.setUserData(e.detail.userInfo);

    // if (!this.data.granted && e.detail.userInfo) {
    //   this.setData({
    //     granted: true,
    //     avatarUrl: e.detail.userInfo.avatarUrl,
    //     userInfo: e.detail.userInfo
    //   })
    //   this.queryUser();
    // }
  },


  // testSubmit: function (e) {
  //   var self = this;
  //   console.log(e);
  //   let _access_token = '5_E1pZJQzTC-lC0r-JJz9wVAZv5Zv22CNtmV_7C1T0sqC9TV7mGE4FTmDX2B0PVM4LaGtaTfXwzfJLnD7fDKTg8DOICJNkKBQgn_Ot2zYmBJyY1g1VXoBNdtwUE0QaP8_9tWlbR-Zq7L1OyrrPKCIjAEAOGM';
  //   let url = 'https://api.weixin.qq.com/cgi-bin/message/wxopen/template/send?access_token=' + _access_token; 
               
  //   const openid = 'on_Li5Pa4d5XQklE_NCiI2IoPKsM';
  //   let _jsonData = {
  //       access_token: _access_token,
  //       touser: openid,
  //       template_id: '50_-U2e4vq8STuhhDTqEWVywu1RQYFSzujZv_NG2h6k',
  //       form_id: e.detail.formId,
  //       page: "pages/index/index",
  //       data: {
  //         "keyword1": { "value": "测试数据一", "color": "#173177" },
  //         "keyword2": { "value": "测试数据二", "color": "#173177" },
  //         "keyword3": { "value": "测试数据三", "color": "#173177" },
  //         "keyword4": { "value": "测试数据四", "color": "#173177" },
  //         "keyword5": { "value": "测试数据五", "color": "#173177" },
  //       }
  //     }
  //   const response = fyglService.postData(300,  _jsonData );
  //   fyglService.handleAfterRemote(response, '测试',
  //     (resultData) => {
  //       console.log(resultData);
  //       // this.setData({ sendingYzm: true });
  //       // this.timer();
  //     }
  //   );
      
    // wx.request({
    //   url: url,
    //   data: _jsonData,
    //   method: 'POST',
    //   success: function (res) {
    //     console.log(res)
    //   },
    //   fail: function (err) {
    //     console.log('request fail ', err);
    //   },
    //   complete: function (res) {
    //     console.log("request completed!",res);
    //   }

    // });
  // },

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
        // console.log('======register user result:');
        // console.log(resultData);
        this.setUserData(resultData && resultData.length > 0 ? resultData[0] : null);
      }
    );
  },
 
  queryUser: function(){
    const response = fyglService.queryData(CONSTS.BUTTON_QUERYUSER);
    fyglService.handleAfterRemote(response, null,
      (resultData) => { 
        // console.log('======query user result:');
        // console.log(resultData);
        this.setUserData(resultData && resultData.length > 0 ? resultData[0]:null);
        this.getWxGrantedData();
      }
    );
  }, 

  //设置用户数据，入口对象userInfo:{userType,nickName,avatarUrl,...}或为空
  setUserData: function(userData){
    if (userData) {
      // let { userType, nickName, avatarUrl } = userData;
      app.setGlobalData({ user: { granted: true, userType: CONSTS.USERTYPE_NONE,...userData}});
      this.setData({ user: app.globalData.user});
      // console.log(this.data.user);
    } else {
      const userType = CONSTS.USERTYPE_NONE;
      const nickName = '',avatarUrl = '',granted=false;
      app.setGlobalData({ user: { granted, userType, nickName, avatarUrl } });
      this.setData({ user: app.globalData.user });
    }
  },  

  seeLastzd: function(){
    const response = fyglService.queryData(CONSTS.BUTTON_ZK_SEELASTZD);
    fyglService.handleAfterRemote(response, '查看帐单',
      (resultData) => {
        console.log('seeLastzd:',resultData);
        const s = JSON.stringify({ houseid: resultData.houseid });
        wx.navigateTo({
          url: '../fygl/editlist/editlist?buttonAction=' + CONSTS.BUTTON_LASTZD + '&item=' + s,
        })
      }
    );    
  },

  kindToggle: function (e) {
    const page = e.currentTarget.id;

    if (page === 'seeLastzd'){
      this.seeLastzd();
      return;
    }

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
