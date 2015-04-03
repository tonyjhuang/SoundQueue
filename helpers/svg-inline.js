var latch = 0;
var total = 0;

/*
 * Replace all SVG images with inline SVG
 * See http://stackoverflow.com/a/11978996
 */
$(function() {
  total = $('img.svg').length;
  $('img.svg').each(function(index){
    var $img = $(this);
    var imgID = $img.attr('id');
    var imgClass = $img.attr('class');
    var imgURL = $img.attr('src');

    $.get(imgURL, function(data) {
      // Get the SVG tag, ignore the rest
      var $svg = $(data).find('svg');

      // Add replaced image's ID to the new SVG
      if(typeof imgID !== 'undefined') {
        $svg = $svg.attr('id', imgID);
      }
      // Add replaced image's classes to the new SVG
      if(typeof imgClass !== 'undefined') {
        $svg = $svg.attr('class', imgClass+' replaced-svg');
      }

      // Remove any invalid XML tags as per http://validator.w3.org
      $svg = $svg.removeAttr('xmlns:a');

      if(++latch == total) {
        chrome.runtime.sendMessage({
          action: "NOTIFY",
          type: "svg-replace"
        });
      }

      // Replace image with new SVG
      $img.replaceWith($svg);
    }, 'xml');
  });

});