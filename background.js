// keeps track of all the tracks in the queue
// and the current song playing
var queue = {
  "tracks": [],
  "index": 0
};

function resolve(url) {
  $.get('http://api.soundcloud.com/resolve.json?url=' + url + '&client_id=be1435461b3275ac389c9f47f61e2560',
    function(result) {
      queue.tracks.push(result);
  });
}

// Listens to messages from content script and popup script
chrome.runtime.onMessage.addListener(
  function(message, sender, sendResponse) {
    console.log(sender);
    console.log(message);

    // if given a track from content script, adds track to the queue
    if(sender.tab && ("track" in message)) {
      queue.tracks.push(message.track);
    }
    // if signaled popup is open, send back queue object
    else if(!sender.tab && message.visible) {
      sendResponse(queue);
    }
  }
);
