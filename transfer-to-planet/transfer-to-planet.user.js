// ==UserScript==
// @name         Transfer to Planet
// @namespace    github.com/odahviing
// @version      0.2
// @description  Provide option to send fleet to planet directly
// @author       Odahviing
// @match        http://www.war-facts.com/fleet*
// @grant        none
// ==/UserScript==

// Version 0.1 - Beta Version

(function() {
    'use strict';
    if (isCallBack() == true)
        setTimeout(pressTheButton, 200);
    else
        prepareScript()
})();

function prepareScript() {
    setTimeout(addOption,150);
    setTimeout(hookButton,150);
}

function addOption() {
    var fleetOption = document.getElementById('tpos');
    fleetOption.innerHTML = fleetOption.innerHTML + `<option value="planet">Planet</option>`

}

function hookButton() {
    originalGetMission = getMission;
    getMission = function(str1, str2) {
        if (document.getElementById('tpos').value == 'planet')
        {
            let planetId = document.getElementById('xyz').value;
            let fleetId = getFleetNumber();
            window.location = `/fleet.php?tworld=${planetId}&fleet=${fleetId}#press=1`;
        }
        else
            originalGetMission('verify', 'c');
    }
}

function getFleetNumber() {
    let tmpUrl = document.URL;
    return tmpUrl.indexOf('?') > 0 ?
        tmpUrl.split('?')[1].split('=')[1] :
        tmpUrl.split('/')[4];
}

function pressTheButton() {
    getMission('launch');
}

function isCallBack() {
    return document.URL.indexOf('press=1') > 0;
}