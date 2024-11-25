// Add this CSS style at the beginning of your content script
const styleSheet = document.createElement("style");
styleSheet.textContent = `
    .link-number {
        background-color: rgba(82, 156, 253, 0.15);;  /* semi-transparent gray that works in both themes */
        // padding: 0.1em 0.4em;
        padding: 0px 1px;
        border-radius: 4px;
        margin-right: 1px;
        font-weight: 500;
        font-size: 0.7em;
        display: inline-block;
        color: #529CFD; 
        // color: inherit;  /* inherit text color from parent */
    }

    /* High contrast version for better accessibility */
    // @media (prefers-contrast: high) {
    // .link-number {
    //     background-color: rgba(82, 156, 253, 0.25);
    //     border: 1.5px solid rgba(82, 156, 253, 0.5);
    //     color: #60A5FF;
    // }
    // }

    // /* Dark theme specific adjustments */
    // @media (prefers-color-scheme: dark) {
    // .link-number {
    //     /* Brighter blue for dark backgrounds */
    //     color: #74B0FF;
    //     /* Slightly more opaque background */
    //     background-color: rgba(82, 156, 253, 0.2);
    // }
    // }

    // /* For light theme */
    // @media (prefers-color-scheme: light) {
    //     .link-number {
    //         background-color: rgba(64, 64, 64, 0.3);
    //     }
    // }

    // /* For dark theme */
    // @media (prefers-color-scheme: dark) {
    //     .link-number {
    //         // background-color: rgba(192, 192, 192, 0.3);
    //         background-color: lightblue;
    //     }
    // }
`;
document.head.appendChild(styleSheet);

const customLog = (...args) => {
  // Convert any non-string arguments to strings for serialization
  const serializedArgs = args.map((arg) => {
    if (typeof arg === "object") {
      try {
        return JSON.stringify(arg);
      } catch (e) {
        return String(arg);
      }
    }
    return String(arg);
  });

  // Create a timestamp
  const timestamp = new Date().toISOString();

  // Create the log message
  const logMessage = {
    // timestamp,
    type: "log",
    source: "content.js",
    message: serializedArgs.join(" "),
    // stack: new Error().stack
  };

  // Send message to background script
  chrome.runtime
    .sendMessage({
      type: "LOG",
      data: logMessage,
    })
    .catch((error) => {
      // Fallback to console.log if messaging fails
      console.log("[CustomLog Failed]", ...args, error);
    });
};

//   console.log = customLog;
