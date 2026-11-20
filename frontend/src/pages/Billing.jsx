import { motion } from "motion/react";
import { useState } from "react";
import { FiMenu, FiX } from "react-icons/fi";
import { GiTwoCoins } from "react-icons/gi";
import { useNavigate } from "react-router-dom";
import PricingCard from "../components/PricingCard";
import api from "../utils/axios";

const RAZORPAY_SCRIPT = "https://checkout.razorpay.com/v1/checkout.js";

let razorpayScriptPromise = null;

// Load Razorpay Checkout SDK once
const loadRazorpay = () => {
  if (typeof window.Razorpay === "function") {
    return Promise.resolve(true);
  }

  if (razorpayScriptPromise) {
    return razorpayScriptPromise;
  }

  razorpayScriptPromise = new Promise((resolve) => {
    const existingScript = document.querySelector(
      `script[src="${RAZORPAY_SCRIPT}"]`,
    );

    // Remove a previous script that did not load correctly
    if (existingScript && typeof window.Razorpay !== "function") {
      existingScript.remove();
    }

    const script = document.createElement("script");
    script.src = RAZORPAY_SCRIPT;
    script.async = true;

    script.onload = () => {
      const isAvailable = typeof window.Razorpay === "function";

      if (!isAvailable) {
        console.error(
          "Razorpay script loaded, but window.Razorpay is not a constructor.",
        );
      }

      resolve(isAvailable);
    };

    script.onerror = () => {
      console.error("Unable to load Razorpay Checkout SDK.");
      script.remove();
      resolve(false);
    };

    document.body.appendChild(script);
  }).finally(() => {
    // Allow retry if the script failed
    if (typeof window.Razorpay !== "function") {
      razorpayScriptPromise = null;
    }
  });

  return razorpayScriptPromise;
};

const plans = [
  {
    title: "Free",
    price: "Free",
    coins: 150,
    button: "Claimed Coins",
    popular: false,
    disabled: true,
    features: [
      "150 Interview Coins",
      "Resume Builder",
      "Resume Scorer",
      "Roadmap Generator",
    ],
  },
  {
    title: "Starter",
    price: "199",
    coins: 300,
    button: "Buy Now",
    popular: true,
    disabled: false,
    features: [
      "300 Interview Coins",
      "Unlimited Resume Score",
      "Unlimited Roadmaps",
      "Priority AI Response",
    ],
  },
];

function Billing({ user, setUser }) {
  const [showMenu, setShowMenu] = useState(false);
  const [paymentLoading, setPaymentLoading] = useState(false);

  const navigate = useNavigate();

  const handlePayment = async (selectedPlan) => {
    if (selectedPlan.disabled || paymentLoading) return;

    setPaymentLoading(true);

    try {
      // 1. Ensure the Razorpay SDK is loaded
      const loaded = await loadRazorpay();

      if (!loaded || typeof window.Razorpay !== "function") {
        throw new Error(
          "Razorpay Checkout could not load. Check your internet connection, browser extensions, or ad blocker.",
        );
      }

      // 2. Check the public Razorpay Key ID
      const key = import.meta.env.VITE_RAZORPAY_KEY_ID;

      if (!key) {
        throw new Error(
          "Razorpay Key ID is missing. Check your frontend .env file.",
        );
      }

      // 3. Create an order through the backend
      const result = await api.post("/api/billing/create", {
        planId: selectedPlan.title.toLowerCase(),
      });

      const order = result.data?.order;

      if (!result.data?.success || !order?.id) {
        throw new Error(
          result.data?.message || "Failed to create payment order.",
        );
      }

      // 4. Configure Razorpay Checkout
      const options = {
        key,
        amount: order.amount,
        currency: order.currency,
        name: "Shreyansh Prep AI",
        description: `${selectedPlan.title} - ${selectedPlan.coins} Interview Coins`,
        order_id: order.id,

        handler: async (response) => {
          try {
            // 5. Verify the payment. Coins are credited server-side only
            //    after the Razorpay signature is validated.
            const verifyRes = await api.post(
              "/api/billing/verify",
              response,
            );

            setUser((prev) => ({
              ...prev,
              interviewCoin:
                verifyRes.data?.interviewCoin ?? prev?.interviewCoin,
            }));

            alert("Payment Successful 🎉");
            navigate("/dashboard");
          } catch (error) {
            console.error(
              "Payment verification or coin update failed:",
              error.response?.data || error,
            );

            alert(
              error.response?.data?.message ||
                "Payment verification or coin update failed. If money was deducted, contact support.",
            );
          } finally {
            setPaymentLoading(false);
          }
        },

        modal: {
          ondismiss: () => {
            setPaymentLoading(false);
          },
        },

        theme: {
          color: "#000000",
        },
      };

      // 7. Validate constructor before opening Checkout
      if (typeof window.Razorpay !== "function") {
        throw new Error(
          "Razorpay SDK is unavailable. Refresh the page and try again.",
        );
      }

      const razorpay = new window.Razorpay(options);

      razorpay.on("payment.failed", (response) => {
        console.error("Razorpay payment failed:", response.error);

        alert(
          response.error?.description || "Payment failed. Please try again.",
        );

        setPaymentLoading(false);
      });

      razorpay.open();
    } catch (error) {
      console.error("Billing Error:", error.response?.data || error);

      alert(
        error.response?.data?.message ||
          error.message ||
          "Unable to start payment.",
      );

      setPaymentLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white text-[#0A0A0A]">
      <motion.nav
        initial={{ y: -60, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="sticky top-0 z-20 border-b border-black/8 bg-white/80 backdrop-blur-xl"
      >
        <div className="mx-auto flex h-12 max-w-7xl items-center justify-between px-3 sm:px-5">
          <div
            onClick={() => navigate("/dashboard")}
            className="flex cursor-pointer items-center gap-1.5"
          >
            <span className="text-sm font-extrabold text-[#0A0A0A] sm:text-base">
              Shreyansh Prep AI
            </span>

            <span className="hidden rounded bg-black/5 px-1.5 py-0.5 text-[10px] text-black/50 sm:block">
              Interview Coins
            </span>
          </div>

          <button
            type="button"
            aria-label={showMenu ? "Close menu" : "Open menu"}
            onClick={() => setShowMenu(!showMenu)}
            className="flex h-8 w-8 items-center justify-center rounded-lg border border-black/15 text-black/60 transition hover:border-black/35 hover:text-[#0A0A0A]"
          >
            {showMenu ? <FiX size={16} /> : <FiMenu size={16} />}
          </button>

          {showMenu && (
            <>
              <div
                onClick={() => setShowMenu(false)}
                className="fixed inset-0 z-30 bg-black/20 lg:hidden"
              />

              <div className="absolute right-1 top-11 z-40 w-[240px] max-w-[calc(100vw-24px)] overflow-hidden rounded-xl border border-white/10 bg-black/90 p-3.5 shadow-[0_8px_32px_rgba(0,0,0,0.25)] backdrop-blur-2xl">
                <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-white/[0.08] via-transparent to-transparent" />

                <div className="relative flex items-center gap-2 border-b border-white/10 pb-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg border border-yellow-400/20 bg-yellow-500/15">
                    <GiTwoCoins className="text-sm text-yellow-400" />
                  </div>

                  <div>
                    <p className="text-[10px] text-white/40">Available Coins</p>
                    <h3 className="text-lg font-bold text-white">
                      {user?.interviewCoin ?? 0}
                    </h3>
                  </div>
                </div>

                <div className="relative mt-3.5 space-y-1.5">
                  {[
                    { title: "Resume Builder", coin: "-10" },
                    { title: "Resume Scorer", coin: "-10" },
                    { title: "Roadmap Generator", coin: "-20" },
                    { title: "AI Interview", coin: "-50" },
                  ].map((item) => (
                    <div
                      key={item.title}
                      className="flex items-center justify-between rounded-lg border border-white/8 bg-white/5 px-2.5 py-1.5"
                    >
                      <span className="text-xs text-white/70">
                        {item.title}
                      </span>
                      <span className="text-xs font-bold text-red-400">
                        {item.coin}
                      </span>
                    </div>
                  ))}
                </div>

                <div className="relative mt-3.5 rounded-lg border border-violet-400/20 bg-violet-500/10 p-2.5">
                  <p className="text-[10px] leading-4 text-violet-300">
                    Every AI feature uses Interview Coins. Buy more coins
                    anytime to continue using Resume Builder, Resume Scorer, AI
                    Interview and Roadmap Generator.
                  </p>
                </div>
              </div>
            </>
          )}
        </div>
      </motion.nav>

      <div className="mx-auto max-w-4xl px-4 py-6">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-[#0A0A0A]">Interview Coins</h1>

          <p className="mt-2 text-sm text-black/45">
            Use coins for Resume Scoring, Resume Builder, AI Interviews, and
            Roadmap Generation.
          </p>
        </div>

        <div className="mt-8 grid place-items-center gap-3 md:grid-cols-2">
          {plans.map((item) => (
            <PricingCard
              key={item.title}
              {...item}
              onBuy={() => handlePayment(item)}
              disabled={item.disabled || paymentLoading}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

export default Billing;
