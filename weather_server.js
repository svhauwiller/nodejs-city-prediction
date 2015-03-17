var fs = require('fs');
var http = require('http');
var https = require('https');
var url = require('url');
var express = require('express');
var bodyParser = require('body-parser');
var basicAuth = require('basic-auth-connect');
var MongoClient = require('mongodb').MongoClient;

var root_dir = "html/";
var app = express();

var options = {
	host: '127.0.0.1',
	key: fs.readFileSync('ssl/server.key'),
	cert: fs.readFileSync('ssl/server.crt')
};

var auth = basicAuth(function(user, pass){
	return((user == 'cs360') && (pass == 'test'));
});

http.createServer(app).listen(80);
https.createServer(options, app).listen(443);

app.get('/', function(req, res){
	res.send("Get Index");
});

app.use('/', express.static("./html", {maxAge: 60*60*1000}));

app.get('/getcity', function(req, res){
	fs.readFile('cities.dat.txt', function(err, data) {
		if(err){
			throw err;
		}
		var urlObj = url.parse(req.url, true, false);
		var searchStr = urlObj.query.q;
		var searchExp = new RegExp("^" + searchStr);
                var returnValue = [];
		var cities = data.toString().split("\n");
		for(var i = 0; i < cities.length; i++){
			var searchResult = cities[i].search(searchExp);
			if(searchResult != -1){
				returnValue.push({'city': cities[i]});
			}
		}
		res.json(returnValue);
	});
});

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({
	extended: true
}));

app.get('/comment', function(req, res){
	var returnValue = "";
	MongoClient.connect("mongodb://localhost/weather", function(err, db){
		if(err){
			throw err;
		}
		db.collection('comments', function(err, comments){
			if(err){
				throw err;
			}
			comments.find(function(err, items){
				items.toArray(function(err, itemArr){
					res.json(itemArr);
				});
			});
		});		
	});
});

app.post('/comment', auth, function(req, res){
	MongoClient.connect("mongodb://localhost/weather", function(err, db){
		if(err){
			throw err;
		}
		db.collection('comments').insert(req.body, function(err, records){
			console.log("");
		});	
	});
	res.end();
});

