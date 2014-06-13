(function (){
	var host = window.location.origin;
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
	const maxFileSizeInMB = 3;
	var toAddFile = false;
	var toRemoveFile = false;
	var uploadButton = $('button#uploadToServer');
	//var hintMessage = $('h1#hint_message');
	var chooseFileButton = $('button#clickable');
	var hiddenDiv = $('div#hidden_area');
	var toUpload = false;

	var global_addFile_event;
	
	function setGlobalAddFileEvent(event) {
		console.log('setEvent');
		global_addFile_event = event;
	}

	function dropAndClickEventHandler(event) {
		if(slidesDropzone.files.length >= maxNumOfFiles) {
			if(confirm("你即將覆蓋目前的檔案\n確定要這麼做嗎?") == true) { //pressed OK
				toRemoveFile = true;
				toAddFile = true;
				toUpload = true;
				if(event.type === click_EVENT) {
					hiddenDiv.trigger(click_EVENT); //after this event would trigger addedFile
				}
			}
			else { //pressed cancel
				toRemoveFile = false;
				toAddFile = false;
				toUpload = false;
			}
		}
		else {
			toRemoveFile = false;
			toAddFile = true;
			toUpload = true;
			if(event.type === click_EVENT) {
				hiddenDiv.trigger(click_EVENT); //after this event would trigger addedFile
			}
		}
			
		setWelcomeMessage(null);
	}

	function setWelcomeMessage(file) {
	    if(toUpload) {
	    	$('#pass-area .info').text('Hello, ' + username);
		}
	}

	chooseFileButton.on(click_EVENT, dropAndClickEventHandler);
	chooseFileButton.on(click_EVENT, setGlobalAddFileEvent);

	var slidesDropzone = new Dropzone(document.body,
		{ 
			clickable: "div#hidden_area", // Define the element that should be used as click trigger to select files.
			paramName: "file",
			url: "/file/upload",
			maxFilesize: maxFileSizeInMB, //in MB
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
			acceptedFiles:"application/pdf",
			
			init: function() {
				
				this
				.on(drop_EVENT, setGlobalAddFileEvent)
				//.on(drop_EVENT, dropAndClickEventHandler)
			    .on(addedFile_EVENT, function(file) {
			    	console.log('event:' + global_addFile_event.type);
			    	if(global_addFile_event.type === drop_EVENT) {
			    		dropAndClickEventHandler(global_addFile_event);
			    	}
			    	
			    	console.log('toRemoveFile:' + toRemoveFile);

			    	if(toRemoveFile) {
			    		this.removeFile(this.files[0]); //trigger removeFile event and update UI
			    	}

			    	if(!toAddFile) {
			    		this.removeFile(file);
			    	}
			    	
			    	if(this.files.length > 0) {
			    		uploadButton.css(display_CSSProperty,inlineBlock_CSSValue);
			    	}

			    })
			    .on(removedfile_EVENT, function(file) { 
			    	if(this.files.length === 0) {
			    		uploadButton.css(display_CSSProperty,none_CSSValue);
			    	}
			    });
			    /*
			    .on(success_EVENT, function(file) {
			    	var template = '<a class="dz-remove" style="margin-top:5px;">download</a>';
			    	//download button
						$(template).appendTo('div.dz-preview').on(click_EVENT,function (event){ 
						var fileName = $('div.dz-filename').find('span').text();
						window.open(host + '/file/download/');

					});
			  });
				*/
			},
			
			addRemoveLinks: false,
			previewsContainer: "#previews" // Define the container to display the previews,
			
		}
	);

	uploadButton.css(display_CSSProperty,none_CSSValue).on(click_EVENT,function (event){
		console.log(slidesDropzone.files);
		slidesDropzone.processQueue();
	});
	
	//disable browser's default event
	$(document).bind('drop dragover', function (e) {
    	e.preventDefault();
	});

	// init 
	function init() {
		uploadButton.hide();
		slidesDropzone.disable();

		if(window.location.pathname.split('/').length === 3 && window.location.pathname.split('/')[1] === 'uploadFile') {
			$('input#email-input').val(window.location.pathname.split('/')[2]);
		}
	}
	init();
	
	function setUploadSucceedMessage(file) {
	    $('#pass-area .info').text('Hello, ' + username + ' 檔案已上傳成功！');
	}

	var username = null;

	// confirm email click function
	$('#confirm-email').click(function(){
		var inputEmail = $('input#email-input').val().trim();
		var inputPassword = $('input#password-input').val();
		$('input#email-input').val(inputEmail);
		if(inputEmail && inputPassword){
			$('#confirm-email').text('驗證中 ...');
			$.get('/auth', {email: inputEmail, password: inputPassword})
			//$.get('/auth' + '/' + inputEmail + '/' + inputPassword)
			.done(function(res) { //success
				$('#confirm-email').text('確認');
				$('#auth-area').hide();
				$('#pass-area .info').text('Hello, '+res.username);
				$('#pass-area').fadeIn();
				slidesDropzone.enable();
				slidesDropzone.options.url = '/file/upload/'+res.id;
				username = res.username;
				//slidesDropzone.on("addedfile", setWelcomeMessage); //move into another listener
				slidesDropzone.on("success", setUploadSucceedMessage);

			})
			.fail(function(error) {
				$('#confirm-email').text('確認');
		    	$('#error-message').text('無效的電子郵件或密碼').fadeIn();
				setTimeout(function(){
					$('#error-message').text('').hide();
				}, 5000);	
		  	});
		}
		else {
			$('#error-message').text('尚未輸入電子郵件或密碼').fadeIn();
			setTimeout(function(){
				$('#error-message').text('').hide();
			}, 5000);	
		}
		
		

	});

})();