(function (){ //failed ,unable to register handler in iframe due to cross origin policy
	$('iframe#typeform-full').ready(function() {
		console.log($('a.button.general.full.enabled'));
		$('a.button.general.full.enabled').on('click',function (event){
			console.log($('ul > li.email.required > div.wrapper > div.content > div.content-wrapper input[type=text]'));
			//$.post(window.location.origin + "/testEmail/" +  );
		});

	});
})();