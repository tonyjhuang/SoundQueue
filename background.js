$(function() {
// keeps track of all the tracks in the queue
// and the current song playing
var queue = {
  /*
  tracks[0].title for song title
  tracks[0].url for song url
  */
  "tracks": [],
  "index": 0
};

  var widget = SC.Widget("sc-widget");

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

  var addToQueue = function(url) {
    SC.get('http://api.soundcloud.com/resolve.json?url=' + url,
    function(result) {
      queue.tracks.push(result);
    });
  }

  var playSong = function(url) {
    widget.load(url, {
      callback: function() {
        widget.play();
      }
    });
  }

  // Listens to messages from content script and popup script
  chrome.runtime.onMessage.addListener(
    function(message, sender, sendResponse) {
      // if given a track from content script, adds track to the queue
      if(sender.tab && message.track === "CURRENT_URL") {
        chrome.tabs.getSelected(null, function(tab) {
          addToQueue(tab.url);
        });
      }
      else if(sender.tab && ("track" in message)) {
        addToQueue("https://soundcloud.com" + message.track);
      }
      // if signaled popup is open, send back queue object
      else if(!sender.tab && message.visible) {
        sendResponse(queue);
      }
      else if (!sender.tab && message.index) {
        queue.index = message.index;
        var currentSongUri = queue.tracks[queue.index].uri;
        playSong(currentSongUri);
      }
    }
  );

  playSong("https://api.soundcloud.com/tracks/196848636");
});
