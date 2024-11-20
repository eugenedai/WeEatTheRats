chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
    if (request.action === "signal_from_popup") {
      console.log("Received message:", request.action);
      sendResponse({ response: "Hello from background!" });
    }
  });