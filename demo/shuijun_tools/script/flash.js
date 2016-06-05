// flash管理
var oConfig = window.oPageConfig;
var oFlashPlayer = {
  init: function() {
    this.mPlayer = document['mPlayer'];
    if (!this.mPlayer) return false;

    $.sub('toflash/addRoom', function(e, data) {
      data.videosrc = data.steamsrc || 'rtmp:\/\/pull.a8.com\/live\/1465089447836608';
      data.picsrc = data.imagesrc || 'http://attach.bbs.miui.com/forum/201506/20/230025qyoyf9slyvbbsuzm.png.thumb.jpg';
      data.busystate = data.liveStatus || 0;
      data.duration = 30;
      oFlashPlayer.addRoom(data);
    });
    $.sub('toflash/delRoom', function(e, data) {
      oFlashPlayer.delRoom(data);
    });
    $.sub('toflash/updateRoomState', function(e, data) {
      data.busystate = data.liveStatus;///
      oFlashPlayer.updateRoomState(data);
    });

    /*$('body').on('click', '.box-video', function() {
      oFlashPlayer.activeRoom({
        roomid: $(this).index() + 1
      });
    });
    $.sub('flash/activeRoom', function(e, data) {
      $('.box-video').removeClass('active');
      $('.box-video').eq(data.roomid - 1).addClass('active');
    });*/
  }
  // 添加直播房间
, addRoom: function(data) {
    /*$('#box-videolist .child-area').append('<div class="box-video red">主播名字<br>直播流</div>');
    if ($('.box-video').length === 1) {
      $('.box-video').addClass('active');
    }*/
    this.mPlayer.addRoom(JSON.stringify(data));
  }
  // 删除直播房间
, delRoom: function(data) {
    /*$('.box-video').eq(2).remove();*/
    this.mPlayer.delRoom(JSON.stringify(data));
  }
  // 更新房间忙碌状态
, updateRoomState: function(data) {
    /*var oMapColor = {
      '0': 'red'
    , '1': 'yellow'
    , '2': 'green'
    };
    var className = oMapColor[data.busystate];
    $('.box-video').eq(data.roomId - 1).addClass(className);*/
    this.mPlayer.updateRoomState(JSON.stringify(data));
  }
  // 激活当前直播间
, activeRoom: function(data) {
    $.pub('flash/activeRoom', data);
  }
};

// 激活某个房间
function activeRoom(data) {
  oFlashPlayer.activeRoom(JSON.parse(data));
};

$(function() {
  oFlashPlayer.init(oConfig.oFlash);
});