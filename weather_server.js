var fs = require('fs');
var http = require('http');
var url = require('url');
var MongoClient = require('mongodb').MongoClient;
var root_dir = "html/";

http.createServer( function(req, res) {
	var urlObj = url.parse(req.url, true, false);
	if(urlObj.pathname.indexOf("getcity") != -1){
		fs.readFile('cities.dat.txt', function(err, data) {
			if(err){
				throw err;
			}
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
			res.writeHead(200);
			res.end(JSON.stringify(returnValue));
		});
	} else if(urlObj.pathname.indexOf("comment") != -1){
		if(req.method === "POST"){
			var jsonData = "";
			req.on('data', function(chunk){
				jsonData += chunk;
			});
			req.on('end', function(){
				var reqObj = JSON.parse(jsonData);
				console.log(reqObj);
				MongoClient.connect("mongodb://localhost/weather", function(err, db){
					if(err){
						throw err;
					}
					db.collection('comments').insert(reqObj, function(err, records){
						console.log("");
					});	
				});
			});
			res.writeHead(200);
			res.end("");
		} else if (req.method === "GET") {
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
							returnValue = JSON.stringify(itemArr);
							res.writeHead(200);
							res.end(returnValue);
						});
					});
				});		
			});
		}
	} else {
		fs.readFile(root_dir + urlObj.pathname, function(err, data){
			if(err){
				res.writeHead(404);
				res.end(JSON.stringify(err));
				return;
			}
			res.writeHead(200);
			res.end(data);
		});
	}
}).listen(80);	
