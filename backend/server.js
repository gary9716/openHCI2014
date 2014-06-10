var mongoose = require('mongoose');
var Grid = require('gridfs-stream');
var mongodb_uri = process.env.MONGOLAB_URI || 'mongodb://localhost/test';

console.log(mongodb_uri);

var connection = mongoose.createConnection(mongodb_uri);

// Error handler
connection.on('error', function(err){
  console.log(err);
});

var gfs;

// Connection established
connection.once('open', function() {
	console.log('database connection established');
	gfs = Grid(connection.db,mongoose.mongo);
	serverStartToListen();
});

var express = require('express'); 
var fs = require('fs');
var formidable = require('formidable');
var util = require('util');
var path = require('path');

//paths
var frontEndPath = __dirname + '/../public';
var port = process.env.PORT || 5000;
var form = new formidable.IncomingForm();
	form.encoding = 'utf-8';
	form.keepExtensions = true;
	form.maxFieldsSize = 2 * 1024 * 1024; //2MB
	form.type = 'multipart';
	form.multiples = false;

var app = express();
app.use(express.json());
app.use(express.urlencoded());
app.use(app.router);
app.use(express.static(frontEndPath));

//relative path would make express feel unsecured
//so we need to resolve to absolute path
var uploadFileHtmlPath = path.resolve(frontEndPath + '/uploadFile.html');

//S3 settings
var s3_access_key_id = process.env.AWS_ACCESS_KEY_ID;
var s3_secret_access_key = process.env.AWS_SECRET_ACCESS_KEY;
var s3_username = process.env.AWS_S3_USER;
var s3_password = process.env.AWS_S3_PASS;
var s3_bucket = process.env.S3_BUCKET_NAME;
var s3_isAvailable;
var s3_client;

if(!s3_access_key_id || !s3_secret_access_key || !s3_username || !s3_password || !s3_bucket) {
	console.log('s3 is unavailable');
	s3_isAvailable = false;
	form.uploadDir = path.resolve(__dirname + '/../filesFolder');
}
else {
	console.log('s3 is available');
	s3_isAvailable = true;
	form.uploadDir = __dirname + '/tmp';
	s3_client = require('knox').createClient({
	    key: s3_access_key_id
	  , secret: s3_secret_access_key
	  , bucket: s3_bucket
	});

}

var global_res;

form.on('file', function(field, file) {
        //rename the incoming file to the file's local name
        var newFileNameAndPath = form.uploadDir + "/" + file.name;
        fs.rename(file.path, newFileNameAndPath,function (err) {
			console.log('file rename to:' + file.name);
			
			// if(!err) {
			// 	s3_client.putFile(newFileNameAndPath, file.name, function(err, res){
			// 	  // Always either do something with `res` or at least call `res.resume()`.
					
			// 		res.resume();
			// 		if(!err) {
			// 			global_res.end("upload complete");
			// 		}
			// 		else {
			// 			global_res.send(400, { error: 'upload failed' }); //400 means bad request
			// 		}
			// 	});
			// }


			if(err) {
        		console.log(err);
        		global_res.send(400, { error: 'upload failed' }); //400 means bad request
        	}
        	else {
        		console.log("no error");
        		global_res.end("upload complete");
        	}
      	
        });
    })
	.on('end', function() {
		console.log('file uploading finished here');
		return;
	});


//http routing
app.get("/uploadFile",function (req,res) {
	res.sendfile(uploadFileHtmlPath);
})
.get("/file/download/:fileName",function (req,res) {
	if(!s3_isAvailable) {
		res.download(form.uploadDir + "/" + req.params.fileName,
					 req.params.fileName,
					 function (err) {
					 	if(err) {
					 		console.log(err);
					 	}
					 }
		);
	}
	else { 
		s3_client.getFile(req.params.fileName, function (err,res) {
			console.log(res);
			res.resume();
		});
	}
})
.post("/file/upload",function (req,res) {
	console.log("start to upload");
	global_res = res;
    form.parse(req);
});

function serverStartToListen() {
	app.listen(port, function(){
	    console.log('Listening on ' + String(port));
	});
}