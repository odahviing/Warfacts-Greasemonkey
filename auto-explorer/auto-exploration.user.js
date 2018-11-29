// ==UserScript==
// @name         Auto Exploration
// @namespace    github.com/odahviing/warfacts
// @version      2.92
// @description  Ease your exploration mission with automatic smart exploring logic for probing, in a single click
// @author       Odahviing
// @match        http://www.war-facts.com/fleet*
// @exclude      http://www.war-facts.com/fleet.php?mtype*
// @grant        none
// ==/UserScript==

// Version 1.0 - Base Exploring Support
// Version 2.0 - JavaScript V2 Support [New Exploring System]
// -- Support auto-click
// -- Support refueling only if needing, if you have system near by and the fuel enough, go for it
// -- Using only jsmap_postload_v2 function to load data
// -- Avoid systems that will lock the probe without fuel to reach the planets

// Version 2.1
// -- Bug fix when the button is not ready to load
// -- Design a different way to auto-press the button

// Version 2.2 -- Fix a stupid bug that ignore places that had x value of aboue 300000 (so almost every galaxy outside Alpha)
// Version 2.3 -- Code Beautifier
// Version 2.4 -- Change settings so the closest system will be explored, but without duplicate systems

// Version 2.5
// -- Change to only one data cycle, too heavy otherwise
// -- Fix a bug that if the page is loaded to fast, its not pressing explore at time

// Version 2.6 - Bug fix that cause fleets to not avoiding reaching planets that are already on the way to be explored

// Version 2.7
// -- Auto move to next free explorer
// -- Alert if enemy fleet detected

// Version 2.8 - Connect "sent to planet script"

// Version 2.9 - Restore Old internal explore planets

// Settings
var JavaScriptV2 = true; // It seems to work on every UI and faster, so no need to use the old code.

// Settings
var minimumFuelAmount = 50000000; // Will go fuel if below
var safeDistance = 5000000; // If the system is 2m km from the fleet range, we won't go there (need to fix the math a-bit)
var zoomOutNumber = 3000; // The zoomout after failing finding unexplored system.

// Alerts For Enemies
var showEnemies = true;
var enemiesFactions = ['Jarnekk','Scaldarians'];

// Filter Next Fleets By Name
var whiteList = false;
var fleetsName = ['Alpha', 'Delta', 'Epsilon', 'Kappa', 'Lambda'];
var abortletter = "#";

var autoSwitchToNextFleet = true;
var fullAuto = false;

(function() {
    'use strict';
    var timers = (fullAuto == true) ?
        {button : 600, mission : 500, explore : 1000, refresh: 10000, hookPlanet: 500} :
    {button : 600, mission : 400, hookPlanet: 300};

    setTimeout(loadButton, timers.button);
    setTimeout(addInternalButton, timers.button);
    setTimeout(addVerifyPlanetButton, timers.hookPlanet);
    setTimeout(pressTheButton, timers.mission);
    if (fullAuto == true)
    {
        setTimeout(pressExplore, timers.explore);
        setTimeout(reloadPage, timers.refresh);
    }
})();

// On-Load Functions

function loadButton() {
    let newButton = document.createElement('input');
    newButton.type = 'button'
    newButton.value = 'System';
    newButton.id = 'ExploreButton';
    newButton.style = 'width: 80px;'
    newButton.className = 'darkbutton dangerbutton';
    newButton.addEventListener("click", run);
    var buttonPlace = document.getElementsByClassName('iBlock tbborder padding5 fullwidth light')[0];
    if (buttonPlace)
        buttonPlace.insertBefore(newButton, null);
}

function pressTheButton() {
    if (document.URL.indexOf('callback=1') > 0) {
        document.getElementById('objective').value='explore';
        getMission('launch');
        if (autoSwitchToNextFleet == true)
            nextFleet();
    }
}

function pressExplore() {
    if (document.URL.indexOf('auto=1') > 0) {
        let getButton = document.getElementById('ExploreButton');
        if (getButton)
            getButton.click();
        else
            nextFleet();
    }
}

function nextFleet() {
    var allFleets = document.getElementsByClassName('padding5 inlineblock light box');
    if (whiteList == false) {
        window.location = allFleets[0].href + (fullAuto == true ? "#auto=1" : "");
        return;
    }

    for (let i = 0; i < allFleets.length; i++)
    {
        let exists = fleetsName.findIndex(x => allFleets[i].innerHTML.indexOf(x) >= 0);
        if (exists >= 0) {
            if (allFleets[i].innerHTML.indexOf(abortletter) >= 0) continue;

            window.location = allFleets[i].href + (fullAuto == true ? "#auto=1" : "");
            return;
        }
    }
}

function reloadPage() {
    if (document.URL.indexOf('auto=1') > 0)
        location.reload();
}

// End On-Load Functions

// Fleet Functions

var fleetNumber;
var fleetRange;
var fleetFuel;

function getFleetNumber() {
    let tmpUrl = document.URL;
    return tmpUrl.indexOf('?') > 0 ?
        tmpUrl.split('?')[1].split('=')[1] :
        tmpUrl.split('/')[4];
}

function getFleetRange() {
    let elem = document.getElementById('fleetRange').innerHTML;
    return parseInt(elem.replace(',','').replace(',','').replace(',','')) - safeDistance;
}

function getFuelAmount() {
    var spanItem = document.getElementById('fleetRange').innerHTML.replace(',','').replace(',','').replace(',','');
    return parseInt(spanItem);
}

function run() {
    fleetNumber = getFleetNumber();
    fleetRange = getFleetRange();
    fleetFuel = getFuelAmount();
    findWH().then(function(status) {
        var baseUrlLink = getMapUrl();
        findUnexplored(baseUrlLink).then(function(result) {
            if (result == false) {
                if (fleetFuel < minimumFuelAmount) {
                    console.log(`Auto-Exploration: Will Try to Refuel Probe, Only Has: ${fleetFuel.toString().replace(/(\d)(?=(\d{3})+$)/g, '$1,')} Left`);
                    let optionsElements = document.getElementById('target1').getElementsByTagName('option');
                    if (optionsElements.length == 2)
                        return alert('No Place To Re-fuel');
                    else {
                        let finalPlanet = optionsElements[2].value.split(',')[1]
                        document.getElementById('target1').value='tworld,' + finalPlanet;
                        getMission("verify", "target1")
                        setTimeout(getMission('launch'),250);
                        if (autoSwitchToNextFleet == true)
                            setTimeout(nextFleet(), 500);
                        return ;
                    }
                }
                else {
                    return alert('No System Were Found');
                }
            }
            else { // Found an Unexplored system
                window.location = result;
            }
        }).catch(function (reason) {
            console.log(reason);
        return false;
        })
    }).catch(function (reason) {
        console.log('Stopping: ' + reason);
        return false;
    });
}

function findWH(){
    var at100 = checkIf100x3();
    return new Promise(function (fulfill, reject){
        if (at100 == true)
        {
            checkForWH().then(function(isWH) {
                if (isWH == true){
                    alert('Wormhole! / Enemy');
                    return reject('Wormhole');
                }

                let fuelAmount = getFuelAmount();


                return fulfill(true);
            });
        }
        else
            return fulfill(true);
    });
}

function checkIf100x3() {
    var firstLine = document.getElementsByClassName('padding5 light tbborder')[0];
    if(firstLine.getElementsByTagName('span')[0].innerHTML == 'System: ')
        return true;
    else
        return false;
}

function checkForWH(){
    return new Promise(function (fulfill, reject){
        var link = document.getElementsByClassName('darkbutton')[3].onclick.toString();
        link = "http://www.war-facts.com/extras/scan.php" + link.substring(link.indexOf('?'), link.indexOf("')"));
        divAjaxRequest("GET", link, true, true, null).then(function(newDiv) {
            var All = newDiv.getElementsByTagName('i');
            for (let i = 0 ; i < All.length; i++)
            {
                if (All[i].innerHTML == 'Wormhole!')
                    return fulfill(true);
            }

            if (showEnemies == false)
                return fulfill(false);
            var fleets = newDiv.getElementsByClassName('tbborder padding5 light')
            for (let i =0 ; i < fleets.length; i++)
            {
                for (let j = 0; j < enemiesFactions.length; j++)
                {
                    if (fleets[i].innerHTML.indexOf(enemiesFactions[j]) > 0)
                        return fulfill(true);
                }
            }

            return fulfill(false);
        });
    });
}

// End Fleet Page Functions

// Find Unexplored System Functions

function findUnexplored(url) {
    return new Promise(function (fulfill, reject){
        switch (JavaScriptV2)
        {
            case true:
                return fulfill(findUnexploredJSV2(url));
            case false:
                return fulfill(extractFinalLink(findUnexploredPseudo(url, 0)));
                break;
        }
    });
}

function getMapUrl() {
    var allNavs = document.getElementById('navData').getElementsByClassName('light tbborder padding5');
    var textItem = allNavs[allNavs.length - 1].innerHTML;
    let url = 'http://www.war-facts.com/extras/view_universe.php' + textItem.substring(textItem.indexOf('?'), textItem.indexOf("')")).replace('&amp;','&').replace('&amp;','&').replace('&amp;','&');
    return url;
}

function replaceDeepUrl(url, zoomOut) {
    let leftSide = url.substring(0,url.indexOf("&z=")+3);
    url = url.replace(leftSide, "");
    let finalParts = url.split('&');
    let newNumberString = (parseInt(finalParts[0]) + zoomOut);
    url = leftSide + newNumberString + "&" + finalParts[1];
    return url;
}

// pseudo 3D CSS - Functions

var maxCount = 5;

function findUnexploredPseudo(url, count = 0) {
    return new Promise(function (fulfill, reject){
        if (count == 0)
            url = replaceDeepUrl(url, 5000);

        if (count == maxCount) return fulfill(false);
        sendAjaxRequest("GET", url, true, true, null).then(function (html) {
            var parentDiv = document.createElement('div');
            parentDiv.attachShadow({mode: 'open'});
            var div = parentDiv.shadowRoot.appendChild(document.createElement('div'));
            div.innerHTML = html;
            div.style.display = 'none';
            document.body.appendChild(parentDiv);

            var allStars = div.getElementsByTagName('a');
            var nums = createShuffleArray(allStars.length);

            for (let i = 0; i < allStars.length; i++)
            {
                var spanObject = allStars[nums[i]].getElementsByTagName('span')[0];
                if (!spanObject) continue;

                if (spanObject.innerHTML == '? unexplored ?')
                {
                    if ('rgb(255, 0, 0)' == getComputedStyle(spanObject)['color']) continue;
                    let nextLink = "http://www.war-facts.com/extras/view_system.php" + allStars[nums[i]].href.substring(allStars[nums[i]].href.indexOf('?'), allStars[nums[i]].href.indexOf("')"));
                    document.body.removeChild(parentDiv);
                    return fulfill(nextLink);
                }
            }

            document.body.removeChild(parentDiv);
            url = replaceDeepUrl(url, zoomOutNumber);

            return fulfill(findUnexploredPseudo(url, count + 1));
        });
    });
}

function extractFinalLink(url) {
    return new Promise(function (fulfill, reject){
        if (url == false)
            return fulfill(url);
        divAjaxRequest("GET", url, true, true, null).then(function(newDiv) {
            return fulfill(newDiv.getElementsByTagName('a')[0].href);
        });
    });
}

// Javascript V2 - Functions

var mainCord;

function buildCordsObject(x,y,z) {
    return {X : parseInt(x), Y: parseInt(y), Z: parseInt(z)}
}

function getDistance(cordsA, cordsB) {
    let X = Math.pow(cordsA.X - cordsB.X, 2);
    let Y = Math.pow(cordsA.Y - cordsB.Y, 2);
    let Z = Math.pow(cordsA.Z - cordsB.Z, 2);
    let f = Math.sqrt(X + Y + Z);
    return 4000 * f;
}

function isEqule(cordsA, cordsB) {
    return (cordsA.X == cordsB.X && cordsA.Y == cordsB.Y && cordsA.Z == cordsB.Z);
}

function findUnexploredJSV2(url) {
    var newLink = extractLink(url);
    return new Promise(function (fulfill, reject){
        var allCurrentRoutes = [];
        var allOptions = [];
        sendAjaxRequest("GET", newLink, true, true, null).then(function(dom) {
            let eachLine = dom.split('\n');

            console.log(`Auto-Exploration: Got ${eachLine.length} Records To Check`);

            for (let i = 0; i < eachLine.length; i++)
            {
                let eachValue = eachLine[i].split('\t');
                if (eachValue[1] != 'f') continue;
                let cordsUsed = eachValue[7].split('');
                if (cordsUsed[0] == 0) continue;
                allCurrentRoutes.push(buildCordsObject(cordsUsed[0], cordsUsed[1], cordsUsed[2]));
            }

            console.log(`Auto-Exploration: Found ${allCurrentRoutes.length} Already Probes System`);

            for (let i = 0 ; i < eachLine.length; i++)
            {
                let eachValue = eachLine[i].split('\t');
                if (eachValue[6] != 'unexplored') continue;
                if (eachValue[1] == 'p') continue;

                let newCords = buildCordsObject(eachValue[3], eachValue[4], eachValue[5]);
                if (eachValue[3] > 1000000) continue;

                let distance = getDistance(newCords, mainCord);
                if (distance > fleetRange) continue;

                allOptions.push({C: newCords, D: distance});
            }

            console.log(`Auto-Exploration: Found ${allOptions.length} Possible Unexplored Systems To Explore`);
            allOptions.sort(function(a, b) {return a.D - b.D});

            for (let i = 0 ; i < allOptions.length; i++)
            {
                let exists = allCurrentRoutes.find(X => isEqule(X, allOptions[i].C));
                if (!exists)
                {
                    let newCords = allOptions[i].C;
                    console.log(`Auto-Exploration: Decided To Explore Option ${i+1}: (${newCords.X},${newCords.Y},${newCords.Z})`);
                    return fulfill(`http://www.war-facts.com/fleet.php?tpos=global&x=${newCords.X}&y=${newCords.Y}&z=${newCords.Z}&fleet=${fleetNumber}#callback=1`);
                }
            }
            return fulfill(false);
        });
    });
}

function extractLink(url) {
    let values = url.split('?');
    let cords = values[1].split('&');
    let x = cords[0].split('=')[1];
    let y = cords[1].split('=')[1];
    let z = cords[2].split('=')[1];

    mainCord = buildCordsObject(x,y,z);
    return `http://www.war-facts.com/ajax/jsmap_postload_v2.php?centerX=${x}&centerY=${y}&centerZ=${z}&displayRange=25000`;
}

// End Find Unexplored System Functions

// Transfer to Planet Script

function addVerifyPlanetButton() {
    addOption();
    hookButton();
}

function addOption() {
    var fleetOption = document.getElementById('tpos');
    if (fleetOption)
        fleetOption.innerHTML = fleetOption.innerHTML + `<option value="planet">Planet</option>`;
}

function hookButton() {
    originalGetMission = getMission;
    getMission = function(str1, str2) {
        if (!document.getElementById('tpos') || document.getElementById('tpos').value != 'planet') {
            return originalGetMission(str1, str2);
        }
        else {
            let planetId = document.getElementById('xyz').value;
            let fleetId = getFleetNumber();
            window.location = `/fleet.php?tworld=${planetId}&fleet=${fleetId}#callback=1`;
            return;
        }
    }
}

// End Transfer to Planet Script

// Internal Explore

var wantedPlanet;

function addInternalButton()
{
    let amIExplorer = document.getElementById('fleetClass').innerHTML;
    let planetsList = [];

    // Check if we have Explorer Fleet and that we are not flying
    if (amIExplorer != 'Explorer' && amIExplorer != 'Sentry') return;

    let objc = document.getElementById('objective');
    if (objc == undefined) return;
    objc.value='explore';

    // Get all Planets
    let optionsElements = document.getElementById('target1').getElementsByTagName('option');
    for (let index = 2; index < optionsElements.length; index++)
        planetsList.push(optionsElements[index].value.split(',')[1]);

    // Get My Location
    let myCords = document.getElementsByClassName('light tbborder padding5')[3].getElementsByTagName('a')[0].innerHTML;
    if (myCords == '100, 100, 100 local')
        wantedPlanet = planetsList[0];
    else
    {
        let baseLink = document.getElementsByClassName('tbborder highlight overauto')[0].getElementsByTagName('A')[0].href;
        if (baseLink.indexOf('colony') >= 0)
            baseLink = document.getElementsByClassName('tbborder highlight overauto')[0].getElementsByTagName('A')[1].href;
        let extractPlanet = baseLink.substring(baseLink.indexOf('planet=')+7, baseLink.indexOf('fleet=') -1);
        let tmpPlanet = planetsList.findIndex(x => x == extractPlanet);
        if (tmpPlanet == planetsList.length - 1)
            wantedPlanet = -1;
        else
            wantedPlanet = planetsList[tmpPlanet+1];
    }

    if (wantedPlanet == -1) return;

    let newButton = document.createElement('input');
    newButton.type = 'button'
    newButton.value = 'Planet';
    newButton.style = 'width: 80px;'
    newButton.className = 'darkbutton dangerbutton';
    newButton.addEventListener("click", exploreNextPlanet);
    document.getElementsByClassName('iBlock tbborder padding5 fullwidth light')[0].insertBefore(newButton, null);
}

function exploreNextPlanet() {
    let optionsElements = document.getElementById('target1')
    optionsElements.value='tworld,' + wantedPlanet;
    getMission("verify", "target1")
    setTimeout(getMission('launch'),100);
    if (autoSwitchToNextFleet == true)
        nextFleet();
}

// End Internal Explore

// Control Panel Functions

function buildMenu() {
}

function loadSettings() {
}

function saveSettings() {
}

// End

// Utilities Functions

function sendAjaxRequest(type, link, async, withResponse, params) {
    return new Promise(function (fulfill, reject){
        var xhttp = new XMLHttpRequest();
        xhttp.open(type, link , true);
        xhttp.setRequestHeader("Content-type", "application/x-www-form-urlencoded");
        xhttp.send(params);

        xhttp.onreadystatechange = function () {
          if(xhttp.readyState === 4 && xhttp.status === 200) {
              if (withResponse == true)
                  fulfill(xhttp.responseText);
              else
                  fulfill();
          }
        };
    });
}

function divAjaxRequest(type, link, async, withResponse, params) {
    return new Promise(function (fulfill, reject){
        sendAjaxRequest(type, link, async, withResponse, params).then(function(html){
            var div = document.createElement('div');
            div.innerHTML = html;
            fulfill(div);
        });
    });
}

function createShuffleArray(num) {
    var array = new Array(num).fill().map((d, i) => i + 0);
    let counter = array.length;
    while (counter > 0) {
        let index = Math.floor(Math.random() * counter);
        counter--;
        let temp = array[counter];
        array[counter] = array[index];
        array[index] = temp;
    }
    return array;
}

// End Utilities Functions

// End Utilities Functions