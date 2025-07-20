exports.Roles = [
  { value: 'Admin', name: 'مسؤل'},
  { value: 'Manager', name: 'مدير الكوفي'},
  { value: 'AccountantManager', name: 'مدير مالي'},
  { value: 'Accountant', name: 'محاسب'},
  { value: 'Cashier', name: 'كاشير'},
  { value: 'StoreMan', name:'رجل المخزن'},
  { value: 'BranchStoreMan', name:'رجل المخزن للفرع'}
];

// Used for adding users
exports.ADD_USER_ROLES = [
  { value: 'Manager', name: ' مدير الكوفي'},
  { value: 'AccountantManager', name: 'مدير مالي'},
  { value: 'Accountant', name: 'محاسب'},
  { value: 'StoreMan', name:'رجل المخزن'},
  { value: 'BranchAccountant', name: ' محاسب فرع'},
  { value: 'Cashier', name: 'كاشير'},
  { value: 'Invoicer', name:' موظف فواتير'},
  { value: 'BranchStoreMan', name:'رجل المخزن للفرع'}
];

exports.EMPLOYEES_STATUS = [
  { value: 'working', name: 'يعمل'},
  { value: 'holiday', name: 'في إجازة'},
  { value: 'notWorking', name: 'انتهت خدمته'},
];

exports.WARRANTY_STATUS = [
  { value: '0', name: 'الكل'},
  { value: '1', name: ' تحتوي على ضمان'},
  { value: '2', name: 'لا تحتوي على ضمان'},
];

exports.TAX_STATUS = [
  { value: '0', name: 'الكل'},
  { value: '1', name: 'مدفوعة الضريبة'},
  { value: '2', name: 'غير مدفوعة الضريبة '},
];

exports.PAGE_SIZE = 20;