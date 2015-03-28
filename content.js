

chrome.extension.onMessage.addListener(function(message, sender, sendResponse) {
  // browser button click.
  /*alert("Hello!");
  switch(message.type) {
      case "colors-div":
          var divs = document.querySelectorAll(".sound__header");
          if(divs.length === 0) {
              alert("There are no any divs in the page.");
          } else {
              for(var i=0; i<divs.length; i++) {
                  divs[i].style.backgroundColor = message.color;
              }
          }
      break;
  }*/
});

function addQueueButtons() {
  setTimeout(function() {_addQueueButtonsLoop()}, 250);
}

/*
  Constantly try to add queue buttons and reposition usernames. Since
  SoundCloud is an SPA, we don't get notified when the user scrolls 
  down to load more sounds or navigates to another page (e.g. a user
  or track). 
*/
function _addQueueButtonsLoop() {
  if($(".soundTitle__playButton").length != 0) {
    _addQueueButtons();  
  }

  setTimeout(function() {_addQueueButtonsLoop()}, 100);
}

/*
  Add a bunch of queue buttons to the page. Looks for the existence
  of a play button, clones it, and adds it to the DOM. Also applies
  styling and attaches an event listener.
*/
function _addQueueButtons() {
  var queueImage = chrome.extension.getURL("art/queue.png");

  $(".soundTitle__playButton, .soundBadge__actions .sc-button-group").each(function(index) {
    // If this playButton div already has a queue button, ignore it.
    if($(this).children(".queue-button").length === 0) {
      var queueButton = $($(this).children(".sc-button-play, .heroPlayButton")[0]).clone();

      // Add class to queue buttons that exist in the hover play thing.
      if($(this).hasClass("sc-button-group")) {
        $(queueButton).addClass("hover-queue");
      }

      // Style points.
      $(queueButton).addClass("queue-button");
      $(queueButton).css({
        "background-image": "url(" + queueImage + ")"
      });

      if($(this).hasClass("soundTitle__playButton")) {
        $(this).append(queueButton);
      } else {
        $($(this).children()[0]).after(queueButton);
      }


      // Attach click listener.
      var onClickFunction;

      // heroPlayButtons don't have sibling a tags so tell the background
      // script to use the current url.
      if($(queueButton).hasClass("heroPlayButton")) {
        onClickFunction = function() {
          chrome.runtime.sendMessage({track: "CURRENT_URL"});
        };
      } else if ($(queueButton).hasClass("hover-queue")) {
        onClickFunction = function() {
          var trackHref = _getTrackHrefForHoverQueueButton(queueButton);
          chrome.runtime.sendMessage({track: trackHref});
        }
      } else {
        // Get the url from the queue button by checking it's sibling a tags.
        onClickFunction = function() {        
          var trackHref = _getTrackHrefForQueueButton(queueButton);
          chrome.runtime.sendMessage({track: trackHref});
        };
      }

      $(queueButton).on("click", onClickFunction);
    }
  });
}

/*
  Make sure your queueButton element is attached to the 
  DOM before calling this function!
*/
function _getTrackHrefForQueueButton(queueButton) {
  return $(queueButton).parent().parent().find(".soundTitle__title").attr("href");
}

/*
  Make sure your queueButton element is attached to the 
  DOM before calling this function!
*/
function _getTrackHrefForHoverQueueButton(queueButton) {
  return $(queueButton).parent().parent().parent().parent().parent().find(".soundTitle__title").attr("href");
}


function _hasParentClass(element, clazz) {
  return $(element).parents(clazz).length > 0;
}

addQueueButtons();
















