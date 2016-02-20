var socket = io();

socket.on('update', function(item){
  var p = document.createElement('p');
  p.className = 'item';

  var img = document.createElement('img');
  img.src = item.icon;
  img.alt = 'icon';

  var id = document.createElement('a');
  id.href = 'http://twitter.com/' + item.name;
  id.appendChild(img);

  p.appendChild(id);

  var link = document.createElement('a');
  link.href = item.url;
  link.innerText = ' ' + item.title;
  p.appendChild(link);

  var div = document.getElementsByClassName('list')[0];
  div.insertBefore(p, div.firstChild);
});
