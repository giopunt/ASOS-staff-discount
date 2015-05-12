document.addEventListener("DOMContentLoaded", function(event) {
    chrome.tabs.executeScript( null, { file: "jquery.min.js" } );
    chrome.tabs.executeScript( null, { file: "DISCO.js" } );
});
