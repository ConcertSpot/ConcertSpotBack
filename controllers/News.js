// controllers/News.js
const express = require("express");
const axios = require("axios");

const router = express.Router();

// News API 엔드포인트
router.get("/api/news", async (req, res) => {
  try {
    const response = await axios.get("https://newsapi.org/v2/everything", {
      params: {
        q: "공연 OR 콘서트 OR 뮤지컬",
        language: "ko",
        sortBy: "publishedAt",
        apiKey: process.env.NEWS_API_KEY, // 환경 변수에서 API 키를 불러옵니다.
      },
    });

    res.json(response.data);
  } catch (error) {
    console.error("Error fetching news:", error.message);
    res.status(500).json({ error: "Error fetching news" });
  }
});

module.exports = router;
