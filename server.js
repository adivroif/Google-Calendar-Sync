import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";
import { parseEventWithGemini } from "./server/geminiParser.ts";
dotenv.config();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const app = express();
const port = process.env.PORT || 3e3;
app.use(express.json());
app.post("/api/parse-event", async (req, res) => {
  try {
    const { text, currentTime, timeZone } = req.body;
    if (!text || typeof text !== "string") {
      res.status(400).json({ error: "Text prompt is required" });
      return;
    }
    const userCurrentIsoTime = currentTime || (/* @__PURE__ */ new Date()).toISOString();
    const userTimeZone = timeZone || "Asia/Jerusalem";
    const parsedEvent = await parseEventWithGemini(text, userCurrentIsoTime, userTimeZone);
    res.json(parsedEvent);
  } catch (err) {
    console.error("Error in /api/parse-event:", err);
    res.status(500).json({
      error: err.message || "Failed to parse event with AI"
    });
  }
});
const distPath = path.join(__dirname, "dist");
app.use(express.static(distPath));
app.get("*", (_req, res) => {
  res.sendFile(path.join(distPath, "index.html"));
});
app.listen(port, () => {
  console.log(`Server listening on http://0.0.0.0:${port}`);
});
