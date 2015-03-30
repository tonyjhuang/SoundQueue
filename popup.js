// the current song in the queue being played
var currentIndex = -1;

// length of the queue
var queueLength;

// song starts out unpaused
var paused = false;

// song starts out not in replay mode
var replay = false;

// highlightes the current played song
// TODO: if we add delete this needs to be changed to not use nth child
function _highlightSong(index) {
	index++;
	$(".song:nth-child(" + index + ")").addClass("now-playing");
}

function _unhighlightSong(index) {
	index++;
	$(".song:nth-child(" + index + ")").removeClass("now-playing");
}

// add song row to queue
function _appendToQueue(result, callback) {
  var id = "track" + i;
  var artwork = result.artwork_url;
  var artist = result.user.username
  var title = result.title;

	var html ="<div id='" + id + "' class='song valign-wrapper'>" +
              "<img class='song-artwork' src='" + artwork + "'>" + 
              "<div class='valign song-meta'>" +
                "<p class='song-artist truncate waves-effect waves-orange btn-flat'>" + artist + "</p>" +
                "<p class='song-title truncate'>" + title + "</p>" +
              "</div>" + 
            "</div>";
	$(".queue-container").append(html);

	callback();
}

function _jumpToSong(index) {
	chrome.runtime.sendMessage({index: index});
	_unhighlightSong(currentIndex);
	currentIndex = index;
	_highlightSong(index);
}

function _pause() {
	paused = !paused;
	chrome.runtime.sendMessage({pause: paused});
	$(".pause").css("display", "none");
	$(".play").css("display", "inline");
}

function _play() {
	paused = !paused;
	chrome.runtime.sendMessage({pause: paused});
	$(".play").css("display", "none");
	$(".pause").css("display", "inline");
}

function _clear() {
	chrome.runtime.sendMessage({clear: true});
	_replay(false);
	$(".queue-container").empty();
}

function _replay(isEnabled) {
	if (isEnabled) {
		$(".replay").css("background-color", "#FFD1B2");
	} else {
		$(".replay").css("background-color", "");
	}
}

function _shuffle() {
	$(".queue-container").empty();
	chrome.runtime.sendMessage({shuffle: true},
		_initializeQueue
	);
}

var _initializeQueue = function(response) {
	if (response) {
		currentIndex = response.index;
		tracks = response.tracks;
		queueLength = tracks.length;
		for (i = 0; i < tracks.length; i++) {

			var callback = 	function() {
				$($(".song")[i]).click(function(e) {
					_jumpToSong($(this).index());
				});
			};

			_appendToQueue(tracks[i], callback);
		}
		_highlightSong(currentIndex);
		_replay(response.replay);
	}
}

$(function() {
	// Lets background script know that popup is opened
	// and gets the queue object as a response
	chrome.runtime.sendMessage({visible: true},
		_initializeQueue
	);

	// listens for the next song if the previous song ends
	chrome.runtime.onMessage.addListener(
	  function(message, sender, sendResponse) {
	  	if (message.nextSong) {
		  	_unhighlightSong(currentIndex);
				currentIndex = message.nextSong;
				_highlightSong(currentIndex);
			}
	  }
	);

	$(".pause").click(function() {
		_pause();
	});

	$(".play").click(function() {
		_play();
	})

	$(".prev").click(function(e) {
		if(currentIndex > 0) {
			_jumpToSong(currentIndex - 1);
		}
	});

	$(".next").click(function(e) {
		var queueModel = chrome.extension.getBackgroundPage().queue;
		if (queueModel.replay) {
			_jumpToSong(currentIndex);
		} else if(currentIndex < queueLength - 1) {
			_jumpToSong(currentIndex + 1);
		}
	});

	$(".clear").click(function() {
		_pause();
		_clear();
	});

	$(".replay").click(function() {
		chrome.runtime.sendMessage({replay: true}, function(response) {
			console.log("is replay callback");
			_replay(response.replay);
		});
	});

	$(".shuffle").click(function(e) {
		_shuffle();
	})
});
