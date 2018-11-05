// page当前状态
export const PAGE_LIST = 0; // 列表查看状态
export const PAGE_SEEDETAIL = 1; // 详表查看状态
export const PAGE_NEW = 2; // 详表新增状态
export const PAGE_UPDATED = 3; // 详表修改状态
export const getPageStateInfo = pageState => ['', '详细', '新增', '编辑'][pageState];

// 后台处理返回状态
export const REMOTE_SUCCESS = 0; // 处理成功
export const REMOTE_ERROR = 1; // 处理错误

// 按钮点击动作
export const BUTTON_NONE = 0; // 无动作
export const BUTTON_QUERYFY = 1; // 查询房源
export const BUTTON_ADDFY = 2; // 添加房源
export const BUTTON_EDITFY = 3; // 编辑房源
export const BUTTON_DELETEFY = 4; // 删除房源
export const BUTTON_CB = 5; // 抄表
export const BUTTON_MAKEZD = 6; // 创建帐单
export const BUTTON_LASTZD = 7; // 查看/处理最近帐单
export const getButtonActionInfo = buttonAction => {
  try {
    return ['', '查询房源','添加房源', '编辑房源', '删除房源', '抄表', '创建帐单', '查看/处理帐单', '', ''][
      buttonAction
    ];
  } catch (e) {
    return '';
  }
};