        // Select all anchor tags on the page
        const links = document.querySelectorAll('a');

        // Loop through each link
        // links.forEach((link,index) => {
        //     // Prepend the number "1" to the link's text content
        //     link.textContent = "[" + String(index+1) + "] " + link.textContent;
        // });
        const linksWithoutImages = Array.from(links).filter(link => {
            return link.textContent.trim().length > 0;
            // return link.querySelector('img') === null; // Check if no <img> exists in the link
        });

        // Log the filtered links
        console.log('Links without images:', linksWithoutImages);

        // Highlight links without images for visualization
        linksWithoutImages.forEach((link, index) => {
            link.textContent = "[" + String(index+1) + "] " + link.textContent;
        });
// const hrefs = links.map(link => link.href);
// console.log(hrefs);




















//         // Get all the links on the page
//         const links = document.querySelectorAll('a');

//         // Filter links that have text content and do not contain <img> elements
//         const linksWithTextNoImages = Array.from(links).filter(link => {
//             // Check if the link has text content (trim to exclude whitespace) and no <img> elements
//             const hasText = link.textContent.trim().length > 0;
//             const hasImages = link.querySelectorAll('img').length > 0;
//             return hasText && !hasImages; // Exclude if there are images
//         });

// links.forEach((link, index) => {
//   // Create a transparent blue block
//   const block = document.createElement("div");
//   block.style.position = "absolute";
//   block.style.top = "0";
//   block.style.left = "0";
//   block.style.width = "100%";
//   block.style.height = "100%";
//     // block.style.backgroundColor = "rgba(121, 242, 255, 0.2)"; // Transparent blue
//   block.style.pointerEvents = "none"; // Allow clicks on the underlying link

//   // Add the index number to the top-right corner
//   const indexLabel = document.createElement("div");
//   indexLabel.style.position = "absolute";
//   indexLabel.style.top = "-12px";
//   indexLabel.style.right = "-12px";
//      indexLabel.style.paddingTop = "-5px";
//     indexLabel.style.height = "20px"
//     indexLabel.style.backgroundColor = "rgba(0, 0, 0, 0.5)"; // White background for readability
//   indexLabel.style.fontSize = "12px";
//   indexLabel.style.color = "white";
//   indexLabel.style.fontWeight = "bold";
//   indexLabel.innerText = index + 1; // Display the 1-based index

//   // Append the index label to the block
//   block.appendChild(indexLabel);

//   // Position the link container for absolute positioning of the block
//   link.style.position = "relative";

//   // Append the block over the link
//   link.appendChild(block);
// });
























// const links = document.querySelectorAll("a");

// links.forEach(link => {
//     link.style.position = "relative";

//     const overlay = document.createElement("div");
//     overlay.style.position = "absolute";
//     overlay.style.top = "0";
//     overlay.style.left = "0";
//     overlay.style.width = "100%";
//     overlay.style.height = "100%";
//     overlay.style.backgroundColor = "rgba(121, 242, 255, 0.1)";
//     overlay.style.pointerEvents = "none";

//     link.appendChild(overlay);
// });



// (function() {
//     // Create a container to hold the list of links
//     const container = document.createElement('div');
//     container.style.position = 'fixed';
//     container.style.top = '0';
//     container.style.right = '0';
//     container.style.backgroundColor = 'rgba(255, 255, 255, 0.8)';
//     container.style.padding = '10px';
//     container.style.maxHeight = '100vh';
//     container.style.overflowY = 'auto';
//     container.style.zIndex = '9999';
//     container.style.border = '1px solid #ccc';
//     container.style.fontFamily = 'Arial, sans-serif';
//     container.style.fontSize = '14px';

//     // Title for the container
//     const title = document.createElement('h3');
//     title.innerText = 'Numbered Links on This Page';
//     container.appendChild(title);

//     // Get all the links on the page
//     const links = document.querySelectorAll('a');

//     // Create a list of links with numbers
//     const list = document.createElement('ul');
//     links.forEach((link, index) => {
//       const listItem = document.createElement('li');
//       listItem.innerHTML = `${index + 1}. <a href="${link.href}" target="_blank">${link.href}</a>`;
//       list.appendChild(listItem);
//     });

//     container.appendChild(list);

//     // Append the container to the body of the page
//     document.body.appendChild(container);
//   })();
