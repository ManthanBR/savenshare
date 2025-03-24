// sns_custom.js
let unityReady = false;
let startARButtonListenerAdded = false;

console.log("sns_custom.js: Script start");

function setupEventListeners() {
    console.log("Attaching event listeners");
    // No record button listener here anymore
}


window.addEventListener("load", function () {
    console.log("sns_custom.js: Page loaded! Initializing");

    // No record button logic here
    const recordButtonContainer = document.getElementById('cameraButtonContainer');
      if (recordButtonContainer) {
        recordButtonContainer.style.display = "none"; // Ensure it's hidden.
      }


    const startARButton = document.getElementById("startARButton");
    if (startARButton && !startARButtonListenerAdded) {
        startARButtonListenerAdded = true;
        startARButton.addEventListener('click', function () {
            const recordButtonContainer = document.getElementById('cameraButtonContainer');
             if (recordButtonContainer) {
                recordButtonContainer.style.display = "none";
             }
        });
    }
     var progressBarFull = document.querySelector("#unity-progress-bar-full");
        var interval = setInterval(() => {
            if (progressBarFull && progressBarFull.style.width == "100%") {
                console.log("Unity progress bar completed!");
                clearInterval(interval);
                unityReady = true;
                 const recordButtonContainer = document.getElementById('cameraButtonContainer');
                  if (recordButtonContainer) {
                        recordButtonContainer.style.display = "none";
                  }
            }
        }, 100);

     setupEventListeners();
});
