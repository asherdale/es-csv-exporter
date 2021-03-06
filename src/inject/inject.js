/*
 * Elasticsearch CSV Exporter
 * v0.1
 * https://github.com/minewhat/es-csv-exporter
 * MIT licensed
 *
 * Copyright (c) 2014-2015 MineWhat,Inc
 *
 * Credits: This extension is created using Extensionizr , github.com/uzairfarooq/arrive
 */
chrome.extension.sendMessage({}, function(response) {
  var readyStateCheckInterval = setInterval(function() {
  if (document.readyState === "complete") {
    clearInterval(readyStateCheckInterval);

    var url = window.location.href;
    if(url.indexOf("app/kibana") >= 0  || url.indexOf("#/discover") >= 0 || url.indexOf(":5601") >= 0){

      var options = {
        fireOnAttributesModification: true,  // Defaults to false. Setting it to true would make arrive event fire on existing elements which start to satisfy selector after some modification in DOM attributes (an arrive event won't fire twice for a single element even if the option is true). If false, it'd only fire for newly created elements.
        onceOnly: false,                     // Defaults to false. Setting it to true would ensure that registered callbacks fire only once. No need to unbind the event if the attribute is set to true, it'll automatically unbind after firing once.
        existing: true                       // Defaults to false. Setting it to true would ensure that the registered callback is fired for the elements that already exists in the DOM and match the selector. If options.onceOnly is set, the callback is only called once with the first element matching the selector.
      };

      document.arrive(".button-group",options, function() {
        var alreadyExists = document.getElementById("elastic-csv-exporter");
        if(!alreadyExists)
          injectCSVExportButton();
      });

      chrome.runtime.sendMessage({"msg": "badge", data: true}, function(){});

    }else{
      //We are in some other page. Just exit.
      chrome.runtime.sendMessage({"msg": "badge", data: false}, function(){});
      return;
    }
  }
  }, 10);
});

function setAttributes(el, attrs) {
  for(var key in attrs) {
    el.setAttribute(key, attrs[key]);
  }
}

function parseTable(){
  var csv = "";
  var tbls = document.getElementsByClassName("discover-table-sourcefield");
  var first_row = true;

  for (var i = 0; i < tbls.length; i++) {

    var tbl = tbls.item(i);
    var dl = tbl.getElementsByTagName("dl")[0];

    //Creates the first row of the CSV file
    if (first_row) {
      var keys = dl.getElementsByTagName("dt");
      for (var c = 0; c < keys.length; c++) {
        var str = keys.item(c).innerHTML;

        //Replace comma with colon
        str = str.replace(/,/g, ";");
    
        //Remove multiple-whitespaces with one
        str = str.replace(/\s+/g, ' ');
    
        //Convert all tag word characters to lower case
        str = str.replace(/<\/*\w+/g, function (s) {
          return s.toLowerCase();
        });
    
        //special cases
        str = str.replace(/<tr><\/tr>/g, "");
    
        //Convert the table tags to commas and white spaces
        str = str.replace(/<\/tr>/g, "\n");
        str = str.replace(/<\/td>/g, ",");
        str = str.replace(/<\/th>/g, ",");
        str = str.replace(/( )?<.+?>( )?/g, "");
        str = str.replace(/,\n/g, "\n");
        str = str.replace(/\n,/g, "\n");
        str = str.replace(/^\s+/g, "");
        str = str.replace(/^,/g, '');

        str = str.slice(0, -1);

        csv += str + ",";
      }
      csv = csv.slice(0, -1);
      csv += "\n";
      first_row = false;
    }

    //Creates the following rows of the CSV file
    var keys = dl.getElementsByTagName("dd");
    for (var c = 0; c < keys.length; c++) {
      var str = keys.item(c).innerHTML;
      //Replace comma with colon
      str = str.replace(/,/g, ";");
  
      //Remove multiple-whitespaces with one
      str = str.replace(/\s+/g, ' ');
  
      //Convert all tag word characters to lower case
      str = str.replace(/<\/*\w+/g, function (s) {
        return s.toLowerCase();
      });
  
      //special cases
      str = str.replace(/<tr><\/tr>/g, "");
  
      //Convert the table tags to commas and white spaces
      str = str.replace(/<\/tr>/g, "\n");
      str = str.replace(/<\/td>/g, ",");
      str = str.replace(/<\/th>/g, ",");
      str = str.replace(/( )?<.+?>( )?/g, "");
      str = str.replace(/,\n/g, "\n");
      str = str.replace(/\n,/g, "\n");
      str = str.replace(/^\s+/g, "");
      str = str.replace(/^,/g, '');
      csv += str + ",";
    }
    csv = csv.slice(0, -1);
    csv += "\n";
  }
  return csv;
}

function parseAndCopyToClipBoard(){
 var csv = parseTable();
  chrome.runtime.sendMessage({"msg": "store-csv", data: csv}, function(response) {
    console.log("CSV Export:", response.status);
  });
}

function createElement(type, attributes, innerHTML){
  var elem = document.createElement(type);

  if(attributes)
    setAttributes(elem, attributes);

  if(innerHTML)
    elem.innerHTML = innerHTML;

  return elem;
}

function createCSVButton(){
  var csvInnerHTML = '<button title="Export to CSV" aria-haspopup="true" aria-expanded="false"  aria-label="Export CSV"> <p style="margin: 0;font-size: 12px;font-weight: 100;">CSV</p> </button>';
  var csvElemAttributes = {"tooltip":"Export CSV", "tooltip-placement":"bottom", "tooltip-popup-delay":"400", "tooltip-append-to-body":"1", "text":"Export CSV", "placement":"bottom", "append-to-body":"1", "class":"ng-scope", "id":"elastic-csv-exporter"};
  var csvButton = createElement('span', csvElemAttributes, csvInnerHTML);
  csvButton.onclick = function(){
    injectMessageSlider();
  };
  return csvButton;
}


function createMessageSlider(){
  var wrapperDiv = createElement('div', {"style": "padding:10px 5px; background-color:#656a76; width:100% !important;", "id":"csv-message-wrapper"});
  var messageBox = createElement('div', {"style": "float:right; margin-top:10px; line-height:2.5em;", "id":"csv-message-box"});
  wrapperDiv.appendChild(messageBox);

  var successText = "CSV Exporter: This will export only the visible query results.";
  var failureText = "Oops, CSV export failed.";
  messageBox.appendChild(createElement('span',null,successText));


  var copyToClipboardHTML = '<button title="Copy to clipboard" aria-expanded="true"  aria-label="Copy to clipboard" style="border: 1px solid #fff;margin-left: 10px;"><p style="margin: 0;font-size: 12px;font-weight:100;">Copy to clipboard</p></button>';
  var copyToClipboard = createElement('span', {"title":"Copy to clipboard"}, copyToClipboardHTML);
  copyToClipboard.onclick = function(){
    parseAndCopyToClipBoard();
  };
  messageBox.appendChild(copyToClipboard);


  var copyToDriveHTML = '<button aria-expanded="true" aria-label="Copy to Google Drive" style="border:1px solid #fff;margin-left: 10px;"><p style="margin: 0;font-size: 12px;font-weight:100;">Google Drive</p></button>';
  var copyToDrive = createElement('span', {"title":"Copy to Google Drive"}, copyToDriveHTML);
  copyToDrive.onclick = function(){
    alert("Coming soon");
  };
  messageBox.appendChild(copyToDrive);

  var CloseHTML = '<button aria-expanded="true" aria-label="Close export slider"><p style="margin: 0;font-size: 12px;font-weight:100;">X</p></button>';
  var close = createElement('span', {"title":"Close export slider"}, CloseHTML);
  close.onclick = function(){
   closeMessageSlider();
  };
  messageBox.appendChild(close);

  return wrapperDiv;
}


function closeMessageSlider(){
  var nav = document.getElementsByTagName("navbar")[0];
  var wrapperDiv = document.getElementById("csv-message-wrapper");

  if(wrapperDiv)
    nav.removeChild(wrapperDiv);
}

function injectMessageSlider(){
  closeMessageSlider();
  var nav = document.getElementsByTagName("navbar")[0];
  var div = createMessageSlider();
  nav.appendChild(div);
}


function injectCSVExportButton() {
  var buttonGroup = document.getElementsByTagName("navbar")[0].getElementsByClassName("button-group");
  var span = createCSVButton();
  buttonGroup[0].appendChild(span);
}
