// sns_custom.js (Corrected - Async Load and Initialization)

let unityReady = false;
let startARButtonListenerAdded = false;
let recording = false;
let startTime;
const maxRecordingTime = 59;
let videoDataURL = null;
let ffmpegReady = false;

console.log("sns_custom.js: Script start");

// Load FFmpeg.wasm
async function loadFFmpeg() {
    if (ffmpegReady) return;

    if (typeof window.FFmpeg === 'undefined' || typeof window.FFmpeg.createFFmpeg === 'undefined') {
        console.error("FFmpeg library is not loaded correctly. Check script tags in index.html.");
        ShowError("FFmpeg library is not loaded. Check index.html");
        return;
    }

    let ffmpeg = window.FFmpeg.createFFmpeg({ log: true, corePath: 'https://unpkg.com/@ffmpeg/core@0.11.0/dist/ffmpeg-core.js' });

    try {
        await ffmpeg.load();
        ffmpegReady = true;
        console.log("FFmpeg loaded successfully");
        initializeAfterFFmpeg(); // Call initialization function here
    } catch (err) {
        console.error("Failed to load FFmpeg:", err);
        ShowError("Failed to load FFmpeg: " + err.message);
    }
}

// NEW FUNCTION: Initialize things that depend on FFmpeg
function initializeAfterFFmpeg() {
    setupEventListeners(); // Now safe to set up listeners

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
}

function setupEventListeners() {
    console.log("Attaching event listeners");
    const recordButton = document.getElementById('recordButton');
    const saveVideoButton = document.getElementById('saveVideoButton');
    const shareVideoButton = document.getElementById('shareVideoButton');

    if (recordButton) {
        recordButton.addEventListener('click', toggleRecording);
    } else {
        console.error("recordButton not found!");
    }

    if (saveVideoButton) {
        saveVideoButton.addEventListener('click', downloadVideo);
    } else {
        console.error("saveVideoButton not found!");
    }

    if (shareVideoButton) {
        shareVideoButton.addEventListener('click', shareVideo);
    } else {
        console.error("shareVideoButton not found!");
    }
}

function toggleRecording() {
    if (!recording) {
        startRecording();
    } else {
        stopRecording();
    }
}

// Make the ENTIRE load event handler async
window.addEventListener("load", async function () { // Add async here
    console.log("sns_custom.js: Page loaded! Initializing");

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
                if (document.getElementById("startARDiv").style.visibility != 'visible') {
                    recordButtonContainer.style.display = "block";
                    setTimeout(() => {
                        recordButtonContainer.style.opacity = 1;
                    }, 50);
                }
            }
        }, 100);
    } else {
        console.error("Could not find recordButtonContainer to set the visibility");
    }

    // setupEventListeners(); // Moved INSIDE initializeAfterFFmpeg
    // loadFFmpeg();        // Call loadFFmpeg, and WAIT for it

     await loadFFmpeg(); // AWAIT the completion of loadFFmpeg
    // initializeAfterFFmpeg(); // Moved INSIDE loadFFmpeg, after ffmpeg.load()
});



function resetProgress() {
    console.log("Video recording complete! Resetting progress bar");
    const circle = document.querySelector('.progress-ring__bar');
    if (circle) {
        circle.style.strokeDashoffset = circle.getAttribute('r') * 2 * Math.PI;
    } else {
        console.error("Could not find the progress-ring__bar to reset the offset");
    }
}

function startRecording() {
    recording = true;
    startTime = Date.now();
    const recordButton = document.getElementById('recordButton');
    if (recordButton) {
        recordButton.classList.add('recording');
    } else {
        console.error("Could not find the recordButton to set the recording style");
    }
    updateProgress();

    if (window.unityInstance) {
        window.unityInstance.SendMessage('ARCamera', 'OnStartRecording');
        console.log("Sent 'OnStartRecording' message to Unity");
    } else {
        console.error("Could not find the Unity Instance to send 'OnStartRecording' message");
    }

    setTimeout(() => {
        if (recording) {
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
        console.error("Could not find the progress-ring__bar to reset the offset");
    }

    if (window.unityInstance) {
        window.unityInstance.SendMessage('ARCamera', 'OnStopRecording');
        console.log("Sent 'OnStopRecording' message to Unity");
    } else {
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
    } else {
        const circle = document.querySelector('.progress-ring__bar');
        if (circle) {
            const circumference = circle.getAttribute('r') * 2 * Math.PI;
            const offset = circumference * (1 - percentage);
            circle.style.strokeDashoffset = offset;
            requestAnimationFrame(updateProgress);
        } else {
            console.error("Could not find progress-ring__bar to update progress");
        }
    }
}

// This function receives the data URL from Unity
async function OnVideoDataURLReceived(dataURL) {
    console.log("Video data URL received (truncated): " + dataURL.substring(0, 50) + "...");
    resetProgress();

    if (!ffmpegReady) {
        console.error("FFmpeg is not ready yet!");
        ShowError("FFmpeg is not ready yet.  Please wait.");
        return;
    }

    // Use window.FFmpeg here as well
    if (typeof window.FFmpeg === 'undefined') {
        console.error("FFmpeg is still undefined in OnVideoDataURLReceived!");
        ShowError("FFmpeg initialization error.");
        return;
    }
    let ffmpeg = window.FFmpeg.createFFmpeg({ log: true, corePath: 'https://unpkg.com/@ffmpeg/core@0.11.0/dist/ffmpeg-core.js' });
    await ffmpeg.load();

    // 1. Convert dataURL to Uint8Array
    const response = await fetch(dataURL);
    const blob = await response.blob();
    const arrayBuffer = await blob.arrayBuffer();
    const uint8Array = new Uint8Array(arrayBuffer);

    // 2. Write to FFmpeg's virtual file system
    ffmpeg.FS('writeFile', 'input.webm', uint8Array); // Or .mp4

    // 3. Run FFmpeg command
    try {
        await ffmpeg.run(
            '-i', 'input.webm',
            '-c:v', 'libx264',
            '-preset', 'fast',
            '-crf', '23',
            '-c:a', 'aac',
            '-b:a', '128k',
            '-movflags', 'faststart',
            'output.mp4'
        );
        console.log("FFmpeg processing complete");
    } catch (error) {
        console.error("FFmpeg processing error:", error);
        ShowError("FFmpeg processing error: " + error.message);
        return;
    }

    // 4. Read the output file
    const outputData = ffmpeg.FS('readFile', 'output.mp4');

    // 5. Create a Blob
    const outputBlob = new Blob([outputData.buffer], { type: 'video/mp4' });

    // 6. Create a URL for the Blob
    videoDataURL = URL.createObjectURL(outputBlob);

    // 7. Show the preview
    ShowVideoPreview(videoDataURL);
}


// --- Download and Share Logic ---

function downloadVideo() {
    if (!videoDataURL) {
        console.error("No video data URL available to download.");
        return;
    }

    const downloadLink = document.createElement('a');
    downloadLink.href = videoDataURL;
    downloadLink.download = 'recorded-video.mp4';

    document.body.appendChild(downloadLink);
    downloadLink.click();
    document.body.removeChild(downloadLink);
}

async function shareVideo() {
    if (!videoDataURL) {
        console.error("No video data URL available for sharing.");
        return;
    }

    try {
        const response = await fetch(videoDataURL);
        const blob = await response.blob();
        const file = new File([blob], "recorded-video.mp4", { type: "video/mp4" });

        if (navigator.share && navigator.canShare && navigator.canShare({ files: [file] })) {
            await navigator.share({
                files: [file],
                title: 'Recorded Video',
                text: 'Check out this recorded video!',
            });
            console.log("Shared successfully via Web Share API.");
        } else {
            console.warn("Web Share API is not fully supported. Falling back to download.");
            ShowError("Sharing is not supported on this browser. Please download instead.");
            downloadVideo();
        }
    } catch (error) {
        console.error("Error during share operation:", error);
        ShowError("Failed to share: " + error.message);
    }
}

function ShowVideoPreview(videoURL) {
    var videoPreviewDiv = document.getElementById('videoPreviewDiv');
    document.getElementById('cameraButtonContainer').style.display = "none";
    videoPreviewDiv.style.opacity = 1;
    videoPreviewDiv.style.visibility = 'visible';

    const video = document.getElementById('videoPreview');
    video.src = videoURL;
    video.style.width = "80vw";
    video.style.height = 80 / window.innerWidth * window.innerHeight + "vw";
    video.onloadedmetadata = function() {
        URL.revokeObjectURL(this.src);
    };
}

function HideVideoPreview(){
        var videoPreviewDiv = document.getElementById('videoPreviewDiv');
           videoPreviewDiv.style.opacity = 0;
           setTimeout(()=>{
              videoPreviewDiv.style.visibility = 'hidden';

              document.getElementById('cameraButtonContainer').style.display = "block";


            }, 500);
      }
