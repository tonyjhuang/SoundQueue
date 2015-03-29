// the current song in the queue being played
var currentIndex;

// Song starts out unpaused
var paused = false;

// highlightes the current played song
function _highlightSong(index) {
	index++;
	$(".song:nth-child(" + index + ")").addClass("highlight");
}

// add song title to popup queue
function _appendToQueue(result, callback) {
	var title = result.title;
	var artwork_url = result.artwork_url;
	var username = result.user.username
	var html = "<div id='track" + i + "' class='song'><img class='artwork' src='" + artwork_url + "'><p>" + username + "</p><p>" + title + "</p></div>";
	$(".queue-container").append(html);

	callback();
}

function _jumpToSong(index) {
	chrome.runtime.sendMessage({index: index});
	currentIndex = index;
}

function _pause(paused) {
	chrome.runtime.sendMessage({pause: paused});
}

function _play(playing) {
	chrome.runtime.sendMessage({play: playing});
}

// Lets background script know that popup is opened
// and gets the queue object as a response
chrome.runtime.sendMessage({visible: true},
	function(response) {
		currentIndex = response.index;
		tracks = response.tracks;
		for (i = 0; i < tracks.length; i++) {

			var callback = 	function() {
				$($(".song")[i]).click(function(e) {
					_jumpToSong($(this).index());
				});
			};

			_appendToQueue(tracks[i], callback);
		}
		_highlightSong(currentIndex);
	}
);

function _jumpToSong(index) {
	chrome.runtime.sendMessage({index: index});
	currentIndex = index;
	_highlightSong(index);
}

function _pause() {
	paused = !paused;
	chrome.runtime.sendMessage({pause: paused});
}
