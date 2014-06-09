(function (){
//var host = 'http://localhost:5000';
var host = 'http://openhci2014.herokuapp.com'

var drop_EVENT = "drop";
var addedFile_EVENT = "addedfile";
var removedfile_EVENT = "removedfile";
var maxfilesreached_EVENT = "maxfilesreached";
var success_EVENT = "success";

var click_EVENT = "click";

var display_CSSProperty = 'display';
var none_CSSValue = 'none';
var inlineBlock_CSSValue = 'inline-block';

var numOfFilesKeptInDropzone = 0;
var filesArray = [];
const maxNumOfFiles = 1;
var toAddFile = false;
var uploadButton = $('button#uploadToServer');
var hintMessage = $('h1#hint_message');
var numBodyClicked = 0; 
	function dropAndClickEventHandler(event) {
		
		//to solve an bug that body's click would be triggered twice within an click event		
		numBodyClicked++;
		if(event.type === click_EVENT && numBodyClicked === 2) { 
			numBodyClicked = 0;
			return;
		}

		console.log(event);
		
		if(numOfFilesKeptInDropzone == maxNumOfFiles) {
			if(confirm("You're going to replace current file on this page.\nDo you want to do this?") == true) { //pressed OK
				this.removeFile(filesArray.pop());
				toAddFile = true;
			}
			else { //pressed cancel
				toAddFile = false;
			}
		}
		else {
			toAddFile = true;
		}
		
	}

	var slidesDropzone = new Dropzone(document.body,
		{ 
			clickable: true,
			paramName: "file",
			url: "/file/upload",
			maxFilesize: 2, //in MB
			maxFiles: maxNumOfFiles,
			autoProcessQueue: false, //have to call dropzone.processQueue() myself
			/*
				The default implementation of accept checks the file's 
				mime type or extension against this list. 
				This is a comma separated list of mime types or file extensions. 
				Eg.: image/*,application/pdf,.psd. If the Dropzone is clickable 
				this option will be used as accept parameter on the hidden file input as well.
			*/
			//acceptedFiles:,
			
			init: function() {
				
				
				this
				.on(drop_EVENT, dropAndClickEventHandler)
			    .on(addedFile_EVENT, function(file) { 
			    	if(toAddFile) {
				    	filesArray.push(file);
			    	}
			    	else {
			    		this.removeFile(file);
			    	}
			    	//in second branch would be offset in the below event handler
			    	numOfFilesKeptInDropzone++;
			    	if(numOfFilesKeptInDropzone > 0) {
			    		uploadButton.css(display_CSSProperty,inlineBlock_CSSValue);
			    		hintMessage.css(display_CSSProperty,none_CSSValue);
			    	}
			    	
			    })
			    .on(removedfile_EVENT, function() { 
			    	numOfFilesKeptInDropzone--; 
			    	if(numOfFilesKeptInDropzone === 0) {
			    		uploadButton.css(display_CSSProperty,none_CSSValue);
			    		hintMessage.css(display_CSSProperty,inlineBlock_CSSValue);
			    	}
			    })
			    .on(success_EVENT, function() {
			    	//console.log('done-uploading');
			    	var template = '<a class="dz-remove" style="margin-top:5px;">download</a>';
					$(template).appendTo('div.dz-preview').on(click_EVENT,function (event){
						var fileName = $('div.dz-filename').find('span').text();
						// console.log(fileName);
						// $.get(host + '/file/download/' + fileName,function (data) {
						//  	//console.log(data);
						// });
						window.open(host + '/file/download/' + fileName);

					});
			    });
			},
			
			addRemoveLinks: true,
			previewsContainer: "#previews", // Define the container to display the previews,
			//clickable: "#clickable" // Define the element that should be used as click trigger to select files.
		}
	);

	$('body.dz-clickable').on(click_EVENT, dropAndClickEventHandler);

	uploadButton.css(display_CSSProperty,none_CSSValue).on(click_EVENT,function (event){
		slidesDropzone.processQueue();
		//slidesDropzone.removeAllFiles();
	});
	
	//disable browser's default event
	$(document).bind('drop dragover', function (e) {
    	e.preventDefault();
	});
	
})();