/***
 * @author xw332
 * @date 2011-7-1
 * 基于Node.js的游戏gridcolor v1.1
 */

var fs = require("fs"),
	http = require("http"),
	url = require("url"),
	path = require("path"),
	util = require('util'),
	Buffer = require('buffer').Buffer,
	mime = require("./mime").mime;

//www根目录
var root = __dirname,
	host = "127.0.0.1",
	port = "332";

if(!path.existsSync(root)) {
	util.error(root + "文件夹不存在，请重新制定根文件夹！");
	process.exit();
}

//显示文件夹下面的文件
function listDirectory(parentDirectory, req, res) {
	fs.readdir(parentDirectory, function(error, files) {
		var body = formatBody(parentDirectory, files);
		res.writeHead(200, {
			"Content-Type": "text/html;charset=utf-8",
			"Content-Length": Buffer.byteLength(body, 'utf8'),
			"Server": "NodeJs(" + process.version + ")"
		});
		res.write(body);
		res.end();
	});
}

//显示文件内容
function showFile(filename, req, res) {
	fs.readFile(filename, 'binary', function(err, file) {
		if(err) {
            res.writeHead(500, {"Content-Type": "text/plain"});
            res.write(err + "\n");
            res.end();
            return;
        }
		var contentType = mime.lookupExtension(path.extname(filename));
		res.writeHead(200);
		//res.writeHead(200, {
		//	"Content-Type": contentType,
		//	"Content-Length": Buffer.byteLength(file, 'binary'),
		//	"Server":"NodeJs(" + process.version + ")"
		//});
		res.write(file, "binary");
		res.end();
	});
}

//在Web页面上显示文件列表，格式为<ul><li></li><li></li></ul>
function formatBody(parent, files) {
	var res = [],
		length = files.length;
	res.push("<!doctype html>");
	res.push("<html>");
	res.push("<head>");
	res.push("<meta http-equiv='Content-Type' content='text/html;charset=utf-8'></meta>")
	res.push("<title>Node.js文件服务器</title>");
	res.push("</head>");
	res.push("<body width='100%'>");
	res.push("<ul>")
	files.forEach(function(val, index) {
		var stat = fs.statSync(path.join(parent, val));
		val = path.basename(val);
		if(stat.isDirectory(val)) {
			val += "/";
		}
		res.push("<li><a href='" + val + "'>" + val + "</a></li>");
	});
	res.push("</ul>");
	res.push("<div style='position:relative;width:98%;bottom:5px;height:25px;background:gray'>");
	res.push("<div style='margin:0 auto;height:100%;line-height:25px;text-align:center'>Powered By Node.js</div>");
	res.push("</div>")
	res.push("</body>");
	return res.join("");
}

//在Web页面上显示文件列表，格式为<ul><li></li><li></li></ul>
function formatBodyToJSON(parent, files) {
	var res = [];
	files.forEach(function(val, index) {
		var stat = fs.statSync(path.join(parent, val));
		val = path.basename(val);
		if(stat.isDirectory(val)) {
			val += "/";
		}
		res.push("{'file':'" + val + "', 'link':'" + val + "'}");
	});
	return '[' + res.join(",") + ']';
}

//如果文件找不到，显示404错误
function write404(req, res) {
	var body = "文件不存在:-(";
	res.writeHead(404, {
		"Content-Type": "text/html;charset=utf-8",
		"Content-Length": Buffer.byteLength(body, 'utf8'),
		"Server": "NodeJs(" + process.version + ")"
	});
	res.write(body);
	res.end();
}

//读取文件
function load_static_file(uri, response) {
	var filename = path.join(process.cwd(), uri);
	path.exists(filename, function(exists) {
		if(!exists) {
			response.writeHead(404, {"Content-Type": "text/plain"});
			response.write("404 Not Found\n");
			response.end();
			return;
		}

		fs.readFile(filename, "binary", function(err, file) {
			if(err) {
				response.writeHead(500, {"Content-Type": "text/plain"});
				response.write(err + "\n");
				response.end();
				return;
			}

			response.writeHead(200);
			response.write(file, "binary");
			response.end();
		});
	});
}

//JSON转换为String
function jsonToString(obj){
    switch(typeof(obj)){
        case 'string':
            return '"' + obj.replace(/(["\\])/g, '\\$1') + '"';
        case 'array':
            return '[' + obj.map(jsonToString).join(',') + ']';
        case 'object':
            if(obj instanceof Array){
                var strArr = [];
                var len = obj.length;
                for(var i=0; i<len; i++){
                    strArr.push(jsonToString(obj[i]));
                }
                return '[' + strArr.join(',') + ']';
            } else if(obj==null){
                return 'null';
            } else{
                var string = [];
                for (var property in obj) string.push(jsonToString(property) + ':' + jsonToString(obj[property]));
                return '{' + string.join(',') + '}';
            }
        case 'number':
            return obj;
        case false:
            return obj;
    }
}

//在数组中获取指定值的元素索引
var getIndexByValue = function(arr, val) {
    var index = -1;
    for (var i = 0; i < arr.length; i++) {
        if (arr[i] == val) {
            index = i;
            break;
        }
    }
    return index;
}


var roomList = {
        list: []
    },
    msgList = [];

//创建服务器
http.createServer(function(req, res) {
	//将url地址的中的%20替换为空格，不然Node.js找不到文件
	var pathname = url.parse(req.url).pathname.replace(/%20/g, ' '),
		re = /(%[0-9A-Fa-f]{2}){3}/g;
	//能够正确显示中文，将三字节的字符转换为utf-8编码
	pathname = pathname.replace(re, function(word) {
		var buffer = new Buffer(3),
			array = word.split('%');
		array.splice(0,1);
		array.forEach(function(val, index) {
			buffer[index] = parseInt('0x' + val, 16);
		});
		return buffer.toString('utf8');
	});
	///操作说明：getCid、create、join、ready、start、set、get、over、out///正则式
	var query = url.parse(req.url, 1).query;
	if (pathname == '/games/gridcolor/getCid') {
        res.writeHead(200);
        var cid = msgList.length || 1;
        msgList[cid] = {};
        msgList[cid].step = [];
        res.end(cid.toString());
	} else if (pathname == '/games/gridcolor/getRoomList') {
        res.writeHead(200);
        var Result = [];
        if (query) {///
            var mode = query['mode'];
            switch(mode) {///全部房间、空闲房间、好友房间、搜索房间
                case 0:
                default:
                    ///Result = roomList.list;
                case 1:
                    var list = roomList.list;
                    for (var i in list) {
                        if (list[i].list && list[i].list.length === 1) {
                            Result.push(i);
                        }
                    }
            }
        }
        res.end(jsonToString(Result));
	} else if (pathname == '/games/gridcolor/create') {
        res.writeHead(200);
        var cid = query['cid'];
        if (cid && !roomList.list[cid]) {
            roomList.list[cid] = {};
            roomList.list[cid].isPlaying = 0;
            roomList.list[cid].list = [cid];///
            msgList[cid].room = cid;
            ///开始超时检测，轮询房间内客户端状态
            res.end('1');
        }
        res.end('0');///
	} else if (pathname == '/games/gridcolor/join') {
        res.writeHead(200);
        var cid = query['cid'],
            cid_r = query['cid_r'];
        if (cid && cid_r && roomList.list[cid].isPlaying == 0) {
            if (!msgList[cid_r].room) {///
                roomList.list[cid].list.push(cid_r);
                msgList[cid_r].room = cid;
                res.end('1');
            }
        }
        res.end('0');///
	} else if (pathname == '/games/gridcolor/start') {
        res.writeHead(200);
        var cid = query['cid'];
        if (cid && roomList.list[cid].isPlaying == 0 && roomList.list[cid].list.length > 1) {
            for (var i in roomList.list[cid].list) {
                ///检查是否所有成员的状态都为准备完毕
                var player = roomList.list[cid].list[i];
                msgList[player].step = [];
                msgList[player].isPlaying = 1;
            }
            roomList.list[cid].isPlaying = 1;
            res.end('1');
        }
        res.end('0');///
	} else if (pathname == '/games/gridcolor/out') {
        res.writeHead(200);
        var cid = query['cid'];
        if (cid) {///事务流程需要再造
            var room = msgList[cid].room;
            //修改所有用户状态
            for (var i in roomList.list[room].list) {
                var player = roomList.list[room].list[i];
                msgList[player].isPlaying = 0;
                msgList[player].step = [];
                if (cid == roomList.list[room].list[0]) {
                    msgList[player].room = null;
                }
            }
            if (cid == roomList.list[room].list[0]) {
                //删除房间
                delete roomList.list[room];///
            } else {
                roomList.list[room].isPlaying = 0;
                //删除成员
                var index = getIndexByValue(roomList.list[room].list, cid);
                roomList.list[room].list.splice(index, 1);
                msgList[cid].room = null;
            }
            res.end('1');
        }
        res.end('0');///
	} else if (pathname == '/games/gridcolor/set') {
        res.writeHead(200);
        var cid = query['cid'];
        if (cid) {
            var room = msgList[cid].room;
            if (roomList.list[room].isPlaying) {//检查房间状态
                for (var i in roomList.list[room].list) {
                    var player = roomList.list[room].list[i];
                    if (player != cid) {///
                        msgList[player].step.push(query);
                    }
                }
                res.end('1');
            }
        }
        res.end('0');///
	} else if (pathname == '/games/gridcolor/get') {///超时检测
        res.writeHead(200);
        var cid = query['cid'];
        if (cid) {
            res.end(jsonToString(msgList[cid].step));
            msgList[cid].step = [];///增加删除条件
        }
        res.end('0');///
	} else if (pathname == '/games/gridcolor/over') {///超时检测
        res.writeHead(200);
        ///判断游戏是否进行中
        var cid = query['cid'];
        if (cid) {
            var room = msgList[cid].room;
            if (roomList.list[room].isPlaying) {//检查房间状态
                //修改所有用户状态
                for (var i in roomList.list[room].list) {
                    var player = roomList.list[room].list[i];
                    msgList[player].isPlaying = 0;
                }
                roomList.list[room].isPlaying = 0;
                res.end('1');
            }
        }
        res.end('0');///
	} else if(pathname == '/') {
		listDirectory(root, req, res);
	} else {
		filename = path.join(root, pathname);
		path.exists(filename, function(exists) {
			if(!exists) {
				util.error('找不到文件' + filename);
				write404(req, res);
			} else {
				//文件属性判断
				fs.stat(filename, function(err, stat) {
					if(stat.isFile()){
						showFile(filename, req, res);
					} else if(stat.isDirectory()) {
						listDirectory(filename, req, res);
					}
				});
			}
		});
	}
}).listen(port, host);

util.debug("服务器开始运行 http://" + host + ":" + port);