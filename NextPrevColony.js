// ==UserScript==
// @name           Colony Helper
// @description	   Add prev/next links to main colony view page + Mall to buy button
// @namespace      bitbucket.org/Odahviing
// @version		     1.2
// @include        *.war-facts.com/view_colony.php*
// ==/UserScript==

// Version history:
// 1.0	Initial Basic Version
// 1.1  Add warning in colony page for lack in malls
// 1.2  Add the ability to buy malls from mail page

var checkMall = true;
var mallId = 11694;
var effMall = 230.08;

function getQueryString(colonyURL){
	
  var indexPoint = colonyURL.indexOf('?');
	if (indexPoint != -1)
		colonyURL = colonyURL.substring(indexPoint+1, colonyURL.length);
	return colonyURL.replace("colony=", "");
}

function getPrevAndNext(currentColonyNumber){
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
	var colonyId = document.URL.substring(document.URL.indexOf('?') + 1);
	
	colonyId = colonyId.replace("colony=","");
	var missing = people - malled;
	var toBuy = Math.ceil(missing / effMall * 40) + 2;
	baseParams = baseParams + "&buildid=" + mallId + "&colony=" + colonyId + "&amount=" + toBuy;
  xhttp = new XMLHttpRequest();
	xhttp.open("POST", "build_facility.php", true);
  xhttp.setRequestHeader("Content-type", "application/x-www-form-urlencoded");
  xhttp.send(baseParams);
	location.reload();
}

function main()
{
	var currentColonyNumber = getQueryString(document.URL);
	var values = getPrevAndNext(currentColonyNumber);
	var colonyText = document.getElementsByClassName("heading bold pagetitle");
	
	if (values[0] != -1)
		colonyText[0].innerHTML = "<a href='view_colony.php?colony=" + values[0] + "'><font color='yellow'>Prev&nbsp;&nbsp;&nbsp;&nbsp;</font></a>" + colonyText[0].innerHTML;
	if (values[1] != -1)	
		colonyText[0].innerHTML = colonyText[0].innerHTML + "<a href='view_colony.php?colony=" + values[1] + "'><font color='yellow'>&nbsp;&nbsp;&nbsp;&nbsp;Next</font></a>";
	
	if (checkMall == true)
	{
		var allBoxes = document.getElementsByClassName('light padding5 tbborder');
		var pop = allBoxes[0].innerHTML.split(' ');
		var finalPop = parseInt(pop[0].replace("Population:", "").trim());
		var malled = allBoxes[5].innerHTML.split(' ');
		var finalMalled = parseInt(malled[1].replace("people:","").trim());
		if (finalPop * 1.1 > finalMalled)
		{
			allBoxes[5].innerHTML = "<font color='red'>" + allBoxes[5].innerHTML + "</font><input type='button' id='mallbutton' value='buy'>";
			var mainbutton = document.getElementById('mallbutton');
			mainbutton.addEventListener("click", function(){buyMalls(finalPop, finalMalled)}, false);
		}
	}
}

main();