// ==UserScript==
// @name        IntelligenceAutoSetup 
// @namespace   Cohanman.Resources
// @include     http://*.war-facts.com/intelligence.php
// @include     http://*.war-facts.com/empire_known_universe.php
// @description Small script to auto-chose settings for AR planets
// @version     1.1
// @grant       none
// ==/UserScript==

// Version 1.0 - Initial Version, set 35b, 50% AR planets
// Version 1.1 - Remove already colonized planets

function removeColonies()
{
  var mainTable = document.getElementsByTagName('table');
  var allColonies = mainTable[0].rows;
  var removeRows = [] 
  for (index = 1; index <allColonies.length ; index = index + 2)
  {
    var innerTableRow = allColonies[index].getElementsByTagName('table')[0].rows[0];    
    var cell = innerTableRow.cells[1];
    if (cell.innerHTML != '&nbsp;')
    {
      removeRows.push(index-1);
      removeRows.push(index);
    }
  }
  
  for (index = removeRows.length -1; index >=0; index --)
    mainTable[0].deleteRow(removeRows[index]);
}

function makeButton()
{
  var row = document.getElementsByClassName('light padding5 tbborder');
  row[0].innerHTML = row[0].innerHTML + "<input type='button' class='darkbutton' id='btn' value='Remove Colonies'>";
  var button = document.getElementById('btn');
  button.addEventListener("click", removeColonies, false);  
}

function setupPlanet()
{


  $('[name=habit]').val(50);
  $('[name=landmass]').val(35000000000);
  $('[name=orderType]').val("land");
  $('[name=orderDirection]').val("desc");
  $('[name=ressel]').val(1);
  var allBoxes = $("input[type=checkbox]");
  $.each(allBoxes, function( index, value ) 
  {
    var checkBox = value;
    if (checkBox.name == "colonized") return true; // On empire page, we had extra checkBox
    checkBox.checked = true;
  });
}

makeButton();
setupPlanet();

