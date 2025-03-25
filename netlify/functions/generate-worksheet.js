const axios = require('axios');

exports.handler = async function(event, context) {
  // CORS 헤더 설정
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS'
  };
  
  // OPTIONS 요청 처리 (CORS preflight)
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers,
      body: ''
    };
  }
  
  try {
    // 요청 데이터 파싱
    const requestData = JSON.parse(event.body);
    const { englishText, gradeLevel, difficulty, elements } = requestData;
    
    // OpenAI API 호출 준비
    const OPENAI_API_KEY = process.env.OPENAI_API_KEY; // Netlify 환경 변수로 설정
    
    // 프롬프트 생성
    const prompt = `
      당신은 한국 고등학교 영어 교사를 위한 영어 학습지 생성 도우미입니다. 
      다음 영어 지문을 분석하여 ${gradeLevel} 학생들을 위한 ${difficulty} 난이도의 학습지를 생성해주세요.
      
      포함할 요소: ${elements.join(', ')}
      
      지문:
      """
      ${englishText}
      """
      
      HTML 형식으로 된 학습지를 생성해주세요. 다음 섹션을 포함해야 합니다:
      1. WARM-UP (3분): 지문에서 추출한 키워드를 사용한 제목 예측 활동
      2. VOCABULARY PREVIEW (3분): 지문에서 중요한 어휘 5-7개와 정의 매칭 활동
      3. READING (7분): 지문 전체 (이미 제공됨)
      4. READING COMPREHENSION (5분): 객관식 문제 3개와 단답형 문제 1개
      5. 문법 학습 1 (7분): 지문에서 찾을 수 있는 중요한 문법 포인트 학습 및 연습
      6. 문법 학습 2 (5분): 두 번째 문법 포인트 학습 및 연습
      
      각 섹션에 적절한 지시문과 설명을 포함해주세요. 학습지는 한글과 영어를 혼합하여 작성하되, 지문은 원본 영어로 유지해주세요.
    `;
    
    // OpenAI API 호출
    const response = await axios.post(
      'https://api.openai.com/v1/chat/completions',
      {
        model: "gpt-4",
        messages: [
          { role: "system", content: "You are a helpful assistant that creates English worksheets for Korean high school students." },
          { role: "user", content: prompt }
        ],
        temperature: 0.7,
        max_tokens: 2500
      },
      {
        headers: {
          'Authorization': `Bearer ${OPENAI_API_KEY}`,
          'Content-Type': 'application/json'
        }
      }
    );
    
    // API 응답에서 학습지 내용 추출
    const worksheetContent = response.data.choices[0].message.content;
    
    // 클라이언트에 응답 반환
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ worksheet: worksheetContent })
    };
    
  } catch (error) {
    console.log('Error:', error);
    
    // 에러 응답
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: '학습지 생성 중 오류가 발생했습니다.' })
    };
  }
};
