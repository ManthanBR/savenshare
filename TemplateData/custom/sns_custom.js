let recorder;
let recording = false;
let startTime;
let unityReady = false;
let startARButtonListenerAdded = false;

console.log("sns_custom.js: Script start");

function setupEventListeners() {
    console.log("Attaching event listeners");
    const recordButton = document.getElementById('recordButton');
    if (recordButton) {
        console.log("recordButton found!");
        recordButton.addEventListener('click', function () {
            if (recording) {
                stopRecording();
            } else {
                startRecording();
            }
        });
    } else {
        console.error("recordButton not found!");
    }
}

window.addEventListener("load", function () {
    console.log("sns_custom.js: Page loaded! Initializing recorder");
    const canvas = document.querySelector("#unity-canvas");
    if (!canvas) {
        console.error("Unity Canvas not found");
        return;
    }
    ZapparVideoRecorder.createCanvasVideoRecorder(canvas, {
        audio: false,
        useSharePrompt: false
    }).then(rec => {
        recorder = rec;
        console.log("Zappar video recorder is ready");
        // Hide the button first
        const recordButtonContainer = document.getElementById('cameraButtonContainer');
         if(recordButtonContainer){
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
         else{
           console.error("Could not find recordButtonContainer to set the visibility")
          }

        recorder.onComplete.bind(async (res) => {
           ZapparSharing({
                data: await res.asDataURL(),
                fileNamePrepend: 'MyCustomVideo',
                shareTitle: 'Check out my Video',
                shareText: 'Recorded using FilterYouAR',
              },
                {
                   buttonCloseAnchor: {
                      width: '30px',
                      height: '30px',
                    }
              },
               {
                 onClose: function () {
                        console.log("Save and share closed! resetting progress bar");
                       const circle = document.querySelector('.progress-ring__bar');
                        if (circle) {
                            circle.style.strokeDashoffset = circle.getAttribute('r') * 2 * Math.PI;
                        } else {
                            console.error("Could not find the progress-ring__bar to reset the offset")
                      }
                 }
               }
            );
        });
    }).catch(e => {
        console.error("Failed to initialize recorder:", e);
    })
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

window.addEventListener("zappar-sns-ready", function () {
    console.log("Zappar SNS ready event fired!");
    const targetNode = document.getElementById('ZapparSnapshotContainer');
    if (!targetNode) {
        console.error("Zappar Snapshot container not found");
        return;
    }
    const observer = new MutationObserver(function (mutationsList, observer) {
        for (const mutation of mutationsList) {
            if (mutation.type === 'childList') {
                console.log("child list mutated, checking for download button");
                const saveButton = document.getElementById('zapparSaveButton');
                if (saveButton) {
                    console.log("Save button found!");
                    saveButton.removeAttribute('download');
                    saveButton.setAttribute('download', 'MyCustomVideoName.mp4');
                    console.log("Save button download attribute set to MyCustomVideoName.mp4");
                    observer.disconnect();
                }
            }
        }
    });
    observer.observe(targetNode, { childList: true, subtree: true });
});

function startRecording() {
    if (recorder) {
        console.log("Starting video recording without custom audio");
        recording = true;
        startTime = Date.now();
         const recordButton =  document.getElementById('recordButton');
         if(recordButton){
              recordButton.classList.add('recording');
         } else {
            console.error("Could not find the recordButton to set the recording style");
         }
        updateProgress();
        recorder.start();
    } else {
        console.error("Recorder not ready yet")
    }
}

function stopRecording() {
    if (recorder) {
        console.log("Stopping video recording without custom audio");
        recording = false;
        const recordButton = document.getElementById('recordButton');
          if(recordButton){
             recordButton.classList.remove('recording');
         } else {
            console.error("Could not find the recordButton to remove the recording style");
         }
         const circle = document.querySelector('.progress-ring__bar');
        if(circle){
             circle.style.strokeDashoffset = circle.getAttribute('r') * 2 * Math.PI;
        } else {
            console.error("Could not find the progress-ring__bar to reset the offset")
        }

        recorder.stop();
    } else {
        console.error("Recorder not ready yet")
    }
}

function updateProgress() {
    if (!recording) return;
    const currentTime = Date.now();
    const elapsedTime = (currentTime - startTime) / 1000;
    const maxTime = 60;
    const percentage = elapsedTime / maxTime;
    if (percentage >= 1) {
        stopRecording();
    }
    else {
        const circle = document.querySelector('.progress-ring__bar');
          if(circle){
                  const circumference = circle.getAttribute('r') * 2 * Math.PI;
                  const offset = circumference * (1 - percentage);
                 circle.style.strokeDashoffset = offset;
                  requestAnimationFrame(updateProgress);
           }
        else{
          console.error("Could not find the progress-ring__bar to update progress");
         }

    }
}
