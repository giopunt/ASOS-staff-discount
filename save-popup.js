var tablink = undefined;
var tabId = undefined;

$("document").ready(function(){
    chrome.tabs.getSelected(null, function(tab) {
        tabId = tab.id;
        tablink = tab.url;

        // send a request to the background page to store a new tabId
        chrome.runtime.sendMessage({type:"new tabid", tabid:tabId});
    });
    $("#save").on("click", save_options.bind(this));
    $('#cmn-toggle-1').on("change", save_options.bind(this));
    load_options();
});

function save_options() {
    var yesOrNo = $("#cmn-toggle-1").is(":checked");
    localStorage["asos_disco"] = yesOrNo;
    setStatus(yesOrNo);
    if(tablink.indexOf("asos.") > -1){
        chrome.runtime.sendMessage({type:"refresh"});
    }
}

function load_options() {
    var yesOrNo = ( typeof(localStorage["asos_disco"]) === "undefined" ) || (localStorage["asos_disco"] === "true");
    if(yesOrNo){
        $("#cmn-toggle-1").attr("checked", true);
        setStatus(yesOrNo);
    }else{
        setStatus(yesOrNo);
        $("#cmn-toggle-1").attr("checked", false);
    }
} 

function setStatus(yesOrNo){
    var status = yesOrNo ? "ON" : "OFF";        
    chrome.browserAction.setIcon({path: yesOrNo?"icon-on-16.png": "icon-16.png"});
    $("#status").text(status);
}