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

var url = "https://soundcloud.com";

// Uses soundcloud sdk to get song info from an url
function _resolve(url) {
  SC.get('http://api.soundcloud.com/resolve.json?url=' + url,
    function(result) {
      queue.tracks.push(result);
    }
  );
}

// Initializes soundcloud sdk
SC.initialize({
  client_id: "be1435461b3275ac389c9f47f61e2560"
});

// Listens to messages from content script and popup script
chrome.runtime.onMessage.addListener(
  function(message, sender, sendResponse) {

    // if given a track from content script, adds track to the queue
    if(sender.tab && message.track === "CURRENT_URL") {
      chrome.tabs.getSelected(null, function(tab) {
        _resolve(tab.url);
      });
    }
    else if(sender.tab && ("track" in message)) {
      _resolve(url + message.track);
    }
    // if signaled popup is open, send back queue object
    else if(!sender.tab && message.visible) {
      sendResponse(queue);
    }
  }
);
