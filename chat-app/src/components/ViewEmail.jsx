import React, { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";

const ViewEmail = () => {
  const { emailId } = useParams();
  const [email, setEmail] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchEmail = async () => {
    try {
      const response = await fetch(`/api/emails/${emailId}`);
      if (!response.ok) {
        throw new Error(`Error: ${response.statusText}`);
      }
      const data = await response.json();
      setEmail(data);
      setLoading(false);
    } catch (error) {
      console.error("Error fetching email:", error.message);
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEmail();
  }, [emailId]);

  if (loading) {
    return <div>Loading email...</div>;
  }

  if (!email) {
    return <div>Error loading email.</div>;
  }

  const { payload, attachments } = email;
  const from = payload.headers.find((h) => h.name === "From")?.value || "Unknown";
  const subject = payload.headers.find((h) => h.name === "Subject")?.value || "No Subject";
  const date = payload.headers.find((h) => h.name === "Date")?.value || "Unknown Date";

  // Decode the email body (handle base64 encoding)
  const decodeBase64 = (str) => {
    try {
      return decodeURIComponent(escape(window.atob(str.replace(/-/g, "+").replace(/_/g, "/"))));
    } catch (error) {
      console.error("Error decoding email body:", error.message);
      return "Error decoding email content.";
    }
  };

  const emailBody = payload.parts
    ? payload.parts.find((part) => part.mimeType === "text/html" || part.mimeType === "text/plain")?.body?.data
    : payload.body?.data;

  return (
    <div className="view-email">
      <Link to="/inbox" className="back-link">← Back to Inbox</Link>
      <h2>{subject}</h2>
      <p><strong>From:</strong> {from}</p>
      <p><strong>Date:</strong> {date}</p>
      <hr />
      <div className="email-body">
        {emailBody ? (
          <div
            dangerouslySetInnerHTML={{
              __html: decodeBase64(emailBody),
            }}
          ></div>
        ) : (
          <p>No content available.</p>
        )}
      </div>
      {attachments.length > 0 && (
        <div className="attachments">
          <h3>Attachments:</h3>
          {attachments.map((attachment) => (
            <a
              key={attachment.attachmentId}
              href={`/api/attachments/${emailId}/${attachment.attachmentId}`}
              download={attachment.filename}
              target="_blank"
              rel="noopener noreferrer"
            >
              {attachment.filename}
            </a>
          ))}
        </div>
      )}
    </div>
  );
};

export default ViewEmail;

