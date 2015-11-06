// ==UserScript==
// @name        Corruption Adder
// @namespace   Cohenman.Resources
// @description Just a little twick
// @include     http://www.war-facts.com/overview.php?view=1
// @version     1
// @grant       none
// ==/UserScript==


function getCurrentCorruption()
{
  xhttp = new XMLHttpRequest();
  xhttp.open("GET", "/extras/corrtest", false);
  xhttp.send();
  var result = xhttp.responseText;
  var index = result.indexOf("corruption is");
  result = result.substring(index + 14, index + 20);
  var final = result.split(" ");
  return final[0];
}

function main()
{
  var elem = document.getElementsByClassName
    ('dark bold centertext largetext150 padding5 box tbborder');
  if (elem[0].innerHTML != 
    "C O L O N Y &nbsp;&nbsp; A D M I N I S T R A T I O N") return;
  
  var lines = document.getElementsByClassName
    ('padding5 tbborder fullwidth');
  
  lines[2].innerHTML = "Corruption: " + getCurrentCorruption();
}

main();
