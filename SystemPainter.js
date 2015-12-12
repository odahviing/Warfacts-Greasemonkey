// ==UserScript==
// @name        System Painter
// @namespace   bitbucket.org/Odahviing
// @include     http://www.war-facts.com/extras/view_system.php?*
// @version     1.0
// @grant       none
// ==/UserScript==

// Version 1.0 - Detect AR planets & Unknown planets

RegularColor = "80FFFF";
ARColor = "00FF00";
unknownColor = "FF0000";

planetsAR = [];
planetsUnknown = [];

main();

function main()
{
   var planetsAR = [];
   var allPlanets = getAllPlanetsId();
   for (var index = 0; index < allPlanets.length; index ++)
   {
      if (isARPlanet(allPlanets[index]) == true)
      {    
         planetsAR.push(allPlanets[index]);
      }
   }
   paintSystemText();
}

function getAllPlanetsId()
{
   var allPlanets = [];
   var allLinks = document.getElementsByTagName('a');
   for (var index = 4 ; index < allLinks.length; index ++)
   {
      var planetId = extractPlanetId(allLinks[index].href);
      allPlanets.push(planetId);
   }
   return allPlanets;
}

function extractPlanetId(textUrl)
{
   if (textUrl.indexOf('&') != -1)
     return textUrl.substring(textUrl.indexOf('?') + 8, textUrl.indexOf('&'));
   else
     return textUrl.substring(textUrl.indexOf('?') + 8);
}

function getPage(url)
{
   xhttp = new XMLHttpRequest();
   xhttp.open("GET", url, false);
   xhttp.send();  

   var div = document.createElement('div');
   div.innerHTML = xhttp.responseText; 
   return div;
}

function isARPlanet(id)
{
   var link = "view_planet.php?planet=" + id;  
   var holder = getPage(link);
   var resources = holder.getElementsByClassName('left tbborder overauto light padding5 box width50');
   if (holder.innerHTML.indexOf('You have ') != -1)
   {
      planetsUnknown.push(id);
      return;
   }
  
   for (var index = 0; index < resources.length; index ++)
   {
      var currentLine = resources[index].getElementsByClassName('percent')[0];
      var value = parseInt(currentLine.innerHTML.replace("%",""));
      if (value == 0)
        return false;
   }
   return true;
}

function paintSystemText()
{
   var allLinks = document.getElementsByTagName('a');
   for (var index = 0; index <allLinks.length; index ++)
   {
      for (var sIndex = 0; sIndex < planetsAR.length; sIndex ++)
      {
         if (allLinks[index].href.indexOf(planetsAR[sIndex]) != -1)
         {
             allLinks[index].innerHTML = allLinks[index].innerHTML.replace(RegularColor, ARColor);
         }
      }
      for (var sIndex = 0; sIndex < planetsUnknown.length; sIndex ++)    
      {
         if (allLinks[index].href.indexOf(planetsUnknown[sIndex]) != -1)
         {
             allLinks[index].innerHTML = allLinks[index].innerHTML.replace(RegularColor, unknownColor);
         }        
      }
      
   }
}