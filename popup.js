var currentIndex;

function _highlightSong(index) {
	console.log($(".queue-container:nth-child(" + index + ")"));
	$(".queue-container:nth-child(" + index + ")").addClass("highlight");
}

// add song title to popup queue
function _appendToQueue(result) {
	var title = result.title;
	var html = "<div class='song'><p>" + title + "</p></div>";
	$(".queue-container").append(title);
}

// Lets background script know that popup is opened
// and gets the queue object as a response
chrome.runtime.sendMessage({visible:true},
	function(response) {
		currentIndex = response.index; 

		tracks = response.tracks;
		for (i = 0; i < tracks.length; i++) {
			_appendToQueue(tracks[i]);
		}

		_highlightSong(currentIndex);
	}
);