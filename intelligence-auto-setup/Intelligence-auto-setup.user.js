// ==UserScript==
// @name        IntelligenceAutoSetup 
// @namespace   Odahviing
// @author      Odahviing
// @include     http://*.war-facts.com/intelligence.php
// @include     http://*.war-facts.com/empire_known_universe.php
// @description Small script to auto-chose settings for AR planets
// @version     1.2
// @grant       none
// ==/UserScript==

    class Cord {
        constructor(stringCord) {
            stringCord.replace(' ','').replace(' ','').replace(' ','');
            let wantedCords = stringCord.split(",");
            this.X = wantedCords[0];
            this.Y = wantedCords[1];
            this.Z = wantedCords[2];
        }
    }

function getDistance(cordsA, cordsB) {
    let X = Math.pow(cordsA.X - cordsB.X, 2);
    let Y = Math.pow(cordsA.Y - cordsB.Y, 2);
    let Z = Math.pow(cordsA.Z - cordsB.Z, 2);
    let f = Math.sqrt(X + Y + Z);
    return 4000 * f;
}

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

function makeButtonForRemove()
{
  var row = document.getElementsByClassName('light padding5 tbborder');
  row[0].innerHTML = row[0].innerHTML + "<input type='button' class='darkbutton' id='btn' value='Remove Colonies'>";
  var button = document.getElementById('btn');
  button.addEventListener("click", removeColonies, false);
}

function makeButtonForOrder()
{
  var row = document.getElementsByClassName('light padding5 tbborder');
  row[0].innerHTML = row[0].innerHTML + "<input type='button' class='darkbutton' id='btn2' value='Sort By Distance'>";
  var button = document.getElementById('btn2');
  button.addEventListener("click", orderByDist, false);
}

function setupPlanet()
{
  $('[name=habit]').val(40);
  $('[name=landmass]').val(15000000000);
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

function orderByDist() {


    var getWantedCords = document.getElementById('xyz').value;
    console.log(getWantedCords);
    let wantedCords = new Cord(getWantedCords);

    let mainTable = document.getElementsByTagName('table')[0];
    let allRows = mainTable.getElementsByTagName('tr');
    for (let i = 0; i < allRows.length; i = i + 5)
    {
        let text = allRows[i].getElementsByClassName('head')[1].innerHTML;
        let cordsText = text.substring(text.indexOf('(') + 1 , text.indexOf(')'));
        var lineCords = new Cord(cordsText);
        let currentDistance = getDistance(wantedCords, lineCords);
        var myp = document.createElement("span");
        myp.style.color = "yellow";
        myp.innerHTML = currentDistance.toFixed(0).replace(/(\d)(?=(\d{3})+$)/g, '$1,') + " km";
        allRows[i].getElementsByClassName('head')[1].innerHTML += myp.outerHTML;
    }
}




makeButtonForRemove();
makeButtonForOrder();
setupPlanet();

