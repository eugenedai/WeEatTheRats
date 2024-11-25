const hostName = "com.rats.host";
let port = null;
let lastVisibleLinks;

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  console.log("background message", message);
  switch (message.type) {
    case "LOG":
      const logStyle =
        "background: #a0a0a0; color: #000; padding: 2px 5px; border-radius: 3px;";
      console.log(`%c[content.js] ${message.data.message}`, logStyle);
      // console.log(message.data.message);
      break;
    case "linksUpdate": {
      lastVisibleLinks = message.links;
      console.log("Updated visible links:", lastVisibleLinks);
      break;
    }
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
