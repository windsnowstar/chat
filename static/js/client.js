
    // for better performance - to avoid searching in DOM
    var content = $('#content');
    var input = $('#input');
    var statusObj = $('#status');
    var userList = $("#list");

    // my color assigned by the server
    var myColor = false;
    // my name sent to the server
    var myName = false;
    var connection = null;
    var currentToUser = null;
    connect();
    window.onbeforeunload = beforeDisConnect;//监听浏览器关闭前的事件
    window.onunload = disConnect;//监听浏览器关闭时

    /**
     * Send mesage when user presses Enter key
     */
    input.keydown(function (e) {
        if (e.keyCode === 13) {
            var msg = $(this).val();
            if (!msg) {
                return;
            }
            if (!myName) {
                myName = msg;//定义名字
                statusObj.text(myName);
                input.val("");

                if (connection) {
                    connection.json.send({ logicId: "login", username: myName });
                }
                return;
            }
            var time = new Date();
            var tmpTime = time.getFullYear() + "-" + ((time.getMonth() < 9 ? "0" : "") + (time.getMonth() + 1)) + "-" + ((time.getDate() < 10 ? "0" : "") + time.getDate()) + " "
                    + ((time.getHours() < 10 ? "0" : "") + time.getHours()) + ":" + ((time.getMinutes() < 10 ? "0" : "") + time.getMinutes()) + ":" + ((time.getSeconds() < 10 ? "0" : "") + time.getSeconds());
            // send the message as an ordinary text
            msg = { "@class": "test.EntityIn", logicId: "chat", username: myName, msg: input.val(),
            to:currentToUser,time:tmpTime};

            //alert(typeof(object));
            connection.json.send(msg);
            $(this).val('');
            // disable the input field to make the user wait until server
            // sends back response

        }
    });



    /**
     * Add message to the chat window
     */
    function addMessage(author, message, dt) {
        content.prepend('<p><span>' + author + '</span> @ '+dt+ ': ' + message + '</p>');
    }

function connect() {
    // open connection
    connection = io.connect('http://localhost:3001', { 'reconnect': false });
    connection.on('connect', function (data) {
        // first we want users to enter their names
        input.removeAttr('disabled');
        statusObj.text('登录:');
        connection.send(1);
    });

    connection.on("error", function (error) {
        // just in there were some problems with conenction...
        content.html($('<p>', {
            text: 'Sorry, but there\'s some problem with your '
                + 'connection or the server is down.'
        }));
    });

    // most important part - incoming messages
    connection.on("message", function (message) {
        var logicId = message.logicId;
        if (logicId == 'conn_success') {//连接成功
            var users = message.users;
            for (var i = 0; i < users.length; i++) {
                userList.append('<a href="#" onclick="chatToSb(this.innerHTML)">'+users[i]+'</a></br>');
            }
        } else if (logicId == "chat") {
            addMessage(message.from,message.msg,message.time);
        }else if(logicId == "history"){
            var historyMsgs = message.historyMsgs;
            for(var i = 0; i < historyMsgs.length; i++){
                addMessage(historyMsgs[i].from,historyMsgs[i].msg,historyMsgs[i].time);
            }
        }

    });
}

function chatToSb(username) {
    currentToUser = username;
}

function disConnect(){
    connection.disconnect();
    //alert("断开连接");

}

function beforeDisConnect() {
    return "确认离开";
}