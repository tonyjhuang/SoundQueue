// keeps track of all the tracks in the queue
// and the current song playing
var queue = {
  "tracks": [],
  "index": 0
};

var url = "https://soundcloud.com";

// Listens to messages from content script and popup script
chrome.runtime.onMessage.addListener(
  function(message, sender, sendResponse) {

    // if given a track from content script, adds track to the queue
    if(sender.tab && message.track === "CURRENT_URL") {
      chrome.tabs.getSelected(null,function(tab) {
        queue.tracks.push(tab.url);
      });
    }
    else if(sender.tab && ("track" in message)) {
      queue.tracks.push(url + message.track);
    }
    // if signaled popup is open, send back queue object
    else if(!sender.tab && message.visible) {
      sendResponse(queue);
    }
  }
);
