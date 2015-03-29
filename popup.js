// add song title to popup queue
function _appendToQueue(result) {
	var title = result.title;
	var html = "<div class='song'><p>" + title + "</p></div>";
	$(".queue-container").append(title);
}

// Lets background script know that popup is opened
// and gets the queue object as a response
chrome.runtime.sendMessage({visible: true},
	function(response) {
		tracks = response.tracks;
		for (i = 0; i < tracks.length; i++) {
			_appendToQueue(tracks[i]);
		}
	}
);

function _jumpToSong(index) {
	chrome.runtime.sendMessage({index: index});
}

function _pause(index) {
	chrome.runtime.sendMessage({pause: true});
}

function _unpause(index) {
	chrome.runtime.sendMessage({pause: false});
}