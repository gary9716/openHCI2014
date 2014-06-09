var express = require('express'); 
var fs = require('fs');
var formidable = require('formidable');
var util = require('util');
var path = require('path');

//paths
var frontEndPath = __dirname + '/../public';
var port = 5000;
var form = new formidable.IncomingForm();
	form.encoding = 'utf-8';
	form.uploadDir = path.resolve(__dirname + '/../filesFolder');
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

app.get("/uploadFile",function (req,res) {
	res.sendfile(uploadFileHtmlPath);
})
.get("/file/download/:fileName",function (req,res) {
	res.download(form.uploadDir + "/" + req.params.fileName,
				 req.params.fileName,
				 function (err) {
				 	if(err) {
				 		console.log(err);
				 	}
				 }
	);
})
.post("/file/upload",function (req,res) {
	console.log("start to upload");

	form.on('file', function(field, file) {
        //rename the incoming file to the file's local name
        fs.rename(file.path, form.uploadDir + "/" + file.name,function (err) {
			if(err) {
        		console.log(err);
        	}
        });
    })
	.on('end', function() {
		res.end("upload complete");
		return;
	});
    
    form.parse(req);

})
.listen(port, function(){
    console.log('Listening on ' + String(port));
});