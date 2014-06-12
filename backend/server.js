var mongo = require('mongodb');
var MongoClient = mongo.MongoClient;
var Grid = require('gridfs-stream');
var mongodb_uri = process.env.MONGOLAB_URI || 'mongodb://localhost/test';
var collectionName = 'registerdata';
console.log(mongodb_uri);

MongoClient.connect(mongodb_uri, function(err, db) {
	if(err) {
		throw err;
	}
	console.log('database connection established');
	gfs = Grid(db,mongo);
	//refreshData(serverStartToListen);
	serverStartToListen();
});

var gfs;
var fileOptions = {
	_id: null, // a MongoDb ObjectId
    filename: null, // a filename
    mode: 'w', // default value: w+, possible options: w, w+ or r, see [GridStore](http://mongodb.github.com/node-mongodb-native/api-generated/gridstore.html)
    root: collectionName
};

var express = require('express'); 
var fs = require('fs');
var formidable = require('formidable');
var util = require('util');
var path = require('path');
var ejs = require('ejs');

//paths
var frontEndPath = __dirname + '/../public';
var port = process.env.PORT || 5000;
var form = new formidable.IncomingForm();
	form.encoding = 'utf-8';
	form.keepExtensions = true;
	form.maxFieldsSize = 3 * 1024 * 1024; //2MB
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
	//form.uploadDir use default upload path
	s3_client = require('knox').createClient({
	    key: s3_access_key_id
	  , secret: s3_secret_access_key
	  , bucket: s3_bucket
	});

}

var typeformDataApi = process.env.TYPEFORM_DATAAPI;
var request = require('request');
var typeformData;

function refreshData(callback) {
	request(typeformDataApi, function (err,res,body){
		if (!err && res.statusCode == 200) {
			jsonData = JSON.parse(body);
			typeformData = {
				tokens: [],
				names: [],
				emails: [],
				passwords: []
			};

			jsonData.responses.reverse().forEach(function (element) {
				typeformData.tokens.push(element.token);
				typeformData.names.push(element.answers.textfield_1032591);
				typeformData.emails.push(element.answers.email_1032698);
				typeformData.passwords.push(element.answers.textfield_1074024);
			});
			console.log(typeformData);
			if(callback) {
				callback();
			}
		}
	});
}

var global_res;
var global_req;

form.on('file', function(field, file) {
    //rename the incoming file to the file's local name
    /*
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
	*/
	if(tokenId) {
		fileOptions._id = tokenId;
	}
	else {
		fileOptions._id = null;
	}

	fileOptions.filename = file.name;
	var writestream = gfs.createWriteStream(fileOptions);
	fs.createReadStream(file.path).pipe(writestream);
	writestream.on('close', function (file) {
	  // do something with `file`
	  console.log('upload successfully:' + file.filename);
	  global_res.end("upload complete");
	});
});
/*
.on('end', function() {
	console.log('file uploading finished here');
	return;
});
*/


//http routing
app.set('view engine','ejs')
.set('views', frontEndPath + '/ejsTemplates')
.get("/auth",function (req,res) {
	var email = req.query.email;
	var password = req.query.password;
	var indexOfEmail = typeformData.emails.indexOf(email);
	refreshData(function () {
		var indexOfEmail = typeformData.emails.indexOf(email);
		if(indexOfEmail !== -1) {
			if(typeformData.passwords[indexOfEmail] === password) {
				res.send(200,{
					username: typeformData.names[indexOfEmail],
					id: typeformData.tokens[indexOfEmail]
				});
			}
			else {
				res.send(401,{
					error: "incorrect password"
				});
			}
		}
		else {
			res.send(401, {
				error: "authentication failed"
			});
		}
	});
});
/*
.get("/checkEmail/:email",function (req,res) {
	var indexOfEmail = typeformData.emails.indexOf(req.params.email);
	if(indexOfEmail !== -1) { //found
		res.send(200, {
			username: typeformData.names[indexOfEmail],
			id: typeformData.tokens[indexOfEmail] 
		});
	}
	else {
		refreshData(function () {
			var indexOfEmail = typeformData.emails.indexOf(req.params.email);
			if(indexOfEmail !== -1) { //found
				res.send(200, {
					username: typeformData.names[indexOfEmail],
					id: typeformData.tokens[indexOfEmail] 
				});
			}
			else { //unrecognized email
				res.send(401, {
					error: "unrecognized email"
				});
			}
		}); //after refresh,call callback.
	}
})
*/

function sendUploadFilePage(req,res) {
	res.sendfile(uploadFileHtmlPath); //file upload page without email
}

app.get("/uploadFile",sendUploadFilePage)
.get("/uploadFile/:email",sendUploadFilePage)
.get("/file/download/:fileId",function (req,res) {
	var readstream = gfs.createReadStream({ _id: req.params.fileId,root: collectionName });
	readstream.pipe(res);

	/*
	if(!s3_isAvailable) {
		
	}
	else { 
		 s3_client.getFile(req.params.fileName, function (err,res) {
		 	console.log(res);
		 	res.resume();
		 });
	}

	res.download(form.uploadDir + "/" + req.params.fileId,
				 req.params.fileId,
				 function (err) {
				 	if(err) {
				 		console.log(err);
				 	}
				 }
	);
	*/
})
.post("/file/upload/:id",function (req,res) {
	global_res = res;
	refreshData(function () {
		if(typeformData.tokens.indexOf(req.params.id) !== -1) {
			tokenId = req.params.id;
			console.log("start to upload");
	    	form.parse(req);
		}
		else {
			res.send(401,{ error:"unrecognized user" }); //Unauthorized
		}
	});
});

var tokenId;
/*
function AuthAndRender (res,user) {
	if(user.realPass.trim() === user.inputPass.trim()) {
		res.render('uploadFileWithEmail', {
			username: user.name,
			id: user.id
		});
	}
	else {
		res.send(401,{ error: "incorrect password" });
	}
}
*/
function serverStartToListen() { //wait for DB connection
	app.listen(port, function(){
	    console.log('Listening on ' + String(port));
	});
}
