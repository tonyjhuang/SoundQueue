// the current song in the queue being played
// need this to unhighlight the song when we switch to a new one.
var currentIndex = -1;


function _getNowPlaying(state) {
  return state.tracks[state.index];
}

/*     UI      */
var _initializeState = function(state) {
  $(".queue-container").empty();
  _resetSeeker();

  if (state) {
    currentIndex = state.index;
    $.each(state.tracks, function(index, track) {
      _appendToQueue(track, index);
    });

    _highlightSong(currentIndex);
    _updateReplayButton(state.replay);
    _showPlayButton(!state.playing);
    $(".volume").get(0).value = state.volume;
    _updateSeeker(state.currentPosition, _getNowPlaying(state).duration)
  }
}


function _millisToTime(millis) {
  // see http://stackoverflow.com/a/1268377
  function zeroPad(num, numZeros) {
    var n = Math.abs(num);
    var zeros = Math.max(0, numZeros - Math.floor(n).toString().length );
    var zeroString = Math.pow(10,zeros).toString().substr(1);
    if( num < 0 ) {
        zeroString = '-' + zeroString;
    }

    return zeroString+n;
  }
  // see http://www.calculatorsoup.com/calculators/time/decimal-to-time-calculator.php
  var minutesInDecimal = millis / 60000;
  var secondsInDecimal = (minutesInDecimal % 1) * 60;

  return Math.floor(minutesInDecimal) + ":" + zeroPad(Math.floor(secondsInDecimal), 2);
}

// add song row to queue
function _appendToQueue(track, index) {
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

function _resetSeeker() {
  $(".seeker-current-position").html("0:00");
  $(".seeker-total-duration").html("0:00");
  $(".seeker")[0].value = 0;
}

// each param is in millis.
function _updateSeeker(currentPosition, trackDuration) {
  var position = Math.floor(currentPosition / trackDuration * 1000);
  $(".seeker-current-position").html(_millisToTime(currentPosition));
  $(".seeker-total-duration").html(_millisToTime(trackDuration));
  $(".seeker")[0].value = position;
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
  _sendMediaMessage("clear", null, _initializeState);
}

function _selectSong(_index) {
  _unhighlightSong(currentIndex);
  _sendMediaMessage("select", {index: _index}, function(response) {
    currentIndex = response.index;
    _highlightSong(response.index);
  });
}


function _throttle(fn, threshhold, scope) {
  threshhold || (threshhold = 250);
  var last,
      deferTimer;
  return function () {
    var context = scope || this;

    var now = +new Date,
        args = arguments;
    if (last && now < last + threshhold) {
      // hold on to it
      clearTimeout(deferTimer);
      deferTimer = setTimeout(function () {
        last = now;
        fn.apply(context, args);
      }, threshhold);
    } else {
      last = now;
      fn.apply(context, args);
    }
  };
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
    _sendMediaMessage("prev", null, function(state) {
      currentIndex = state.index;
      _highlightSong(state.index);
    });
  });

  $(".next").click(function(e) {
    _unhighlightSong(currentIndex);
    _sendMediaMessage("next", null, function(state) {
      currentIndex = state.index;
      _highlightSong(state.index);
    });
  });

  $(".clear").click(function() {
    _clear();
  });

  $(".replay").click(function() {
    _sendMediaMessage("replay", null, function(state) {
      _updateReplayButton(state.replay);
    });
  });

  $(".shuffle").click(function(e) {
    $(".queue-container").empty();
    _sendMediaMessage("shuffle", null, function(state) {
      _initializeState(state);
      _showPlayButton(!state.playing);
    });
  });

  $(".volume").on("input", function() { 
    _sendMediaMessage("volume", {volume: parseInt($(this).val())})
  });

  $(".seeker").on("input", _throttle(function() {
    _sendMediaMessage("seek", {seek: $(this).val()}, function(state) {
      _updateSeeker(state.currentPosition, _getNowPlaying(state).duration);
    });
  }, 50));
}

function _handleNotifyMessage(message, sender, sendResponse) {
  switch(message.type) {
    case "next-song":
      console.log("next-song");
      var state = message.state;
      _unhighlightSong(currentIndex);
      currentIndex = state.index;
      _highlightSong(currentIndex);
      console.log(state);
      _updateSeeker(0, _getNowPlaying(state).duration);
      break;
    case "svg-replace":
      _attachClickListeners();
      break;
    case "song-progress":
      var state = message.state;
      _updateSeeker(state.currentPosition, _getNowPlaying(state).duration);
      break;
  }
}

var seeker;

$(function() {
	// Lets background script know that popup is opened
	// and gets the queue object as a response
	chrome.runtime.sendMessage({
      action: "NOTIFY",
      type: "visible"
    },
		_initializeState
	);

	// listens updates to the current song index.
	chrome.runtime.onMessage.addListener(
	  function(message, sender, sendResponse) {
      switch(message.action) {
        case "NOTIFY":
          _handleNotifyMessage(message, sender, sendResponse);
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
