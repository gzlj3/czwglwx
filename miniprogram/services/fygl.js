import * as CONSTS from '../utils/constants.js';
import moment from '../utils/moment.min.js';

export function queryData(action,params) {
  const result = wx.cloud.callFunction({
    name: 'fygl',
    data: {
      action,
      method: 'GET',
      data:params,
    },
  });
  return result;
}

export function postData(action, params) {
  const result = wx.cloud.callFunction({
    name: 'fygl',
    data: {
      action,
      method: 'POST',
      data: params,
    },
  });
  return result;
}

export function queryFyglList(params) {
  const result = wx.cloud.callFunction({
    name: 'fygl',
    data: {
      action: CONSTS.BUTTON_QUERYFY,      
    },
  });
  return result;
}
export function saveFy(action,params) {
  return wx.cloud.callFunction({
    name: 'fygl',
    data: {
      action,
      data: params,
    },
  });
}

export function handleAfterRemote(response,tsinfo,successCallback) {
  if (!response) return;
  // const { buttonAction } = this.data;
  // const tsinfo = CONSTS.getButtonActionInfo(buttonAction);
  // console.log("tsinfo:"+tsinfo);
  if(!tsinfo) tsinfo = "";
  response.then(res => {
    console.log(res);
    const { status = CONSTS.REMOTE_SUCCESS, msg, data } = res.result;
    // this.changeState({ status, msg });

    if (status === CONSTS.REMOTE_SUCCESS) {
      if (tsinfo.length > 0) {
        wx.showToast({
          title: `${tsinfo}成功完成！${msg}`,
        });
      };
      if (successCallback) successCallback(data);
    } else {
      wx.showToast({
        title: `${tsinfo}处理失败！${msg}`,
        icon: 'none',
        duration: 5000,
      });
    }
  }).catch(err => {
    console.log(err);
    wx.showToast({
      title: `${tsinfo}处理失败！${err.errMsg}`,
      icon: 'none',
      duration: 5000,
    });
  })
}

export function refreshProgessState(fyList) {
  fyList.map(item =>{
    item.progressState = getProgessState(item);
  }) 
}

const getProgessState = item => {
  const ysz = (item.sfsz && item.sfsz !== '0');
  const currq = moment().startOf('day');
  const szrq = moment(item.szrq, 'YYYY-MM-DD');
  let progressState = {
    backgroundColor:'default',
    activeColor:'default',
    percent: 0,
  };
// console.log(item.fwmc+'  '+ysz);
  let { percent, activeColor, backgroundColor } = progressState;
  if (ysz) {
    const days1 = currq.diff(szrq, 'days');
    if(days1<=0){
      percent = Math.round((days1+31) / 31 * 100);
      if (percent >= 90) activeColor='yellow';
    }else{
      percent = Math.round(days1 / 5 * 100);
      if(percent<100){
        backgroundColor = 'yellow';
      }else{
        activeColor = 'red';
      }
    }
  } else if (!ysz) {
    const days1 = currq.diff(szrq, 'days');
    percent = Math.round((days1 / 5) * 100);
    if(percent<100){ 
      backgroundColor = 'yellow';
    }else{
      backgroundColor = 'yellow';
      activeColor = 'red';
    }
  }
  progressState = { percent, activeColor, backgroundColor };
  // console.log(progressState);
  return progressState;
};
