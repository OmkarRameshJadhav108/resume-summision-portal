const express = require('express');
const multer = require('multer');
const nodemailer = require('nodemailer');
const path = require('path');
require('dotenv').config();
console.log(process.env.ADMIN_EMAIL);  // TEMP test

const app = express();
const PORT = 3000;

// Serve static HTML form
app.use(express.static(__dirname));

// Multer setup
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, 'uploads'),
  filename: (req, file, cb) => cb(null, Date.now() + '-' + file.originalname)
});
const upload = multer({ storage: storage });

// Nodemailer transporter
const transporter = nodemailer.createTransport({
  service: 'gmail',
  host: "smtp.gmail.com",
  port: 587,
  secure: false,
  auth: {
    user: process.env.ADMIN_EMAIL,
    pass: process.env.ADMIN_PASS
  }
});

// POST route to handle upload and email
app.post('/upload', upload.single('resume'), async (req, res) => {
  const { name, email } = req.body;
  const resumePath = req.file.path;

  // Email to Admin
  const adminMail = {
    from: `"Resume Bot" <${process.env.ADMIN_EMAIL}>`,
    to: process.env.ADMIN_EMAIL,
    subject: `New Resume Submission from ${name}`,
    text: `Candidate Name: ${name}\nEmail: ${email}`,
    attachments: [
      {
        filename: req.file.originalname,
        path: resumePath
      }
    ]
  };

  // Email to User
  const userMail = {
    from: `"Resume Bot" <${process.env.ADMIN_EMAIL}>`,
    to: email,
    subject: 'Resume Submission Confirmation',
    text: `Hi ${name},\n\nThank you for submitting your resume. We have received it and will get back to you soon.\n\nBest regards,\nTeam`
  };

  try {
    await transporter.sendMail(adminMail);
    await transporter.sendMail(userMail);
    res.send('Resume uploaded and emails sent to both admin and user.');
  } catch (error) {
    console.error('Email Error:', error);
    res.status(500).send('Failed to send email: ' + error.message);
  }
});

app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
