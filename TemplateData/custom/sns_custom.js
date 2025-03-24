let unityReady = false;
let startARButtonListenerAdded = false;
let recording = false;
let startTime;
const maxRecordingTime = 30; // Set your desired max recording time in seconds

console.log("sns_custom.js: Script start");

function setupEventListeners() {
    console.log("Attaching event listeners");
    const recordButton = document.getElementById('recordButton');
    if (recordButton) {
        console.log("recordButton found!");
        recordButton.addEventListener('click', function () {
            if (!recording) {
                startRecording();
            }
            else {
                stopRecording();
            }
        });
    } else {
        console.error("recordButton not found!");
    }
}

window.addEventListener("load", function () {
    console.log("sns_custom.js: Page loaded! Initializing");

    // Hide the button first
    const recordButtonContainer = document.getElementById('cameraButtonContainer');
    if (recordButtonContainer) {
        recordButtonContainer.style.opacity = 0;
        setTimeout(() => {
            recordButtonContainer.style.display = "none";
        }, 500);

        var progressBarFull = document.querySelector("#unity-progress-bar-full");
        var interval = setInterval(() => {
            if (progressBarFull.style.width == "100%") {
                console.log("Unity progress bar completed!");
                clearInterval(interval);
                unityReady = true;
                // Show the button only when the game has started (or allow access button is not visible)
                if (document.getElementById("startARDiv").style.visibility != 'visible') {
                    recordButtonContainer.style.display = "block";
                    setTimeout(() => {
                        recordButtonContainer.style.opacity = 1;
                    }, 50);
                }
            }
        }, 100);
    }
    else {
        console.error("Could not find recordButtonContainer to set the visibility")
    }

    setupEventListeners();

    if (document.getElementById("startARButton") != null && !startARButtonListenerAdded) {
        startARButtonListenerAdded = true;
        document.getElementById("startARButton").addEventListener('click', function () {
            const recordButtonContainer = document.getElementById('cameraButtonContainer');
            if (unityReady && recordButtonContainer) {
                recordButtonContainer.style.display = "block";
                setTimeout(() => {
                    recordButtonContainer.style.opacity = 1;
                }, 50);
            }
        });
    }
});


function resetProgress() {
    console.log("Video recording complete! resetting progress bar");
    const circle = document.querySelector('.progress-ring__bar');
    if (circle) {
        circle.style.strokeDashoffset = circle.getAttribute('r') * 2 * Math.PI;
    } else {
        console.error("Could not find the progress-ring__bar to reset the offset")
    }
}

function startRecording() {
    recording = true;
    startTime = Date.now();
    var tapcontainer = document.getElementById('tap-container');
    const recordButton = document.getElementById('recordButton');
    if (recordButton) {
        recordButton.classList.add('recording');
        tapcontainer.style.opacity = 0;
    } else {
        console.error("Could not find the recordButton to set the recording style");
    }
    updateProgress();

    // Send Message to Unity to activate a button
    if (window.unityInstance) {
        window.unityInstance.SendMessage('ARCamera', 'OnStartRecording');
        console.log("Sent 'OnStartRecording' message to Unity");
    }
    else {
        console.error("Could not find the Unity Instance to send 'OnStartRecording' message");
    }

      // Set a timer to stop recording automatically after maxRecordingTime seconds
        setTimeout(() => {
             if(recording){
                  stopRecording();
             }
    }, maxRecordingTime * 1000);
}


function stopRecording() {
    recording = false;
    const recordButton = document.getElementById('recordButton');
    if (recordButton) {
        recordButton.classList.remove('recording');
    } else {
        console.error("Could not find the recordButton to remove the recording style");
    }
    const circle = document.querySelector('.progress-ring__bar');
    if (circle) {
        circle.style.strokeDashoffset = circle.getAttribute('r') * 2 * Math.PI;
    } else {
        console.error("Could not find the progress-ring__bar to reset the offset")
    }

    if (window.unityInstance) {
        window.unityInstance.SendMessage('ARCamera', 'OnStopRecording');
        console.log("Sent 'OnStopRecording' message to Unity");
    }
    else {
        console.error("Could not find the Unity Instance to send 'OnStopRecording' message");
    }
}


function updateProgress() {
    if (!recording) return;
    const currentTime = Date.now();
    const elapsedTime = (currentTime - startTime) / 1000;
    const percentage = elapsedTime / maxRecordingTime;
    if (percentage >= 1) {
      stopRecording();
    }
    else {
        const circle = document.querySelector('.progress-ring__bar');
        if (circle) {
            const circumference = circle.getAttribute('r') * 2 * Math.PI;
            const offset = circumference * (1 - percentage);
            circle.style.strokeDashoffset = offset;
            requestAnimationFrame(updateProgress);
        }
        else {
            console.error("Could not find the progress-ring__bar to update progress");
        }
    }
}

function OnVideoDataURLReceived(dataURL) {
    console.log("Video data URL received: " + dataURL);
    resetProgress();
     ShowVideoPreview(dataURL);
}
function ShowVideoPreview(videoURL) {
    var videoPreviewDiv = document.getElementById('videoPreviewDiv');
    videoPreviewDiv.style.opacity = 1;
    videoPreviewDiv.style.visibility = 'visible';

    const video = document.getElementById('videoPreview');
    video.src = videoURL;
    video.style.width = "80vw";
    video.style.height = 80 / window.innerWidth * window.innerHeight + "vw";
    console.log("video.src: " + video.src);
}
