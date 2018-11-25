// ==UserScript==
// @name         Sensor Net Manager
// @namespace    github.com/odahviing/warfacts
// @version      0.2
// @description  Next Generation Sensor Net
// @author       Odahviing
// @match        http://www.war-facts.com/sensorArray.php
// @grant        GM_getValue
// @grant        GM_setValue
// ==/UserScript==

(function() {
    'use strict';
    loadData();
})();

// Loading Functions

function loadData() {
    buildPage(0);
    let currentList = GM_getValue('sensor-list');
    if (!currentList) return;

    let allNetworks = currentList.split('&');
    for (let i = 0; i < allNetworks.length; i++) {
        let currentNetwork = readString(GM_getValue(allNetworks[i]));
        buildPage(i+1, currentNetwork.Name, currentNetwork.Scanner, currentNetwork.Cords, currentNetwork.Range);
    }
    document.getElementsByClassName('padding5 dark shadow')[0].outerHTML = `<div id='data-holder'></div>` + document.getElementsByClassName('padding5 dark shadow')[0].outerHTML;
}

function buildPage(id, name = "", sensor = "", cords = "", range = "") {
    var afterTitle = document.getElementsByTagName('h1')[0];
    afterTitle.outerHTML = afterTitle.outerHTML + htmlIframe(id, name, sensor, cords, range);
    document.getElementById(`buttonUpdate${id}`).addEventListener("click", update);
    document.getElementById(`buttonView${id}`).addEventListener("click", view);
    document.getElementById(`buttonDelete${id}`).addEventListener("click", del);
}

// End Loading Functions

// User Action Functions

function readInputs(_this) {
    var objTable = _this.parentElement.parentElement.parentElement;
    var allInputs = objTable.getElementsByTagName('input');

    var networkName = allInputs[0].value;
    var scannerLevel = allInputs[1].value;
    var coreCords = Cords(allInputs[2].value, allInputs[3].value, allInputs[4].value);
    var range = allInputs[5].value;

    var networkData = Network(networkName, scannerLevel, coreCords, range);
    return networkData;
}

function update(){
    var networkData = readInputs(this);
    if (networkData.Name == "") return;
    saveNode(networkData);
    alert('Added / Updated');
}

function del() {
    var networkData = readInputs(this);
    removeMainList(networkData.Name);
    this.parentElement.parentElement.parentElement.parentElement.remove();
}

function view(){
    var networkData = readInputs(this);
    var allPoints = getAllCords(networkData.Cords, networkData.Scanner, networkData.Range);

    let newData = "";
    for (let i = 0; i < allPoints.length; i++) {
        var distance = getDistance(networkData.Cords, allPoints[i]);
        newData = newData + newRaw(i+1, allPoints[i], distance);
    }

    document.getElementById('data-holder').innerHTML = addHeader() + newData;
    document.getElementById('verify-all').addEventListener("click", verifyAll);

    for (let i = 1; i <= allPoints.length; i++) {
        document.getElementById(`sendButton${i}`).addEventListener("click", sendFleet);
    }
}

function verifyAll() {
    var allActive = [];
    getFleetList().then(function(fleetList) {
        var allListening = document.getElementsByClassName('padding5 dark shadow')[0].getElementsByTagName('tr');
        for (let i = 1; i < allListening.length; i++) {
            let aHold = allListening[i].getElementsByTagName('a')[0];
            if (aHold) {
                let href = aHold.href;
                allActive.push(href.substring(href.indexOf('?') + 7));
            }
        }

        var allLines = document.getElementById('data-holder').getElementsByTagName('tbody')[0].getElementsByTagName('tr');
        for (let i = 0; i < allLines.length; i++) {
            var allTds = allLines[i].getElementsByTagName('td');
            let lineCord = allTds[1].innerHTML.split(', ');
            let theCords = Cords(lineCord[0],lineCord[1],lineCord[2]);
            let exists = fleetList.findIndex(x => isEqual(x.Cords, theCords));
            if (exists == -1) {
                allTds[3].innerHTML = 'Missing';
                allTds[3].style.color = "red"
            }
            else {
                allTds[3].innerHTML = allActive.findIndex(fleetList[exists].Id) >= 0 ? 'Listening' : 'In-Place';
                allTds[4].value = fleetList[exists].Id;
            }
        }
    });
}

function getFleetList() {
    var fleetLists = [];
    return new Promise(function (fulfill, reject){
        divAjaxRequest("GET", 'http://www.war-facts.com/overview.php?view=2', true, true, null).then(function(newDiv) {
            let fleetTable = newDiv.getElementsByTagName('table')[0];
            let allRows = newDiv.getElementsByTagName('tr');
            for (let i = 1 ; i < allRows.length; i++) {
                if (allRows[i].innerHTML.indexOf('Single Vessels') >= 0) break;
                var allAs = allRows[i].getElementsByTagName('a');
                let fleetId = allAs[0].href.substring(allAs[0].href.indexOf('?') + 7);
                let cordsObj = allAs[1].innerHTML.split('');
                fleetLists.push(Fleet(fleetId, Cords(cordsObj[0],cordsObj[1],cordsObj[2]), false));
            }
            return fulfill(fleetLists);
        });
    });
}

function sendFleet() {
    var row = this.parentElement.parentElement;
    var allColumns = row.getElementsByTagName('td');
    let value = allColumns[4].getElementsByTagName('input')[0].value;
    if (value == "") return;
    let lineCord = allColumns[1].innerHTML.split(', ');
    let theCords = Cords(lineCord[0],lineCord[1],lineCord[2]);
    window.open(`http://www.war-facts.com/fleet.php?tpos=global&x=${lineCord[0]}&y=${lineCord[1]}&z=${lineCord[2]}&fleet=${value}`, '_blank');
    return;
}

// End User Action Functions

// Sensors Grid Functions - Logic

function getAllCords(cords, level, fuel) {
    let scanPoints = sTc(level);
    let scanRange = cTr(scanPoints);

    let count = Math.ceil(fuel / (scanRange * 2), 1);
    var allCords = [];

    allCords = allCords.concat(buildRow(cords, scanPoints));
    for (let i = 1; i < count; i++) {
        allCords = allCords.concat(buildRow(addX(clone(cords), 2 * i * scanPoints), scanPoints));
        allCords = allCords.concat(buildRow(addX(clone(cords), 2 * i * -scanPoints), scanPoints));
        allCords = allCords.concat(buildRow(addY(clone(cords), 2 * i * scanPoints), scanPoints));
        allCords = allCords.concat(buildRow(addY(clone(cords), 2 * i * -scanPoints), scanPoints));
    }

    const uniqueCords = [];
    const map = new Map();
    for (const cord of allCords) {
        let sign = cord.X+""+cord.Y+""+cord.Z;
        if(!map.has(sign)){
            map.set(sign, true);    // set any value to Map
            uniqueCords.push(cord);
        }
    }

    return uniqueCords;
}

function buildRow(cords, range) {
    var thisLists = [];

    // Right, Left, Top, Bottom
    thisLists.push(addX(clone(cords), range));
    thisLists.push(addX(clone(cords), -range));
    thisLists.push(addY(clone(cords), range));
    thisLists.push(addY(clone(cords), -range));

    // Above - Right, Left, Top, Bottom
    thisLists.push(addZ(addX(clone(cords), range), range));
    thisLists.push(addZ(addX(clone(cords), range), -range));
    thisLists.push(addZ(addY(clone(cords), range), range));
    thisLists.push(addZ(addY(clone(cords), range), -range));

    // Below - Right, Left, Top, Bottom
    thisLists.push(addZ(addX(clone(cords), -range), range));
    thisLists.push(addZ(addX(clone(cords), -range), -range));
    thisLists.push(addZ(addY(clone(cords), -range), range));
    thisLists.push(addZ(addY(clone(cords), -range), -range));

    return thisLists;
}

function sTc(level) {return level * 50 * 2;}

function cTr(cords) {return cords * 4000};

// End Sensors Grid Functions - Logic

// Saving Functions

function Network(name, level, cords, range) {
    return {
        Name: name,
        Scanner: level,
        Cords: cords,
        Range: range
    }
}

function createString(networkObject) {
    return `${networkObject.Name}&${networkObject.Scanner}&${networkObject.Cords.X}&${networkObject.Cords.Y}&${networkObject.Cords.Z}&${networkObject.Range}`;
}

function readString(networkString) {
    let parts = networkString.split('&');
    return Network(parts[0], parts[1], Cords(parts[2], parts[3], parts[4]), parts[5]);
}

function saveNode(network) {
    GM_setValue(network.Name, createString(network));
    updateMainList(network.Name);
}

function updateMainList(networkName) {
    let currentList = GM_getValue('sensor-list');
    var allNetworks = [];

    if (!currentList) {
        allNetworks.push(networkName);
    }
    else {
        allNetworks = currentList.split('&');
        let index = allNetworks.findIndex(x => x == networkName);
        if (index == -1) {
            allNetworks.push(networkName);
        }
    }

    currentList = allNetworks.join('&');
    GM_setValue('sensor-list', currentList);
}

function removeMainList(networkName) {
    let currentList = GM_getValue('sensor-list');
    let allNetworks = currentList.split('&');
    let index = allNetworks.findIndex(x => x == networkName);
    if (index != -1) {
        allNetworks = allNetworks.filter(x => x != networkName);
        currentList = allNetworks.join('&');
        GM_setValue('sensor-list', currentList);
    }
}

// End Saving Functions

// Cords Class

function Cords(x,y,z) {
    return {X : parseInt(x), Y: parseInt(y), Z: parseInt(z)}
}

function clone(cords) {
    return {X : cords.X, Y: cords.Y, Z: cords.Z}
}

function addX(cords, x) {
    cords.X = cords.X + x;
    return cords;
}

function addY(cords, y) {
    cords.Y = cords.Y + y;
    return cords;
}

function addZ(cords, z) {
    cords.Z = cords.Z + z;
    return cords;
}

function toCords(cords) {
    return `${cords.X}, ${cords.Y}, ${cords.Z}`;
}

function getDistance(cordsA, cordsB) {
    let X = Math.pow(cordsA.X - cordsB.X, 2);
    let Y = Math.pow(cordsA.Y - cordsB.Y, 2);
    let Z = Math.pow(cordsA.Z - cordsB.Z, 2);
    let f = Math.sqrt(X + Y + Z);
    return 4000 * f;
}

function isEqual(cordsA, cordsB) {
    return (cordsA.X == cordsB.X && cordsA.Y == cordsB.Y && cordsA.Z == cordsB.Z);
}

// End Cords Class

// Fleet Class

function Fleet(id, cords, status) {
    return {Id: id, Cords: cords, Status: status};
}

// End Fleet Class

// HTML Painting Functions

function htmlIframe(id, name, sensor, cords, range) {
    if (!cords) cords = {X:"",Y:"",Z:""};

    return `<div id="manage-data${id}">
	<div id="header-data${id}">
		<table id="table-header${id}" style="width:100%">
			<tr class="dark tbborder">
				<td class="padding5">Grid Name:</td>
				<td class="padding5">
					<input type="text" class="darkinput" id="grid-name${id}" value='${name}' />
				</td>
			</tr>
			<tr class="dark tbborder">
				<td class="padding5">Scanner Level:</td>
				<td class="padding5">
					<input type="text" class="darkinput" id="scanner-level${id}" value='${sensor}' />
				</td>
			</tr>
			<tr class="dark tbborder">
				<td class="padding5">Core Point:</td>
				<td class="padding5">
					<input type="text" class="darkinput" id="core-pointX${id}" value='${cords.X}' />
<input type="text" class="darkinput" id="core-pointY${id}" value='${cords.Y}' />
<input type="text" class="darkinput" id="core-pointZ${id}" value='${cords.Z}' />
				</td>
			</tr>
			<tr class="dark tbborder">
				<td class="padding5">Range:</td>
				<td class="padding5">
					<input type="text" class="darkinput" id="range${id}" value='${range}' />
				</td>
			</tr>
			<tr class="dark tbborder">
				<td>
					<input type="button" id='buttonUpdate${id}' value="${id == 0 ? 'Add' : 'Update'}" class="darkbutton dangerbutton" />
					<input type='button' id='buttonDelete${id}' class='darkbutton dangerbutton' value='Delete' />
<input type="button" id='buttonView${id}' class="darkbutton dangerbutton" value="View" />
				</td>
			</tr>
		</table>
	</div>

</div>`;

}

function addHeader() {
    return `<div id="body-data">
		<table id="table-data" style="width:100%">
			<thead class="dark tbborder">
				<td class="padding5" align="center">Id</td>
				<td class="padding5" align="center">Cords</td>
				<td class="padding5" align="center">Distance</td>
				<td class="padding5" align="center">Sensor Status</td>
				<td class="padding5" align="center">Fleet</td>
<td><input id='verify-all' type='button' value='Verify All' class="darkbutton dangerbutton" /></td>
			</thead>
	</div>`;
}

function newRaw(index, cords, distance) {
    return `<tr class="dark tbborder">
        <td align="center">${index}</td>
    <td align="center">${toCords(cords)}</td>
    <td align="center">${toNumber(distance)} km</td>
    <td align="center">Check</td>
    <td align="center"><input type="text" class="darkinput" placeholder="Add Fleet Number" value="" /></td>
<td><input type="text" class="darkbutton" value="Send" id="sendButton${index}" /></td>
    </tr>`;
}

// End HTML Painting Functions


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
            return fulfill(div);
        });
    });
}

function toNumber(num) {
    num = Math.floor(num, 2);
    return num.toString().replace(/(\d)(?=(\d{3})+$)/g, '$1,');
}

// End Utilities Functions

