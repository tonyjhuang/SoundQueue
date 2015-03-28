

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
    _repositionUsernames(); 
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

  $(".soundTitle__playButton").each(function(index) {
    // If this playButton div already has a queue button, ignore it.
    if($(this).children(".queue-button").length === 0) {
      var queueButton = $($(this).children(".sc-button-play")[0]).clone();

      // Style points.
      $(queueButton).addClass('queue-button');
      $(queueButton).css({
        "background-image": "url(" + queueImage + ")"
      });

      $(this).append(queueButton);

      $(queueButton).on("click", function() {
        var trackHref = _getTrackHrefForQueueButton(queueButton);
        chrome.runtime.sendMessage({track: trackHref});
      });
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
  Move the soundcloud widgets' usernames to the right to
  make room for the queue button.
*/
function _repositionUsernames() {
  // Move user names
  $(".soundTitle__username").each(function() {
    if(!(_hasParentClass($(this), "visualSound"))) {
      $(this).css("margin-left", "68px");
    } 
  });

  // visual sounds need special casing.
  var visualUsernames = 
    $(".visualSound.streamContext .soundTitle__title,.visualSound.streamContext .soundTitle__username");
  visualUsernames.css("left", "68px");
}

function _hasParentClass(element, clazz) {
  var hasParent = false;
  $(element).parents().each(function(parent) {
    var classes = _getClasses($(this));
    if($.inArray(clazz, classes) > 0) {
      hasParent = true;
      return false; // return false to break from loop.
    } 
  });
  return hasParent;
}

function _getClasses(element) {
  var classes = $(element).attr('class');
  if(classes) {
    return classes.split(/\s+/);
  } else {
    return undefined;
  }
}

addQueueButtons();
















