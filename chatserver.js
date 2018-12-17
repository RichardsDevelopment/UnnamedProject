var port = 3000;
var express = require('express');
var app = express();
var http = require('http').Server(app);
var io = require('socket.io').listen(http);
var path = require('path');
var mysql = require('mysql');
var hash = require('js-sha256');

var connection = mysql.createConnection({
	host: 'localhost',
	user: 'root',
	password: '',
	database: 'social'	
});

connection.connect(function(err){
  if (err) throw err;
  // console.log("MYSQL connected!");
});

http.listen(port, function(){
  // console.log('listening on *:3000');
});

app.use(express.static('./styles'));
 
app.get('/', function(req, res){
	res.sendFile(path.join(__dirname + '/index.html'));
});

app.get('/about',function(req,res){
  res.sendFile(path.join(__dirname+'/about.html'));
});

app.get('/pricing',function(req,res){
  res.sendFile(path.join(__dirname+'/pricing.html'));
});

app.get('/contact',function(req,res){
  res.sendFile(path.join(__dirname+'/contact.html'));
});



function checkEmail(email, callback){
    var sql = "SELECT * FROM users WHERE email = ?";
	connection.query(sql, email, function(err, result){
		if (err) throw err;  
		else if(result.length > 0){
			return callback(result);
		}
		else{
			return callback("no_users");
		}
	});  
}

function checkPassword(email, salt, pass, checkPass, callback){
	var length = (salt.length)/2;
	// console.log(length);
	var tempPass = salt.substring(0, length) + checkPass + salt.substring(length);
	// console.log(tempPass);
	var result = hash(tempPass);
	// console.log(result);
	var code;
	
	if(result == pass){
		code = 1;
	}
	else{
		code = 0;
	}
	// console.log(code);
	return callback(code);
}

io.on('connection', function(socket){
	// console.log('a user connected named ' + socket.id);
    // TODO() : every login attempt, update socketid field in table to reflect newest socket
	socket.on('login', function(email, pass){
		var userinfo = "";
	    // console.log("login attempt " + email + " " + pass);
	  
	    checkEmail(email, function(user){
			// console.log('Finished email check on server...');
			if(user == "no_users"){
				// console.log('User email not found!');
				socket.emit('login_result', 0, null);
			}
			else{
				// console.log('User email found!');
				user.forEach(function(row){
					checkPassword(email, row.salt, row.password, pass, function(result){
						// console.log(result);
						if(result == 0){
							socket.emit('login_result', result, null);
						}
						else if(result == 1){
							socket.emit('login_result', result, row);
						}
					});
					// console.log(row.password);
				});
			}
		});
    });
  
  socket.on('disconnect', function(){
	// console.log('user disconnected');
	// TODO() : on logout, set user socketid in table to empty field
  });
});