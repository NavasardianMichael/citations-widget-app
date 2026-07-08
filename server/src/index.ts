import cors from "cors";
import dotenv from "dotenv";
import express from "express";

dotenv.config();

const app = express();
const PORT = Number(process.env.PORT ?? 3001);

app.use(cors());
app.use(express.json());

app.get("/api/health", (_req, res) => {
  res.json({ status: "ok", service: "citations-widget-api" });
});

app.get("/api/citations", (_req, res) => {
  res.json([
    {
      id: "1",
      text: "The only way to do great work is to love what you do.",
      author: "Steve Jobs",
    },
  ]);
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
