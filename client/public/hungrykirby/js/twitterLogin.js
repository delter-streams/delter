$(function(){
  $("#twitter").click(function(){
    $("#welcome_card").css('display', 'none');
    $("#loading").css('display', 'block');
    setTimeout("timeForData()", 3000);
  });
});

function timeForData(){
  $("#loading").css('display', 'none');
  $(".tweets").css('display', 'block');
}
