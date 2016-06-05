/// socket管理
var oConfig = window.oPageConfig;
var oSocketManager = {
  init: function() {
    this.oMap = {};
    this.count_client = 0;
  }
  // 创建一个socket连接
, createOne: function(callback) {
    var self = this;
    setTimeout(function() {
      callback(++self.count_client);
    }, 1);
  }
  // 受到消息
, get: function(name, data) {
    if (this.oMap[name]) {
      if (name.indexOf('Gateway.Login.Req') === 0) {
        data = {
          status: 0
        };
      } else if (name.indexOf('Gateway.Room.Join') === 0) {
        data = {
          type: 0
        , liveStatus: 1
        , tips: ''
        , status: 1
        , roomId: data.roomId
        };
      } else if (name.indexOf('Gateway.Room.Chat') === 0) {
        data = {
          uid: data.uid///
        , toUid: data.toUid
        , type: data.type
        , txt: data.txt
        , nickname: '测试用户'
        , avatar: '1.jpg'
        , level: 2
        , roomId: data.roomId
        };
      }
      this.oMap[name](data, 1);///
    }
  }
  // 发送消息
, send: function(name, data, socketid, callback) {
    this.oMap[name + socketid] = callback;

    /// 模拟
    setTimeout(function() {
      oSocketManager.get(name + socketid, data);///
    }, 1);
  }
};

$(function() {
  oSocketManager.init(oConfig.oSocket);

  // 
  $.sub('tosocket/Gateway/Login/Req', function(e, data) {
    /*setTimeout(function() {
      $.pub('socket/Gateway/Login/Req', {
        status: 0//0 登录成功 , 1 时间错误, 2 签名错误, 3密码错误,4用户已经登录 5,登录信息错误
      });
    }, 200);*/

    setTimeout(function() {
      $.pub('socket/newOrder', {
        roomid: 1
      , roomname: '甜甜的主播1'
      , content: '20条消息/分钟'
      });
    }, 100);
    setTimeout(function() {
      $.pub('socket/newOrder', {
        roomid: 2
      , roomname: '甜甜的主播2'
      , content: '30条消息/分钟'
      });
    }, 300);
    setTimeout(function() {
      $.pub('socket/newOrder', {
        roomid: 3
      , roomname: '甜甜的主播3'
      , content: '40条消息/分钟'
      });
    }, 500);
    /*setTimeout(function() {
      $.pub('socket/newOrder', {
        roomid: 4
      , roomname: '甜甜的主播4'
      , content: '50条消息/分钟'
      });
    }, 1200);
    setTimeout(function() {
      $.pub('socket/newOrder', {
        roomid: 4
      , roomname: '甜甜的主播5'
      , content: '60条消息/分钟'
      });
    }, 2000);*/
  });

  // 
  $.sub('tosocket/Gateway/Room/Join/Req', function(e, data) {
    $.pub('socket/Gateway/Room/Join/Req', {
      roomid: data.roomid///
    , videosrc: '流地址，字符串'
    , picsrc: '截图地址（加上时间戳刷新）'
    , busystate: 1

    , type: 0//0 登录成功, 1 踢出房间, 2 用户还未登录
    , liveStatus: 2//0停播，1正在直播没有流，2正常直播中 -1 禁用直接
    , tips: '进入提示'//有的话显示，没有的话显示默认
    , status: 0//-10禁止进入, －1禁止发言 0普通用户  1 管理员 10 Owner
    , starlight: 1234//星光数
    , roomId: data.roomid///

    /*, oDataAnchor: {
        uid: 99
      , nickname: '主播1'
      , portrait: 'http://dummyimage.com/50x50'
      , msg_count: 20
      , starlight: 20
      }*/
    /*, aDataAdmin: [{
        uid: 1
      , nickname: '机器人A'
      }, {
        uid: 2
      , nickname: '机器人B'
      }, {
        uid: 3
      , nickname: '机器人C'
      }]*/
    /*, aDataUser: [
      {
        nickname: '用户1'
      , uid: 1
      , portrait: 'http://dummyimage.com/50x50'
      , starlight: 21
      }, {
        nickname: '用户2'
      , uid: 2
      , portrait: 'http://dummyimage.com/50x50'
      , starlight: 22
      }, {
        nickname: '用户3'
      , uid: 3
      , portrait: 'http://dummyimage.com/50x50'
      , starlight: 23
      }, {
        nickname: '用户4'
      , uid: 4
      , portrait: 'http://dummyimage.com/50x50'
      , starlight: 24
      }
    ]*/
    });
    // 
    setTimeout(function() {
      /*$.pub('socket/Gateway/Room/ChatList', {
        list: [{
          txt: '测试1'
        , uid: 1
        , nickname: '张三'
        , portrait: 'http://dummyimage.com/50x50'
        , toUid: 1
        , toNickname: 1
        , type: 1
        , level: 1
        , roomId: 1
        }]
      });*/
      $.pub('socket/Gateway/Event/Online/Chg', {
        online: 4321
      , roomId: data.roomid
      });
    }, 200);
    // 
    setTimeout(function() {
      $.pub('socket/Gateway/Event/Starlight/Chg', {
        starlight: 1111
      , roomId: data.roomid
      });
    }, 400);
    // 
    setTimeout(function() {
      $.pub('socket/Gateway/Event/Login', {
        uid: 1
      , nickname: '管理员'
      , roomId: data.roomid
      });
    }, 600);
    // 
    setTimeout(function() {
      $.pub('socket/Gateway/Event/LiveStatus/Chg', {
        liveStatus: fGetRandom(2)
      , roomId: data.roomid
      });
    }, 1000);
    /*if (!window.flag_delRoom) {
      // 
      setTimeout(function() {
        $.pub('socket/delRoom', {
          roomid: 1
        });
      }, 1000);
      flag_delRoom = true;
    }*/
  });

  // 
  setTimeout(function() {
    $.pub('socket/Gateway/Room/ChatList', {
      list: [{
        txt: '测试'
      , uid: 1
      , nickname: '张三'
      , portrait: 'http://dummyimage.com/50x50'
      , toUid: 1
      , toNickname: 1
      , type: 1
      , level: 1
      }]
    , roomId: 1///
    });
  }, 600);
  $.sub('tosocket/Gateway/Room/Chat', function(e, data) {
    var one = vmChatBox.data.oMap[data.uid];///
    $.pub('socket/Gateway/Room/Chat', {
      txt: data.txt
    , uid: data.uid
    , nickname: one.nickname
    , toNickname: data.toNickname
    , toUid: data.toUid
    , type: data.type
    , level: 3

    , roomid: data.roomid
    , roomId: data.roomid
    });
  });

  // 
  $.sub('tosocket/Gateway/Fans/Zan', function(e, data) {
    var one = vmChatBox.data.oMap[data.uid];///
    $.pub('socket/Gateway/Fans/Zan', {
      uid: data.uid
    , nickname: one.nickname
    , level: 3
    , roomId: data.roomid
    });
  });

  // 
  $.sub('tosocket/Rich/Gift/Send', function(e, data) {
    var one = vmChatBox.data.oMap[data.uid];///
    $.pub('socket/Gateway/Gift/Incoming', {
      id: 1 || data.giftid
    , uid: data.uid
    , level: 1
    , portrait: '1'
    , nickname: one.nickname
    , toUid: 1
    , utime: 1
    , roomId: data.roomid
    , combo: data.combo
    , comboId: data.combo

    , roomid: data.roomid
    });
  });
});