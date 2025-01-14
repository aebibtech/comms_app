import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";

const EmailList = () => {
  const [emails, setEmails] = useState([]);
	const navigate = useNavigate();

  // Fetch emails
  const fetchEmails = async () => {
    try {
      const response = await fetch("/api/emails");
      if (!response.ok) {
        throw new Error(`Error: ${response.statusText}`);
      }
      const data = await response.json();
      setEmails(data);
    } catch (error) {
      console.error("Error fetching emails:", error.message);
    }
  };

	const handleSendEmailClick = () => {
    navigate("/mail"); // Adjust the route based on your setup
  };

  useEffect(() => {
    fetchEmails();

    // Poll for new emails every 30 seconds
    const interval = setInterval(fetchEmails, 15000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="email-list">
			<button onClick={handleSendEmailClick} className="send-email-button">
        + Send E-Mail
      </button>
      <table className="email-table">
        <thead>
          <tr>
            <th>From</th>
            <th>Subject</th>
            <th>Snippet</th>
            <th>Attachments</th>
          </tr>
        </thead>
        <tbody>
          {emails.length > 0 ? (
            emails.map((email) => (
              <tr key={email.id}>
                <td>
                  <Link to={`/view-email/${email.id}`}>
                    {email.payload.headers.find((h) => h.name === "From")?.value}
                  </Link>
                </td>
                <td>
                  {email.payload.headers.find((h) => h.name === "Subject")?.value}
                </td>
                <td>{email.snippet}</td>
                <td>
                  {email.attachments.length > 0 ? (
                    email.attachments.map((attachment) => (
                      <a
                        key={attachment.attachmentId}
                        href={`/api/attachments/${email.id}/${attachment.attachmentId}`}
                        download={attachment.filename}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        {attachment.filename}
                      </a>
                    ))
                  ) : (
                    "None"
                  )}
                </td>
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan="4">No emails found.</td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
};

export default EmailList;
