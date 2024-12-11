const hostName = "com.rats.host";
let port = null;
let lastVisibleLinks= [];
let isLinkTrackingEnabled = false;

// Initialize state when background script loads (runs once for the extension)
chrome.storage.local.get(['linkTrackingEnabled'], function(result) {
  isLinkTrackingEnabled = result.linkTrackingEnabled || false;
});


// Listen for content script initialization
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  console.log("background message", message);
  switch (message.type) {
    case "LOG":
      const logStyle = "background: #a0a0a0; color: #000; padding: 2px 5px; border-radius: 3px;";
      console.log(`%c[content.js] ${message.data.message}`, logStyle);
      break;
    case "INIT_CONTENT_SCRIPT":
      // Tell content script whether to start link tracking
      sendResponse({ shouldTrack: isLinkTrackingEnabled });
      break;
    case "linksUpdate":
      lastVisibleLinks = message.links;
      console.log(message.url, "updated visible links:", lastVisibleLinks);
      break;
  }
});

// Listen for new tab loads
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.status === 'complete') {
    // Inject the content script dynamically if needed
    chrome.scripting.executeScript({
      target: { tabId: tabId },
      function: (shouldTrack) => {
        // This runs in the context of the webpage
        if (shouldTrack) {
          if (typeof resetLinkTracking === 'function') {
            resetLinkTracking();
          }
          if (typeof initializeLinkTracking === 'function') {
            initializeLinkTracking();
          }
        }
      },
      args: [isLinkTrackingEnabled]  // Pass the current state
    });
  }
});


// Helper function to extract domain from URL
function extractDomain(url) {
  let domain;
  try {
    domain = new URL(url).hostname;
  } catch (error) {
    console.error("Invalid URL:", url);
    domain = "";
  }
  return domain;
}

function sendNativeMessage(message) {
  console.log("Send native, ", message);
  const messageToSend = message.payload;
  if (port) {
    port.postMessage(messageToSend);
  } else {
    console.error("Native messaging port is not connected");
  }
}

function connectNativeHost() {
  try {
    port = chrome.runtime.connectNative(hostName);

    port.onMessage.addListener((response) => {
      console.log("Received response from native host:", response);

      if (response.type === "hid_cmd") {
        // Handle the retrieved credentials
        handleHidCmd(response.cmd_id, response.parameter);
      }
    });

    port.onDisconnect.addListener(() => {
      console.log("Native host has exited. Attempting to reconnect...");
      port = null;
      setTimeout(connectNativeHost, 1000); // Attempt to reconnect after 1 second
    });
  } catch (e) {
    console.error("Connection error:", e, chrome.runtime.lastError);
  }
}

function applyToAllTabs(action) {
  chrome.tabs.query({}, function(tabs) {
    tabs.forEach(tab => {
      console.log("Tab URL:", tab.url);
      // Only apply to http/https pages (skip chrome:// and other special pages)
      if (tab.url && (tab.url.startsWith('http://') || tab.url.startsWith('https://'))) {
        chrome.scripting.executeScript({
          target: { tabId: tab.id },
          function: action
        }).catch(err => {
          // Silently handle any injection errors (e.g., for restricted pages)
          console.log(`Script injection failed for tab ${tab.id}:`, err);
        });
      }
    });
  });
}

function handleHidCmd(cmd, parameter) {
  // Check if username and password are valid (non-empty strings)
  console.log("handleHidCmd", cmd);
  if (cmd == "click") {
    console.log("Received  input:", parameter);

    const matchedLink = findHrefByNumber(lastVisibleLinks, parameter);

    if (matchedLink) {
      console.log("Navigating to:", matchedLink.url);
      // Navigate the current tab to the matched URL
      chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
        if (tabs[0]) {
          chrome.tabs.update(tabs[0].id, { url: matchedLink.url });
        }
      });
    } else {
      console.log("Did not find match link");
    }
  } else if (cmd == "back") {
    chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
      if (tabs[0]) {
        chrome.tabs.goBack(tabs[0].id);
      }
    });
  } else if (cmd == "forward") {
    chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
      if (tabs[0]) {
        chrome.tabs.goForward(tabs[0].id);
      }
    });
  } else  if (cmd == "down") {
    console.log("Received  input:", parameter);

    const numericTarget = Number(parameter);
    scrollPage(numericTarget);
  } else  if (cmd == "up") {
    console.log("Received  input:", parameter);

    const numericTarget = Number(parameter);
    scrollPage(-numericTarget);
  } else if (cmd == "focus") {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (tabs.length > 0) {
        const tab = tabs[0];
        chrome.windows.update(tab.windowId, { focused: true }, () => {
          chrome.tabs.update(tab.id, { highlighted: true });
        });
      }
    });
  }   else if (cmd == "switch"){
    chrome.storage.local.get(['linkTrackingEnabled'], function(result){
      if (result.linkTrackingEnabled == true){
        chrome.storage.local.set({ linkTrackingEnabled: false }, function() {
          isLinkTrackingEnabled = false;
          applyToAllTabs(() => {
            const numberSpans = document.querySelectorAll('.link-number');
            numberSpans.forEach(span => span.remove());
            window.dispatchEvent(new Event('beforeunload'));
            if (typeof resetLinkTracking === 'function') {
              resetLinkTracking();
            }
          });
        });
        
      }
      else{
        chrome.storage.local.set({ linkTrackingEnabled: true }, function() {
          isLinkTrackingEnabled = true;
          applyToAllTabs(() => {
            if (typeof resetLinkTracking === 'function') {
              resetLinkTracking();
            }
            if (typeof initializeLinkTracking === 'function') {
              initializeLinkTracking();
            }
          });
        });
      }
    });
  }   else if (cmd == "start") {
    chrome.storage.local.set({ linkTrackingEnabled: true }, function() {
      isLinkTrackingEnabled = true;
      applyToAllTabs(() => {
        if (typeof resetLinkTracking === 'function') {
          resetLinkTracking();
        }
        if (typeof initializeLinkTracking === 'function') {
          initializeLinkTracking();
        }
      });

      // Only apply to current active tab
      // chrome.tabs.query({ active: true, currentWindow: true }, function(tabs) {
      //   if (tabs[0] && (tabs[0].url.startsWith('http://') || tabs[0].url.startsWith('https://'))) {
      //     console.log("Start command - Current tab URL:", tabs[0].url);
      //     chrome.scripting.executeScript({
      //       target: { tabId: tabs[0].id },
      //       function: () => {
      //         if (typeof resetLinkTracking === 'function') {
      //           resetLinkTracking();
      //         }
      //         if (typeof initializeLinkTracking === 'function') {
      //           initializeLinkTracking();
      //         }
      //       }
      //     }).catch(err => {
      //       console.log(`Script injection failed for tab ${tabs[0].id}:`, err);
      //     });
      //   }
      // });

    });
  } else if (cmd == "stop") {
    chrome.storage.local.set({ linkTrackingEnabled: false }, function() {
      isLinkTrackingEnabled = false;
      applyToAllTabs(() => {
        const numberSpans = document.querySelectorAll('.link-number');
        numberSpans.forEach(span => span.remove());
        window.dispatchEvent(new Event('beforeunload'));
        if (typeof resetLinkTracking === 'function') {
          resetLinkTracking();
        }
      });
    });
  } else if (cmd == "redraw") {
    chrome.storage.local.set({ linkTrackingEnabled: false }, function() {
      if (isLinkTrackingEnabled == false) return;
      applyToAllTabs(() => {
        const numberSpans = document.querySelectorAll('.link-number');
        numberSpans.forEach(span => span.remove());
        window.dispatchEvent(new Event('beforeunload'));
        if (typeof resetLinkTracking === 'function') {
          resetLinkTracking();
        }
        if (typeof initializeLinkTracking === 'function') {
          initializeLinkTracking();
        }
      });
    });
  } else if (cmd == "righttab") {
    chrome.windows.getCurrent((currentWindow) => {
      chrome.tabs.query({ windowId: currentWindow.id }, (tabs) => {
        // Find the currently active tab
        const activeTabIndex = tabs.findIndex(tab => tab.active);
        console.log("current tab", activeTabIndex)
        // Move to the next tab, wrapping around to the first tab if at the end
        const nextTabIndex = (activeTabIndex + 1) % tabs.length;
        console.log("next tab", nextTabIndex)
        chrome.tabs.update(tabs[nextTabIndex].id, { active: true });
        console.log("moved")
      });
    });
  } else if (cmd == "lefttab") {
    // Get the current window
    chrome.windows.getCurrent((currentWindow) => {
      chrome.tabs.query({ windowId: currentWindow.id }, (tabs) => {
        // Find the currently active tab
        const activeTabIndex = tabs.findIndex(tab => tab.active);
        
        // Move to the next tab, wrapping around to the first tab if at the end
        const nextTabIndex = (activeTabIndex - 1) % tabs.length;
        chrome.tabs.update(tabs[nextTabIndex].id, { active: true });
      });
    });
  } else if (cmd == "newtab") {
    chrome.tabs.create({});
  } else if (cmd == "closetab") {
    // Get the current window
    chrome.windows.getCurrent((currentWindow) => {
      // Query the active tab in the current window
      chrome.tabs.query({ active: true, windowId: currentWindow.id }, (tabs) => {
        // Close the active tab
        if (tabs[0]) {
          chrome.tabs.remove(tabs[0].id);
        }
      });
    });
  } else if (cmd === "bookmark") {
    // Get the current active tab
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      const currentTab = tabs[0];
      
      // Create a bookmark
      chrome.bookmarks.create({
        title: currentTab.title,
        url: currentTab.url
      }, (newBookmark) => {
        // Optional: You could add a notification or console log
        console.log('Bookmarked:', newBookmark);
      });
    });
  }
}


// Initialize native messaging connection
connectNativeHost();

function findHrefByNumber(visibleLinks, targetNumber) {
  const numericTarget = Number(targetNumber);
  for (const link of visibleLinks) {
    if (link.number === numericTarget) {
      console.log("found", link);
      return link;
    }
  }
  return null;
}

function scrollPage(amount) {
  chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
    if (tabs[0]) {
      chrome.scripting.executeScript({
        target: { tabId: tabs[0].id },
        func: (scrollAmount) => {
          window.scrollBy({
            top: scrollAmount,
            behavior: "smooth",
          });
        },
        args: [amount],
      });
    }
  });
}
