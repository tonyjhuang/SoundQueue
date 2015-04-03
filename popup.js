// the current song in the queue being played
// need this to unhighlight the song when we switch to a new one.
var currentIndex = -1;


/*     UI      */
var _initializeState = function(state) {
  $(".queue-container").empty();

  if (state) {
    currentIndex = state.index;
    $.each(state.tracks, function(index, track) {
      _appendToQueue(track, index);
    });

    _highlightSong(currentIndex);
    _updateReplayButton(state.replay);
    _showPlayButton(!state.playing);
    $(".volume").get(0).value=state.volume;
  }
}

// add song row to queue
function _appendToQueue(track, index) {

  function _millisToTime(millis) {
    // see http://www.calculatorsoup.com/calculators/time/decimal-to-time-calculator.php
    var minutesInDecimal = millis / 60000;
    var secondsInDecimal = (minutesInDecimal % 1) * 60;

    return Math.floor(minutesInDecimal) + ":" + Math.floor(secondsInDecimal);
  }

  var buttonClasses = "waves-effect waves-orange btn-flat"

  //console.log(track);

  var id = "track" + index;
  var artwork = track.artwork_url;
  var artist = track.user.username;
  var artistLink = track.user.permalink_url;
  var title = track.title;
  var link = track.permalink_url;
  var duration = _millisToTime(track.duration); // millis to minutes.

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
    chrome.tabs.create({url: link});
  });

  // artist click listener, redirects user to artist page.
  $("#" + id + " .song-artist").click(function(e) {
    chrome.tabs.create({url: artistLink});
  });

  // entire row click listener, selects the song to play immediately.
  $("#" + id).click(function(e) {
    _selectSong(index);
  });
}


// highlights the current played song
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

function _updateReplayButton(replay) {
  if (replay) {
    $(".replay").css("background-color", "#EEE");
  } else {
    $(".replay").css("background-color", "");
  }
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
  _sendMediaMessage("clear", null, _initializeState);
}


function _selectSong(_index) {
  _unhighlightSong(currentIndex);
  _sendMediaMessage("select", {index: _index}, function(response) {
    currentIndex = response.index;
    _highlightSong(response.index);
  });
}

function _attachClickListeners() {
  $(".soundcloud-link").click(function() {
    chrome.tabs.create({url: "https://soundcloud.com"});
  });

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
    _sendMediaMessage("replay", null, function(response) {
      _updateReplayButton(response.replay);
    });
  });

  $(".shuffle").click(function(e) {
    $(".queue-container").empty();
    _sendMediaMessage("shuffle", null, function(result) {
      _initializeState(result);
      _showPlayButton(!result.playing);
    });
  });

  $(".volume").on("input", function() { 
    _sendMediaMessage("volume", {volume: parseInt($(this).val())})
  });
}

$(function() {
	// Lets background script know that popup is opened
	// and gets the queue object as a response
	chrome.runtime.sendMessage({
      action: "NOTIFY",
      visible: true
    },
		_initializeState
	);

	// listens updates to the current song index.
	chrome.runtime.onMessage.addListener(
	  function(message, sender, sendResponse) {
      switch(message.action) {
        case "NOTIFY":
          if(message.type === "next-song") {
            _unhighlightSong(currentIndex);
            currentIndex = message.state.index;
            _highlightSong(currentIndex);
          } else if(message.type === "svg-replace") {
            _attachClickListeners();
          }
          break;
      }
	  }
	);

  _attachClickListeners();
});

/* Use these helpers to send messages to the backend about user actions. */
function _sendMediaMessage(type) {
  _sendMediaMessage(type, null);
}

function _sendMediaMessage(type, options) {
  _sendMediaMessage(type, options, null);
}

function _sendMediaMessage(type, options, callback) {
  chrome.runtime.sendMessage({
    action: "MEDIA",
    type: type,
    options: options
  }, callback);
}
