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
    newsql: 'Y' // 신규 API 여부 추가
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

router.post('/submitCode', async (req, res) => {
  const serviceKey = process.env.SERVICE_KEY;
  const apiUrl = `http://kopis.or.kr/openApi/restful/pblprfr`;
  const stdate = getTodayDate();
  const eddate = getEndDate();
  const { code } = req.body;
  console.log("Received administrative code:", code);

  const params = {
    service: serviceKey,
    ststype: "dayWeek",
    stdate: stdate,
    eddate: eddate,
    cpage: "1",
    rows: "30",
    signgucodesub: code,  // Received code from the request
    newsql: 'Y' // 신규 API 여부 추가
  };

  try {
    const response = await axios.get(apiUrl, { params });
    console.log("API Response:", response.data);

    parseString(response.data, async (err, result) => {
      if (err) {
        console.error("XML Parsing Error:", err);
        res.status(500).json({ error: "XML Parsing Error" });
      } else {
        console.log("Parsed Result:", result);

        // mt20id 추출
        const performances = result.dbs.db;
        const mt20ids = performances.map(performance => performance.mt20id[0]);
        console.log("mt20ids:", mt20ids);

        // 각 mt20id에 대해 상세 정보 요청
        const detailedInfoPromises = mt20ids.map(mt20id => {
          const detailApiUrl = `http://kopis.or.kr/openApi/restful/pblprfr/${mt20id}`;
          return axios.get(detailApiUrl, { params: { service: serviceKey, newsql: 'Y' } });
        });

        try {
          const detailedInfos = await Promise.all(detailedInfoPromises);

          // XML to JSON 변환
          const detailedResults = await Promise.all(detailedInfos.map(info => {
            return new Promise((resolve, reject) => {
              parseString(info.data, (err, result) => {
                if (err) reject(err);
                else resolve(result);
              });
            });
          }));

          console.log("Detailed Results:", detailedResults);

          // 각 상세 정보에서 mt10id 추출 및 콘솔 출력
          const mt10ids = detailedResults.map(detail => detail.dbs.db[0].mt10id[0]);
          console.log("mt10ids:", mt10ids);

          // 각 mt10id에 대해 장소 정보 요청
          const placeInfoPromises = mt10ids.map(mt10id => {
            const placeApiUrl = `http://kopis.or.kr/openApi/restful/prfplc/${mt10id}`;
            return axios.get(placeApiUrl, { params: { service: serviceKey, newsql: 'Y' } });
          });

          try {
            const placeInfos = await Promise.all(placeInfoPromises);

            // XML to JSON 변환
            const placeResults = await Promise.all(placeInfos.map(info => {
              return new Promise((resolve, reject) => {
                parseString(info.data, (err, result) => {
                  if (err) reject(err);
                  else resolve(result);
                });
              });
            }));

            console.log("Place Results:", placeResults);

            // 결과를 하나의 배열로 결합
            const combinedResults = performances.map((performance, index) => {
              return {
                performance: performance,
                detail: detailedResults[index],
                place: placeResults[index]
              };
            });

            console.log("Combined Results:", combinedResults);
            res.json(combinedResults); // 클라이언트에게 결합된 데이터 반환
          } catch (error) {
            console.error("Error fetching place info:", error);
            res.status(500).json({ error: "Error fetching place info" });
          }
        } catch (error) {
          console.error("Error fetching detailed info:", error);
          res.status(500).json({ error: "Error fetching detailed info" });
        }
      }
    });
  } catch (error) {
    console.error("API Call Error:", error);
    res.status(500).json({ error: "API Call Error" });
  }
});

module.exports = router;
