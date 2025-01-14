import React, { useEffect, useState, useRef } from "react";
import ReactQuill from "react-quill";
import "react-quill/dist/quill.snow.css";
import { useNavigate } from "react-router-dom";

const MailClient = () => {
  const [to, setTo] = useState("");
  const [subject, setSubject] = useState("");
  const [text, setText] = useState("");
  const [attachment, setAttachment] = useState(null);
  const [status, setStatus] = useState("");
  const fileRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (!localStorage.getItem("authToken")) navigate("/login");
  }, []);

  const handleAttachment = (e) => {
    setAttachment(e.target.files[0]);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const formData = new FormData();
    formData.append("to", to);
    formData.append("subject", subject);
    formData.append("html", text); // WYSIWYG editor outputs HTML
    if (attachment) formData.append("attachment", attachment);

    try {
      const response = await fetch("/api/send-email", {
        method: "POST",
        body: formData,
      });

      const data = await response.json();
      if (response.ok) {
        setStatus("Email sent successfully!");
      } else {
        setStatus(data.error || "Failed to send email.");
      }
    } catch (error) {
      setStatus("Error occurred while sending email.");
    }
  };

  return (
    <div className="mail-client">
      {status && <div className="status">{status}</div>}
      <form style={{ width: '100%' }} onSubmit={handleSubmit} encType="multipart/form-data">
        <input
          type="email"
          placeholder="Recipient's Email"
          value={to}
          onChange={(e) => setTo(e.target.value)}
          required
        />
        <input
          type="text"
          placeholder="Subject"
          value={subject}
          onChange={(e) => setSubject(e.target.value)}
          required
        />
        <ReactQuill value={text} onChange={setText} placeholder="Compose your email..." />
        <input type="file" onChange={handleAttachment} />
        <button type="submit">Send</button>
      </form>
    </div>
  );
};

export default MailClient;
