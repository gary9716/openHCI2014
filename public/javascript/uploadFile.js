(function (){
var host = window.location.origin;
//var host = 'http://openhci2014.herokuapp.com'

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
const maxNumOfFiles = 1;
var toAddFile = false;
var toRemoveFile = false;
var uploadButton = $('button#uploadToServer');
var hintMessage = $('h1#hint_message');
var chooseFileButton = $('button#clickable');
var hiddenDiv = $('div#hidden_area');

	function dropAndClickEventHandler(event) {
		
		//to solve an bug that body's click would be triggered twice within an click event		
		// numBodyClicked++;
		// if(event.type === click_EVENT && numBodyClicked === 2) { 
		// 	numBodyClicked = 0;
		// 	return;
		// }

		if(slidesDropzone.files.length == maxNumOfFiles) {
			if(confirm("You're going to replace current file on this page.\nDo you want to do this?") == true) { //pressed OK
				toRemoveFile = true;
				toAddFile = true;
				if(event.type === click_EVENT) {
					hiddenDiv.trigger(click_EVENT); //after this event would trigger addedFile
				}
			}
			else { //pressed cancel
				toRemoveFile = false;
				toAddFile = false;
			}
		}
		else {
			toRemoveFile = false;
			toAddFile = true;
			if(event.type === click_EVENT) {
				hiddenDiv.trigger(click_EVENT); //after this event would trigger addedFile
			}
		}
		
	}


	chooseFileButton.on(click_EVENT, dropAndClickEventHandler);

	var slidesDropzone = new Dropzone(document.body,
		{ 
			//clickable: false,
			clickable: "div#hidden_area", // Define the element that should be used as click trigger to select files.
			paramName: "file",
			url: "/file/upload",
			maxFilesize: 2, //in MB
			maxFiles: maxNumOfFiles,
			autoProcessQueue: false, //have to call dropzone.processQueue() myself
			uploadMultiple: false,
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

			    	if(toRemoveFile) {
			    		this.removeFile(this.files[0]); //trigger removeFile event and update UI
			    	}

			    	if(!toAddFile) {
			    		this.removeFile(file);
			    	}
			    	
			    	//in second branch would be offset in the below event handler
			    	
			    	if(this.files.length > 0) {
			    		uploadButton.css(display_CSSProperty,inlineBlock_CSSValue);
			    		hintMessage.css(display_CSSProperty,none_CSSValue);
			    	}

			    })
			    .on(removedfile_EVENT, function(file) { 

			    	if(this.files.length === 0) {
			    		uploadButton.css(display_CSSProperty,none_CSSValue);
			    		hintMessage.css(display_CSSProperty,inlineBlock_CSSValue);
			    	}
			    })
			    .on(success_EVENT, function(file) {
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
			previewsContainer: "#previews" // Define the container to display the previews,
			
		}
	);

	uploadButton.css(display_CSSProperty,none_CSSValue).on(click_EVENT,function (event){
		slidesDropzone.processQueue();
	});
	
	//disable browser's default event
	$(document).bind('drop dragover', function (e) {
    	e.preventDefault();
	});

})();