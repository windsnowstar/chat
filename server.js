

var express = require('express');
var app = express();



var http = require('http').Server(app);
var io = require('socket.io')(http);


/**
 * Global variables
 */
var history = [];
// list of currently connected clients (users)
var users = ["user1","user2"];
var clients = [];


//静态文件
app.use(express.static('static'));


app.get('/index', function(req, res){
    //解决windows下html中文乱码
	res.setHeader('Content-Type','text/html;charset=utf-8');
	
    res.sendFile(__dirname + '/static/html/client2.html');
});




/**
 * HTTP server
 */

http.listen(3001, function(){
  console.log('listening on *:3001');
});


/**
 * socketio server
 */

//io监听socket事件
io.on('connection', function (connection) {
    var self = this;
    var id = connection.id.slice(0, 12);

    console.log((new Date()) + ' Connection from origin ' + connection.id + '.');
    var json = { logicId:"conn_success",users: users };
    connection.json.send(json);
    var userName = false;

    console.log((new Date()) + ' Connection accepted.');

    connection.on('message', function (message) {
        console.log(message);
        if (message.logicId == "login") {
            clients[message.username] = connection; //将用户名与连接对应
            connection.username = message.username;
        }else if(message.logicId == "chat") {//用户发起会话
            //1、查找该用户是否有历史消息
            var toUser = message.to;//会话目标
            var from = message.username;//会话发起人
            if(history[toUser]&&history[toUser][from]){
                var historyMsgs = [];
                for (var i = 0; i < history[toUser][from].length; i++) {
                    historyMsgs.push(history[toUser][from][i]);
                };
                connection.json.send({logicId:"history",historyMsgs:historyMsgs});
            }
            //2、检查目标用户是否在线，若在线，转发用户请求,否则，存为历史会话中
            var objConnect = clients[toUser];
            var chatJson = {logicId:"chat", from: from, time: message.time, msg: message.msg };
                connection.json.send(chatJson);
            if (objConnect) {
                objConnect.json.send(chatJson);
            } else {//存储于历史会话中
                if (!history[from]||!history[from][toUser]) {
                    if (!history[from]) {
                        history[from] = [];
                    }
                    history[from][toUser] = [];
                }
                history[from][toUser].push(chatJson);
            }
        }
    });


      // 用户与服务器第一次握手，服务器传递信息给客户端
    connection.emit('connected', {
      id: id
    });
    // 用户与服务器第二次握手，客户端传递信息给服务器
    connection.on('createUser', function (data) {
      // 用户 userId 作为 session 信息保存在用户客户端
      var userId = data.userId;
      var userName = data.userName;
      var userAvatar = data.userAvatar;
      
        // 广播新用户
        io.emit('broadcast', {
          id: userId,
          name: userName,
          avatar: userAvatar,
          msg: '欢迎 ' + userName + ' 加入群聊！',
          type: "NEW"
        });

      self.onlineUser[userId] = connection || {};
      for(var key in data) {
        self.onlineUser[userId][key] = data[key];
      }
    });

    // 断开连接
    connection.on('forceDisconnect', function(data) {
      var userId = connection.userId;
      var pw = data.pw;
      if(pw && password && pw === password) {
        userId = data.id;
      }
      var user = userId && self.onlineUser[userId];
      if(userId && user && user.userName) {
        io.emit('broadcast', {
          name: "SYSTEM",
          msg: '用户 ' + user.userName + ' 离开群聊',
          type: "LEAVE"
        });
        user.disconnect();
        delete self.onlineUser[userId];
      }
    });




    // user disconnected
    connection.on('disconnect', function (socket) {
        console.log("关闭连接:" + socket);
        delete clients[connection.username];//删除用户的连接


    });

});
