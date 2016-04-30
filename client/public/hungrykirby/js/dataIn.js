window.onload = function(){
  //$(".tweets").css('display', 'none');
  //$("#loading").css('display', 'none');
  /*$.getJSON("https://delter.herokuapp.com/api/is_authenticated",
  {
    crossDomain: true
  },
  function() {
    console.log("実行");
  })
  .done(function(json) {
      console.log(json);
      if(json.is_authenticated === false){
        $('#tweets').css('display', 'none');
        alert("papa");
      }
  })
  .fail(function(jqXHR, textStatus, errorThrown) {
      console.log("エラー：" + textStatus);
      console.log("テキスト：" + jqXHR.responseText);
  })
  .always(function(json) {
      console.log("完了");
  });*/
  /*var content="";
  jQuery(function($){
    var targetURL = 'https://delter.herokuapp.com/api/is_authenticated';
    var xhr = $.getJSON({
        crossDomain: true,
        type: 'GET',
        url: targetURL,
        //dataType: 'text'
    });
    xhr.success(function(json){
        content = $(json.responseText);
        console.log(content);
        console.log('通信成功');
    });
    xhr.error(function(res){
        console.log('通信失敗');
    });
    xhr.complete(function(json){
      console.log(json);
      if(json.responseText.is_authenticated === false){
        $('#tweets').css('display', 'none');
        alert("papa");
      }
    });
  });*/
  /*$.getJSON('http://api.b.st-hatena.com/entry.count?callback=?', {
    'url':'https://delter.herokuapp.com/api/auth/is_authenticated'*/
  /*$.getJSON('https://delter.herokuapp.com/api/auth/is_authenticated/?callback=?'
  ).then(
      function (cnt){
          console.log(cnt);
      },
      function (){
          alert('error dayo');
      }
  );*/
}
