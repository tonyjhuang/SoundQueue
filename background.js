/*
  Should control all logic around managing the queue and current playing
  song.
*/


/* 
  Some env variables to control optional debug behaviors
*/
var ENV = 'prod'; // 'debug'
var DEBUG = {
  log: false,
  autoPlay: true,
  createQueue: false
};

function isProd() {
  return ENV === 'prod';
}

// Initialize Soundcloud SDK
SC.initialize({
  client_id: "be1435461b3275ac389c9f47f61e2560"
});

/**
 * tracks:  list of SoundCloud track objects, represents the queue
 *
 * index:   indexes into tracks, represents which song is currently playing
 *
 * replay:  should we replay the current song after it finishes?
 *          we should consider changing functionality to replay the QUEUE
 *
 * playing: is the widget currently playing? we could just ask the widget
 *          but that's asynchronous and we want to keep latency low   
 *
 * volume:  current volume of the widget (doesn't really seem to work as
 *          expected. it's more binary than anything [on/off])
 *
 * currentPosition: current progress in song in milliseconds
 *
 * clear:   did the user recently clear the queue? 
 */
var state = {
    tracks:  [],
    index:   -1,
    replay:  false,
    playing: false,
    volume:  50,
    currentPosition: 0,
    clear:   true
};

// Our SoundCloud widget gets embedded on the persistent and
// non-user facing background.html page. Controls sound streaming.
var widget;

function addToQueue (url) {
  SC.get('http://api.soundcloud.com/resolve.json?url=' + url,
    function(result) {
      if(!isProd() && DEBUG.log) {
        console.log(result);
      }

      if(result.kind == "track") { // single track
        state["tracks"].push(result);
      } else { // playlist
        $.each(result.tracks, function(index) {
          state["tracks"].push(result.tracks[index]);
        });
      }

      if (state.index === -1) {
        state.index = 0;
        if(isProd() || DEBUG.autoPlay) {
          playSong(state.index);
        }
      }
    }
  );
}

// Plays the song at the index (if there is one),
// updates the state appropriately. if respectCurrentPlayState
// is set to true, only play the widget if the current state
// is already playing.
function playSong(index, options) {
  if(index >= 0 && index < state.tracks.length) {
    
    // If respectCurrentPlayState is set and true, then only 
    // start playing the new song if the currently queued  
    // song is already playing. If nothing is currently
    // playing then just load the new song into the widget.
    //
    // If respectCurrentPlayState not true or unset, then play the new song.
    if(typeof options === 'undefined' || !options.respectCurrentPlayState) {
      state.playing = true;
    }

    if(state.index === index && !state.clear) {
      // in case the user has paused the song and then seeked
      // to a new position.
      widget.seekTo(state.currentPosition);
      if(state.playing) {
        widget.play();
      }
    } else {
      state.index = index;
      state.clear = false;
      var currentSongUri = state.tracks[index].uri;
      console.log(currentSongUri);
      widget.load(currentSongUri, {
        callback: function() {
          widget.setVolume(state.volume);
          if(state.playing) {
            widget.play();
          } else {
            /*
             Seems to be a bug in the SoundCloud widget. 

             To reproduce:
             - add songs to queue.
             - pause playback.
             - select/click any song that isn't currently playing
             - seek to a time in the song
             - play song

             Expected behavior:
             - widget starts playing the song at that seeked to position

             Actual behavior:
             - widget starts playing the song from the beginning

             Workaround:
             - 'prime' the widget by playing and then immediately pausing. 
             - when the widget is next played, it will respect prior seekTo's

             */
            widget.play();
            widget.pause();
          }
        }
      });
    }
  } else { // invalid index.
    state.playing = false;
    widget.pause();
  }
}

function randomizeArray(o){
    for(var j, x, i = o.length; i; j = Math.floor(Math.random() * i), x = o[--i], o[i] = o[j], o[j] = x);
    return o;
};

var messageHandler = function(message, sender, sendResponse) {
  if(!isProd() && DEBUG.log) {
    console.log(message);
  }

  switch(message.action) {
    case "ADD_TO_QUEUE":
      if (message.track === "CURRENT_URL") {
        chrome.tabs.getSelected(null, function(tab) {
          addToQueue(tab.url);
        });
      } else {
        addToQueue("https://soundcloud.com" + message.track);
      }
      break;
    case "NOTIFY":
      if(message.type === "visible") {        
        sendResponse(state);
      }
      break;
    case "MEDIA":
      _handleMediaMessage(message, sender, sendResponse);
    default:
      break;
  }
}


function _handleMediaMessage(message, sender, sendResponse) {
  switch(message.type) {
    case "play":
      playSong(state.index);
      sendResponse(state);
      break;
    case "pause":
      widget.pause();
      state.playing = false;
      break;
    case "prev":
      if(state.currentPosition > 5000) {
        // If we're more than 5 seconds into a song, restart the song.
        state.currentPosition = 0;
        playSong(state.index, {respectCurrentPlayState: true});
        sendResponse(state);
      } else {
        // Otherwise, go to the previous song.
        state.currentPosition = 0;
        var newSongIndex = Math.max(state.index - 1, -1);
        playSong(newSongIndex, {respectCurrentPlayState: true});
        sendResponse(state);
        _notifyNextSong();  
      }
      break;
    case "next":
      state.currentPosition = 0;
      var newSongIndex = Math.min(state.index + 1, state.tracks.length);
      playSong(newSongIndex, {respectCurrentPlayState: true});
      sendResponse(state);
      _notifyNextSong();
      break;
    case "select":
      ignoreNextPlayProgressEvent = true; // see variable declaration comment.
      state.currentPosition = 0;
      playSong(message.options.index, {respectCurrentPlayState: true});
      sendResponse(state);
      _notifyNextSong();
      break;
    case "replay":
      state.replay = !state.replay;
      sendResponse(state);
      break;
    case "shuffle":
      state.currentPosition = 0;
      widget.pause();
      state.playing = false;
      if(state.tracks.length > 0) {
        state.index = 0;
        randomizeArray(state.tracks);
      } else {
        state.index = -1;
      }
      sendResponse(state);
      break;
    case "clear":
      widget.pause();
      state.tracks = [];
      state.index = -1;
      state.playing = false;
      state.currentPosition = 0;
      state.clear = true;
      sendResponse(state);
      break;
    case "volume":
      state.volume = message.options.volume;
      widget.setVolume(state.volume);
      break;
    case "seek":
      state.currentPosition = message.options.seek / 1000 * state.tracks[state.index].duration;
      widget.seekTo(state.currentPosition);
      sendResponse(state);
      break;
  }
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

// So there's an issue with picking a track to play while another song
// is already playing: after selecting the new song, the widget has to
// pause, and in doing so, fires off one last play-progress event. in
// order to avoid ping-ponging currentPosition events (user selects new
// song, currentPosition is at 0, widget fires event, currentPosition
// is back to 63253.23 or whatever), we ignore the next play-progress
// event.
var ignoreNextPlayProgressEvent = false;

$(function() {
  widget = SC.Widget("sc-widget");

  // Listen for song finish event from the widget.
  widget.bind(SC.Widget.Events.FINISH, function() {
    state.currentPosition = 0;
    if (state.replay) {
      playSong(state.index);
    } else {
      if (state.index + 1 < state.tracks.length) {
        playSong(state.index + 1);
        _notifyNextSong();
      }
    }
  });

  widget.bind(SC.Widget.Events.PLAY_PROGRESS, _throttle(function(progress) {
    if(ignoreNextPlayProgressEvent) {
      ignoreNextPlayProgressEvent = false;
      return;
    }

    state.currentPosition = progress.currentPosition;

    // Similar to ignoreNextPlayProgressEvent, when the user clears the
    // queue, one final play-progress event is fired off when the widget
    // pauses. We want to avoid sending that final event and instead
    // keep the currentPosition value 0.
    if(state.clear) {
      state.currentPosition = 0;
    }

    chrome.runtime.sendMessage({
      action: "NOTIFY",
      type: "song-progress",
      state: state
    });
  }, 100));

  if(!isProd() && DEBUG.createQueue) {
    addToQueue("https://soundcloud.com/mellomusicgroup/pete-rock-one-two-a-few-more-1");
    addToQueue("https://soundcloud.com/wrgmag/whats-really-good-mix-series-vol18-by-deejay-theory");
    addToQueue("http://soundcloud.com/iamgangus/drderggangus-old-chub");
    addToQueue("http://soundcloud.com/alltrapmusic/buku-blur-1");
    addToQueue("http://soundcloud.com/lidogotsongs/lido-canblaster-superspeed-1");
    addToQueue("http://soundcloud.com/mrmarstoday/soulful-jawn");
    addToQueue("http://soundcloud.com/mrmarstoday/dem-apples");
  }

  // Listens to messages from content script and popup script
  chrome.runtime.onMessage.addListener(messageHandler);
});

function _notifyNextSong() {
  chrome.runtime.sendMessage({
    action: "NOTIFY",
    type: "next-song",
    state: state
  });
}
