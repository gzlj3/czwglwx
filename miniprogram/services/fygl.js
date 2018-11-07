// import { stringify } from 'qs';
// import request from '@/utils/request';
import * as CONSTS from '../utils/constants.js';

export function queryList(buttonAction) {
  const result = wx.cloud.callFunction({
    name: 'fygl',
    data: {
      action: buttonAction,
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
  // .then(res=>{
  //   return res.result;
  // });
  // .catch(err=>{
  //   console.log(err);
  //   result = null;
  // })
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
    // console.log(res);
    const { status = CONSTS.REMOTE_SUCCESS, msg, data } = res.result;
    // this.changeState({ status, msg });

    if (status === CONSTS.REMOTE_SUCCESS) {
      if (tsinfo.length > 0) {
        wx.showToast({
          title: `${tsinfo}成功完成！${msg}`,
        });
      };
      // 传递返回参数
      // getApp().setPageParams(buttonAction, data);
      // wx.navigateBack();
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

// export async function querySdbList(params) {
//   return request(`/fygl/sdb_list?${stringify(params)}`);
// }

// export async function queryLastZd(params) {
//   return request(`/fygl/lastzd?${stringify(params)}`);
// }
// export async function qrsz(params) {
//   return request(`/fygl/handlezd?${stringify(params)}`);
// }

// export async function queryZdList(params) {
//   return request(`/fygl/zd_list?${stringify(params)}`);
// }

// export async function removeFyglList(params) {
//   const { count = 5, ...restParams } = params;
//   return request(`/fygl/fygl_list/${CONSTS.BUTTON_DELETEFY}?count=${count}`, {
//     method: 'POST',
//     body: {
//       ...restParams,
//     },
//   });
// }

// export async function addFyglList(params) {
//   const { count = 5, ...restParams } = params;
//   return request(`/fygl/fygl_list/${CONSTS.BUTTON_ADDFY}?count=${count}`, {
//     method: 'POST',
//     body: {
//       ...restParams,
//     },
//   });
// }

// export async function updateFyglList(params) {
//   const { count = 5, ...restParams } = params;
//   return request(`/fygl/fygl_list/${CONSTS.BUTTON_EDITFY}?count=${count}`, {
//     method: 'POST',
//     body: {
//       ...restParams,
//     },
//   });
// }

// export async function updateSdbList(params) {
//   return request(`/fygl/sdb_list`, {
//     method: 'POST',
//     body: {
//       ...params,
//     },
//   });
// }

// export async function updateZdList(params) {
//   return request(`/fygl/zd_list`, {
//     method: 'POST',
//     body: {
//       ...params,
//     },
//   });
// }
