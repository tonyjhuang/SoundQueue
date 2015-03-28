

function main() {
	SC.initialize({
		client_id: "be1435461b3275ac389c9f47f61e2560"
	});

	SC.get("/tracks/49931", function(sound){
		console.log(sound);
 		 //sound.play();
	});

	chrome.runtime.sendMessage({visible:true});
}

main();