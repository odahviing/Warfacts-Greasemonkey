// ==UserScript==
// @name         Auto Exploration
// @namespace    bitbucket.org/Odahviing
// @version      2.1
// @description  Ease your exploration mission with smart logic
// @author       Odahviing
// @match        http://www.war-facts.com/fleet*
// @exclude      http://www.war-facts.com/fleet.php?mtype*
// @grant        none
// ==/UserScript==

// Version 1.0 - Base Exploring Support
// Version 2.0 - JavaScript V2 Support [Changed System]
// -- Support auto-click
// -- Support refueling only if needing
// -- Using only jsmap_postload_v2 function to load data
// -- Defending from systems that will lock the probe

// Version 2.1
// -- Bug fix when the button is not ready to load
// -- Design a different way to auto-press the button

// TODO:
// -- Fix Numbering ! My cords is off
// -- Find a Way to NOT go to the same planet (and then priotize by distance)


var JavaScriptV2 = true; // It seems to work on every UI and faster, so no need to use the old code.

var minimumFuelAmount = 50000000;
var maxCount = 5;
var safeDistance = 2000000;
var zoomOutNumber = 3000;

(function() {
    'use strict';
    setTimeout(loadButton, 600);
    setTimeout(pressTheButton, 100);
    // Your code here...
})();

function pressTheButton() {
    if (document.URL.indexOf('callback=1') > 0) getMission('launch')
}

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

// pseudo 3D CSS - Functions

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
var fleetNumber;
var fleetRange;
var fleetFuel;

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

function findUnexploredJSV2(url, firstTry = true) {
    var newLink = extractLink(url);
    return new Promise(function (fulfill, reject){
        var allOptions = [];
        sendAjaxRequest("GET", newLink, true, true, null).then(function(dom) {
            let eachLine = dom.split('\n');
            var nums = createShuffleArray(eachLine.length);
            for (let i = 0 ; i < eachLine.length; i++)
            {
                let eachValue = eachLine[nums[i]].split('\t');
                if (eachValue[6] != 'unexplored') continue;

                let newCords = buildCordsObject(eachValue[3], eachValue[4], eachValue[5]);
                if (eachValue[3] > 300000) continue;
                let distance = getDistance(newCords, mainCord);
                if (distance > fleetRange) continue;

                return fulfill(`http://www.war-facts.com/fleet.php?tpos=global&x=${newCords.X}&y=${newCords.Y}&z=${newCords.Z}&fleet=${fleetNumber}&callback=1`);
            }

            if (firstTry == true)
                return fulfill(findUnexploredJSV2(replaceDeepUrl(url, zoomOutNumber), false))
            else
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

// Fleet Page Functions

function loadButton() {
    let newButton = document.createElement('input');
    newButton.type = 'button'
    newButton.value = 'Explore'
    newButton.style = 'width: 130px;'
    newButton.className = 'darkbutton dangerbutton';
    newButton.addEventListener("click", run);
    var buttonPlace = document.getElementsByClassName('iBlock tbborder padding5 fullwidth light')[0];
    if (buttonPlace)
        buttonPlace.insertBefore(newButton, null);
}

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

function run() {
    fleetNumber = getFleetNumber();
    fleetRange = getFleetRange();
    fleetFuel = getFuelAmount();
    findWH().then(function(status) {
        var baseUrlLink = getMapUrl();
        findUnexplored(baseUrlLink).then(function(result) {
            if (result == false) {
                if (fleetFuel < minimumFuelAmount) {
                    let optionsElements = document.getElementById('target1').getElementsByTagName('option');
                    if (optionsElements.length == 2)
                        return alert('No Place To Re-fuel');
                    else {
                        let finalPlanet = optionsElements[2].value.split(',')[1]
                        document.getElementById('target1').value='tworld,' + finalPlanet;
                        getMission("verify", "target1")
                        return setTimeout(getMission('launch'),100);
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
            alert(reason);
        return false;
        })
    }).catch(function (reason) {
        console.log('Stopping: ' + reason);
        return false;
    });
}

function getMapUrl() {
    var allNavs = document.getElementById('navData').getElementsByClassName('light tbborder padding5');
    var textItem = allNavs[allNavs.length - 1].innerHTML;
    let url = 'http://www.war-facts.com/extras/view_universe.php' + textItem.substring(textItem.indexOf('?'), textItem.indexOf("')")).replace('&amp;','&').replace('&amp;','&').replace('&amp;','&');
    return url;
}

function checkForWH(){
    return new Promise(function (fulfill, reject){
        var link = document.getElementsByClassName('darkbutton')[2].onclick.toString();
        link = "http://www.war-facts.com/extras/scan.php" + link.substring(link.indexOf('?'), link.indexOf("')"));
        divAjaxRequest("GET", link, true, true, null).then(function(newDiv) {
            var All = newDiv.getElementsByTagName('i');
            for (let i = 0 ; i < All.length; i++)
            {
                if (All[i].innerHTML == 'Wormhole!')
                    return fulfill(true);
            }
            return fulfill(false);
        });
    });
}

function checkIf100x3() {
    var firstLine = document.getElementsByClassName('padding5 light tbborder')[0];
    if(firstLine.getElementsByTagName('span')[0].innerHTML == 'System: ')
        return true;
    else
        return false;
}

function findWH(){
    var at100 = checkIf100x3();
    return new Promise(function (fulfill, reject){
        if (at100 == true)
        {
            checkForWH().then(function(isWH) {
                if (isWH == true){
                    alert('Found Wormhole!');
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

function getFuelAmount() {
    var spanItem = document.getElementById('fleetRange').innerHTML.replace(',','').replace(',','').replace(',','');
    return parseInt(spanItem);
}

// End Fleet Page Functions

function replaceDeepUrl(url, zoomOut) {
    let leftSide = url.substring(0,url.indexOf("&z=")+3);
    url = url.replace(leftSide, "");
    let finalParts = url.split('&');
    let newNumberString = (parseInt(finalParts[0]) + zoomOut);
    url = leftSide + newNumberString + "&" + finalParts[1];
    return url;

}

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