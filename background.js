$(function() {

  var widget = SC.Widget("sc-widget");

  // keeps track of all the tracks in the queue
  // and the current song playing
  var queue = {
    "tracks": [],
    "index": -1
  };

  var addToQueue = function(url) {
    $.get('http://api.soundcloud.com/resolve.json?url=' + url + '&client_id=be1435461b3275ac389c9f47f61e2560',
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
        chrome.tabs.getSelected(null,function(tab) {
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
});
