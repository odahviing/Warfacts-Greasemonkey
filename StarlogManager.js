// ==UserScript==
// @name        Starlog Manager
// @namespace   bitbucket.org/Odahviing
// @include     http://www.war-facts.com/starlog.php*
// @version     1.0
// @grant       none
// ==/UserScript==

// Version 1.0 - Inital Script - Player filter + Real Time

// Features So Far
// --- Ability to filter with "player" messages only


function loadPlayerMessages()
{
  var newLink = document.createElement('a');
  newLink.setAttribute('class', "darkbutton smalltext");
  newLink.innerHTML = "Player";
  newLink.addEventListener("click", loadOnlyPlayer);
 
  var linksObject = document.getElementsByClassName('left starlog_right box dark padding5 minheight60')[0];
  linksObject.insertBefore(newLink, linksObject.firstChild);
  linksObject.children[1].innerHTML = "Stargroup";
  addRealDate();
}

// Based of guardian21 script
function addRealDate()
{
   var divs = document.getElementById("midcolumn").getElementsByTagName("div")[0].getElementsByTagName("div");
   var i, current_div, realTimeEST,timetext,timeDateSpan,temp;

   //For each starlog entry
   for (i = 3; i < divs.length; i+=3) 
   {	//i=3 because first are headers 

      current_div = divs[i].children[0];

      timeDateSpan = current_div.getElementsByTagName("span")[0];
      if (timeDateSpan === undefined)
      {
        if (i + 1 < divs.length)
        {
          i = i + 1;
          current_div = divs[i].children[0];
          timeDateSpan = current_div.getElementsByTagName("span")[0];
        }
        else
        {
          break;
        }
      }

      realTimeEST = timeDateSpan.title;

      //Process real time. Add the timezone diffrence, change Date if needed
      var thehours = parseInt(realTimeEST.substr(0,2));
      var dateString =  realTimeEST.substr(9,2);  
      thedate  = parseInt(dateString);
      thehours += timeZoneDiff;

      if (thehours >= 24) 
      {
        thehours -= 24; thedate ++ ;
        dateString = thedate.toString();
        if (thedate < 10) { dateString = "0" + dateString;}
      }

      var hoursString = thehours.toString();
      if (thehours < 10) { hoursString = "0" + hoursString;}

      var myTimeDate = dateString + realTimeEST.substring(11,19) + "  " + hoursString + realTimeEST.substring(2,8);
      var myp = document.createElement("p");
      myp.style.color = "yellow";
      myp.innerHTML = myTimeDate;
     
      current_div.appendChild(myp);
   }
  
}

function loadOnlyPlayer()
{
  window.location.replace("http://www.war-facts.com/starlog.php?#1");
}

function onlyPlayer()
{
  var allLines = document.getElementsByClassName('shadow');
  
  xhttp = new XMLHttpRequest();
  xhttp.open("GET", "http://www.war-facts.com/starlog.php?offset=100&type=2", false);
  xhttp.send();  
  
  var div = document.createElement('div');
  div.innerHTML = xhttp.responseText; 
  
  var moreValues = div.getElementsByClassName('fullwidth dark tbborder');
  for (index = 0; index < moreValues.length; index++)  allLines[1].appendChild(moreValues[index]);
  
  var removeList = [];
 
  for (var groupsIndex = 0; groupsIndex < groups.length; groupsIndex ++)
  {
    var lines =  allLines[1].getElementsByClassName('fullwidth dark tbborder starlog_' + groups[groupsIndex]);
    for (var index = 0; index < lines.length; index++)  removeList.push(lines[index]);    
  }    
  for (index = 0; index < removeList.length; index++) removeList[index].remove();
  var left = document.getElementsByClassName('fullwidth dark tbborder');
  for (index = 0; index < left.length; index++) 
  {
    var isGroup = left[index].getElementsByClassName('groupmessageheader');
    if (isGroup.length == 1) removeList.push(left[index]);
  }
  for (index = 0; index < removeList.length; index++) removeList[index].remove();
}

function removePlayerMessages()
{
  var allMessages = document.getElementsByClassName('fullwidth dark tbborder');
  var removeList = [];
  
  for (var index = 0; index < allMessages.length; index ++)
  {
    var isGroup = allMessages[index].getElementsByClassName('groupmessageheader');
    if (isGroup.length == 0) removeList.push(allMessages[index]);
  }
  
  for (index = 0; index < removeList.length; index++) removeList[index].remove();
}

// Loading
//Set Time zone Difference
var currentdate = new Date(); 
var timeZoneDiff = currentdate.getTimezoneOffset() / 60;	// Difference between user time and UTC time in hours
	timeZoneDiff = -timeZoneDiff;	// I want to know user compared to utc, not utc compared to user
	timeZoneDiff += 5;	//Difference between UTC and EST (server is in EST)
var groups = ["fleet", "explore", "colony", "empire", "science"];

// Start
loadPlayerMessages();
var index = document.URL.indexOf("?");
if (index != -1)
{

  var getType = document.URL.substring(index + 1);    
  if (getType == "type=2") removePlayerMessages();
  else if (getType =="#1") onlyPlayer();
}