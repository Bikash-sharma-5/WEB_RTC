import React, { useEffect, useCallback, useState } from "react";
import ReactPlayer from "react-player";
import peer from "../service/peer";
import { useSocket } from "../context/SocketProvider";

const RoomPage = () => {
  const socket = useSocket();
  const [remoteSocketId, setRemoteSocketId] = useState(null);
  const [myStream, setMyStream] = useState(null);
  const [remoteStream, setRemoteStream] = useState(null);
  const [isAudioMuted, setIsAudioMuted] = useState(true);
  const [isVideoMuted, setIsVideoMuted] = useState(true);

  const handleUserJoined = useCallback(({ email, id }) => {
    console.log(`Email ${email} joined room`);
    setRemoteSocketId(id);
  }, []);

  const handleCallUser = useCallback(async () => {
    const stream = await navigator.mediaDevices.getUserMedia({
      audio: true,
      video: true,
    });

    stream.getAudioTracks()[0].enabled = !isAudioMuted;
    stream.getVideoTracks()[0].enabled = !isVideoMuted;

    const offer = await peer.getOffer();
    socket.emit("user:call", { to: remoteSocketId, offer });
    setMyStream(stream);
  }, [remoteSocketId, socket, isAudioMuted, isVideoMuted]);

  const handleIncomingCall = useCallback(
    async ({ from, offer }) => {
      setRemoteSocketId(from);
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: true,
        video: true,
      });

      stream.getAudioTracks()[0].enabled = !isAudioMuted;
      stream.getVideoTracks()[0].enabled = !isVideoMuted;

      setMyStream(stream);
      console.log(`Incoming Call`, from, offer);
      const ans = await peer.getAnswer(offer);
      socket.emit("call:accepted", { to: from, ans });
    },
    [socket, isAudioMuted, isVideoMuted]
  );

  const sendStreams = useCallback(() => {
    if (myStream) {
      for (const track of myStream.getTracks()) {
        peer.peer.addTrack(track, myStream);
      }
    }
  }, [myStream]);

  const handleCallAccepted = useCallback(
    ({ from, ans }) => {
      peer.setLocalDescription(ans);
      console.log("Call Accepted!");
      sendStreams();
    },
    [sendStreams]
  );

  const handleMuteAudio = () => {
    if (myStream) {
      myStream.getAudioTracks().forEach((track) => {
        track.enabled = !isAudioMuted;
      });
      setIsAudioMuted(!isAudioMuted);
    }
  };

  const handleMuteVideo = async () => {
    if (myStream) {
      if (isVideoMuted) {
        // Restart camera if it was previously muted
        const newStream = await navigator.mediaDevices.getUserMedia({ video: true });
        const newTrack = newStream.getVideoTracks()[0];
  
        // Replace the video track in the peer connection
        const sender = peer.peer.getSenders().find((s) => s.track.kind === "video");
        if (sender) sender.replaceTrack(newTrack);
  
        myStream.removeTrack(myStream.getVideoTracks()[0]); // Remove old track
        myStream.addTrack(newTrack); // Add new track
  
        setMyStream(newStream);
      } else {
        // Just disable video instead of stopping it
        myStream.getVideoTracks()[0].enabled = false;
      }
  
      setIsVideoMuted(!isVideoMuted);
    }
  };
  
  useEffect(() => {
    peer.peer.addEventListener("track", async (ev) => {
      const remoteStream = ev.streams;
      console.log("GOT TRACKS!!");
      setRemoteStream(remoteStream[0]);
    });
  }, []);

  useEffect(() => {
    socket.on("user:joined", handleUserJoined);
    socket.on("incomming:call", handleIncomingCall);
    socket.on("call:accepted", handleCallAccepted);

    return () => {
      socket.off("user:joined", handleUserJoined);
      socket.off("incomming:call", handleIncomingCall);
      socket.off("call:accepted", handleCallAccepted);
    };
  }, [socket, handleUserJoined, handleIncomingCall, handleCallAccepted]);

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        alignItems: "center",
        height: "100vh",
        backgroundColor: "#1e1e1e",
        color: "#fff",
        textAlign: "center",
      }}
    >
      <h1 style={{ marginBottom: "10px" }}>Zoom Clone</h1>
      <h4 style={{ color: remoteSocketId ? "lightgreen" : "red" }}>
        {remoteSocketId ? "Connected" : "No one in room"}
      </h4>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: "20px",
          width: "80%",
          maxWidth: "900px",
          backgroundColor: "#2c2c2c",
          padding: "20px",
          borderRadius: "10px",
        }}
      >
        {/* Local Video */}
        {myStream && (
          <div
            style={{
              position: "relative",
              borderRadius: "10px",
              overflow: "hidden",
              backgroundColor: isVideoMuted ? "black" : "transparent",
            }}
          >
            {!isVideoMuted ? (
              <ReactPlayer playing muted={isAudioMuted} height="250px" width="100%" url={myStream} />
            ) : (
              <div style={{ height: "250px", backgroundColor: "black" }} />
            )}
            <div
              style={{
                position: "absolute",
                bottom: "10px",
                left: "10px",
                backgroundColor: "rgba(0,0,0,0.6)",
                color: "white",
                padding: "5px 10px",
                borderRadius: "5px",
              }}
            >
              You
            </div>
          </div>
        )}

        {/* Remote Video */}
        {remoteStream && (
          <div
            style={{
              position: "relative",
              borderRadius: "10px",
              overflow: "hidden",
            }}
          >
            <ReactPlayer playing muted height="250px" width="100%" url={remoteStream} />
            <div
              style={{
                position: "absolute",
                bottom: "10px",
                left: "10px",
                backgroundColor: "rgba(0,0,0,0.6)",
                color: "white",
                padding: "5px 10px",
                borderRadius: "5px",
              }}
            >
              Remote User
            </div>
          </div>
        )}
      </div>

      {/* Controls */}
      <div style={{ marginTop: "20px" }}>
        <button
          onClick={handleMuteAudio}
          style={{
            padding: "10px 20px",
            marginRight: "10px",
            backgroundColor: isAudioMuted ? "#ff3b30" : "#007bff",
            color: "#fff",
            border: "none",
            borderRadius: "5px",
            cursor: "pointer",
          }}
        >
          {isAudioMuted ? "Unmute Audio" : "Mute Audio"}
        </button>
        <button
          onClick={handleMuteVideo}
          style={{
            padding: "10px 20px",
            marginRight: "10px",
            backgroundColor: isVideoMuted ? "#ff3b30" : "#007bff",
            color: "#fff",
            border: "none",
            borderRadius: "5px",
            cursor: "pointer",
          }}
        >
          {isVideoMuted ? "Unmute Video" : "Mute Video"}
        </button>
        {remoteSocketId && (
          <button
            onClick={handleCallUser}
            style={{
              padding: "10px 20px",
              backgroundColor: "#28a745",
              color: "#fff",
              border: "none",
              borderRadius: "5px",
              cursor: "pointer",
            }}
          >
            CALL
          </button>
        )}
      </div>
    </div>
  );
};

export default RoomPage;
