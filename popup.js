

function main() {
	SC.initialize({
		client_id: "be1435461b3275ac389c9f47f61e2560"
	});

	SC.get("/tracks/49931", function(sound){
		console.log(sound);
 		 //sound.play();
	});

	// Lets background script know that popup is opened
	// and gets the queue object as a response
	var queue;
	chrome.runtime.sendMessage({visible:true},
		function(response) {
			queue = response;
		}
	);
}

main();