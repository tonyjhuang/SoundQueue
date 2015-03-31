// the current song in the queue being played
var currentIndex = -1;


// length of the queue
var queueLength;

// song starts out unpaused
var paused = false;

// song starts out not in replay mode
var replay = false;



/*     UI      */
var _initializeQueue = function(queue) {
  $(".queue-container").empty();

  if (queue) {
    currentIndex = queue.index;
    tracks = queue.tracks;
    queueLength = tracks.length;
    for (i = 0; i < tracks.length; i++) {

      var callback =  function() {
        $($(".song")[i]).click(function(e) {
          _selectSong($(this).index());
        });
      };

      _appendToQueue(tracks[i], callback);
    }

    _highlightSong(currentIndex);
    _updateReplayButton(queue.replay);
  }
}

// add song row to queue
function _appendToQueue(result, callback) {

  function _millisToTime(millis) {
    // see http://www.calculatorsoup.com/calculators/time/decimal-to-time-calculator.php
    var minutesInDecimal = millis / 60000;
    var secondsInDecimal = (minutesInDecimal % 1) * 60;

    return Math.floor(minutesInDecimal) + ":" + Math.floor(secondsInDecimal);
  }

  var buttonClasses = "waves-effect waves-orange btn-flat"

  console.log(result);

  var id = "track" + i;
  var artwork = result.artwork_url;
  var artist = result.user.username;
  var artistLink = result.user.permalink_url;
  var title = result.title;
  var link = result.permalink_url;
  var duration = _millisToTime(result.duration); // millis to minutes.

	var html ="\n" +
            "<div id='" + id + "' class='song valign-wrapper'>\n" +
            "  <img class='song-artwork' src='" + artwork + "'>\n" + 
            "  <div class='valign song-meta'>\n" +
            "    <p class='song-artist truncate " + buttonClasses + "'>" + artist + "</p>\n" +
            "    <p class='song-duration'>" + duration + "</p>\n" +
            "    <p class='song-title truncate'>" + title + "</p>\n" +
            "  </div>\n" + 
            "</div>\n";
	$(".queue-container").append(html);

  // artwork click listener, redirects user to sound page.
  $("#" + id + " .song-artwork").click(function(e) {
    e.preventDefault();
    chrome.tabs.create({url: link});
  });

  // artist click listener, redirects user to artist page.
  $("#" + id + " .song-artist").click(function(e) {
    e.preventDefault();
    chrome.tabs.create({url: artistLink});
  });

	callback();
}


// highlightes the current played song
// TODO: if we add delete this needs to be changed to not use nth child
function _highlightSong(index) {
  $(".song:nth-child(" + (index + 1) + ")").addClass("now-playing");
}

function _unhighlightSong(index) {
  $(".song:nth-child(" + (index + 1) + ")").removeClass("now-playing");
}

function _showPlayButton(show) {
  var playDisplay = show ? "inline" : "none";
  var pauseDisplay = show ? "none" : "inline";
  $(".play").css("display", playDisplay);
  $(".pause").css("display", pauseDisplay);
}


/* Click Handlers. */

function _pause() {
  _sendMediaMessage("pause");
	_showPlayButton(true);
}

function _play() {
  _sendMediaMessage("play", null, function(response) {
    _showPlayButton(!response.playing);
  });
}

function _clear() {
  _pause();
  _sendMediaMessage("clear", null, _initializeQueue);
}

function _updateReplayButton(replay) {
	if (replay) {
		$(".replay").css("background-color", "#D3D3D3");
	} else {
		$(".replay").css("background-color", "");
	}
}


function _selectSong(_index) {
  _unhighlightSong(currentIndex);
  _sendMediaMessage("select", {index: _index}, _getNewCurrentIndex);
}

// Retrieves the new current index from
// background page callback responses.
function _getNewCurrentIndex(response) {
  currentIndex = response.index;
  _highlightSong(response.index);
}

$(function() {
	// Lets background script know that popup is opened
	// and gets the queue object as a response
	chrome.runtime.sendMessage({
      action: "NOTIFY",
      visible: true
    },
		_initializeQueue
	);

	// listens updates to the current song index.
	chrome.runtime.onMessage.addListener(
	  function(message, sender, sendResponse) {
	  	if ("updateCurrentIndex" in message) {
		  	_unhighlightSong(currentIndex);
				currentIndex = message.updateCurrentIndex;
				_highlightSong(currentIndex);
			}
	  }
	);

	$(".pause").click(function() {
		_pause();
	});

	$(".play").click(function() {
		_play();
	});

	$(".prev").click(function(e) {
    _unhighlightSong(currentIndex);
    _sendMediaMessage("prev", null, function(response) {
      currentIndex = response.index;
      _highlightSong(response.index);
	  });
  });

	$(".next").click(function(e) {
    _unhighlightSong(currentIndex);
    _sendMediaMessage("next", null, function(response) {
      currentIndex = response.index;
      _highlightSong(response.index);
    });
  });

	$(".clear").click(function() {
		_clear();
	});

	$(".replay").click(function() {
		_sendMediaMessage("replay", {replay: !replay}, function(response) {
			console.log("is replay callback. response: " + response.replay);
      replay = response.replay;
			_updateReplayButton(response.replay);
		});
	});

	$(".shuffle").click(function(e) {
    $(".queue-container").empty();
    _sendMediaMessage("shuffle", {shuffle: true}, _initializeQueue);
	});

});


function _sendMediaMessage(type) {
  _sendMediaMessage(type, null);
}

function _sendMediaMessage(type, options) {
  _sendMediaMessage(type, options, null);
}

function _sendMediaMessage(_type, _options, callback) {
  chrome.runtime.sendMessage({
    action: "MEDIA",
    type: _type,
    options: _options
  }, callback);
}
