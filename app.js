"use strict";

const express = require("express");
const cors = require("cors");
const axios = require("axios");
const { parseString } = require("xml2js");
require("dotenv").config();

const app = express();
const port = 8000;

// CORS 설정
app.use(cors());

app.get("/", (req, res) => {
  res.send("서버 가동 성공");
});

app.get("/performances", async (req, res) => {
  const serviceKey = process.env.SERVICE_KEY; // 환경 변수에서 서비스 키 가져오기
  const apiUrl = `http://www.kopis.or.kr/openApi/restful/pblprfr`;

  const params = {
    service: serviceKey,
    stdate: "20240703",
    eddate: "20240703",
    cpage: "1",
    rows: "10",
    shcate: "CCCD",
  };

  try {
    const response = await axios.get(apiUrl, { params });

    // XML을 JSON으로 변환
    parseString(response.data, (err, result) => {
      if (err) {
        console.error("XML 파싱 에러:", err);
        res.status(500).json({ error: "XML 파싱 에러" });
      } else {
        console.log(result); // 변환된 JSON 로그 출력
        res.json(result); // 클라이언트에게 JSON 데이터 반환
      }
    });
  } 
  
  catch (error) {
    console.error("API 호출 중 에러:", error);
    res.status(500).json({ error: "API 호출 중 에러 발생" });
  }
});

app.listen(port, () => {
  console.log(`${port} 포트에서 서버 가동중`);
});
