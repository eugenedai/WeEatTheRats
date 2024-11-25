/**
 * Global state variables for tracking links across the page
 */
// Stores currently visible links with their properties
let visibleLinks = [];
// Maps href URLs to their assigned numbers for consistent link numbering
let hrefMap = new Map();
// Counter for assigning sequential numbers to new links
let linkCounter = 1;

/**
 * Resets all global state variables to their initial values
 * Used when needing to restart link tracking from scratch
 */
function resetLinkTracking() {
  visibleLinks = [];
  hrefMap.clear();
  linkCounter = 1;
}

/**
 * Inserts a numbered label before the text content of a link
 * @param {HTMLElement} link - The anchor element to modify
 */
function insertNumberBeforeText(link) {
  // Get the href to look up the assigned number
  let href = link.href;

  const exist = link.querySelector('.link-number');
  if (exist) {
    exist.textContent = `${hrefMap.get(href)}.`;
    return;
  }

  // Create span element to hold the link number
  const numberSpan = document.createElement("span");
  numberSpan.className = "link-number";
  // Add the number with a period after it
  numberSpan.textContent = `${hrefMap.get(href)}.`;

  /**
   * Recursively searches through an element and its children
   * to find the first non-empty text node
   * @param {Node} element - The element to search
   * @returns {Node|null} The first text node found, or null
   */
  function findFirstTextNode(element) {
    // Return the element if it's a non-empty text node
    if (element.nodeType === Node.TEXT_NODE && element.textContent.trim()) {
      return element;
    }

    // Recursively search through child nodes
    for (let child of element.childNodes) {
      const textNode = findFirstTextNode(child);
      if (textNode) return textNode;
    }
    return null;
  }

  // Find where to insert the number
  const textNode = findFirstTextNode(link);
  if (textNode) {
    // Insert before the first text node if found
    textNode.parentNode.insertBefore(numberSpan, textNode);
  } else {
    // Fallback: insert at the start of the link if no text node found
    link.insertBefore(numberSpan, link.firstChild);
  }
}


// Helper function to find and get first text node content
function getFirstTextNodeContent(element) {
    function findFirstTextNode(element) {
        if (element.nodeType === Node.TEXT_NODE && element.textContent.trim()) {
            return element;
        }
        
        for (let child of element.childNodes) {
            const textNode = findFirstTextNode(child);
            if (textNode) return textNode;
        }
        return null;
    }

    const textNode = findFirstTextNode(element);
    return textNode ? textNode.textContent.trim() : '';
}
/**
 * Identifies and processes all visible links in the viewport
 * @returns {Array<Object>} Array of visible links with their properties
 */
function getViewportLinks() {
  const viewportHeight = window.innerHeight;
  const viewportWidth = window.innerWidth;
  const links = document.getElementsByTagName("a");

  // Process each link element
  for (let link of links) {
    // console.log("Link", link)

    //skip youtube thumnnail
    // yt-simple-endpoint inline-block style-scope ytd-thumbnail
    if (
      link.classList.contains("yt-simple-endpoint") &&
      link.classList.contains("ytd-thumbnail")
    ) {
      continue;
    }

    const href = link.href;

    // Look for heading elements first, fall back to the link itself
    const titleElement = link.querySelector("h3");
    const targetElement = titleElement || link;
    const currentText = getFirstTextNodeContent(link);

    // Skip links with no visible text
    if (!currentText.trim()) continue;
    // console.log(" CurrentText", currentText, href);
    if (linkCounter > 99) resetLinkTracking();

    // Check if link is sufficiently visible (30% threshold) and not hidden
    if (isElementSufficientlyVisible(link, 0.3) && isElementVisible(link)) {
      const rect = link.getBoundingClientRect();

      // Process new unique URLs
      if (!hrefMap.has(href)) {
        // Assign next available number
        hrefMap.set(href, linkCounter++);
        // link.innerText = `${hrefMap.get(href)}. ${currentText}`;
        // targetElement.innerHTML = `<span class="link-number">${hrefMap.get(href)}.</span> ${targetElement.innerHTML}`;
        insertNumberBeforeText(link);

        visibleLinks.push({
          text: currentText,
          url: href,
          number: hrefMap.get(href),
          position: {
            top: rect.top,
            left: rect.left,
          },
        });
      } else {
        // Handle links with existing URLs but no number yet
        if (!currentText.match(/\d+\./)) {
          // link.innerText = `${hrefMap.get(href)}. ${currentText}`;
        //   targetElement.innerHTML = `<span class="link-number">${hrefMap.get(
        //     href
        //   )}.</span> ${targetElement.innerHTML}`;
            insertNumberBeforeText(link);

        }
        // Skip if number already added
      }
    }
  }

  // Sort links first by vertical position, then by horizontal position
  // 10px threshold handles slight vertical misalignments
  visibleLinks.sort((a, b) => {
    if (Math.abs(a.position.top - b.position.top) > 10) {
      return a.position.top - b.position.top;
    }
    return a.position.left - b.position.left;
  });

  // Return formatted array with numbered text
  return visibleLinks.map(({ text, url, number }) => ({
    text, 
    url,
    number
  }));
}

/**
 * Determines if enough of an element is visible in the viewport
 * @param {HTMLElement} element - Element to check
 * @param {number} threshold - Minimum visible portion (0-1)
 * @returns {boolean} True if element is sufficiently visible
 */
function isElementSufficientlyVisible(element, threshold = 0.3) {
  const rect = element.getBoundingClientRect();
  const viewportHeight = window.innerHeight;
  const viewportWidth = window.innerWidth;

  // Calculate visible dimensions accounting for viewport boundaries
  const visibleWidth =
    Math.min(rect.right, viewportWidth) - Math.max(rect.left, 0);
  const visibleHeight =
    Math.min(rect.bottom, viewportHeight) - Math.max(rect.top, 0);

  // Calculate ratio of visible area to total area
  const totalArea = rect.width * rect.height;
  const visibleArea = visibleWidth * visibleHeight;
  const visibilityRatio = visibleArea / totalArea;

  return visibilityRatio >= threshold;
}

/**
 * Checks if an element is hidden via CSS properties
 * @param {HTMLElement} element - Element to check
 * @returns {boolean} True if element is visible
 */
function isElementVisible(element) {
  const style = window.getComputedStyle(element);
  return (
    style.display !== "none" &&
    style.visibility !== "hidden" &&
    style.opacity !== "0"
  );
}

/**
 * Extracts readable text from a link element
 * @param {HTMLElement} link - Link element to process
 * @returns {string} Best available text description
 */
function getLinkText(link) {
  // Try direct text content first
  let text = link.textContent.trim();

  // Fall back to image alt text if available
  if (!text) {
    const images = link.getElementsByTagName("img");
    for (let img of images) {
      if (img.alt) {
        text = img.alt.trim();
        break;
      }
    }
  }

  // Try aria-label if still no text
  if (!text) {
    text = link.getAttribute("aria-label") || "";
  }

  // Use href as last resort
  if (!text) {
    text = link.href;
  }

  return text;
}

/**
 * Sets up IntersectionObserver to track link visibility changes
 * @returns {Function} Cleanup function to remove observers
 */
function setupLinkObserver() {
  let currentLinks = [];
  let updateTimeout = null;

  // Create observer to track when links become visible
  const observer = new IntersectionObserver(
    (entries) => {
      // Clear pending updates
      if (updateTimeout) {
        clearTimeout(updateTimeout);
      }

      // Debounce updates to avoid excessive processing
      updateTimeout = setTimeout(() => {
        const newLinks = getViewportLinks();

        // Only send updates when links actually change
        if (JSON.stringify(currentLinks) !== JSON.stringify(newLinks)) {
          currentLinks = newLinks;
          chrome.runtime.sendMessage({
            type: "linksUpdate",
            links: newLinks,
          });
        }
      }, 200); // Batch changes within 100ms window
    },
    {
      threshold: [0.3], // Trigger at 30% visibility
      root: null, // Use viewport as root
    }
  );

  /**
   * Refreshes observation of all links on the page
   */
  function observeAllLinks() {
    // Reset existing observations
    observer.disconnect();

    // Start observing all links
    const links = document.getElementsByTagName("a");
    for (let link of links) {
      observer.observe(link);
    }

    // Send initial state
    const initialLinks = getViewportLinks();
    chrome.runtime.sendMessage({
      type: "linksUpdate",
      links: initialLinks,
    });
  }

  // Watch for DOM changes to catch new links
  const mutationObserver = new MutationObserver((mutations) => {
    observeAllLinks();
  });

  // Observe all DOM changes
  mutationObserver.observe(document.body, {
    childList: true,
    subtree: true,
  });

  // Initial setup
  observeAllLinks();

  // Handle viewport resizing
  const handleResize = () => {
    if (updateTimeout) {
      clearTimeout(updateTimeout);
    }
    updateTimeout = setTimeout(() => {
      const newLinks = getViewportLinks();
      if (JSON.stringify(currentLinks) !== JSON.stringify(newLinks)) {
        currentLinks = newLinks;
        chrome.runtime.sendMessage({
          type: "linksUpdate",
          links: newLinks,
        });
      }
    }, 100);
  };

  window.addEventListener("resize", handleResize, { passive: true });

  // Return cleanup function
  return () => {
    observer.disconnect();
    mutationObserver.disconnect();
    window.removeEventListener("resize", handleResize);
    if (updateTimeout) {
      clearTimeout(updateTimeout);
    }
  };
}

/**
 * Initializes link tracking and sets up cleanup
 */
function initializeLinkTracking() {
  const cleanup = setupLinkObserver();
  // Ensure cleanup runs when page is unloaded
  window.addEventListener("beforeunload", cleanup);
}

// Begin tracking when script loads
initializeLinkTracking();
