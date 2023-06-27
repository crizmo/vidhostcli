// Connect to the server
import io from 'socket.io-client';

const socket = io.connect('http://localhost:3000/');

// Identify if this device is the host or a client
let isHost = false;
console.log(isHost)
socket.on('hostConnected', () => {
  console.log('Host connected');
  isHost = true;
  // Show buttons only to the host
  showButtons();
});
console.log(isHost)
// Function to show buttons only to the host
function showButtons() {
  const buttons = document.querySelectorAll('button');
  buttons.forEach(button => {
    button.style.display = isHost ? 'block' : 'none';
  });
}

// Button event listeners
document.getElementById('openCameraBtn').addEventListener('click', () => {
  socket.emit('openCamera');
});

document.getElementById('closeCameraBtn').addEventListener('click', () => {
  socket.emit('closeCamera');
});

document.getElementById('startRecordingBtn').addEventListener('click', () => {
  socket.emit('startRecording');
});

document.getElementById('stopRecordingBtn').addEventListener('click', () => {
  socket.emit('stopRecording');
});

document.getElementById('downloadBtn').addEventListener('click', () => {
  socket.emit('downloadVideo');
});

// Handle events from the server
socket.on('openCamera', () => {
  openCamera();
});

socket.on('closeCamera', () => {
  closeCamera();
});

socket.on('startRecording', () => {
  if (!isHost) {
    startRecording();
  }
});

socket.on('stopRecording', () => {
  stopRecording();
});

socket.on('downloadVideo', () => {
  if (!isHost) {
    downloadVideo();
  }
});

// Camera and video recording functionality
let mediaStream;
let mediaRecorder;
let recordedChunks = [];

async function openCamera() {
  console.log('Opening camera...');
  try {
    mediaStream = await navigator.mediaDevices.getUserMedia({ video: true });
    const videoElement = document.getElementById('videoElement');
    videoElement.style.display = 'block';
    videoElement.srcObject = mediaStream;
    videoElement.play();
  } catch (error) {
    console.error('Error opening camera:', error);
  }
}

function closeCamera() {
  if (mediaStream) {
    mediaStream.getTracks().forEach(track => track.stop());
    const videoElement = document.getElementById('videoElement');
    videoElement.srcObject = null;
  }
}

function startRecording() {
  if (mediaStream) {
    const canvasElement = document.getElementById('canvasElement');
    const videoElement = document.getElementById('videoElement');
    const canvasContext = canvasElement.getContext('2d');
    const videoWidth = videoElement.videoWidth;
    const videoHeight = videoElement.videoHeight;
    canvasElement.width = videoWidth;
    canvasElement.height = videoHeight;

    mediaRecorder = new MediaRecorder(mediaStream);
    recordedChunks = [];

    mediaRecorder.ondataavailable = (event) => {
      recordedChunks.push(event.data);
    };

    mediaRecorder.start();
    canvasContext.clearRect(0, 0, videoWidth, videoHeight);
    drawToCanvas(canvasContext, videoWidth, videoHeight);
  }
}

function stopRecording() {
  if (mediaRecorder && mediaRecorder.state !== 'inactive') {
    mediaRecorder.stop();
  }
}

function drawToCanvas(canvasContext, width, height) {
  if (mediaStream) {
    canvasContext.drawImage(videoElement, 0, 0, width, height);
    requestAnimationFrame(() => {
      drawToCanvas(canvasContext, width, height);
    });
  }
}

function downloadVideo() {
  if (recordedChunks.length > 0) {
    const blob = new Blob(recordedChunks, { type: 'video/webm' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'recorded_video.webm';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }
}
