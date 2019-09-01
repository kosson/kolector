/*========== NAVBAR TRANSPARENT TO SOLID ==========*/
$(document).ready(function() { //when document(DOM) loads completely. 
    // Transition effect for navbar 
    $(window).scroll(function() { //function is called while you scrolls 
      // checks if window is scrolled more than 300px, adds/removes solid class
      if($(this).scrollTop() > 300) { 
          $('.navbar').addClass('solid'); //add class 'solid' in any element which has class 'navbar'
      } else {
          $('.navbar').removeClass('solid'); //remove class 'solid' in any element which has class 'navbar'
      }
    });
});

/*========== CLOSE MOBILE NAV ON CLICK ==========*/
$(document).ready(function () { //when document loads completely.
$(document).click(function (event) { //click anywhere
    var clickover = $(event.target); //get the target element where you clicked
    var _opened = $(".navbar-collapse").hasClass("show"); //check if element with 'navbar-collapse' class has a class called show. Returns true and false.
    if (_opened === true && !clickover.hasClass("navbar-toggler")) { // if _opened is true and clickover(element we clicked) doesn't have 'navbar-toggler' class
        $(".navbar-toggler").click(); //toggle the navbar; close the navbar menu in mobile.
    }
});
});

/*========== SMOOTH SCROLLING TO LINKS ==========*/
$(document).ready(function(){ //document is loaded
  // Add smooth scrolling to all links
  $("a").on('click', function(event) {//click on any link;anchor tag;

    // Make sure this.hash has a value before overriding default behavior
    if (this.hash !== "") { //for e.g. website.com#home - #home
      // Prevent default anchor click behavior
      event.preventDefault();

      // Store hash
      var hash = this.hash;
      //console.log('hash:',hash)

      // Using jQuery's animate() method to add smooth page scroll
      // The optional number (800) specifies the number of milliseconds it takes to scroll to the specified area
      $('html, body').animate({ //animate whole html and body elements
        scrollTop: $(hash).offset().top //scroll to the element with that hash
      }, 800, function(){

        // Add hash (#) to URL when done scrolling (default click behavior)
        window.location.hash = hash; //website.com - website.com#home
        //Optional remove "window.location.hash = hash;" to prevent transparent navbar on load
      });
    } // End if
  });
});

/*========== BOUNCING DOWN ARROW ==========*/
//down arrow at top
$(document).ready(function(){
  $(window).scroll(function(){ //browser scroll 
    $(".arrow").css("opacity", 1 - $(window).scrollTop() / 350); //set opacity css from 1 to -(negative) infinity of element with class 'arrow'
    //250 is fade pixels
  });
});

/*========== WAYPOINTS ==========*/
$(function(){ // a self calling function
  function onScrollInit( items, trigger ) { // a custom made function
      items.each( function() { //for every element in items run function
      var osElement = $(this), //set osElement to the current 
          osAnimationClass = osElement.attr('data-animation'), //get value of attribute data-animation type
          osAnimationDelay = osElement.attr('data-delay'); //get value of attribute data-delay time

          osElement.css({ //change css of element
              '-webkit-animation-delay':  osAnimationDelay, //for safari browsers
              '-moz-animation-delay':     osAnimationDelay, //for mozilla browsers
              'animation-delay':          osAnimationDelay //normal
          });

          var osTrigger = ( trigger ) ? trigger : osElement; //if trigger is present, set it to osTrigger. Else set osElement to osTrigger

          osTrigger.waypoint(function() { //scroll upwards and downwards
              osElement.addClass('animated').addClass(osAnimationClass); //add animated and the data-animation class to the element.
              },{
                  triggerOnce: true, //only once this animation should happen
                  offset: '70%' // animation should happen when the element is 70% below from the top of the browser window
          });
      });
  }

  onScrollInit( $('.os-animation') ); //function call with only items
  onScrollInit( $('.staggered-animation'), $('.staggered-animation-container') ); //function call with items and trigger
});

/* ===== GESTIONAREA FORMULARULUI DE INTRODUCERE A RESURSELOR ====== */
$(document).ready(function () {

  // Avans către pasul doi al formularului
  $('#next-1').click(function (e) {
    e.preventDefault();

    // o mică validate pe titlul resursei
    if ($('#titlu-res').val() == '') {
      // $('#titluErr').text('Trebuie neapărat să denumești resursa!!!');
      $('#titluErr').toastmessage('showToast', {
        text: "Trebuie neapărat să denumești resursa!!!",
        position: 'top-center', 
        type: 'error', 
        sticky: true,
        stayTime: 10000,
      });
      return false;
    } else if ($('#responsabil').val() == '') {
      $('#titluErr').toastmessage('showToast', {
        text: "Introdu numele celui care propune resursa.",
        position: 'top-center', 
        type: 'error', 
        sticky: true,
        stayTime: 10000,
      });
    } else {
      // arată divul cu id-ul `doi` și ascunde div-ul primului pas din formular `unu`
      $('#doi').show();
      $('#unu').hide();
      // incrementează width-ul bar-ului care indică progresul
      $('#progressBar').css("width", "50%");
      $('#progressText').text('Pasul 2');
    }
  });

  //Mergi înapoi la pasul unu al formularului
  $('#next-2').click(function () {
    // ascunde divul cu id-ul `doi și arată-l pe cel cu id-ul `unu`
    $('#doi').hide();
    $('#unu').show();
    // decrementează width-ul bar-ului care indică progresul
    $('#progressBar').css("width", "25%");
    $('#progressText').text('Pasul 1');
  });

  //Avansează la pasul trei al formularului
  $('#next-3').click(function () {
    // ascunde divul cu id-ul `doi și arată-l pe cel cu id-ul `trei`
    $('#doi').hide();
    $('#trei').show();
    // decrementează width-ul bar-ului care indică progresul
    $('#progressBar').css("width", "75%");
    $('#progressText').text('Pasul 3');
  });

    //Mergi înapoi la pasul doi al formularului
    $('#next-4').click(function () {
      // ascunde divul cu id-ul `trei și arată-l pe cel cu id-ul `doi`
      $('#trei').hide();
      $('#doi').show();
      // decrementează width-ul bar-ului care indică progresul
      $('#progressBar').css("width", "50%");
      $('#progressText').text('Pasul 2');
    });

    //Mergi la pasul patru al formularului
    $('#next-5').click(function () {
      // ascunde divul cu id-ul `trei și arată-l pe cel cu id-ul `patru`
      $('#trei').hide();
      $('#patru').show();
      // incrementează width-ul bar-ului care indică progresul
      $('#progressBar').css("width", "100%");
      $('#progressText').text('Pasul 4');
    });

    //Mergi înapoi la pasul trei al formularului
    $('#next-6').click(function () {
      // ascunde divul cu id-ul `patru și arată-l pe cel cu id-ul `trei`
      $('#patru').hide();
      $('#trei').show();
      // decrementează width-ul bar-ului care indică progresul
      $('#progressBar').css("width", "75%");
      $('#progressText').text('Pasul 3');
    });
});