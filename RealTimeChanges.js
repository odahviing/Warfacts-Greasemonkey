// ==UserScript==
// @name        Game to Real Time Changer
// @description Add ETA in real time for fleet arrival
// @namespace   bitbucket.org/Odahviing
// @match       http://*.war-facts.com/fleet.php*
// @match       http://*.war-facts.com/overview.php?view=2
// @version     1.0
// @grant       none
// ==/UserScript==

// Version 1.0 - Intial Script

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
      hours = minutes = 0;
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

function updateFromHours()
{
    var fleetData = document.getElementById("fleetTable");
    var fleets = fleetData.getElementsByTagName("span");

    for (var index = 0; index < fleets.length; ++index) 
    {
      var text = fleets[index].innerHTML;
      var hoursLeft = text.substring(text.indexOf('(') + 1, text.indexOf(')') - 10);
      hoursLeft = parseInt(hoursLeft.replace(',',''));
      if (hoursLeft < 60)
      {
         fleets[index].innerHTML = text + " <font color='yellow'>(" + hoursLeft + " Minutes)</font>";  
      }
      else if (hoursLeft > 1440)
      {
         var leftovers = hoursLeft % 60;
         var hours = (hoursLeft - leftovers) / 60;
         hoursLeft = hours % 24;
         var days = (hours - hoursLeft) /24;
         fleets[index].innerHTML = text + " <font color='yellow'>(" + days + " Days, " + hoursLeft + " Hours)</font>";  
      }
      else
      {
         var minutes = hoursLeft % 60;
         hoursLeft = (hoursLeft - minutes) / 60;
         fleets[index].innerHTML = text + " <font color='yellow'>(" + hoursLeft + " Hours)</font>";  
      }  
    }
}

function main()
{
  var currentLink = window.location.href;
  if (currentLink.indexOf("fleet.php") != -1)
  {
     var textData = document.getElementById("mEta");
     textData.innerHTML = textData.innerHTML + " <font color='yellow'>(" + calcTime(textData.innerHTML) + ")</font>";
     return;
  }
  if (currentLink.indexOf("overview.php") != -1)
  {
     updateFromHours();
  }
}

window.setTimeout(main, 250); // Small time issue before running