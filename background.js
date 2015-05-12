var tabId = null

chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
    if (request.method == "getLocalStorage"){
      sendResponse({data: localStorage[request.key]});
    }
    if(request.type == "new tabid") {
        tabId = request.tabid;
    }
    else if(request.type == "refresh" && tabId !== null) {
        chrome.tabs.reload(tabId);
    }
    else{
      sendResponse({}); // snub them.
    }
});