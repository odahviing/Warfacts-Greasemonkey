// ==UserScript==
// @name        IntelligenceAutoSetup 
// @namespace   Cohanman.Resources
// @include     http://*.war-facts.com/intelligence.php
// @include     http://*.war-facts.com/empire_known_universe.php
// @description Small script to auto-chose settings for AR planets
// @version     1
// @grant       none
// ==/UserScript==


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



