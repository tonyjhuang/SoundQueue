function appendToQueue(result) {
	var title = result.title;
	var html = "<div class='song'><p>" + title + "</p></div>";
	$(".queue-container").append(title);
}

function resolve(url) {
	$.get('http://api.soundcloud.com/resolve.json?url=' + url + '&client_id=be1435461b3275ac389c9f47f61e2560',
		function(result) {
			console.log(result);
			appendToQueue(result);
	});
}

function main() {
	SC.initialize({
		client_id: "be1435461b3275ac389c9f47f61e2560"
	});

	// Lets background script know that popup is opened
	// and gets the queue object as a response

	chrome.runtime.sendMessage({visible:true},
		function(response) {
			console.log(response);
			for (i = 0; i < response.tracks.length; i++) {
				resolve("https://soundcloud.com" + response.tracks[i]);
			}
		}
	);

	
}

main();