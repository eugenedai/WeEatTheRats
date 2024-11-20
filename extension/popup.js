// popup.js
document.getElementById("sendMessage").addEventListener("click", () => {
  // popup.js
  chrome.runtime.sendMessage({ action: "signal_from_popup" }, function (response) {
      console.log("Response from background:", response);
    });
});
