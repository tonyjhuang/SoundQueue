/*
  Should control all logic around managing the queue and current playing
  song.
*/


/* 
Env variable to facilitate debugging. 

PLEASE PLEASE PLEASE switch this to false when you're packing this for prod.
*/
var DEBUG = true;

// Initialize Soundcloud SDK
SC.initialize({
  client_id: "be1435461b3275ac389c9f47f61e2560"
});

// keeps track of all the tracks in the queue and the current song playing
// tracks[0].title for song title
// tracks[0].url for song url
var state = {
    "tracks": [],
    "index": -1,
    "replay": false,
    "playing": false
};

// Our SoundCloud widget gets embedded on the persistent and
// non-user facing background.html page. Controls sound streaming.
var widget;

var addToQueue = function(url) {
  SC.get('http://api.soundcloud.com/resolve.json?url=' + url,
    function(result) {
      if(DEBUG) {
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
        if(!DEBUG) { 
          // Let's NOT autoplay the song on first add to avoid migraines.
          playSong(state.index);
          state.playing = true;
        }
      }
    }
  );
}

// Plays the song at the index (if there is one),
// updates the state appropriately.
var playSong = function(index) {
  if(index >= 0 && index < state.tracks.length) {
    state.playing = true; 
    var currentSongUri = state.tracks[index].uri;
    widget.load(currentSongUri, {
      callback: function() {
        widget.play();
      }
    });
  } else {
    state.playing = false;
    widget.pause();
  }
}

function randomizeArray(o){
    for(var j, x, i = o.length; i; j = Math.floor(Math.random() * i), x = o[--i], o[i] = o[j], o[j] = x);
    return o;
};



var messageHandler = function(message, sender, sendResponse) {
  if(DEBUG) {
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
      if("visible" in message && message.visible) {        
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
      var validIndex = state.index >= 0 && state.index < state.tracks.length;
      if(validIndex) {
        widget.play();
      }
      state.playing = validIndex;
      sendResponse(state);
      break;
    case "pause":
      widget.pause();
      state.playing = false;
      break;
    case "prev":
      state.index = Math.max(state.index - 1, -1);
      playSong(state.index);
      sendResponse(state);
      break;
    case "next":
      state.index = Math.min(state.index + 1, state.tracks.length);
      playSong(state.index);
      sendResponse(state);
      break;
    case "select":
      state.index = message.options.index;
      playSong(state.index)
      sendResponse(state);
      break;
    case "replay":
      state.replay = !state.replay;
      sendResponse(state);
      break;
    case "shuffle":
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
      state.tracks = [];
      state.index = -1;
      sendResponse(state);
      break;
    case "volume":
      widget.setVolume(message.options.volume);
      break;
  }
}


$(function() {
  widget = SC.Widget("sc-widget");

  // Listen for song finish event from the widget.
  widget.bind(SC.Widget.Events.FINISH, function() {
    if (state.replay) {
      playSong(state.index);
    } else {
      state.index++;
      if (state.index < state.tracks.length) {
        playSong(state.index);
        chrome.runtime.sendMessage({
          action: "NEXT_SONG",
          state: state
        });
      }
    }
  });

  if(DEBUG) {
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
