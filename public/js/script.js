const socket = io("/");
const videoGrid = document.getElementById("video-grid");
// const myPeer = new Peer(undefined, {
// 	host: "/",
// 	port: "3001"
// });
console.log("Connecting to PeerJS...");
const myPeer = new Peer();
const myVideo = document.createElement("video");
myVideo.muted = true;
myVideo.setAttribute("playsinline", true);  // Added for iOS
const peers = {};

console.log("Requesting camera and microphone access...");
navigator.mediaDevices
  .getUserMedia({
    video: true,
    audio: true,
  })
  .then((stream) => {
    console.log("Camera and mic access granted.");
    addVideoStream(myVideo, stream);

    myPeer.on("call", (call) => {
      console.log("Incoming call from peer:", call.peer);
      call.answer(stream);
      const video = document.createElement("video");
      video.setAttribute("playsinline", true);  // Added for iOS
      call.on("stream", (userVideoStream) => {
        console.log("Received remote stream from:", call.peer);
        addVideoStream(video, userVideoStream);
      });

      call.on("error", (err) => {
        console.error("Call error:", err);
      });
    });

    socket.on("user-connected", (userId) => {
      console.log("🟢 New user connected:", userId);
      connectToNewUser(userId, stream);
    });
  })
  .catch((err) => {
    console.error("Failed to get media stream:", err);
    alert("Error accessing camera/mic: " + err.message);
  });

socket.on("user-disconnected", (userId) => {
  console.log("🔴 User disconnected:", userId);
  if (peers[userId]) peers[userId].close();
});

myPeer.on("open", (id) => {
  console.log("My peer ID is:", id);
  socket.emit("join-room", ROOM_ID, id);
});

function connectToNewUser(userId, stream) {
  console.log("Calling new user:", userId);
  const call = myPeer.call(userId, stream);
  const video = document.createElement("video");
  video.setAttribute("playsinline", true);  // Added for iOS
  call.on("stream", (userVideoStream) => {
    console.log("Stream received from new user:", userId);
    addVideoStream(video, userVideoStream);
  });
  call.on("close", () => {
    console.log("Call closed with user:", userId);
    video.remove();
  });

  call.on("error", (err) => {
    console.error("Call error with user:", userId, err);
  });

  peers[userId] = call;
}

// function addVideoStream(video, stream) {
//   video.srcObject = stream;
//   video.addEventListener("loadedmetadata", () => {
//     video.play();
//   });
//   videoGrid.append(video);
// }

function addVideoStream(video, stream) {
  console.log("Adding video stream to DOM");
  video.srcObject = stream;

  // Essential for iOS Safari/Chrome
  video.setAttribute("playsinline", true);
  video.muted = true; // Only needed for local stream (safe to set always)

  video.addEventListener("loadedmetadata", () => {
    video.play().catch(e => console.error("video.play() failed:", e));
  });

  videoGrid.append(video);
}


// URL Copy To Clipboard
document.getElementById("invite-button").addEventListener("click", getURL);

function getURL() {
  const c_url = window.location.href;
  copyToClipboard(c_url);
  alert("Url Copied to Clipboard,\nShare it with your Friends!\nUrl: " + c_url);
}

function copyToClipboard(text) {
  var dummy = document.createElement("textarea");
  document.body.appendChild(dummy);
  dummy.value = text;
  dummy.select();
  document.execCommand("copy");
  document.body.removeChild(dummy);
}

// End Call
document.getElementById("end-button").addEventListener("click", endCall);

function endCall() {
  window.location.href = "/";
}
