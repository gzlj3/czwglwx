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
exports.BUTTON_EXITFY = 10; // 退房
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
exports.BUTTON_SENDSJYZM = 102; // 发送手机验证码
exports.USERTYPE_NONE = '0'; // 用户类型：未注册
exports.USERTYPE_FD = '1'; // 用户类型：房东
exports.USERTYPE_ZK = '2'; // 用户类型：租客
exports.USERTYPE_FDZK = '3'; // 用户类型：房东租客双重身份

//租客操作
exports.BUTTON_ZK_SEELASTZD = 200;  //租客查看帐单

//帐单类型
exports.ZDLX_HTZD = '0';  //合同帐单
exports.ZDLX_YJZD = '1';  //月结帐单
exports.ZDLX_TFZD = '2';  //退房帐单
 
//收租状态
exports.SFSZ_WJQ = '0'; //未结清;
exports.SFSZ_YJQ = '1'; //已结清;
exports.SFSZ_YJZ = '2'; //已结转;
exports.SFSZ_YTF = '3'; //已退房;
exports.getSfszInfo = sfsz => {
  return { '0': '未结清', '1': '已结清','2': '已结转','3': '已退房' }[sfsz];
}

// 异常信息
exports.EXCEPTION = {
  100: '用户未注册',
  101: '用户数据异常',
}
