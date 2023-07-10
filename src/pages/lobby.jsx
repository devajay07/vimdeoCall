import React from "react";
import "./lobby.css";
import Agora from "agora-rtm-sdk";

function LobbyPage() {
  let peerConnection;
  const servers = {
    iceServers: [
      {
        urls: "stun:stun.l.google.com:19302",
      },
    ],
  };

  let localStream;
  const appId = "ea43bb1b76644e2288285733f6510fee";
  let token = null;
  let uid = String(Math.floor(Math.random() * 10000));
  let client;
  let channel;
  let remoteStream;

  const init = async () => {
    client = Agora.createInstance(appId);

    await client.login({ uid, token });

    channel = client.createChannel("main");
    await channel.join();

    channel.on("MemberJoined", handleMemberJoined);
    channel.on("MemberLeft", handleMemberLeft);

    client.on("MessageFromPeer", handleMessageFromPeer);

    if (navigator.mediaDevices) {
      localStream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true,
      });
    } else {
      // handle errorl
      console.log("no api");
    }

    navigator.permissions.query({ name: "camera" }).then(function (result) {
      if (result.state === "granted") {
        // camera access granted
        console.log("y");
      } else if (result.state === "prompt") {
        // camera access not yet granted, show a prompt to ask for permission
        console.log("ask");
      } else if (result.state === "denied") {
        // camera access denied, show an error message
        console.log("n");
      }
    });

    document.getElementById("user-1").srcObject = localStream;

    document
      .getElementById("camera-btn")
      .addEventListener("click", toggleCamera);
    document.getElementById("mic-btn").addEventListener("click", toggleAudio);
  };

  const handleMemberJoined = async (MemeberId) => {
    console.log("handleMemberJoined called with memberId:", MemeberId);
    createOffer(MemeberId);
  };

  const handleMessageFromPeer = async (message, MemeberId) => {
    message = JSON.parse(message.text);

    if (message.type === "offer") createAnswer(MemeberId, message.offer);

    if (message.type === "answer") addAnswer(message.answer);

    if (message.type === "candidate") {
      if (peerConnection) peerConnection.addIceCandidate(message.candidate);
    }
  };

  const handleMemberLeft = () => {
    document.getElementById("user-2").style.display = "none";
  };

  const createPeerConnection = async (MemeberId) => {
    peerConnection = new RTCPeerConnection(servers);

    remoteStream = new MediaStream();
    document.getElementById("user-2").srcObject = remoteStream;

    document.getElementById("user-2").style.display = "block";

    if (!localStream) {
      localStream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true,
      });
      document.getElementById("user-1").srcObject = localStream;
    }

    localStream.getTracks().forEach((track) => {
      peerConnection.addTrack(track, localStream);
    });

    peerConnection.ontrack = (event) => {
      event.streams[0].getTracks().forEach((track) => {
        remoteStream.addTrack(track);
      });
    };

    peerConnection.onicecandidate = async (event) => {
      if (event.candidate) {
        client.sendMessageToPeer(
          {
            text: JSON.stringify({
              type: "candidate",
              candidate: event.candidate,
            }),
          },
          MemeberId
        );
      }
    };
  };

  const createOffer = async (MemeberId) => {
    await createPeerConnection(MemeberId);

    let offer = await peerConnection.createOffer();
    await peerConnection.setLocalDescription(offer);

    client.sendMessageToPeer(
      { text: JSON.stringify({ type: "offer", offer: offer }) },
      MemeberId
    );
  };

  const createAnswer = async (MemeberId, offer) => {
    await createPeerConnection(MemeberId);

    await peerConnection.setRemoteDescription(offer);

    let answer = await peerConnection.createAnswer();
    await peerConnection.setLocalDescription(answer);

    client.sendMessageToPeer(
      { text: JSON.stringify({ type: "answer", answer: answer }) },
      MemeberId
    );
  };

  const addAnswer = async (answer) => {
    if (!peerConnection.currentRemoteDescription)
      peerConnection.setRemoteDescription(answer);
  };

  const leaveChannel = async () => {
    await channel.leaveChannel();
    await client.logout();
  }; // 30 seconds delay ????

  const toggleCamera = () => {
    const videoTrack = localStream
      .getTracks()
      .find((track) => track.kind === "video");

    if (videoTrack.enabled) {
      videoTrack.enabled = false;
      document.getElementById("camera-btn").style.backgroundColor = "#ff202b";
    } else {
      videoTrack.enabled = true;
      document.getElementById("camera-btn").style.backgroundColor =
        "rgb(179,102,249,0.9)";
    }
  };

  const toggleAudio = () => {
    const audioTrack = localStream
      .getTracks()
      .find((track) => track.kind === "audio");

    if (audioTrack.enabled) {
      audioTrack.enabled = false;
      document.getElementById("mic-btn").style.backgroundColor = "#ff202b";
    } else {
      audioTrack.enabled = true;
      document.getElementById("mic-btn").style.backgroundColor =
        "rgb(179,102,249,0.9)";
    }
  };

  window.addEventListener("beforeunload", leaveChannel);

  init();

  return (
    <div className="App">
      <header></header>
      <div className="video">
        <video
          className="video-player"
          id="user-1"
          autoPlay
          playsInline
        ></video>
        <video
          className="video-player"
          id="user-2"
          autoPlay
          playsInline
        ></video>
      </div>

      <div id="controls">
        <div id="camera-controls">
          <div className="camera-control-btn" id="camera-btn">
            <img
              src={process.env.PUBLIC_URL + "/video-camera.png"}
              alt="djfd"
            />
          </div>

          <div className="camera-control-btn" id="mic-btn">
            <img src={process.env.PUBLIC_URL + "/mic.png"} alt="djfd" />
          </div>

          <a href="/">
            <div className="camera-control-btn" id="end-btn">
              <img
                src={process.env.PUBLIC_URL + "/phone-call.png"}
                alt="djfd"
              />
            </div>
          </a>
        </div>
      </div>
    </div>
  );
}

export default LobbyPage;
