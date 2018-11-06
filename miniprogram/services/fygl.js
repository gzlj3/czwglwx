// import { stringify } from 'qs';
// import request from '@/utils/request';
import * as CONSTS from '../utils/constants.js';

export function queryFyglList(params) {
  const result = wx.cloud.callFunction({
    name: 'fygl',
    data: {
      action: CONSTS.BUTTON_QUERYFY,      
    },
  }).then(res=>{
    return res.result;
  });
  // .catch(err=>{
  //   console.log(err);
  //   result = null;
  // })
  return result;
}
export function addFy(params) {
  return wx.cloud.callFunction({
    name: 'fygl',
    data: {
      action: CONSTS.BUTTON_ADDFY,
      data: params,
    },
  });
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
