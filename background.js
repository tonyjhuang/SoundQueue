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
var queue = {
    "tracks": [],
    "index": -1,
    "replay": false
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
        queue["tracks"].push(result);
      } else { // playlist
        $.each(result.tracks, function(index) {
          queue["tracks"].push(result.tracks[index]);
        });
      }

      if (queue.index === -1) {
        queue.index = 0;
        if(!DEBUG) { 
          // Let's NOT autoplay the song on first add to avoid migraines.
          playSong(queue.index);
        }
      }
    }
  );
}

var playSong = function(index) {
  if(index >= 0 && index < queue.tracks.length) {
    var currentSongUri = queue.tracks[index].uri;
    widget.load(currentSongUri, {
      callback: function() {
        widget.play();
      }
    });
  } else {
    widget.pause();
  }
}

function randomizeArray(o){
    for(var j, x, i = o.length; i; j = Math.floor(Math.random() * i), x = o[--i], o[i] = o[j], o[j] = x);
    return o;
};



var messageHandler = function(message, sender, sendResponse) {
  console.log(message);
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
        sendResponse(queue);
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
      console.log("play");
      var validIndex = queue.index >= 0 && queue.index < queue.tracks.length;
      if(validIndex) {
        widget.play();
      }
      sendResponse({playing: validIndex});
      break;
    case "pause":
      console.log("pause");
      widget.pause();
      sendResponse({playing: false})
      break;
    case "prev":
      console.log("current queue index: " + queue.index);
      queue.index = Math.max(queue.index - 1, -1);
      console.log("new queue index: " + queue.index);
      playSong(queue.index);
      sendResponse({index: queue.index});
      break;
    case "next":
      console.log("current queue index: " + queue.index);
      queue.index = Math.min(queue.index + 1, queue.tracks.length);
      console.log("new queue index: " + queue.index);
      playSong(queue.index);
      sendResponse({index: queue.index});
      break;
    case "select":
      queue.index = message.options.index;
      playSong(queue.index)
      sendResponse({index: queue.index});
      break;
    case "replay":
      queue.replay = !queue.replay;
      sendResponse({replay: queue.replay});
      break;
    case "shuffle":
      queue.index = 0;
      randomizeArray(queue.tracks);
      sendResponse(queue);
      break;
    case "clear":
      queue.tracks = [];
      queue.index = -1;
      sendResponse(queue);
      break;
  }
}


$(function() {
  widget = SC.Widget("sc-widget");

  // Listen for song finish event from the widget.
  widget.bind(SC.Widget.Events.FINISH, function() {
    if (queue.replay) {
    playSong(queue.index);
  } else {
    queue.index++;
    if (queue.index < queue.tracks.length) {
      playSong(queue.index);
      chrome.runtime.sendMessage({updateCurrentIndex: queue.index});
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
