"use strict";

const express = require("express");
const router = express.Router();
const axios = require("axios");
const { parseString } = require("xml2js");

// 오늘 날짜를 YYYYMMDD 형식으로 반환하는 함수
const getTodayDate = () => {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, '0');
  const day = String(today.getDate()).padStart(2, '0');
  return `${year}${month}${day}`;
};

// 오늘 날짜에 30일을 더한 날짜를 YYYYMMDD 형식으로 반환하는 함수
const getEndDate = () => {
  const today = new Date();
  today.setDate(today.getDate() + 30);
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, '0');
  const day = String(today.getDate()).padStart(2, '0');
  return `${year}${month}${day}`;
};

router.get("/performances", async (req, res) => {
  const serviceKey = process.env.SERVICE_KEY; // 환경 변수에서 서비스 키 가져오기
  const apiUrl = `http://www.kopis.or.kr/openApi/restful/pblprfr`;

  const stdate = getTodayDate(); // 오늘 날짜
  const eddate = getEndDate(); // 오늘 날짜에서 30일 후 날짜

  const params = {
    service: serviceKey,
    ststype: "dayWeek",
    stdate: stdate,
    eddate: eddate,
    cpage: "1",
    rows: "30",
    shcate: "EEEA",
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
  } catch (error) {
    console.error("API 호출 중 에러:", error);
    res.status(500).json({ error: "API 호출 중 에러 발생" });
  }
});

module.exports = router;
