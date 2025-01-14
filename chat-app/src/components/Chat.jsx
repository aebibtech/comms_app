import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import "./Chat.css";
import { io } from "socket.io-client";

const Chat = () => {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [username, setUsername] = useState("");
  const [file, setFile] = useState(null);
  const messagesEndRef = useRef(null);
  const fileInputRef = useRef(null);
  const navigate = useNavigate();

  // Initialize Socket.IO
  const socket = useRef(null);

  useEffect(() => {
    setUsername(localStorage.getItem("username"));

    // Connect to the backend socket server
    socket.current = io("/", {
      auth: {
        token: `Bearer ${localStorage.getItem("authToken")}`, // Add your auth token for secure connections
      },
    });

    // Listen for incoming messages
    socket.current.on("message", (message) => {
      setMessages((prevMessages) => [...prevMessages, message]);
    });

    // Optionally fetch previous messages (requires backend support)
    socket.current.on("previousMessages", (previousMessages) => {
      setMessages(previousMessages);
    });

    // Handle socket connection error
    socket.current.on("connect_error", (err) => {
      console.error("Socket connection failed:", err.message);
      // alert("Connection failed. Please log in again.");
      navigate("/login");
    });

    // Clean up when the component unmounts
    return () => {
      socket.current.disconnect();
    };
  }, []);

  // Scroll to the bottom of the chat when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSendMessage = () => {
    if (!input.trim() && !file) return;

    const message = { text: input, sender: username, createdAt: new Date() };

    if (file) {
      const formData = new FormData();
      formData.append("file", file);
      fetch("/api/upload", {
        method: "POST",
        body: formData,
      })
        .then((res) => res.json())
        .then((data) => {
          message.fileUrl = data.fileUrl;
          message.fileType = data.fileType;
          socket.current.emit("sendmessage", message);
        })
        .catch((err) => {
          console.error("File upload error:", err);
          message.fileUrl = null;
          message.fileType = null;
        });
    } else {
      message.fileUrl = null;
      message.fileType = null;
      socket.current.emit("sendmessage", message);
    }

    setInput("");
    setFile(null);
    fileInputRef.current.value = null;

    // if (input.trim()) {
    //   const message = { text: input, sender: username, createdAt: new Date() };
    //   socket.current.emit("sendmessage", message);
    //   // setMessages([...messages, message]);
    //   setInput("");
    // }
  };

  const handleFileChange = (e) => {
    setFile(e.target.files[0]);
  };

  const renderFile = (message) => {
    if (message.fileUrl) {
      const isImage = message.fileType?.startsWith("image/");
      if (isImage) {
        return <img src={message.fileUrl} alt="Uploaded" className="chat-image" />;
      }
      return (
        <a href={message.fileUrl} target="_blank" rel="noopener noreferrer" className="chat-file">
          {message.fileUrl}
        </a>
      );
    }
    return null;
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter") handleSendMessage();
  };

  return (
    <div className="chat-container">
      {/* Chat Header */}
      <div className="chat-header">
        <div className="chat-recipient">
          <div className="recipient-name">Me</div>
          <div className="status">Online</div>
        </div>
      </div>

      {/* Messages Area */}
      <div className="chat-messages">
        {messages.map((message, index) => (
          <div
            key={index}
            className={`chat-message ${
              message.sender === username ? "self" : "other"
            }`}
          >
            {message.text && <p>{message.text}</p>}
            {renderFile(message)}
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="chat-input">
        <input
          type="text"
          placeholder="Type a message..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyUp={handleKeyPress}
        />
        <input ref={fileInputRef} type="file" onChange={handleFileChange} />
        <button onClick={handleSendMessage}>Send</button>
      </div>
    </div>
  );
};

export default Chat;
