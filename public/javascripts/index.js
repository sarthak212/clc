/* eslint-disable prefer-arrow-callback, no-var, no-tabs */
$(document).ready(function () {
  // Add specific code to this theme here
  if($('.carousel').swipe)
  {
    $(".carousel").swipe({

      swipe: function (event, direction, distance, duration, fingerCount, fingerData) {
  
        if (direction == 'left') $(this).carousel('next');
        if (direction == 'right') $(this).carousel('prev');
  
      },
      allowPageScroll: "vertical"
    });
  }




  function addBlur() {
    $('#background').addClass('blur');
    $('#content').addClass('blur');
  }

  function removeBlur() {
    $('#background').removeClass('blur');
    $('#content').removeClass('blur');
  }

  // var submit = document.getElementById('customerSave', 'addressSave', 'passwordSave');
  // submit.addEventListener('click', clicked);
  // submit.addEventListener('click', validate);
  
  // Account Page Popups
  $('#editDetails').click(function () {
    $('.accdata').fadeOut();
    $('#detailsForm').fadeToggle();
   
  });
  $('#editAddress').click(function () {
    $('.accdata').fadeOut();
    $('#addressForm').fadeToggle();
    
  });
  $('#pickupAddress').click(function () {
    $('.accdata').fadeOut();
    $('#orderForm1').fadeToggle();
    
  });
  $('#dropupAddress').click(function () {
    $('.accdata').fadeOut();
    $('#orderForm2').fadeToggle();
    
  });
  $('#orderDetails').click(function () {
    $('.accdata').fadeOut();
    $('#orderForm').fadeToggle();
  });
  $('#passwordDetails').click(function () {
    $('.accdata').fadeOut();
    $('#passwordForm').fadeToggle();
    
  });
  $('#newsletterDetails').click(function () {
    $('.accdata').fadeOut();
    $('#newsletterForm').fadeToggle();
  });
  
  $('.password-show').on('click',function(e) {
    if(e.currentTarget.form[1].type == 'password'){
      e.currentTarget.form[1].type = 'text';
    }
    else{
      e.currentTarget.form[1].type = 'password';
    }
  });
  $('.btncolor').on('click',function(){
    $(this).css('background-color','#777');
  });
  $(".btn1").on('click', function () {
    $(".form-signin").toggleClass("form-signin-left");
    $(".form-signup").toggleClass("form-signup-left");
    $(".frame").toggleClass("frame-long");
    $(".signup-inactive").toggleClass("signup-active");
    $(".signin-active").toggleClass("signin-inactive");
    $(".forgot").toggleClass("forgot-left");
    $(this).removeClass("idle").addClass("active");
  });

  $(".btn1-signup").on('click', function () {
    $("frame.nav").toggleClass("nav-up");
    $(".form-signup-left").toggleClass("form-signup-down");
    $(".success").toggleClass("success-left");
    $(".frame").toggleClass("frame-short");
  });

  $(".btn1-signin").on('click', function () {
    $(".btn1-animate").toggleClass("btn1-animate-grow");
    $(".welcome").toggleClass("welcome-left");
    $(".cover-photo").toggleClass("cover-photo-down");
    $(".frame").toggleClass("frame-short");
    $(".profile-photo").toggleClass("profile-photo-down");
    $(".btn1-goback").toggleClass("btn1-goback-up");
    $(".forgot").toggleClass("forgot-fade");
  });

});