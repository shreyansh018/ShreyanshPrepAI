import express from "express";
import { login, logout, useInterviewCoins } from "../controllers/auth.controller.js";

const authRouter = express.Router();

authRouter.post("/login", login);
authRouter.get("/logout", logout);
authRouter.post("/use-coins", useInterviewCoins);

// Coin top-ups are granted only by the verified billing callback.

export default authRouter;
