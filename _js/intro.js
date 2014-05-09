/* 
    Created on : May 8, 2014, 12:48:08 AM
    Author     : Siddharth
*/
var current_slide = 1;

function nextSlide() {
	console.log(current_slide)
	if (current_slide < 6) {
		if (current_slide == 5) {
			//console.log("redirect to index.html");
			window.location.assign("index.html")
		} else {
			$('#slide'+current_slide).fadeOut(500);
			current_slide++; 
			$('#slide'+current_slide).fadeIn(500);
			setTimeout(nextSlide, 5000);
	    }
	}
}

$(window).load(function(){
  setTimeout(nextSlide, 5000);
});