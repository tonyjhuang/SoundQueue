// Initialize Soundcloud SDK
SC.initialize({
  client_id: "be1435461b3275ac389c9f47f61e2560"
});

// keeps track of all the tracks in the queue and the current song playing
// tracks[0].title for song title
// tracks[0].url for song url
var queue = {
    "tracks": [],
    "index": -1
};

var widget;

var replay = false;

var songDone = function() {
  if (replay) {
    console.log("replaying");
    playSong(queue.index);
  } else {
    console.log("not replaying");
    queue.index++;
    if (queue.tracks.length != queue.index) {
      playSong(queue.index);
      chrome.runtime.sendMessage({"nextSong": queue.index});
    }
  }
}

var addToQueue = function(url) {
  SC.get('http://api.soundcloud.com/resolve.json?url=' + url,
    function(result) {
      console.log(result);
      if(result.kind == "track") { // single track
        queue["tracks"].push(result);
      } else { // playlist
        $.each(result.tracks, function(index) {
          console.log(result.tracks[index]);
          queue["tracks"].push(result.tracks[index]);
        });
      }

      if (queue.index === -1) {
        queue.index = 0;
        var currentSongUri = queue.tracks[queue.index].uri;
        playSong(queue.index);
      }
    }
  );
}

var playSong = function(index) {
  var currentSongUri = queue.tracks[index].uri;
  widget.load(currentSongUri, {
    callback: function() {
      widget.play();
    }
  });
}

function shuffle(o){ 
    for(var j, x, i = o.length; i; j = Math.floor(Math.random() * i), x = o[--i], o[i] = o[j], o[j] = x);
    return o;
};

$(function() {
  widget = SC.Widget("sc-widget");

  widget.bind(SC.Widget.Events.FINISH, function() {
    songDone();
  });

  // Listens to messages from content script and popup script
  chrome.runtime.onMessage.addListener(
    function(message, sender, sendResponse) {
      // if given a track from content script, adds track to the queue
      if (sender.tab && message.track === "CURRENT_URL") {
        chrome.tabs.getSelected(null, function(tab) {
          addToQueue(tab.url);
        });
      }
      else if (sender.tab && ("track" in message)) {
        addToQueue("https://soundcloud.com" + message.track);
      }
      // if signaled popup is open, send back queue object
      else if (!sender.tab && message.visible) {
        sendResponse(queue);
      }
      else if(!sender.tab && message.shuffle) {
        queue.index = 0;
        shuffle(queue.tracks);
        sendResponse(queue);
      }
      else if (!sender.tab && "index" in message) {
        queue.index = message.index;
        playSong(queue.index);
      }
      else if (!sender.tab && "pause" in message) {
        if (message.pause) {
          widget.pause();
        } else {
          widget.play();
        }
      }
      else if (!sender.tab && "clear" in message) {
        queue.tracks = [];
        queue.index = -1;
        sendResponse(queue);
      }
      else if (!sender.tab && "replay" in message) {
        replay = !replay;
      }
    }
  );
});
