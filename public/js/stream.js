'use strict';
document.querySelector('body').onload = initParams;

const ws = new WebSocket('ws://localhost:9090');

// Element refs
const videoElem = document.getElementById("screen");
const audioElem = document.getElementById("voice");

ws.commands = {
    example,
    broadcast,
    watch,
};

ws.onopen = (event) => {
    console.log("WebSocket is open now.");
    ws.send(JSON.stringify({PING: "PINNG"}));
};
ws.onmessage = (event) => {
    const msg = JSON.parse(event.data);
    console.log(`WebSocket message received: ${msg}`);
    const cmd = msg.cmd;
    if (ws.commands[cmd]) {
        ws.commands[cmd](event);
    }
}
ws.onclose = (event) => {
    console.log(`Websocket closed!`)
}

document.getElementById('shareScreen--button').onclick = shareScreen;
document.getElementById('stopCapture--button').onclick = stopCapture;

function initParams(){
    const urlParams = new URLSearchParams(window.location.search);
    const myParam = urlParams.get('firstname');
    let firstname = document.getElementById('firstname');
    let header = document.createElement('h1');
    header.textContent = myParam;
    firstname.appendChild(header);
}

async function shareScreen () {
    console.log(navigator.mediaDevices.getSupportedConstraints());
    startCapture();
}

async function startCapture() {
    try {
        const displayMediaOptions = {
            video: {
                cursor: "motion"
            }
        };
        videoElem.srcObject = await navigator.mediaDevices.getDisplayMedia(displayMediaOptions);
        audioElem.srcObject = await navigator.mediaDevices.getUserMedia({
            audio: {
              echoCancellation: true,
              noiseSuppression: true,
              sampleRate: 44100
            },
            video: false,
        });
        videoElem.srcObject.getVideoTracks().forEach((track) => {
            track.contentHint = 'text';
        });
    } catch(err) {
        console.error("Error: " + err);
    }
}

function stopCapture (evt) {
    let videoTracks = videoElem.srcObject.getTracks();
    console.log(audioElem.srcObject)
    let audioTracks = audioElem.srcObject.getTracks();
  
    videoTracks.forEach(track => track.stop());
    videoElem.srcObject = null;

    audioTracks.forEach(track => track.stop());
    audioElem.srcObject = null;
}

const peerConnections = {};
const config = {
  iceServers: [
    {
      urls: ["stun:stun.l.google.com:19302"]
    }
  ]
}

// ws.on("answer", (id, description) => {
//     peerConnections[id].setRemoteDescription(description);
// });

function example (event) {
    console.log(`Example event: ${event.data}`);
}

function broadcast (event) {
    console.log(`Broadcast event: ${event.data}`);
}

function watch (event) {
    console.log(`Watch event: ${event.data}`);
}
