import React, { useState } from "react";
import { Link } from "react-router-dom";

const SmsClient = () => {
  const [recipient, setRecipient] = useState("");
  const [message, setMessage] = useState("");
  const [status, setStatus] = useState("");

  const sendSms = async (e) => {
    e.preventDefault();

    try {
      const response = await fetch("/api/send-sms", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ to: recipient, message }),
      });

      const data = await response.json();

      if (response.ok) {
        setStatus(`SMS sent successfully! Message SID: ${data.sid}`);
      } else {
        setStatus(`Error: ${data.error}`);
      }
    } catch (error) {
      console.error("Error sending SMS:", error.message);
      setStatus("Failed to send SMS. Please try again.");
    }
  };

  return (
    <div style={{ padding: "20px", maxWidth: "400px", margin: "0 auto" }}>
      <Link to="/smsinbox">⬅️ Back to Inbox</Link>
      <form onSubmit={sendSms}>
        <div style={{ marginBottom: "10px" }}>
          <label>Recipient:</label>
          <input
            type="tel"
            value={recipient}
            onChange={(e) => setRecipient(e.target.value)}
            placeholder="+1234567890"
            required
            style={{
              width: "100%",
              padding: "8px",
              margin: "5px 0",
              border: "1px solid #ccc",
              borderRadius: "4px",
            }}
          />
        </div>
        <div style={{ marginBottom: "10px" }}>
          <label>Message:</label>
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Type your message here..."
            required
            style={{
              width: "100%",
              padding: "8px",
              margin: "5px 0",
              border: "1px solid #ccc",
              borderRadius: "4px",
            }}
          />
        </div>
        <button
          type="submit"
          style={{
            backgroundColor: "#007bff",
            color: "#fff",
            border: "none",
            padding: "10px 15px",
            borderRadius: "4px",
            cursor: "pointer",
          }}
        >
          Send SMS
        </button>
      </form>
      {status && (
        <div style={{ marginTop: "10px", color: status.includes("Error") ? "red" : "green" }}>
          {status}
        </div>
      )}
    </div>
  );
};

export default SmsClient;
