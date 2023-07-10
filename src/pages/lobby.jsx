import React, { useEffect, useRef } from "react";
import "./lobby.css";
import Agora from "agora-rtm-sdk";

function LobbyPage() {
  const peerConnectionRef = useRef(null);
  const localStreamRef = useRef(null);
  const remoteStreamRef = useRef(null);
  const appId = "ea43bb1b76644e2288285733f6510fee";
  let token = null;
  let uid = String(Math.floor(Math.random() * 10000));
  let client;
  let channel;

  useEffect(() => {
    const servers = {
      iceServers: [
        {
          urls: "stun:stun.l.google.com:19302",
        },
      ],
    };

    const init = async () => {
      client = Agora.createInstance(appId);

      await client.login({ uid, token });

      channel = client.createChannel("main");
      await channel.join();

      channel.on("MemberJoined", handleMemberJoined);
      channel.on("MemberLeft", handleMemberLeft);

      client.on("MessageFromPeer", handleMessageFromPeer);

      try {
        localStreamRef.current = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: true,
        });
        document.getElementById("user-1").srcObject = localStreamRef.current;
      } catch (error) {
        console.log("Error accessing media devices:", error);
      }

      navigator.permissions.query({ name: "camera" }).then(function (result) {
        if (result.state === "granted") {
          console.log("Camera access granted");
        } else if (result.state === "prompt") {
          console.log("Camera access prompt");
        } else if (result.state === "denied") {
          console.log("Camera access denied");
        }
      });

      document
        .getElementById("camera-btn")
        .addEventListener("click", toggleCamera);
      document.getElementById("mic-btn").addEventListener("click", toggleAudio);
    };

    const handleMemberJoined = async (memberId) => {
      console.log("handleMemberJoined called with memberId:", memberId);
      createOffer(memberId);
    };

    const handleMessageFromPeer = async (message, memberId) => {
      message = JSON.parse(message.text);

      if (message.type === "offer") createAnswer(memberId, message.offer);

      if (message.type === "answer") addAnswer(message.answer);

      if (message.type === "candidate") {
        if (peerConnectionRef.current)
          peerConnectionRef.current.addIceCandidate(message.candidate);
      }
    };

    const handleMemberLeft = () => {
      document.getElementById("user-2").style.display = "none";
      cleanUpResources();
    };

    const createPeerConnection = async (memberId) => {
      peerConnectionRef.current = new RTCPeerConnection(servers);

      remoteStreamRef.current = new MediaStream();
      document.getElementById("user-2").srcObject = remoteStreamRef.current;

      document.getElementById("user-2").style.display = "block";

      if (!localStreamRef.current) {
        try {
          localStreamRef.current = await navigator.mediaDevices.getUserMedia({
            video: true,
            audio: true,
          });
          document.getElementById("user-1").srcObject = localStreamRef.current;
        } catch (error) {
          console.log("Error accessing media devices:", error);
        }
      }

      localStreamRef.current.getTracks().forEach((track) => {
        peerConnectionRef.current.addTrack(track, localStreamRef.current);
      });

      peerConnectionRef.current.ontrack = (event) => {
        event.streams[0].getTracks().forEach((track) => {
          remoteStreamRef.current.addTrack(track);
        });
      };

      peerConnectionRef.current.onicecandidate = async (event) => {
        if (event.candidate) {
          client.sendMessageToPeer(
            {
              text: JSON.stringify({
                type: "candidate",
                candidate: event.candidate,
              }),
            },
            memberId
          );
        }
      };
    };

    const createOffer = async (memberId) => {
      await createPeerConnection(memberId);

      try {
        const offer = await peerConnectionRef.current.createOffer();
        await peerConnectionRef.current.setLocalDescription(offer);

        client.sendMessageToPeer(
          { text: JSON.stringify({ type: "offer", offer: offer }) },
          memberId
        );
      } catch (error) {
        console.log("Error creating offer:", error);
      }
    };

    const createAnswer = async (memberId, offer) => {
      await createPeerConnection(memberId);

      try {
        await peerConnectionRef.current.setRemoteDescription(offer);

        const answer = await peerConnectionRef.current.createAnswer();
        await peerConnectionRef.current.setLocalDescription(answer);

        client.sendMessageToPeer(
          { text: JSON.stringify({ type: "answer", answer: answer }) },
          memberId
        );
      } catch (error) {
        console.log("Error creating answer:", error);
      }
    };

    const addAnswer = async (answer) => {
      if (!peerConnectionRef.current.currentRemoteDescription)
        peerConnectionRef.current.setRemoteDescription(answer);
    };

    const toggleCamera = () => {
      const videoTrack = localStreamRef.current
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
      const audioTrack = localStreamRef.current
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

    const cleanUpResources = () => {
      if (peerConnectionRef.current) {
        peerConnectionRef.current.close();
        peerConnectionRef.current = null;
      }

      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach((track) => {
          track.stop();
        });
        localStreamRef.current = null;
      }

      if (remoteStreamRef.current) {
        remoteStreamRef.current.getTracks().forEach((track) => {
          track.stop();
        });
        remoteStreamRef.current = null;
      }
    };

    window.addEventListener("beforeunload", leaveChannel);

    init();

    return () => {
      cleanUpResources();
    };
  }, []);

  const leaveChannel = async () => {
    await channel.leaveChannel();
    await client.logout();
  };

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
