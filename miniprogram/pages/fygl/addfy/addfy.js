// miniprogram/pages/fygl/addfy/addfy.js
import * as CONSTS from '../../../utils/constants.js';
import * as utils from '../../../utils/utils.js';
import * as fyglService from '../../../services/fyglServices.js'; 
import moment from '../../../utils/moment.min.js';

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
  dgtds: { label: '电公摊度数', name: 'dgtds', type: "number" },
  sgtds: { label: '水公摊度数', name: 'sgtds', type: "number" },
  // dbcds: { label: '电本次读数', name: 'dbcds', type: "number" },
  // sbcds: { label: '水本次读数', name: 'sbcds', type: "number" },
  wlf: { label: '网络费', name: 'wlf', type: "digit" },
  ljf: { label: '卫生费', name: 'ljf', type: "digit" },
  glf: { label: '管理费', name: 'glf', type: "digit" },
  qtf: { label: '其它费', name: 'qtf', type: "digit" },
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
}

const refreshFmMetas = (fmMetas,currentObject) => {
  Object.keys(fmMetas).map(value => {
    if (fmMetas[value].require) {
      fmMetas[value].isEmpty = utils.isEmpty(currentObject[value]);
    }
  });
  console.log('currentobject:',currentObject);
  console.log('fmMetas:',fmMetas);
}

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
    console.log('form提交数据：', e.detail.value)
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


    const response = fyglService.saveFy(buttonAction, formObject);
    // console.log(buttonAction+"===:"+CONSTS.getButtonActionInfo(buttonAction));
    fyglService.handleAfterRemote(response, CONSTS.getButtonActionInfo(buttonAction),
      (resultData)=>{
        console.log('savefy return:',resultData);
        getApp().setFyListDirty(true);
        if(!utils.isEmpty(formObject.zhxm)){
          const s = JSON.stringify({ houseid: resultData._id });
          let pageDesc;
          if(buttonAction===CONSTS.BUTTON_EDITFY){
            pageDesc = '数据修改完成后，如帐单数据有变动，可进入帐单详情页查看并刷新帐单。';
          }else{
            pageDesc = '房源新建完成后，可进入帐单详细页查看签约帐单。';
          }
          utils.redirectToSuccessPage(pageDesc, '查看帐单详情', '/pages/fygl/editlist/editlist', CONSTS.BUTTON_LASTZD, { houseid: resultData._id });
          // const returnUrl = '/pages/fygl/editlist/editlist';
          // console.log('returnUrl:',returnUrl);
          // const button2Obj = {
          //   buttonText:'查看帐单详情',
          //   returnUrl,
          //   returnAction: CONSTS.BUTTON_LASTZD,
          //   returnItem: { houseid: resultData._id }
          // }
          // wx.redirectTo({
          //   url: '/pages/fygl/msg/msg_success?pageDesc='+pageDesc+'&button2=' + JSON.stringify(button2Obj)
          // });
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
    const currentObject = options.item?JSON.parse(options.item):{};
    let buttonAction = options.buttonAction;
    if(buttonAction){
      buttonAction = Number.parseInt(buttonAction);
    }
    this.setData({
      buttonAction,
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

  onInputBlur: function(e) {
    // console.log(e);
    // console.log(e.target);
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
        currentObject.htrqz = htrqq.clone().add(1, 'years').format('YYYY-MM-DD');
      }
      refreshFmMetas(fmMetas, currentObject);
    }else{
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