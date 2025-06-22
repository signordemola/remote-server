require("dotenv").config();
const express = require("express");
const nodemailer = require("nodemailer");
const cors = require("cors");
const multer = require("multer");
const path = require("path");
const app = express();
const port = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Configure multer for file uploads
const storage = multer.memoryStorage();
const upload = multer({
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: (req, file, cb) => {
    const allowedTypes = [
      "application/pdf",
      "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    ];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error("Only PDF and DOC files are allowed"));
    }
  },
});

// Verify environment variables
console.log("GMAIL_USER:", process.env.GMAIL_USER);
console.log("GMAIL_PASS:", process.env.GMAIL_PASS ? "****" : "Not set");

// Nodemailer transporter configuration
const transporter = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 587,
  secure: false, // Use TLS
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_PASS,
  },
});

// Verify transporter configuration
transporter.verify((error, success) => {
  if (error) {
    console.error("Transporter verification failed:", error);
  } else {
    console.log("Transporter is ready to send emails");
  }
});

// Form submission endpoint
app.post("/submit-application", upload.single("resume"), async (req, res) => {
  try {
    const formData = req.body;
    const resume = req.file;

    // Prepare email content
    const mailOptions = {
      from: process.env.GMAIL_USER,
      to: "adedamola4678@gmail.com", // Replace with your email
      subject: "New Job Application Submission",
      html: `
                <h2>New Application for Remote Chat Support/Data Entry Role</h2>
                <p><strong>Full Name:</strong> ${formData.name}</p>
                <p><strong>Email:</strong> ${formData.email}</p>
                <p><strong>Phone:</strong> ${formData.phone}</p>
                <p><strong>Date of Birth:</strong> ${formData.dob}</p>
                <p><strong>Address:</strong> ${formData.address}</p>
                <p><strong>State:</strong> ${formData.state}</p>
                <p><strong>U.S. Authorized:</strong> ${formData.us_auth}</p>
                <p><strong>IRS Verified:</strong> ${formData.irs_verified}</p>
                <p><strong>Reliable Internet:</strong> ${formData.internet}</p>
                <p><strong>Remote Experience:</strong> ${
                  formData.remote_exp
                }</p>
                <p><strong>Desired Salary:</strong> ${formData.salary} (${
        formData.salary_type
      })</p>
                <p><strong>Weekly Hours:</strong> ${formData.hours}</p>
                <p><strong>Hourly Rate:</strong> ${formData.hourly_rate}</p>
                <p><strong>Availability:</strong> ${
                  Array.isArray(formData.availability)
                    ? formData.availability.join(", ")
                    : formData.availability
                }</p>
                <p><strong>Experience:</strong> ${formData.experience}</p>
                <p><strong>Cover Letter:</strong> ${formData.cover_letter}</p>
                <p><strong>Why Support:</strong> ${formData.why_support}</p>
                <p><strong>Unique Qualities:</strong> ${formData.qualities}</p>
                <p><strong>Referred By:</strong> ${formData.referred}</p>
                <p><strong>Why Good Fit:</strong> ${formData.message}</p>
                <p><strong>Genuine Information Confirmed:</strong> ${
                  formData.genuine ? "Yes" : "No"
                }</p>
            `,
      attachments: resume
        ? [
            {
              filename: resume.originalname,
              content: resume.buffer,
            },
          ]
        : [],
    };

    // Send email
    await transporter.sendMail(mailOptions);
    res.status(200).json({ message: "Application submitted successfully" });
  } catch (error) {
    console.error("Error sending email:", error);
    res
      .status(500)
      .json({ message: `Failed to submit application: ${error.message}` });
  }
});

// Serve the HTML file
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "index.html"));
});

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});
