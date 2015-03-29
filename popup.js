// the current song in the queue being played
var currentIndex;

// highlights the current played song
function _highlightSong(index) {
	console.log($(".song:nth-child(" + index + ")"));
	$(".song:nth-child(" + index + ")").addClass("highlight");
}

// add song title to popup queue
function _appendToQueue(result) {
	var title = result.title;
	var artwork_url = result.artwork_url;
	var username = result.user.username
	var html = "<div id='track" + i + "' class='song'><img class='artwork' src='" + artwork_url + "'><p>" + username + "</p><p>" + title + "</p><img src='assets/images/play.svg'></div>";
	$(".queue-container").append(html);
}

// Lets background script know that popup is opened
// and gets the queue object as a response
chrome.runtime.sendMessage({visible: true},
	function(response) {
		currentIndex = response.index; 

		tracks = response.tracks;
		for (i = 0; i < tracks.length; i++) {
			_appendToQueue(tracks[i]);
		}
		_highlightSong(currentIndex + 1);
	}
);

function _jumpToSong(index) {
	chrome.runtime.sendMessage({index: index});
	currentIndex = index;
}

function _pause(paused) {
	chrome.runtime.sendMessage({pause: paused});
}
