import React, { useState, useEffect } from "react";
import { Link, useParams } from "react-router-dom";

const SmsView = () => {
  const { sid } = useParams(); // Get the message SID from the URL
  const [message, setMessage] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchMessage = async () => {
      try {
        const response = await fetch(`/api/messages/${sid}`);
        if (!response.ok) {
          throw new Error("Failed to fetch message");
        }

        const data = await response.json();
        setMessage(data);
        setLoading(false);
      } catch (err) {
        setError(err.message);
        setLoading(false);
      }
    };

    fetchMessage();
  }, [sid]);

  if (loading) {
    return <div>Loading message...</div>;
  }

  if (error) {
    return <div>Error: {error}</div>;
  }

  return (
    <div style={{ padding: "20px", maxWidth: "600px", margin: "0 auto" }}>
      <Link to="/smsinbox">⬅️ Back to Inbox</Link>
      <p><strong>From:</strong> {message.from}</p>
      <p><strong>Message:</strong> {message.body}</p>
      <p><strong>Received on:</strong> {new Date(message.dateSent).toLocaleString()}</p>
    </div>
  );
};

export default SmsView;
