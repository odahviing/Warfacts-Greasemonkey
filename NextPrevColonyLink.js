// ==UserScript==
// @name           Next & Prev Colony Link
// @description	   Add prev/next links to main colony view page
// @namespace      bitbucket.org/Odahviing
// @version		   1.0
// @include        *.war-facts.com/view_colony.php*
// ==/UserScript==

// Version history:
// 1.0	Initial Basic Version

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
	
function main()
{
	var currentColonyNumber = getQueryString(document.URL);
	var values = getPrevAndNext(currentColonyNumber);
	var colonyText = document.getElementsByClassName("heading bold pagetitle");
	
	if (values[0] != -1)
		colonyText[0].innerHTML = "<a href='view_colony.php?colony=" + values[0] + "'><font color='yellow'>Prev&nbsp;&nbsp;&nbsp;&nbsp;</font></a>" + colonyText[0].innerHTML;
	if (values[1] != -1)	
		colonyText[0].innerHTML = colonyText[0].innerHTML + "<a href='view_colony.php?colony=" + values[1] + "'><font color='yellow'>&nbsp;&nbsp;&nbsp;&nbsp;Next</font></a>";
}

main();