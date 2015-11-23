// ==UserScript==
// @name           Colony Helper
// @description	   Add Farm/Mall buttons if need to buy, also prev/next button to fast zipping
// @namespace      bitbucket.org/Odahviing
// @version		   2.11
// @include        *.war-facts.com/view_colony.php*
// @grant          GM_getValue
// @grant          GM_setValue
// ==/UserScript==

// Version history:
// 1.0	Initial Basic Version
// 1.1  Add warning in colony page for lack in malls
// 1.2  Add the ability to buy malls from mail page (inner settings for mall)
// 1.3  Some Bug Fix
// 2.0  Add farm Option / Redesign Script
// 2.1x  Add warning if no input has been given / Bug fix

var ColonyId = getQueryString(document.URL);


/* Global Settings */
var addPrevNext = true;
var checkMall = true;
var checkFarm = true;
var farmConstant = 0.18; // Don't have any idea what is the right number, but this number seems more or less right
var multi = 1.1; // How much I want more then I need

/* Prints Id */
var mallId = 12584;
var peopleMall = 36;
var effMall = 794;
// --- //
var farmId = 14285;
var peopleFarm = 33;
var effFarm = 722;

/* Basic Actions & Button Setup */

if (addPrevNext == true)
{
		var prevNextValues = getPrevAndNext(ColonyId);
	  var colonyText = document.getElementsByClassName("heading bold pagetitle");
		if (prevNextValues[0] != -1)
			colonyText[0].innerHTML = "<a href='view_colony.php?colony=" + prevNextValues[0] + "'><font color='yellow'>Prev&nbsp;&nbsp;&nbsp;&nbsp;</font></a>" + colonyText[0].innerHTML;
		if (prevNextValues[1] != -1)	
			colonyText[0].innerHTML = colonyText[0].innerHTML + "<a href='view_colony.php?colony=" + prevNextValues[1] + "'><font color='yellow'>&nbsp;&nbsp;&nbsp;&nbsp;Next</font></a>";	
}

if (isOneBuyerActive() == false) return;

if (peopleMall * peopleFarm == 0)
{
    alert("You didn't update script settings for best blueprints, stopping..");
	return;
}
var mainDataBlock = document.getElementsByClassName('light padding5 tbborder');
var population = parseInt(mainDataBlock[0].innerHTML.split(" ")[0].replace("Population:", "").replace(',','').replace(",",""));
var mallEffective = peopleMall * effMall / 100;
var farmEffective = peopleFarm * effFarm / 100;

if (checkMall == true)
{
	var peopleMalled = parseInt(mainDataBlock[5].innerHTML.split(' ')[1].replace("people:","").replace(",","").replace(",","").trim());
	if (population * 1.1 > peopleMalled)
	{
		mainDataBlock[5].innerHTML = "<font color='red'>" + mainDataBlock[5].innerHTML + "</font><input type='button' id='mallbutton' value='buy'>";
		var mainbutton = document.getElementById('mallbutton');
		mainbutton.addEventListener("click", function(){buyMalls(population * multi, peopleMalled)}, false);		
	}
}

if (checkFarm == true)
{
	var tempHolder = mainDataBlock[16].innerHTML;
	var currentFood = tempHolder.substring(tempHolder.indexOf("</a>") + 4, tempHolder.indexOf("<span>")).replace(",", "").trim();
	if (population * 2 < currentFood) return;
	
    var link = "/extras/colony_res.php?colony=" + ColonyId;
	var div = document.createElement('div');
	div.innerHTML = sendAjaxRequest("GET", link, false, true, "");
  
	var allLines = div.getElementsByTagName('tr');
	var LowValue = allLines[11].getElementsByTagName('td')[1].innerHTML;
	var HighValue = allLines[11].getElementsByTagName('td')[2].innerHTML;
	
	var currentProduction = (parseInt(LowValue) * 0.7 + parseInt(HighValue) * 0.3);
	var resourcesGap = Math.ceil((population - currentProduction * 10) / 10);			
	if (resourcesGap > 0)
	{
		 // Just making sure I don't have to much
		if (currentFood < (population /10 - currentProduction) * 60)
		{
			mainDataBlock[16].innerHTML = "<font color='red'>" + mainDataBlock[16].innerHTML + "</font><input type='button' id='farmbutton' value='buy'>";
			var mainbutton = document.getElementById('farmbutton');		 mainbutton.addEventListener("click", function(){buyFarms(resourcesGap * multi)}, false);
		}
	}
}


/* Helping Functions */

function sendAjaxRequest(type, link, async, withResponse, params)
{
  xhttp = new XMLHttpRequest();
 	xhttp.open(type, link , async);
 	xhttp.setRequestHeader("Content-type", "application/x-www-form-urlencoded");
 	xhttp.send(params);	
	if (withResponse == true)
		return xhttp.responseText;
}

function isOneBuyerActive(){return (checkMall || checkFarm);}

function getQueryString(colonyURL){
  var indexPoint = colonyURL.indexOf('?');
	if (indexPoint != -1)
		colonyURL = colonyURL.substring(indexPoint+1, colonyURL.length);
	return colonyURL.replace("colony=", "");
}

/* Main Functions */

function getPrevAndNext(currentColonyNumber)
{
	var allColoniesFrame = document.getElementById("colonylist");
	var allColonies = allColoniesFrame.getElementsByClassName("colmenu_name");
	if (allColonies.length == 1)
		return [-1, -1];
	
	for (var index = 0; index < allColonies.length; index ++)
	{
  		var currentValue = getQueryString(allColonies[index].href);	
		if (currentColonyNumber == currentValue)
		{
				if (index == 0)
					return [-1, getQueryString(allColonies[index+1].href)];

				if (index == allColonies.length -1)
					return [getQueryString(allColonies[index-1].href), -1];
			
			  return [getQueryString(allColonies[index-1].href), getQueryString(allColonies[index+1].href)];
		}
	}
}

function buyMalls(people, malled)
{
	var baseParams = "build=1&type=3&subtype=8";
	
	var missing = people - malled;

	var toBuy = Math.ceil(missing / (mallEffective * 40));
	baseParams = baseParams + "&buildid=" + mallId + "&colony=" + ColonyId + "&amount=" + toBuy;
  sendAjaxRequest("POST", "build_facility.php", true, false, baseParams);
	
	location.reload();
}

function buyFarms(gap)
{
	
	// First taking data from the page
	var temp = mainDataBlock[3].innerHTML.split(" ")[1];
  var wealth = temp.substring(temp.indexOf('</a>') + 9).trim();
	var wages = document.getElementById('wages').value;
	
	// Now lets see the %
	var farmFert = GM_getValue("farm" + ColonyId);
	if (farmFert == undefined)
	{
		var planetLink = document.getElementById('midcolumn').getElementsByClassName('openextra pointer')[0].title.trim();
		var div = document.createElement('div');
		div.innerHTML = sendAjaxRequest("GET", planetLink, false, true, "");
		var allPlanetValues = div.getElementsByClassName('left tbborder  light padding5 overauto box width50')
		farmFert = allPlanetValues[10].getElementsByTagName('div')[3].innerHTML.replace("%","");
		GM_setValue("farm" + ColonyId, farmFert);
	}
			
	// Finish Calc
	var toBuy = Math.ceil(gap / Math.sqrt(wages/wealth) / Math.sqrt(farmFert * farmConstant) / farmEffective);
	var baseParams = "build=1&type=1&subtype=11";
  baseParams = baseParams + "&buildid=" + farmId + "&colony=" + ColonyId + "&amount=" + toBuy;
	sendAjaxRequest("POST", "build_facility.php", true, false, baseParams);
	location.reload();
}








