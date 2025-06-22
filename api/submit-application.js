const nodemailer = require("nodemailer");
const multer = require("multer");
const { Readable } = require("stream");

// Configure multer for file uploads (in-memory storage for serverless)
const upload = multer({
  storage: multer.memoryStorage(),
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
}).single("resume");

// Nodemailer transporter configuration
const transporter = nodemailer.createTransport({
  host: "smtp.zoho.com", // or 'smtp.mail.com' for Mail.com
  port: 587,
  secure: false, // Use TLS
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

module.exports = async (req, res) => {
  // Handle CORS for Vercel
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  // Handle preflight requests
  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  if (req.method !== "POST") {
    return res.status(405).json({ message: "Method not allowed" });
  }

  // Process file upload
  upload(req, res, async (err) => {
    if (err) {
      console.error("Multer error:", err);
      return res
        .status(400)
        .json({ message: `File upload error: ${err.message}` });
    }

    try {
      const formData = req.body;
      const resume = req.file;

      // Prepare email content
      const mailOptions = {
        from: process.env.EMAIL_USER,
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
                    <p><strong>IRS Verified:</strong> ${
                      formData.irs_verified
                    }</p>
                    <p><strong>Reliable Internet:</strong> ${
                      formData.internet
                    }</p>
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
                    <p><strong>Cover Letter:</strong> ${
                      formData.cover_letter
                    }</p>
                    <p><strong>Why Support:</strong> ${formData.why_support}</p>
                    <p><strong>Unique Qualities:</strong> ${
                      formData.qualities
                    }</p>
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
      const info = await transporter.sendMail(mailOptions);
      console.log("Email sent:", info.messageId, "to:", mailOptions.to);
      res.status(200).json({ message: "Application submitted successfully" });
    } catch (error) {
      console.error("Error sending email:", error);
      res
        .status(500)
        .json({ message: `Failed to submit application: ${error.message}` });
    }
  });
};
