+function() {
  yp.test = {
    mock: Mock.mock
  };

  var setMsg = function(data, message) {
    return function(opts) {
      var res = yp.test.mock(data);
      res.errcode = 0;
      res.errmsg = message;
      console.log('ajax请求', opts, res);
      return res;
    }
  };

  var dataOne = {
    'id|+1': 1
  , 'name': '@cname(2)'
  , 'num': /\d{2}/
  , 'str': /\S{5,8}/
  , 'datetime': '@datetime("yyyy-MM-dd HH:mm")'
  , 'phone': /170\d{8}/
  , 'email': '@email'
  , 'url': '@image(50x50)'
  , 'cparagraph': '@cparagraph(2)'
  , 'range': '@range(5, 10)'
  , 'ip': '@ip'
  , 'province': '@province'
  , 'city': '@city(true)'
  , 'county': '@county(true)'
  };
  var dataList = {
    'list|5': [dataOne]
  };
  yp.test.mock(/list_/, setMsg(dataList));
  yp.test.mock(/act_/, setMsg(dataOne, '操作成功'));

  setTimeout(function() {
    if (window.oPageConfig.oTest) {
      $.extend(true, dataOne, window.oPageConfig.oTest.dataOne);
      $.extend(true, dataList, window.oPageConfig.oTest.dataList);
      dataList[window.oPageConfig.oTest.listname] = [dataOne];
    }
  }, 30);
}();