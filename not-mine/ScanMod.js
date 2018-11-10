// ==UserScript==
// @name        Scan Mod
// @namespace   
// @description Scan All Surveyors
// @version     2
// @match        http://*.war-facts.com/sensorArray.php*
// @grant       none
// ==/UserScript==

var scannerList = document.getElementById('fc_ScanTeam').children;
var index = 0;
var scannerListLength = scannerList.length;
var fleetIdRegex = /menufleet_(\d+)/g;

var table = $("table")[1];
var row = table.insertRow(-1);
var cell1 = row.insertCell(0);
cell1.innerHTML = '<input type="submit" name="Auto Perimeter Scan" value="Auto Perimeter Scan" />';
cell1.onclick = (function() {

    requestAllBuoys(scannerListLength, function(requests) {
        // Take out the responses, they are collected in the order they were
        // requested.
        responses = requests.map(function(request) {
            return request.responseText;
        });
        
        console.log('Got results! ' +responses.length);

        var scanTable = document.createElement('table');
        scanTable.width = "100%";
        var scanDiv = document.createElement('div');
        scanDiv.className = 'block';
        scanDiv.appendChild(scanTable);
        var div = $('div', document.getElementById('midcolumn'))[0];
        div.appendChild(scanDiv);

        var count = 1;
        responses.forEach(function(scan) {
            console.log('process response ' + count++);
            var el = $( '<div></div>' );
            el.html(scan);
            var el2 = $('table', el)[1];
            for (x = 1; x < el2.rows.length ; x++) {
                var scanRow = scanTable.insertRow(-1);

                for (y = 0; y < el2.rows.item(x).cells.length; y++) {
                    var cell = scanRow.insertCell(-1);
                    cell.innerHTML = el2.rows.item(x).cells[y].innerHTML;
                }

            }
        });

    });
});

// Makes request to all buoy url's, calling the given callback once
// all have completed with an array of xmlRequests.
function requestAllBuoys (n, cb) {

    var latch = makeLatch(n, cb);

    makeBuoyURLTo(n).map(function (url, i) {
        startXMLRequest('GET', url, latch.bind(undefined, i));
    });

}

// Generates a latch function, that will execute the given callback
// only once the function it returns has been called n times.
function makeLatch (n, cb) {

    var remaining = n,
        results = [],
        countDown;

    countDown = function (i, result) {
        results[i] = result;
        if (--remaining == 0 && typeof cb == 'function') {
            cb(results);
        }
    }

    return countDown;

}

var scannerList = document.getElementById('fc_ScanTeam').children;
// Generates an array of buoy URL's from 1 to n.
function makeBuoyURLTo (n) {

    var i, buoyUrls = [];

    for (i = 0; i < n; i++) {
        var match =  fleetIdRegex.exec(scannerList[i].children[0].id);
        var fleetId = match === null ? 0 : match[1];

        buoyUrls.push('http://www.war-facts.com/extras/scan.php?fleet=' + fleetId);
        fleetIdRegex.lastIndex = 0;
    }

    return buoyUrls;

}

// Create and initiate an XMLRequest, with the given method to the given url.
// The optional callback will be called on successful completion.
function startXMLRequest (method, url, cb) {

    var xmlRequest = createXMLRequest();

    xmlRequest.onreadystatechange = function () {
        if (isXMLFinished(xmlRequest)) {
            if (cb && typeof cb == 'function') {
                cb(xmlRequest, method, url);
            }
        }
    }

    xmlRequest.open(method, url, true);
    xmlRequest.send();

    return xmlRequest;

}

// Initiates an XMLRequest from either HTML5 native, or MS ActiveX depending
// on what is available.
function createXMLRequest () {

    var xmlRequest;

    if (XMLHttpRequest) {
        xmlRequest = new XMLHttpRequest();
    } else {
        xmlRequest = new ActiveXObject('Microsoft.XMLHTTP');
    }

    return xmlRequest;

}

// Verifies that XMLRequest has finished, with a status 200 (OK).
function isXMLFinished (xmlRequest) {
    return (xmlRequest.readyState == 4) && (xmlRequest.status == 200);
}