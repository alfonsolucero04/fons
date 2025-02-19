const svgNamespace = "http://www.w3.org/2000/svg";

// Function to create an SVG element with specified attributes
function createSVGElement(type, attributes) {
    const element = document.createElementNS(svgNamespace, type);
    for (const [attr, value] of Object.entries(attributes)) {
        element.setAttribute(attr, value);
    }
    return element;
}

let currentScale = 1;
let isDragging = false;
let startX, startY;
let offsetX = 0, offsetY = 0;

// Function to zoom in and out
function zoom(delta) {
    currentScale += delta;
    if (currentScale < 1) currentScale = 1; // Limit zoom out to original size
    if (currentScale > 2) currentScale = 2; // Limit zoom in
    updateTransform();
}

// Function to update the SVG transform based on zoom and drag
function updateTransform() {
    const svg = document.getElementById("svgContainer");
    const svgRect = svg.getBoundingClientRect();
    const container = svg.parentElement;
    const containerRect = container.getBoundingClientRect();

    // Center the SVG when zoomed out to original size
    if (currentScale === 1) {
        offsetX = (containerRect.width - svgRect.width) / 2;
        offsetY = (containerRect.height - svgRect.height) / 2;
        svg.classList.remove('dragging-enabled');
    } else {
        svg.classList.add('dragging-enabled');
    }

    svg.style.transform = `translate(${offsetX}px, ${offsetY}px) scale(${currentScale})`;
}

function startDrag(event) {
    if (!document.getElementById("svgContainer").classList.contains('dragging-enabled')) return;
    isDragging = true;
    startX = event.clientX - offsetX;
    startY = event.clientY - offsetY;
    document.getElementById("svgContainer").classList.add("dragging");
    event.preventDefault();
}

function drag(event) {
    if (!document.getElementById("svgContainer").classList.contains('dragging-enabled')) return;
    if (isDragging) {
        offsetX = event.clientX - startX;
        offsetY = event.clientY - startY;
        requestAnimationFrame(updateTransform); // Use requestAnimationFrame for smoother updates
    }
}

function endDrag() {
    isDragging = false;
    document.getElementById("svgContainer").classList.remove("dragging");
}

function displaySVG(data) {
    const svg = document.getElementById("svgContainer");
    const tooltipContainer = document.createElement("div");
    tooltipContainer.classList.add("tooltip-container");
    document.body.appendChild(tooltipContainer);

    let hideTooltipTimeout;

    svg.addEventListener('wheel', (event) => {
        event.preventDefault();
        const delta = event.deltaY < 0 ? 0.1 : -0.1;
        zoom(delta);
    });

    svg.addEventListener('mousedown', startDrag);
    svg.addEventListener('mousemove', drag);
    svg.addEventListener('mouseup', endDrag);
    svg.addEventListener('mouseleave', endDrag);

    data.forEach(path => {
        // Create path element
        const pathElement = createSVGElement("path", { d: path.d, id: path.id });
        pathElement.classList.add(`path-${path.id}`);

path.stations.forEach(station => {
    const locator = createSVGElement("image", {
        href: "test/image/locator.png",
        x: station.x - 12,  // Use X from data.js
        y: station.y - 12,  // Use Y from data.js
        width: 150,
        height: 150,
        class: "locator"
    });

    locator.addEventListener("mouseover", (event) => {
        displayTooltip(event, station);
    });

    locator.addEventListener("click", () => {
        displayStationDetails(station);
    });

    svg.appendChild(locator);
});




        // Add hover event listener to highlight paths with the same ID
        pathElement.addEventListener("mouseover", (event) => {
            document.querySelectorAll(`.path-${path.id}`).forEach(el => {
                el.style.fill = 'rgba(255, 0, 0, 0.5)'; // Highlight effect for all paths with the same ID
            });
            displayTooltip(event, path.stations);
        });

        // Add mouseout event listener to remove highlight from paths with the same ID
        pathElement.addEventListener("mouseout", (event) => {
            document.querySelectorAll(`.path-${path.id}`).forEach(el => {
                if (!el.classList.contains('selected')) {
                    el.style.fill = 'transparent'; // Remove highlight effect for all paths with the same ID
                }
            });
        });

        // Add click event listener to display a single path SVG
        pathElement.addEventListener("click", (event) => {
            displaySinglePath(path);
        });

        // Add the path element to the SVG container
        svg.appendChild(pathElement);

        // Add event listener to display tooltip on mouseover
        pathElement.addEventListener("mouseover", (event) => {
            clearTooltips();

            // Create and display the tooltip for the specific path
            const tooltip = document.createElement("div");
            tooltip.classList.add("tooltip");

            const ul = document.createElement("ul");

            // Add station IDs to the tooltip
            path.stations.forEach(station => {
                const li = document.createElement("li");
                li.textContent = station.id;
                li.addEventListener("click", () => {
                    displayStationDetails(station); // Display station details on click
                    document.querySelectorAll("path").forEach(el => {
                        el.classList.remove('selected');
                        el.style.fill = 'transparent'; // Reset fill color
                    });
                    document.querySelectorAll(`.path-${path.id}`).forEach(el => {
                        el.classList.add('selected'); // Mark paths as selected
                        el.style.fill = 'rgba(255, 0, 0, 0.5)'; // Keep highlight effect for all paths with the same ID
                    });
                });
                ul.appendChild(li);
            });

            tooltip.appendChild(ul);
            tooltipContainer.appendChild(tooltip);

            // Function to update the tooltip position
            const updateTooltipPosition = (e) => {
                tooltip.style.display = "block";
                setTimeout(() => {
                    tooltip.style.opacity = 1; // Fade-in effect
                }, 200); // Add delay before fading in
                tooltip.style.left = `${e.pageX + 10}px`;
                tooltip.style.top = `${e.pageY + 10}px`;
            };

            updateTooltipPosition(event);

            // Keep the tooltip visible when hovering over it
            tooltip.addEventListener("mouseover", () => {
                clearTimeout(hideTooltipTimeout);
                tooltip.style.display = "block";
                tooltip.style.opacity = 1;
            });

            // Clear the tooltips when mouse is out of the path or tooltip
            pathElement.addEventListener("mouseout", hideTooltip);
            tooltip.addEventListener("mouseout", hideTooltip);

            function hideTooltip() {
                hideTooltipTimeout = setTimeout(() => {
                    tooltip.style.opacity = 0; // Reset opacity for next fade-in
                    setTimeout(() => {
                        tooltip.style.display = "none";
                    }, 500); // Increased delay to allow for fade-out
                }, 200); // Add a slight delay before hiding the tooltip
            }
        });
    });

    

    // Function to clear existing tooltips
    function clearTooltips() {
        const tooltips = document.querySelectorAll('.tooltip');
        tooltips.forEach(tooltip => tooltip.remove());
    }

    // Function to display station details on the left container
    function displayStationDetails(station) {
        const leftContainer = document.getElementById("leftContainer");
        leftContainer.innerHTML = `
            <div class="station-details">
                <h3 class="fade-in">${station.id}</h3>
                <p class="fade-in" style="animation-delay: 0.5s"><strong>Title:</strong> ${station.title}</p>
                <p class="fade-in" style="animation-delay: 1s"><img src="${station.image}" alt="${station.title}" width="100"></p>
                <p class="fade-in" style="animation-delay: 1.5s">${station.description}</p>
                <div class="gallery fade-in" style="animation-delay: 2s">
                    <h4>Gallery</h4>
                    ${station.gallery.map(image => `<img src="${image}" alt="${station.title}" width="100">`).join('')}
                </div>
            </div>
        `;
    }


    //Start of DISPLAYING SINGLE PATH

   // Function to display single path SVG
function displaySinglePath(path) {

    
    const coordinates = document.getElementById('coordinates');
    const xCoord = document.getElementById('xCoord');
    const yCoord = document.getElementById('yCoord');
    const svg = document.getElementById("svgContainer");
    const backLink = document.getElementById("backLink");
    const locator = document.getElementById('locator');
    svg.innerHTML = ''; // Clear current SVG content

    

    // Remove drag and zoom event listeners
    svg.removeEventListener('wheel', zoomHandler);
    svg.removeEventListener('mousedown', startDrag);
    svg.removeEventListener('mousemove', drag);
    svg.removeEventListener('mouseup', endDrag);
    svg.removeEventListener('mouseleave', endDrag);

    // Create the tooltip container
    const tooltipContainer = document.createElement("div");
    tooltipContainer.classList.add("tooltip-container");
    document.body.appendChild(tooltipContainer);

    // Find all paths with the same ID
    const pathsWithSameId = pathData.filter(p => p.id === path.id);

    pathsWithSameId.forEach(p => {
        const pathElement = createSVGElement("path", { d: p.d, id: p.id });
        pathElement.classList.add(`path-${p.id}`, 'fade-in-path'); // Add fade-in-path class

      

        path.stations.forEach(station => {
            if (station.id) { // ✅ Ensure station has an ID before creating locator
                const locator = createSVGElement("image", {
                    href: "test/image/locator.png",
                    x: station.x - 12,
                    y: station.y - 12,
                    width: 150,
                    height: 150,
                    class: "locator"
                });

                locator.addEventListener("mouseover", (event) => {
                    displayTooltip(event, station);
                });

                locator.addEventListener("click", () => {
                    displayStationDetails(station);
                });

                svg.appendChild(locator);
            }
        });
        

function displaySinglePath(path) {
    const svg = document.getElementById("svgContainer");
    svg.innerHTML = ''; // Clear previous content

    // Find all paths with the same ID
    const pathsWithSameId = pathData.filter(p => p.id === path.id);
    const pathElements = [];

    // Add all matching paths to the SVG
    pathsWithSameId.forEach(p => {
        const pathElement = createSVGElement("path", { d: p.d, id: p.id });
        svg.appendChild(pathElement);
        pathElements.push(pathElement);
    });


}




        // Add click event listener to display path details
        pathElement.addEventListener("click", (event) => {
            displayPathDetails(p);
        });


       // Function to manually set locator position
       function setLocatorPosition(x, y) {
        locator.setAttribute('x', x - 12); // Centering the locator (24px wide)
        locator.setAttribute('y', y - 12);

        locator.setAttribute('width', 100);  // Change to your preferred size
        locator.setAttribute('height', 100);
    }

    // Example: Manually set the locator at (1000, 1500) in SVG coordinates
    setLocatorPosition(1360, 1993.70);

        // Add the path element to the SVG container
        svg.appendChild(pathElement);

        // Add event listener to display tooltip on mouseover
        pathElement.addEventListener("mouseover", (event) => {
            clearTooltips();

            const tooltip = document.createElement("div");
            tooltip.classList.add("tooltip");

            const ul = document.createElement("ul");
            p.stations.forEach(station => {
                const li = document.createElement("li");
                li.textContent = station.id;
                ul.appendChild(li);
            });

            tooltip.appendChild(ul);
            tooltipContainer.appendChild(tooltip);

            const updateTooltipPosition = (e) => {
                tooltip.style.display = "block";
                setTimeout(() => {
                    tooltip.style.opacity = 1; // Fade-in effect
                }, 200); // Add delay before fading in
                tooltip.style.left = `${e.pageX + 10}px`;
                tooltip.style.top = `${e.pageY + 10}px`;
            };

            updateTooltipPosition(event);

            // Clear the tooltips when mouse is out of the path or tooltip
            pathElement.addEventListener("mouseout", hideTooltip);
            tooltip.addEventListener("mouseout", hideTooltip);

            function hideTooltip() {
                hideTooltipTimeout = setTimeout(() => {
                    tooltip.style.opacity = 0; // Reset opacity for next fade-in
                    setTimeout(() => {
                        tooltip.style.display = "none";
                    }, 500); // Increased delay to allow for fade-out
                }, 200); // Add a slight delay before hiding the tooltip
            }
        });
    });

    
    // Add the locator back to the SVG container
    svg.appendChild(locator);


    // Adjust SVG viewBox and position to center the paths
    const bbox = svg.getBBox();
    const viewBox = `${bbox.x - 20} ${bbox.y - 20} ${bbox.width + 40} ${bbox.height + 40}`;
    svg.setAttribute('viewBox', viewBox);

    // Display the back link to return to the full map view
    backLink.style.display = 'block';
    backLink.addEventListener("click", (event) => {
        event.preventDefault();
        svg.classList.add('fade-in'); // Add fade-in class to SVG container
        svg.setAttribute('viewBox', '800 600 500 6200');
        backLink.style.display = 'none';
        enableZoomAndDrag(); // Re-enable zoom and drag event listeners
        displaySVG(pathData); // Reset to display all paths
    });


    
    



    // Mousemove event to track SVG coordinates
    svg.addEventListener('mousemove', (event) => {
        const point = svg.createSVGPoint();
        point.x = event.clientX;
        point.y = event.clientY;

        // Convert screen coordinates to SVG coordinates
        const svgPoint = point.matrixTransform(svg.getScreenCTM().inverse());

        // Display coordinates
        xCoord.textContent = svgPoint.x.toFixed(2);
        yCoord.textContent = svgPoint.y.toFixed(2);


        // Show coordinates tooltip near the cursor
        coordinates.style.left = `${event.clientX + 10}px`;
        coordinates.style.top = `${event.clientY + 10}px`;
        coordinates.style.display = 'block';
    });

    // Hide coordinates on mouseout
    svg.addEventListener('mouseout', () => {
        coordinates.style.display = 'none';
    });


}


// END OF DISPLAY SINGLE PATH




// Function to enable zoom and drag event listeners
function enableZoomAndDrag() {
    const svg = document.getElementById("svgContainer");
    svg.addEventListener('wheel', zoomHandler);
    svg.addEventListener('mousedown', startDrag);
    svg.addEventListener('mousemove', drag);
    svg.addEventListener('mouseup', endDrag);
    svg.addEventListener('mouseleave', endDrag);
}

// Zoom handler function
function zoomHandler(event) {
    event.preventDefault();
    const delta = event.deltaY < 0 ? 0.1 : -0.1;
    zoom(delta);
}

// Call enableZoomAndDrag when the document is loaded
document.addEventListener("DOMContentLoaded", () => {
    enableZoomAndDrag();
});


    // Function to display path details on the left container
    function displayPathDetails(path) {
        const leftContainer = document.getElementById("leftContainer");
        leftContainer.innerHTML = `
            <div class="path-details">
                <h3 class="fade-in">${path.id}</h3>
                ${path.stations.map(station => `
                    <div class="station fade-in" style="animation-delay: 0.5s">
                        <h4>${station.id}</h4>
                        <p><strong>Title:</strong> ${station.title}</p>
                        <img src="${station.image}" alt="${station.title}" width="100">
                        <p>${station.description}</p>
                        <div class="gallery">
                            <h4>Gallery</h4>
                            ${station.gallery.map(image => `<img src="${image}" alt="${station.title}" width="100">`).join('')}
                        </div>
                    </div>
                `).join('')}
            </div>
        `;
    }

    // Clear tooltips function
    function clearTooltips() {
        const tooltips = document.querySelectorAll('.tooltip');
        tooltips.forEach(tooltip => tooltip.remove());
    }
}

document.addEventListener("DOMContentLoaded", () => {
    displaySVG(pathData);
});

    