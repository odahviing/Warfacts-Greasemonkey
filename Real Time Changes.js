// ==UserScript==
// @name        Real Time Changer
// @namespace   Cohenman.Resources
// @description Change from game time to reg time
// @include     http://*.war-facts.com/fleet.php*
// @version     1
// @grant       none
// ==/UserScript==

// Version history:
// 1.0	First basic version

function calcTime(text){
  var splitText = text.split(" ");
  var hours = 0;
  var minutes = 0;
  var seconds = 0;
  switch (splitText.length)
    {
      case 7:
        hours = parseInt(splitText[0]);
        minutes = parseInt(splitText[2]);
        seconds = parseInt(splitText[5]);        
        break;
      case 5:
        hours = 0;
        minutes = parseInt(splitText[0]);
        seconds = parseInt(splitText[3]);
        break;
      case 2:
        hours = minutes = 0
        seconds = parseInt(splitText[0]);
        break;
      default:
        return "n/a";
    }
  
  var overallTime = seconds + 60 * (minutes + 24 * hours); 
  if (overallTime < 60)
    return overallTime + " Seconds";
  
  if (overallTime >= 60 && overallTime < 3600)
  {
    var sec = overallTime % 60;
    overallTime = (overallTime - sec) / 60;
    return overallTime + " Minutes and " + sec + " Seconds";
  }

  var min = overallTime % 60;
  overallTime = (overallTime - min) / 60;
  var sec = overallTime % 60;
  overallTime = (overallTime - sec) / 60;
  
  if (overallTime > 24)
  {
      var hour = overallTime % 24;
      overallTime = (overallTime - hour) / 24;
      return overallTime + " Days, " + hour + " Hours, " + min + " Minutes and " + sec + " Seconds";
  }
  return overallTime + " Hours, " + min + " Minutes and " + sec + " Seconds"; 
}

function main()
{
  var textData = document.getElementById("mEta");
  textData.innerHTML = textData.innerHTML + " <font color='yellow'>(" + calcTime(textData.innerHTML) + ")</font>";
}

window.setTimeout(main, 250); // Small time issue before running