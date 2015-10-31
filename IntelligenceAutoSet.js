// ==UserScript==
// @name        IntelligenceAutoSetup 
// @namespace   Odahviing
// @description Auto set values on the intelligence page for good planets, for now its hard-coded
// @include     *.war-facts.com/intelligence.php
// @include     *.war-facts.com/empire_known_universe.php
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



