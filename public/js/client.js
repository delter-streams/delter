var socket = io();

socket.on('update', function(item){
  var p = document.createElement('p');

  var img = document.createElement('img');
  img.src = item.icon;
  img.alt = 'icon';
  p.appendChild(img);

  p.appendChild(document.createElement('br'));

  var a = document.createElement('a');
  a.href = item.url;
  a.innerText = item.title;
  p.appendChild(a);

  document.getElementsByClassName('list')[0].appendChild(p);
});
