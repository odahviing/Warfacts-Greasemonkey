function sendAjaxRequest(type, link, async, withResponse, params) {
    return new Promise(function (fulfill, reject){
        var xhttp = new XMLHttpRequest();
        xhttp.open(type, link , true);
        xhttp.setRequestHeader("Content-type", "application/x-www-form-urlencoded");
        xhttp.send(params);
console.log('herererer');
        xhttp.onreadystatechange = function () {
          if(xhttp.readyState === 4 && xhttp.status === 200) {
              if (withResponse == true)
                  fulfill(xhttp.responseText);
              else
                  fulfill();
          }
        };
    });
}

function divAjaxRequest(type, link, async, withResponse, params) {
    return new Promise(function (fulfill, reject){
        sendAjaxRequest(type, link, async, withResponse, params).then(function(html){
            var div = document.createElement('div');
            div.innerHTML = html;
            return fulfill(div);
        });
    });
}
