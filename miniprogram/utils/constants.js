// 后台处理返回状态
exports.REMOTE_SUCCESS = 0; // 处理成功
exports.REMOTE_ERROR = 1; // 处理错误

// 按钮点击动作(云函数端当作请求的action，和前端按钮点击动作不一定完全匹配)
exports.BUTTON_NONE = 0; // 无动作
exports.BUTTON_QUERYFY = 1; // 查询房源 
exports.BUTTON_ADDFY = 2; // 添加房源
exports.BUTTON_EDITFY = 3; // 编辑房源
exports.BUTTON_DELETEFY = 4; // 删除房源
exports.BUTTON_CB = 5; // 抄表
exports.BUTTON_MAKEZD = 6; // 创建帐单
exports.BUTTON_LASTZD = 7; // 查看/处理最近帐单
exports.BUTTON_QUERYSDB = 8; // 查询水电表
exports.BUTTON_QUERYMAKEZD = 9; // 查询创建帐单列表
exports.getButtonActionInfo = buttonAction => {
  try {
    return ['', '查询房源', '添加房源', '编辑房源', '删除房源', '抄表', '创建帐单', '查看/处理帐单', '', ''][
      buttonAction
    ];
  } catch (e) {
    return '';
  }
};

//用户管理 
exports.BUTTON_QUERYUSER = 100; // 查询用户数据
exports.BUTTON_REGISTERUSER = 101; // 注册用户
exports.USERTYPE_NONE = '0'; // 用户类型：未注册
exports.USERTYPE_FD = '1'; // 用户类型：房东
exports.USERTYPE_ZK = '2'; // 用户类型：租客


//帐单类型
exports.ZDLX_HTZD = '0';  //合同帐单
exports.ZDLX_YJZD = '1';  //月结帐单
exports.ZDLX_TFZD = '2';  //退房帐单
 

// 后台处理返回状态
// export const REMOTE_SUCCESS = 0; // 处理成功
// export const REMOTE_ERROR = 1; // 处理错误

// // 按钮点击动作
// export const BUTTON_NONE = 0; // 无动作
// export const BUTTON_QUERYFY = 1; // 查询房源
// export const BUTTON_ADDFY = 2; // 添加房源
// export const BUTTON_EDITFY = 3; // 编辑房源
// export const BUTTON_DELETEFY = 4; // 删除房源
// export const BUTTON_CB = 5; // 抄表
// export const BUTTON_MAKEZD = 6; // 创建帐单
// export const BUTTON_LASTZD = 7; // 查看/处理最近帐单
// export const BUTTON_QUERYSDB = 8; // 查询水电表
// export const BUTTON_QUERYMAKEZD = 9; // 查询创建帐单列表
// export const getButtonActionInfo = buttonAction => {
//   try {
//     return ['', '查询房源','添加房源', '编辑房源', '删除房源', '抄表', '创建帐单', '查看/处理帐单', '', ''][
//       buttonAction
//     ];
//   } catch (e) {
//     return '';
//   }
// };

// export const ZDLX_HTZD = '0';  //合同帐单
// export const ZDLX_YJZD = '1';  //月结帐单
// export const ZDLX_TFZD = '2';  //退房帐单
