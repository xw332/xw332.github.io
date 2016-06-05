/* ===================================================
 * v20160605
 * ===================================================
 * Copyright xw
 *
 * 操作员工具
 * =================================================== */

var yp = {};
yp.format = function(str, data) {
  if (!str) {
    throw new Error('yp.format字符串参数不能为空');
    return '';
  }
  var re = this.re || /{([\s\S]+?)}/g
  if (typeof data !== 'object') data = [].slice.call(arguments, 1);
  return str.replace(re, function($0, $1) {
    return data[$1] != null ? data[$1] : '';
  });
};
yp.ready = $;
yp.ajax = $.ajax;
/* 全局事件管理event */
+function() {
  var o = $({});
  $.each({
    on: 'sub'
  , off: 'unsub'
  , trigger: 'pub'
  }, function(key, val) {
    $[val] = function() {
      o[key].apply(o, arguments);
    };
  });
}();

// 生成随机数
function fGetRandom(min, max) {
  if (max == null) {
    max = min;
    min = 0;
  }
  var range = max - min;
  return (min + Math.round(Math.random() * range));
};

// 滚动列表
var oSwiper = {
  init: function() {
    this._obj = new Swiper('.swiper-container', {
      slidesPerView: 8
    });
    this.inited = true;
    return this._obj;
  }
, update: function(obj) {
    (obj || this._obj).update();
  }
, render: function() {
    if (!this.inited) {
      this.init();
    } else {
      this.update();
    }
  }
};
// 表情包
var oEmoji = {
  init: function() {
    this._emoji = new EmojiConvertor();
    this._emoji.img_sets = {
      'apple': {
        'sheet': '../assets/images/sheet_apple_64.png'
      }
    };
    this._emoji.use_sheet = true;
    this._emoji.init_env();
  }
, format: function(str) {
    return this._emoji.replace_colons(str);
  }
};
oEmoji.init();
// 提示框
var oNotify = {
  show: function(options) {
    return new PNotify(options);
  }
};

yp.ready(function() {
  var oConfig = window.oPageConfig;

  $(document).on('click.bs.modal.data-api', '[data-toggle="modal"]', function(e) {
    var $this   = $(this);
    var href    = $this.attr('href');
    var $target = $($this.attr('data-target') || href);

    if ($this.is('a')) e.preventDefault();

    $target.addClass('active');
  });
  $('.js-close').on('click', function() {
    $(this).closest('.js-pop').removeClass('active');
    $('body').off('click.ibox');
  });

  /* 登录 */
  yp.storage = {};
  yp.storage.set = function(key, value) {
    if (arguments.length === 2) {
      var v = value;
      if (typeof v == 'object') {
        v = JSON.stringify(v);
        v = 'obj-' + v;
      } else {
        v = 'str-' + v;
      }
      localStorage.setItem(key, v);
    }
  };
  yp.storage.get = function(key) {
    var v = localStorage.getItem(key);
    if (!v) {return;}
    if (v.indexOf('obj-') === 0) {
      v = v.slice(4);
      return JSON.parse(v);
    } else if (v.indexOf('str-') === 0) {
      return v.slice(4);
    }
  };
  yp.storage.remove = function(key) {
    if (key) {
      localStorage.removeItem(key);
    }
  };
  yp.storage.clear = function() {
    localStorage.clear();
  };

  // 登录
  var fLoginDone = function(oLoginData) {
    // 创建socket
    /*oSocketManager.createOne(function() {
      oSocketManager.send('Gateway.Login.Req', oOper, function(data) {
        ///
      });
    });*/
    $.pub('tosocket/Gateway/Login/Req', oLoginData);
  };
  var oLoginData = yp.storage.get('loginData');
  if (!oLoginData) {
    var vmLogin = new Regular({
      template: '#t_login'
    , data: {
        isShow: true
      , uname: ''
      , pwd: ''
      }
    , submit: function() {
        if (!this.data.uname || !this.data.pwd) {
          return false;
        }
        yp.ajax(oConfig.oUrl['sLogin'], {
          dataType: 'json'
        , data: {
            uname: this.data.uname
          , pwd: this.data.pwd
          }
        })
        .done(function(msg) {
          if (!msg.errcode) {
            oLoginData = msg;
            yp.storage.set('loginData', oLoginData);
            fLoginDone(oLoginData);
            alert('登录成功！');
            vmLogin.destroy();
          } else {
            alert(msg.errmsg);
          }
        });
      }
    }).$inject('#js-box-login');
  } else {
    fLoginDone(oLoginData);
  }

  /* 房间信息区 */
  var vmAnchor = new Regular({
    template: '#t_anchor'
  , data: {}
  , loadData: function(data) {
      this.data = data;
      this.$update();
    }
  }).$inject('#js-box-anchor');
  // 更新房间在线数
  $.sub('page/online/Chg', function(e, data) {
    if (data.roomId == oConfig.roomid) {
      vmAnchor.data.online = data.online;
      vmAnchor.$update();
    }
  });
  // 更新房间星光
  $.sub('page/starlight/Chg', function(e, data) {
    if (data.roomId == oConfig.roomid) {
      vmAnchor.data.starlight = data.starlight;
      vmAnchor.$update();
    }
  });

  /* 观众区 */
  var vmUserlist = new Regular({
    template: '#t_userlist'
  , data: {
      list: []
    , oMap: {}
    }
  , loadData: function(data) {
      this.data.list = data;
      $.each(data, function(i, one) {
        vmUserlist.data.oMap[one.uid] = one;
      });///
      this.$update();
      oSwiper.render();
    }
  , showCard: function(el) {
      vmUserCard.showCard(el);
    }
  }).$inject('#js-list-user');

  var vmUserCard = new Regular({
    template: '#t_usercard'
  , data: {}
  , showCard: function(el) {
      this.data = el;
      this.$update();
    }
  }).$inject('#js-box-usercard');

  /* 聊天记录区 */
  Regular.filter('msgformat', function(val) {
    return yp.format.call({
      re: /(\[[\s\S]+?\])/g
    }, val, oConfig.oMapEmot);
  });
  var vmMsglist = new Regular({
    template: '#t_msglist'
  , data: []
  , loadData: function(data) {
      this.data = [];
      this.add(data);///
    }
  , cName_msgtype: function(data) {
      var className = 'chat';
      if (data._type_msg === 'join') {
        className = 'join';
      } else if (data._type_msg === 'light') {
        className = 'light';
      } else if (data._type_msg === 'paychat') {
        className = 'paychat';
      } else if (data._type_msg === 'gift') {
        className = 'gift';
      }
      return className;
    }
  , showCard: function(el) {
      /*var one = vmUserlist.data.oMap[el.uid];
      vmUserCard.showCard(one);*/
    }
  , add: function(list) {
      this.data = this.data.concat(list);
      this.$update();
      $('#js-box-msg').scrollTop(9999);///
    }
  }).$inject('#js-list-msg');
  $.sub('page/getmsg', function(e, data) {
    oConfig.oRoomList[data.roomId].aMsglist = oConfig.oRoomList[data.roomId].aMsglist.concat(data);
    if (data.roomId == oConfig.roomid) {
      vmMsglist.add(data);
    }
  });
  $.sub('page/getmsg/replace', function(e, data) {
    oConfig.oRoomList[data.roomId].aMsglist = data.list;
    if (data.roomId == oConfig.roomid) {
      vmMsglist.loadData(data.list);
    }
  });

  /* 聊天表单区 */
  Regular.event('enter', function(element, fire) {
    Regular.dom.on(element, 'keypress', function(ev) {
      if (ev.which === 13) {
        fire(ev);
        ev.preventDefault();
      }
    });
  });
  // 随机不重复的新号
  function fNoSameUid(uid) {
    var index = fGetRandom(vmChatBox.data.userlist.length - 1);
    var uid_new = vmChatBox.data.userlist[index].uid;
    if (uid_new == uid) {
      return fNoSameUid(uid);
    }
    return uid_new;
  };
  // 表情组件
  oConfig.oMapEmot = {};
  $.each(oConfig.oEmot.sys, function(i, one) {
    oConfig.oMapEmot[one.key] = yp.format('<img src="{0}">', one.src);
  });
  Regular.extend({
    template: '#t_face'
  , name: 'facebox'
  , data: oConfig.oEmot
  , select: function(el) {
      this.$emit('select', el);
    }
  });
  var oComponentGift = Regular.extend({
    template: '#t_gift'
  , name: 'giftbox'
  , data: {
      giftlist: []
    , giftid: -1///
    , combo: 1
    }
  , loadData: function(data) {
      this.data.giftlist = data;
      if (data.length) this.data.giftid = data[0].giftid;///
      this.$update();
    }
  , submit: function() {
      this.$emit('select', this.data);
      this.data.combo = 1;
    }
  });
  var vmChatBox = new Regular({
    template: '#t_chatbox'
  , data: {
      userlist: []
    , oMap: {}
    , uid: -1
    , islock: false
    , txt: ''
    , issp: false
    , isShowFace: false
    , isShowGift: false
    }
  , events: {
      '$init': function() {
        this.vmGift = new oComponentGift({
          data: {
            giftlist: []
          , giftid: -1///
          , combo: 1
          }
        });
        this.vmGift.$on('select', function(data) {
          $.pub('page/sendgift', {
            giftid: data.giftid
          , combo: data.combo
          });
          vmChatBox.hideGift();
        });
      }
    }
  , loadData: function(data) {
      this.data.userlist = data;///
      if (data.length) this.data.uid = data[0].uid;///
      $.each(data, function(i, one) {
        vmChatBox.data.oMap[one.uid] = one;
      });
      this.$update();
    }
  , addEmot: function(el) {
      this.data.txt += el.key;
      this.hideFace();
      this.$refs.txt.focus();
    }
  , hideFace: function() {
      this.data.isShowFace = false;
      this.$update();///
      $('body').off('click.ibox');///
    }
  , hideGift: function() {
      this.data.isShowGift = false;
      this.vmGift.$inject(false);
      $('body').off('click.ibox');
    }
  , resetMsg: function() {
      var data = this.data;
      data.txt = '';
      ///data.issp = false;
    }
  , sendMsg: function() {
      var data = this.data;
      var val = oEmoji.format(data.txt);
      var type = vmChatBox.data.issp ? 1 : 0;

      if (val) {
        $.pub('page/sendmsg', {
          txt: val
        , type: type
        });
        this.resetMsg();
      }
    }
  , light: function() {
      $.pub('page/sendlight', {
        uid: this.data.uid
      });
    }
  , loadQK: function() {
      this.data.txt = this.data.txt_qk;
      this.data.txt_qk = '快捷语';
    }
  }).$inject('#js-box-chat');
  window.vmChatBox = vmChatBox;///
  // 消息发送结束，切换账号
  $.sub('page/sendmsg', function() {
    /*if (!vmChatBox.data.islock) {
      vmChatBox.data.uid = fNoSameUid(vmChatBox.data.uid);///
      vmChatBox.$update();
    }*/
  });
  // 表情按钮
  $('#js-btn-face').on('click', function() {
    if (!vmChatBox.data.isShowFace) {
      setTimeout(function() {
        $('body').off('click.ibox').on('click.ibox', function(e) {
          if (!$(e.target).closest('.js-pop').length) {
            vmChatBox.hideFace();
          }
        });
      }, 100);
    }
    vmChatBox.data.isShowFace = !vmChatBox.data.isShowFace;///
    vmChatBox.$update();
  });
  // 礼物
  $('#js-btn-gift').on('click', function() {
    if (!vmChatBox.data.isShowGift) {
      vmChatBox.vmGift.loadData(oConfig.oRoomList[oConfig.roomid].oGiftList);
      vmChatBox.vmGift.$inject('#js-box-msgsend', 'before');
      setTimeout(function() {
        $('body').off('click.ibox').on('click.ibox', function(e) {
          if (!$(e.target).closest('.js-pop').length) {
            vmChatBox.hideGift();
          }
        });
      }, 100);
    }
    vmChatBox.data.isShowGift = !vmChatBox.data.isShowGift;///
  });

  // 获取房间数据
  function fLoadRoomInfo(roomid) {
    var oRoom = oConfig.oRoomList[roomid];
    if (!oRoom) {
      oRoom = oConfig.oRoomList[roomid] = {
        oInfo: null
      , oGiftList: null
      , aMsglist: []
      , aRobotList: []
      , oDfdList: {}
      };
      oRoom.oDfdList['info'] = yp.ajax(oConfig.oUrl.sRoomInfo, {
        dataType: 'json'
      , data: {
          roomid: roomid
        }
      })
      .done(function(msg) {
        msg.roomid = roomid;///msg.id
        oRoom.oInfo = msg;///
        $.pub('toflash/addRoom', msg);///
      });
      oRoom.oDfdList['robot'] = yp.ajax(oConfig.oUrl.sRoomRobotlist, {
        dataType: 'json'
      , data: {
          roomid: roomid
        }
      })
      .done(function(msg) {
        msg.list.unshift({
          uid: 0
        , nickname: '随机账号'
        });
        oRoom.aRobotList = msg.list;
      });
      oRoom.oDfdList['gift'] = yp.ajax(oConfig.oUrl.sRoomGiftlist, {
        dataType: 'json'
      , data: {
          roomid: roomid
        }
      })
      .done(function(msg) {
        oRoom.oGiftList = msg.list;
      });
    }
    oRoom.oDfdList['user'] = yp.ajax(oConfig.oUrl.sRoomUserlist, {
      dataType: 'json'
    , data: {
        roomid: roomid
      }
    })
    .done(function(msg) {
      oRoom.aUserList = msg.list;
    });
    return oRoom;
  };
  // 激活房间
  function fJoinRoom(roomid) {
    vmAnchor.loadData({});
    vmUserlist.loadData([]);
    vmChatBox.loadData([]);
    if (roomid) {
      var oRoom = fLoadRoomInfo(roomid);///
      oRoom.oDfdList['info']
      .done(function() {
        vmAnchor.loadData(oRoom.oInfo);
      });
      oRoom.oDfdList['user']
      .done(function() {
        vmUserlist.loadData(oRoom.aUserList);
      });
      oRoom.oDfdList['robot']
      .done(function() {
        vmChatBox.loadData(oRoom.aRobotList);
      });
      vmChatBox.data.txt = '';
      vmChatBox.$update();
      vmChatBox.$refs.txt.focus();
      vmMsglist.loadData(oRoom.aMsglist);
    } else {
      vmMsglist.loadData([]);
      oConfig.oRoomList[oConfig.roomid] = null;
    }
    oConfig.roomid = roomid;
  };
  // 登录
  $.sub('socket/Gateway/Login/Req', function(e, data) {
    if (data.status == 0) {
      ///
    }
  });
  // 进房间
  $.sub('socket/Gateway/Room/Join/Req', function(e, data) {
    if (data.status == 0) {
      ///添加房间
    } else {
      alert('接单失败，订单已失效');
    }
  });
  // 收到聊天
  $.sub('socket/Gateway/Room/ChatList', function(e, data) {
    $.each(data.list, function(i, one) {
      one._type_msg = 'chat';///
      if (one.type == 1) {
        one._type_msg = 'paychat';///
        one.txt = '【弹幕】' + one.txt;
      }
    });
    $.pub('page/getmsg/replace', data);
  });
  $.sub('socket/Gateway/Room/Chat', function(e, data) {
    data._type_msg = 'chat';///
    if (data.type == 1) {
      data._type_msg = 'paychat';///
      data.txt = '【弹幕】' + data.txt;
    }
    $.pub('page/getmsg', data);
  });
  // 收到礼物
  $.sub('socket/Gateway/Gift/Incoming', function(e, data) {
    var oMapGift = oConfig.oRoomList[data.roomid].oGiftList;///
    if (oMapGift) {
      var name = oMapGift[data.id].giftname;///
      data.txt = yp.format('送了{0}个{1}', data.combo, name);
      data._type_msg = 'gift';///
      data.txt = '【礼物】' + data.txt;
      $.pub('page/getmsg', data);
    }
  });
  // 点亮
  $.sub('socket/Gateway/Fans/Zan', function(e, data) {
    data.txt = '点亮成功！';
    data._type_msg = 'light';///
    $.pub('page/getmsg', data);
  });
  // 更新在线
  $.sub('socket/Gateway/Event/Online/Chg', function(e, data) {
    $.pub('page/online/Chg', data);
  });
  // 更新星光
  $.sub('socket/Gateway/Event/Starlight/Chg', function(e, data) {
    $.pub('page/starlight/Chg', data);
  });
  // 更新直播间状态
  $.sub('socket/Gateway/Event/LiveStatus/Chg', function(e, data) {
    $.pub('toflash/updateRoomState', data);
  });
  // 某人进入房间
  $.sub('socket/Gateway/Event/Login', function(e, data) {
    data.txt = '进了直播间';
    data._type_msg = 'join';///
    $.pub('page/getmsg', data);
  });
  // 房间停播
  $.sub('socket/delRoom', function(e, data) {
    fJoinRoom(null);
    $.pub('toflash/delRoom', data);
  });
  // 收到新订单
  $.sub('socket/newOrder', function(e, data) {
    var nRoomLimit = 3;///
    if (oConfig.nRoomCount < nRoomLimit) {
      $.pub('tosocket/Gateway/Room/Join/Req', {
        roomid: data.roomid
      });
      ++oConfig.nRoomCount;
      fLoadRoomInfo(data.roomid);
    } else {
      var sHtml = `<div>收到一个主播订单：{roomname}</div>
      <div>要求：{content}</div>
      <div><button type="button" class="btn-getOrder">抢单</button><button type="button" class="btn-noOrder">忽略</button></div>`;

      sHtml = yp.format(sHtml, data);
      oNotify.show({
        title: '订单通知'
      , text: sHtml
      , hide: false
      , after_init: function(notice) {
          notice.elem.data('orderinfo', data);
          notice.elem.on('click', '.btn-getOrder', function() {
            $.pub('tosocket/Gateway/Room/Join/Req', {
              roomid: data.roomid
            });
            ++oConfig.nRoomCount;
            fLoadRoomInfo(data.roomid);
            notice.remove();
          });
          notice.elem.on('click', '.btn-noOrder', function() {
            notice.remove();
          });
        }
      });
    }
  });
  // 发送消息
  $.sub('page/sendmsg', function(e, data) {
    data.roomid = oConfig.roomid;
    data.uid = +vmChatBox.data.uid || fNoSameUid(0);
    $.pub('tosocket/Gateway/Room/Chat', data);///
  });
  // 送礼物
  $.sub('page/sendgift', function(e, data) {
    data.roomid = oConfig.roomid;
    data.uid = +vmChatBox.data.uid || fNoSameUid(0);
    $.pub('tosocket/Rich/Gift/Send', data);///
  });
  // 点赞
  $.sub('page/sendlight', function(e, data) {
    data.roomid = oConfig.roomid;
    data.uid = +vmChatBox.data.uid || fNoSameUid(0);
    $.pub('tosocket/Gateway/Fans/Zan', data);
  });
  // 激活房间
  $.sub('flash/activeRoom', function(e, data) {
    /*var data_sys = {};
    data_sys.roomId = oConfig.roomid;
    data_sys.txt = new Date().toLocaleString();
    data_sys._type_msg = 'join';///
    data_sys.nickname = '上次离开时间';
    $.pub('page/getmsg', data_sys);*/

    fJoinRoom(data.roomid);
  });
});