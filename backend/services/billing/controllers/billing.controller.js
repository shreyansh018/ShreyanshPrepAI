import crypto from "crypto";

import User from "../../auth/model/user.model.js";
import redis from "../../../shared/redis/redis.js";
import razorpay from "../configs/razorpay.js";
import Billing from "../models/billing.model.js";

const PLANS = {
  starter: {
    amount: 199,
    interviewCoins: 300,
  },
};

const SESSION_TTL = 60 * 60 * 24 * 7;

const refreshSessionCoins = async (req, user) => {
  const sessionId = req.cookies?.session;
  if (!sessionId || !user) return;

  try {
    const rawSession = await redis.get(`session:${sessionId}`);
    if (!rawSession) return;

    const session = JSON.parse(rawSession);
    session.interviewCoin = user.interviewCoin;
    await redis.set(
      `session:${sessionId}`,
      JSON.stringify(session),
      "EX",
      SESSION_TTL,
    );
  } catch (error) {
    console.error("Unable to refresh session coin count:", error.message);
  }
};

export const createOrder = async (req, res) => {
  try {
    const { planId } = req.body;
    const userId = req.headers["x-user-id"];
    const plan = PLANS[planId];

    if (!plan) {
      return res.status(400).json({
        success: false,
        message: "Invalid plan",
      });
    }

    const order = await razorpay.orders.create({
      amount: plan.amount * 100,
      currency: "INR",
      receipt: `receipt_${Date.now()}`,
    });

    await Billing.create({
      userId,
      amount: plan.amount,
      interviewCoins: plan.interviewCoins,
      razorpayOrderId: order.id,
      status: "created",
    });

    return res.status(201).json({
      success: true,
      order,
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      success: false,
      message: "Failed to create order",
    });
  }
};

export const verifyPayment = async (req, res) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } =
      req.body;

    const payment = await Billing.findOne({
      razorpayOrderId: razorpay_order_id,
    });
    if (!payment) {
      return res.status(404).json({
        success: false,
        message: "Payment not found",
      });
    }

    const generatedSignature = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
      .update(`${razorpay_order_id}|${razorpay_payment_id}`)
      .digest("hex");

    if (generatedSignature !== razorpay_signature) {
      payment.status = "failed";
      await payment.save();
      return res.status(400).json({
        success: false,
        message: "Payment verification failed",
      });
    }

    // Atomically claim this order so duplicate callbacks cannot credit coins twice.
    const claimedPayment = await Billing.findOneAndUpdate(
      { _id: payment._id, status: "created" },
      {
        $set: {
          status: "paid",
          razorpayPaymentId: razorpay_payment_id,
          razorpaySignature: razorpay_signature,
        },
      },
      { new: true },
    );

    if (!claimedPayment) {
      const existingUser = await User.findById(payment.userId).select(
        "interviewCoin",
      );
      return res.status(200).json({
        success: true,
        message: "Payment already verified",
        interviewCoin: existingUser?.interviewCoin,
      });
    }

    const user = await User.findById(claimedPayment.userId);
    if (!user) {
      console.error(
        "Payment verified but user was not found:",
        claimedPayment.userId,
      );
      return res.status(500).json({
        success: false,
        message: "Payment verified, but the user account could not be found",
      });
    }

    user.interviewCoin += claimedPayment.interviewCoins;
    await user.save();
    await refreshSessionCoins(req, user);

    return res.status(200).json({
      success: true,
      message: "Payment successful",
      interviewCoin: user.interviewCoin,
    });
  } catch (error) {
    console.log(error);

    if (req.body?.razorpay_order_id) {
      await Billing.findOneAndUpdate(
        {
          razorpayOrderId: req.body.razorpay_order_id,
          status: "created",
        },
        {
          status: "failed",
        },
      );
    }

    return res.status(500).json({
      success: false,
      message: "Payment verification failed",
    });
  }
};
