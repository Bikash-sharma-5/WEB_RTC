import React, { useState, useCallback, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useSocket } from "../context/SocketProvider";

const LobbyScreen = () => {
  const [email, setEmail] = useState("");
  const [room, setRoom] = useState("");

  const socket = useSocket();
  const navigate = useNavigate();

  const handleSubmitForm = useCallback(
    (e) => {
      e.preventDefault();
      socket.emit("room:join", { email, room });
    },
    [email, room, socket]
  );

  const handleJoinRoom = useCallback(
    (data) => {
      const { email, room } = data;
      navigate(`/room/${room}`);
    },
    [navigate]
  );

  useEffect(() => {
    socket.on("room:join", handleJoinRoom);
    return () => {
      socket.off("room:join", handleJoinRoom);
    };
  }, [socket, handleJoinRoom]);

  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: "100vh", backgroundColor: "#f5f5f5" }}>
      <h1 style={{ color: "#333" }}>Lobby</h1>
      <form onSubmit={handleSubmitForm} style={{ display: "flex", flexDirection: "column", gap: "10px", padding: "20px", backgroundColor: "white", borderRadius: "8px", boxShadow: "0 4px 8px rgba(0, 0, 0, 0.1)" }}>
        <label htmlFor="email" style={{ fontWeight: "bold" }}>Email ID</label>
        <input
          type="email"
          id="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          style={{ padding: "8px", borderRadius: "4px", border: "1px solid #ccc" }}
        />
        <label htmlFor="room" style={{ fontWeight: "bold" }}>Room Number</label>
        <input
          type="text"
          id="room"
          value={room}
          onChange={(e) => setRoom(e.target.value)}
          style={{ padding: "8px", borderRadius: "4px", border: "1px solid #ccc" }}
        />
        <button style={{ padding: "10px", backgroundColor: "#007bff", color: "white", border: "none", borderRadius: "4px", cursor: "pointer" }}>Join</button>
      </form>
    </div>
  );
};

export default LobbyScreen;
