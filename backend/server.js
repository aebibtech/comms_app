require("dotenv").config();
const express = require("express");
const multer = require("multer");
const path = require("path");
const cors = require("cors");
const http = require("http");
const { Server } = require("socket.io");
const jwt = require("jsonwebtoken");
const mongoose = require("mongoose");
const bcrypt = require("bcrypt");
const winston = require("winston");
const { sendEmail, getEmails, getEmail, getAttachment } = require("./gmail");
const { Twilio } = require("twilio");
const twilio = require("twilio");
const VoiceResponse = require('twilio').twiml.VoiceResponse;

const client = twilio(
  process.env.TWILIO_ACCOUNT_SID,
  process.env.TWILIO_AUTH_TOKEN
);

// Twilio Configuration
const TWILIO_ACCOUNT_SID = process.env.TWILIO_ACCOUNT_SID;
const TWILIO_AUTH_TOKEN = process.env.TWILIO_AUTH_TOKEN;
const TWILIO_PHONE_NUMBER = process.env.TWILIO_PHONE_NUMBER;
const TWILIO_TWIML_APP_SID = process.env.TWILIO_TWIML_APP_SID;

const twilioClient = new Twilio(TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN);

// Initialize Express and HTTP server
const app = express();

// Middleware to enable CORS
app.use(cors({
  origin: '*', // You can specify the frontend URL here (or '*' for all origins)
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  credentials: true, // Allow cookies to be sent with requests
}));

const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*"
  }
});

// Secret key for JWT
const SECRET_KEY = process.env.SECRET_KEY;
const PORT = process.env.PORT || 3000;

// Connect to MongoDB
mongoose.connect(process.env.MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
});  

// MongoDB Models
const User = mongoose.model("User", new mongoose.Schema({
  username: { type: String, unique: true },
  password: String, // In production, store hashed passwords!
}));

const Message = mongoose.model("Message", new mongoose.Schema({
  sender: String,
  text: String,
  fileUrl: String,
  fileType: String,
  createdAt: { type: Date, default: Date.now },
}));

// Routes

// Configure Winston logger
const logger = winston.createLogger({
  level: "info",
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.printf(({ timestamp, level, message }) => {
      return `${timestamp} [${level.toUpperCase()}]: ${message}`;
    })
  ),
  transports: [
    new winston.transports.Console(),
    new winston.transports.File({ filename: "logs/app.log" }),
  ],
});

// Middleware to parse JSON bodies
app.use(express.json());

app.use(express.urlencoded({ extended: false }));

// Use logger in middleware and routes
app.use((req, res, next) => {
  logger.info(`${req.method} ${req.url} - ${JSON.stringify(req.body)}`);
  next();
});

// Set up storage for uploaded files
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/"); // Save files in the 'uploads' directory
  },
  filename: (req, file, cb) => {
    cb(null, `${Date.now()}-${file.originalname}`);
  },
});

const upload = multer({ storage });
const gmailUpload = multer({ storage: multer.memoryStorage() });

// Serve uploaded files
app.use("/api/uploads", express.static(path.join(__dirname, "uploads")));

// Endpoint for file uploads
app.post("/api/upload", upload.single("file"), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: "No file uploaded" });
  }

  const fileUrl = `/api/uploads/${req.file.filename}`;
  const fileType = req.file.mimetype;
  res.json({ fileUrl, fileType });
});

// User Registration Route
app.post("/api/register", async (req, res) => {
  const { username, password } = req.body;

  try {
    // Hash the password
    const hashedPassword = await bcrypt.hash(password, 10);

    const user = new User({ username, password: hashedPassword });
    await user.save();
    res.status(201).json({ success: "User registered successfully" });
  } catch (error) {
    res.status(400).json({ error: "User registration failed" + error });
  }
});

// User Login Route
app.post("/api/login", async (req, res) => {
  const { username, password } = req.body;

  const user = await User.findOne({ username });
  if (user && await bcrypt.compare(password, user.password)) {
    const token = jwt.sign({ username }, SECRET_KEY, { expiresIn: "24h" });
    return res.json({ token });
  }

  return res.status(401).json({ error: "Invalid username or password" });
});

// Send Email
app.post("/api/send-email", gmailUpload.single("attachment"), async (req, res) => {
  const { to, subject, text, html } = req.body;
  const file = req.file;

  if (!to || !subject || (!text && !html)) {
    return res.status(400).json({ error: "All fields are required." });
  }

  const emailOptions = {
    from: process.env.EMAIL_ADDRESS,
    to,
    subject,
    text,
    html,
    attachments: file
      ? [
          {
            filename: file.originalname,
            content: file.buffer,
            contentType: file.mimetype,
          },
        ]
      : [],
  };

  try {
    await sendEmail(emailOptions);
    res.status(200).json({ message: "Email sent successfully!" });
  } catch (error) {
    logger.info("Failed to send email:", error);
    res.status(500).json({ error: "Failed to send email." });
  }
});

app.get("/api/emails", async (req, res) => {
  try {
    const emails = await getEmails();
    res.json(emails);
  } catch (error) {
    res.status(500).send("Error fetching emails");
  }
});

app.get("/api/emails/:id", async (req, res) => {
  const { id } = req.params;

  try {
    const email = await getEmail(id);
    res.json(email);
  } catch (error) {
    logger.info("Error fetching email:", error.message);
    res.status(500).send("Failed to fetch email");
  }
});

app.get("/api/attachments/:emailId/:attachmentId", async (req, res) => {
  const { emailId, attachmentId } = req.params;

  try {
    const attachment = await getAttachment(emailId, attachmentId);

    // Send decoded attachment data
    const buffer = Buffer.from(attachment.data.data, "base64");
    res.set("Content-Type", attachment.data.mimeType);
    res.send(buffer);
  } catch (error) {
    logger.info("Error fetching attachment:", error.message);
    res.status(500).send("Failed to fetch attachment");
  }
});


// SMS Endpoint
app.post("/api/send-sms", async (req, res) => {
  const { to, message } = req.body;

  if (!to || !message) {
    return res.status(400).json({ error: "Recipient and message are required." });
  }

  try {
    const smsResponse = await twilioClient.messages.create({
      body: message,
      from: TWILIO_PHONE_NUMBER,
      to,
    });

    res.status(200).json({
      message: "SMS sent successfully",
      sid: smsResponse.sid,
    });
  } catch (error) {
    logger.info("Error sending SMS:", error.message);
    res.status(500).json({ error: "Failed to send SMS" });
  }
});

// Fetch Received Messages Endpoint
app.get("/api/messages", async (req, res) => {
  try {
    const messages = await twilioClient.messages.list({ limit: 50 });

    const receivedMessages = messages
      .filter((msg) => msg.direction === "inbound")
      .map((msg) => ({
        from: msg.from,
        body: msg.body,
        dateSent: msg.dateSent,
        sid: msg.sid,
      }));

    res.status(200).json(receivedMessages);
  } catch (error) {
    logger.info("Error fetching messages:", error.message);
    res.status(500).json({ error: "Failed to fetch messages" });
  }
});

// Single SMS Retrieval Endpoint
app.get("/api/messages/:sid", async (req, res) => {
  const { sid } = req.params;  // Get the SID from the request parameters

  try {
    // Fetch the message from Twilio using the SID
    const message = await twilioClient.messages(sid).fetch();

    // Return the message details
    res.status(200).json({
      sid: message.sid,
      from: message.from,
      to: message.to,
      body: message.body,
      status: message.status,
      dateSent: message.dateSent,
      mediaUrl: message.mediaUrl ? message.mediaUrl : null,  // If media exists
    });
  } catch (error) {
    logger.info("Error fetching message:", error.message);
    res.status(500).json({ error: "Failed to fetch the message" });
  }
});

// Calls
// Generate access token for Twilio Client
app.get('/api/token', (req, res) => {
  const AccessToken = twilio.jwt.AccessToken;
  const VoiceGrant = AccessToken.VoiceGrant;

  const accessToken = new AccessToken(
    process.env.TWILIO_ACCOUNT_SID,
    process.env.TWILIO_API_KEY,
    process.env.TWILIO_API_SECRET,
    {
      identity: 'browser-user'
    }
  );

  // Create Voice grant
  const voiceGrant = new VoiceGrant({
    outgoingApplicationSid: process.env.TWILIO_TWIML_APP_SID,
    incomingAllow: true,
  });

  // Add voice grant to token
  accessToken.addGrant(voiceGrant);
  // accessToken.identity = 'browser-user';

  res.json({
    token: accessToken.toJwt()
  });
});

// Handle incoming calls
app.post('/api/voice/incoming', (req, res) => {
  const twiml = new VoiceResponse();
  const { To } = req.body;
  if (!To) {
    // Direct the call to the client
    const dial = twiml.dial();
    dial.client('browser-user');
  }
  else {
    const dial = twiml.dial({
      callerId: process.env.TWILIO_PHONE_NUMBER
    });
    
    dial.number(req.body.To);
    // twiml.dial({
    //   callerId: process.env.TWILIO_PHONE_NUMBER
    // }, To);
  }
  
  res.type('text/xml');
  res.send(twiml.toString());
});

// Handle client-side outgoing calls
app.post('/api/voice/outgoing', (req, res) => {
  const twiml = new VoiceResponse();
  // const dial = twiml.dial({
  //   callerId: process.env.TWILIO_PHONE_NUMBER
  // });
  
  // dial.number(req.body.numberToCall);
  twiml.dial({
    callerId: process.env.TWILIO_PHONE_NUMBER
  }, req.body.To);
    
  logger.info('dialing number: ' + req.body.To);
  res.type('text/xml');
  res.send(twiml.toString());
});

// Serve static files
app.use(express.static("public"));

// Socket.IO Authentication Middleware
io.use((socket, next) => {
  const token = socket.handshake.auth.token?.split(" ")[1];
  if (!token) {
    return next(new Error("Authentication error: Token missing"));
  }

  try {
    const decoded = jwt.verify(token, SECRET_KEY);
    socket.user = decoded; // Attach user info to the socket
    next();
  } catch (err) {
    next(new Error("Authentication error: Invalid token"));
  }
});

io.on("connection", (socket) => {
  console.log(`${socket.user.username} connected`);
  
  // Send previous messages (optional, fetch from MongoDB)
  Message.find()
    .sort({ createdAt: 1 })
    .then((messages) => {
      socket.emit("previousMessages", messages.map((msg) => ({
        sender: msg.sender,
        text: msg.text,
        fileUrl: msg.fileUrl,
        fileType: msg.fileType,
        createdAt: msg.createdAt
      })));
    });

  // Handle new messages
  socket.on("sendmessage", async (data) => {
    const { sender, text, fileUrl, fileType } = data;

    // Save to MongoDB
    const newMessage = new Message({ sender, text, fileUrl, fileType });
    const savedMessage = await newMessage.save();

    // Broadcast message with timestamp
    io.emit("message", {
      sender,
      text,
      fileUrl,
      fileType,
      createdAt: savedMessage.createdAt,
    });
  });

  setInterval(async () => {
    const messages = await twilioClient.messages.list({ limit: 50 });
    const receivedMessages = messages
      .filter((msg) => msg.direction === "inbound")
      .map((msg) => ({
        from: msg.from,
        body: msg.body,
        dateSent: msg.dateSent,
        sid: msg.sid,
      }));

    socket.emit("newMessage", receivedMessages);
  }, 5000); // Polling every 5 seconds for new messages

  socket.on("disconnect", () => {
    logger.info(`${socket.user.username} has disconnected.`);
  });
});

// Start the server
server.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
