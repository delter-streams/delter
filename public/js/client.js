var socket = io();

socket.on('update', function(item){
  var p = document.createElement('p');
  p.className = 'item item-'+item.alg;

  var img = document.createElement('img');
  img.src = item.icon;
  img.alt = 'icon';

  var id = document.createElement('a');
  id.href = 'http://twitter.com/' + item.name;
  id.appendChild(img);

  p.appendChild(id);

  var link = document.createElement('a');
  link.href = item.url;
  link.innerText = item.title;
  p.appendChild(link);

  var div = document.getElementsByClassName('items')[item.alg-1];
  if (div.children.length < 50) div.insertBefore(p, div.firstChild);
  else div.replaceChild(p, div.lastChild);
});

socket.on('trend', function(trends){
  var div = document.getElementsByClassName('trends')[0];
  div.removeChild(div.firstChild);

  var ul = document.createElement('ul');
  var cnt = 0;
  for (var i = 0; i < trends.length; i++) {
    if (trends[i].tweet_volume) {
      var li = document.createElement('li');
      li.appendChild(document.createTextNode(trends[i].name));
      ul.appendChild(li);
      if (++cnt == 5) break;
    }
  }

  div.appendChild(ul);
});
