import * as utils from '../utils/utils.js';
// import moment from '../utils/moment.min.js';
// import commServices from 'commServices.js';
const CONSTS = require('../utils/constants.js');

export { handleAfterRemote } from 'commServices.js';

export function queryUser(action, params) {
  utils.showLoading();
  const result = wx.cloud.callFunction({
    name: 'fygl',
    data: {
      action:CONSTS.BUTTON_QUERYUSER,
      method: 'GET',
      data: params,
    },
  });
  return result;
}

export function registerUser(action, params) {
  utils.showLoading();
  const result = wx.cloud.callFunction({
    name: 'fygl',
    data: {
      action: CONSTS.BUTTON_REGISTERUSER,
      method: 'POST',
      data: params,
    },
  });
  return result;
}
