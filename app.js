"use strict";

const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");

const kopisAPI = require("./controllers/kopisAPI");
const newsAPI = require("./controllers/News"); // News.js 라우터 추가

const app = express();
const port = 8000;

dotenv.config(); // 환경 변수 로드

app.use(cors());  // CORS 설정을 모든 라우터 앞에 두기
app.use(express.json()); // JSON 파싱 미들웨어 설정

app.use("/", kopisAPI); // kopisAPI 라우터 설정
app.use("/", newsAPI);  // News.js 라우터 설정

app.get("/", (req, res) => {
  res.send("서버 가동 성공");
});

app.listen(port, () => {
  console.log(`${port} 포트에서 서버 가동중`);
});
