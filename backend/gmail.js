const { google } = require("googleapis");
const nodemailer = require("nodemailer");
const multer = require("multer");

const oauth2Client = new google.auth.OAuth2(
  process.env.CLIENT_ID,
  process.env.CLIENT_SECRET,
  process.env.REDIRECT_URI
);

// Set refresh token
oauth2Client.setCredentials({
  refresh_token: process.env.REFRESH_TOKEN,
});

const getAccessToken = async () => {
  try {
    const { token } = await oauth2Client.getAccessToken();
    return token;
  } catch (error) {
    console.error("Failed to generate access token:", error);
    throw error;
  }
};

// Configure Nodemailer transport
const createTransporter = async () => {
  const accessToken = await getAccessToken();
  return nodemailer.createTransport({
    service: "gmail",
    auth: {
      type: "OAuth2",
      user: process.env.EMAIL_ADDRESS,
      clientId: process.env.CLIENT_ID,
      clientSecret: process.env.CLIENT_SECRET,
      refreshToken: process.env.REFRESH_TOKEN,
      accessToken,
    },
  });
};

// Send email with optional attachments
const sendEmail = async (emailOptions) => {
  const transporter = await createTransporter();
  await transporter.sendMail(emailOptions);
};

const getEmails = async () => {
	try {
		const gmail = google.gmail({ version: "v1", auth: oauth2Client });

		// List messages
		const res = await gmail.users.messages.list({
			userId: "me",
			q: "label:inbox", // Optional query
			maxResults: 10, // Adjust as needed
		});

		const messages = res.data.messages || [];

		// Fetch detailed information for each email
		const emailDetails = await Promise.all(
			messages.map(async (message) => {
				const email = await gmail.users.messages.get({
					userId: "me",
					id: message.id,
				});

				// Extract attachment metadata
				const parts = email.data.payload?.parts || [];
				const attachments = parts
				.filter((part) => part.filename && part.body.attachmentId)
				.map((part) => ({
						filename: part.filename,
						mimeType: part.mimeType,
						attachmentId: part.body.attachmentId,
						emailId: message.id,
				}));

				return {
					...email.data,
					attachments,
				};
			})
		);

		return emailDetails;
	} catch (error) {
		console.error("Error fetching emails:", error.message);
		return [];
	}
};

const getEmail = async (id) => {
	try {
    const gmail = google.gmail({ version: "v1", auth: oauth2Client });
    const email = await gmail.users.messages.get({ userId: "me", id });

    const parts = email.data.payload?.parts || [];
    const attachments = parts
      .filter((part) => part.filename && part.body.attachmentId)
      .map((part) => ({
        filename: part.filename,
        mimeType: part.mimeType,
        attachmentId: part.body.attachmentId,
      }));

    return {
      ...email.data,
      attachments,
    };
  } catch (error) {
    console.error("Error fetching email:", error.message);
    throw new Error(error.message);
  }
};

const getAttachment = async (emailId, attachmentId) => {
	try {
    const gmail = google.gmail({ version: "v1", auth: oauth2Client });

    const attachment = await gmail.users.messages.attachments.get({
      userId: "me",
      messageId: emailId,
      id: attachmentId,
    });

    return attachment;
  } catch (error) {
    console.error("Error fetching attachment:", error.message);
    throw new Error("Failed to fetch attachment. " + error.message);
  }
};

module.exports = { sendEmail, getEmails, getEmail, getAttachment };
