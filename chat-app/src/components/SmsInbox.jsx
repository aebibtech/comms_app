import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import io from "socket.io-client";

const SmsInbox = () => {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [socket, setSocket] = useState(null);

  useEffect(() => {
    const fetchMessages = async () => {
      try {
        const response = await fetch("/api/messages");
        if (!response.ok) {
          throw new Error("Failed to fetch messages");
        }

        const data = await response.json();
        setMessages(data);
        setLoading(false);
      } catch (err) {
        setError(err.message);
        setLoading(false);
      }
    };

    fetchMessages();

    const socketConnection = io();
    setSocket(socketConnection);

    socketConnection.on("newMessage", (newMessages) => {
      setMessages(newMessages); // Update state with real-time messages
    });

    return () => {
      socketConnection.disconnect();
    };
  }, []);

  if (loading) {
    return <div>Loading messages...</div>;
  }

  if (error) {
    return <div>Error: {error}</div>;
  }

  return (
    <div style={{ padding: "20px", maxWidth: "600px", margin: "0 auto" }}>
      <Link to="/sms">✉️ Send SMS</Link>
      {messages.length === 0 ? (
        <p>No messages received.</p>
      ) : (
        <table
          style={{
            width: "100%",
            borderCollapse: "collapse",
            marginTop: "20px",
          }}
        >
          <thead>
            <tr>
              <th style={{ border: "1px solid #ddd", padding: "8px" }}>From</th>
              <th style={{ border: "1px solid #ddd", padding: "8px" }}>Message</th>
              <th style={{ border: "1px solid #ddd", padding: "8px" }}>Date</th>
            </tr>
          </thead>
          <tbody>
            {messages.map((msg) => (
              <tr key={msg.sid}>
                <td style={{ border: "1px solid #ddd", padding: "8px" }}>
                  <Link to={`/smsinbox/${msg.sid}`}>{msg.from}</Link>
                </td>
                <td style={{ border: "1px solid #ddd", padding: "8px" }}>
                  {msg.body}
                </td>
                <td style={{ border: "1px solid #ddd", padding: "8px" }}>
                  {new Date(msg.dateSent).toLocaleString()}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
};

export default SmsInbox;
