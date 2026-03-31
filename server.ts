import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import { fileURLToPath } from "url";
import Razorpay from "razorpay";
import crypto from "crypto";
import nodemailer from "nodemailer";
import { rateLimit } from "express-rate-limit";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// OTP Store (In-memory)
const otpStore = new Map<string, { otp: string; expires: number; attempts: number }>();

// Rate Limiter for OTP
const otpLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // Limit each IP to 5 OTP requests per window
  message: { error: "Too many OTP requests from this IP, please try again after 15 minutes" }
});

async function startServer() {
  const app = express();
  const PORT = process.env.PORT || 3000;

  app.use(express.json());

  // Lazy Razorpay Initialization
  const getRazorpay = () => {
    const key_id = process.env.RAZORPAY_KEY_ID;
    const key_secret = process.env.RAZORPAY_KEY_SECRET;

    if (!key_id || !key_secret) {
      return null;
    }

    return new Razorpay({
      key_id,
      key_secret,
    });
  };

  // API routes
  app.get("/api/health", (req, res) => {
    res.json({ 
      status: "ok", 
      message: "Shanti Meditech Pathology API is running",
      paymentConfigured: !!(process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_SECRET)
    });
  });

  app.get("/api/payment/config", (req, res) => {
    res.json({ keyId: process.env.RAZORPAY_KEY_ID || "" });
  });

  app.post("/api/payment/create-order", async (req, res) => {
    const { amount, currency = "INR", receipt } = req.body;
    const razorpay = getRazorpay();

    if (!razorpay) {
      console.error("Razorpay keys are missing in environment variables");
      return res.status(500).json({ error: "Payment gateway not configured. Please add RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET to secrets." });
    }

    try {
      const options = {
        amount: Math.round(amount * 100), // amount in the smallest currency unit (paise)
        currency,
        receipt,
      };

      const order = await razorpay.orders.create(options);
      res.json(order);
    } catch (error) {
      console.error("Error creating Razorpay order:", error);
      res.status(500).json({ error: "Failed to create order" });
    }
  });

  app.post("/api/payment/verify", (req, res) => {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;
    const key_secret = process.env.RAZORPAY_KEY_SECRET;

    if (!key_secret) {
      return res.status(500).json({ error: "Payment gateway not configured" });
    }

    const sign = razorpay_order_id + "|" + razorpay_payment_id;
    const expectedSign = crypto
      .createHmac("sha256", key_secret)
      .update(sign.toString())
      .digest("hex");

    if (razorpay_signature === expectedSign) {
      res.json({ status: "success", message: "Payment verified successfully" });
    } else {
      res.status(400).json({ status: "failure", message: "Invalid signature" });
    }
  });

  // OTP Endpoints
  app.post("/api/send-otp", otpLimiter, async (req, res) => {
    const { email } = req.body;
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return res.status(400).json({ error: "Invalid email address" });
    }

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expires = Date.now() + 5 * 60 * 1000; // 5 minutes

    otpStore.set(email, { otp, expires, attempts: 0 });

    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.GMAIL_USER,
        pass: process.env.GMAIL_APP_PASSWORD,
      },
    });

    const mailOptions = {
      from: `"Shanti Meditech" <${process.env.GMAIL_USER}>`,
      to: email,
      subject: "Your Verification OTP",
      text: `Your OTP for verification is: ${otp}. It will expire in 5 minutes.`,
      html: `
        <div style="font-family: sans-serif; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
          <h2 style="color: #2563eb;">Verification OTP</h2>
          <p>Your OTP for verification is:</p>
          <div style="font-size: 32px; font-weight: bold; color: #2563eb; letter-spacing: 5px; margin: 20px 0;">${otp}</div>
          <p style="color: #666; font-size: 14px;">This OTP will expire in 5 minutes. Do not share it with anyone.</p>
        </div>
      `,
    };

    try {
      if (!process.env.GMAIL_USER || !process.env.GMAIL_APP_PASSWORD) {
        throw new Error("Gmail credentials not configured");
      }
      await transporter.sendMail(mailOptions);
      res.json({ message: "OTP sent successfully" });
    } catch (error) {
      console.error("Error sending OTP:", error);
      res.status(500).json({ error: "Failed to send OTP. Please check server configuration." });
    }
  });

  app.post("/api/verify-otp", async (req, res) => {
    const { email, otp } = req.body;
    const record = otpStore.get(email);

    if (!record) {
      return res.status(400).json({ error: "No OTP found for this email" });
    }

    if (Date.now() > record.expires) {
      otpStore.delete(email);
      return res.status(400).json({ error: "OTP has expired" });
    }

    if (record.attempts >= 3) {
      otpStore.delete(email);
      return res.status(400).json({ error: "Too many failed attempts. Please request a new OTP." });
    }

    if (record.otp === otp) {
      otpStore.delete(email);
      res.json({ message: "OTP verified successfully" });
    } else {
      record.attempts += 1;
      otpStore.set(email, record);
      res.status(400).json({ error: `Invalid OTP. ${3 - record.attempts} attempts remaining.` });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
