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

if(!s3_access_key_id || !s3_secret_access_key || !s3_username || !s3_password || !s3_bucket) {
	s3_isAvailable = false;
	form.uploadDir = path.resolve(__dirname + '/../filesFolder');
}
else {
	s3_isAvailable = true;
	form.uploadDir = __dirname + '/tmp';
}

var global_res;

form.on('file', function(field, file) {
        //rename the incoming file to the file's local name
        fs.rename(file.path, form.uploadDir + "/" + file.name,function (err) {
			console.log('file rename to:' + file.name);
			try {
				if(err) {
	        		console.log(err);
	        		global_res.send(400, { error: 'file already there' }); //400 means bad request
	        	}
	        	else {
	        		console.log("no error");
	        		global_res.end("upload complete");
	        	}
        	}
        	catch(e) {
        		console.log(e);
        	}
        });
    })
	.on('end', function() {
		console.log('file uploading finished here');
		return;
	});

app.get("/uploadFile",function (req,res) {
	if(!s3_isAvailable) {
		res.sendfile(uploadFileHtmlPath);
	}
	else { //when s3 is available

	}
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

	}
})
.post("/file/upload",function (req,res) {
	console.log("start to upload");
	global_res = res;
    form.parse(req);
})
.listen(port, function(){
    console.log('Listening on ' + String(port));
});