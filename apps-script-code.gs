/**
 * 로렌츄컴퍼니 B2B 폼 백엔드 — Google Apps Script
 *
 * ============ 셋업 가이드 ============
 *
 * 1. https://script.google.com → "새 프로젝트"
 * 2. 이 코드 전체 붙여넣기
 * 3. 하단 SHEET_ID 를 사장님 Google Sheet ID로 교체
 *    (Sheet URL: https://docs.google.com/spreadsheets/d/{이 부분}/edit)
 * 4. NOTIFY_EMAIL을 사장님 메일로 교체 (이미 입력해둠)
 * 5. 메뉴: 배포 → "새 배포" → 유형: 웹 앱
 *    - 실행 권한: 본인
 *    - 액세스: 모든 사용자 (익명 포함)
 *    → 받은 Web App URL 복사해서 main.js의 APPS_SCRIPT_URL 자리에 붙여넣기
 *
 * ============ 동작 ============
 * - 폼 제출 → 시트에 row 추가 (시트별 분기: brochure / sample / inquiry)
 * - 사장님에게 즉시 알림 메일
 * - brochure 신청자에게는 자동으로 소개서 PDF 링크 회신 (PDF는 Drive에 업로드해두고 링크 삽입)
 */

// ============ 설정 ============
const SHEET_ID = '1PHBRGkR_Wrbs-s0sSAjL7Qqo4cxwt0bH5FS0xQQmaUU';   // 로렌츄_B2B_접수 시트
const NOTIFY_EMAIL = 'choopermarket1@gmail.com'; // 알림 받을 이메일
const BROCHURE_PDF_URL = 'https://drive.google.com/file/d/YOUR_BROCHURE_FILE_ID/view'; // 소개서 PDF 링크 (Drive 공유 링크) — 나중에 교체

// ============ 메인 핸들러 ============
function doPost(e) {
  try {
    const data = JSON.parse(e.postData.contents);
    const formType = data._form || 'unknown';

    // 1. 시트에 저장
    saveToSheet(formType, data);

    // 2. 사장님 알림
    sendNotification(formType, data);

    // 3. 폼 종류별 자동 회신
    if (formType === 'brochure' && data.email) sendBrochure(data);
    if (formType === 'sample' && data.email) sendSampleConfirmation(data);
    if (formType === 'inquiry' && data.email) sendInquiryConfirmation(data);

    return ContentService.createTextOutput(JSON.stringify({ ok: true }))
      .setMimeType(ContentService.MimeType.JSON);
  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({ ok: false, err: err.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

function doGet() {
  return ContentService.createTextOutput('B2B Form Backend OK');
}

// ============ 시트 저장 ============
// 모든 접수를 "첫 번째 시트(시트1)" 한 곳에 기재.
// 폼 종류별로 컬럼이 달라도, 새 항목이 나오면 헤더에 자동으로 컬럼을 추가함.
function saveToSheet(formType, data) {
  const ss = SpreadsheetApp.openById(SHEET_ID);
  const sheet = ss.getSheets()[0]; // 맨 앞 시트(시트1)에 저장

  const labels = { brochure: '소개서', sample: '샘플', inquiry: '거래문의' };

  // 현재 헤더 읽기 (없으면 기본 헤더 생성)
  let lastCol = sheet.getLastColumn();
  let headers = lastCol > 0 ? sheet.getRange(1, 1, 1, lastCol).getValues()[0] : [];
  if (headers.length === 0 || headers.join('') === '') {
    headers = ['수신일시', '폼종류'];
  }

  // data의 새 필드를 헤더에 추가
  const dataKeys = Object.keys(data).filter(k => !k.startsWith('_'));
  dataKeys.forEach(k => { if (headers.indexOf(k) === -1) headers.push(k); });

  // 헤더 행 기록 + 스타일
  sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
  sheet.getRange(1, 1, 1, headers.length)
       .setFontWeight('bold').setBackground('#5A1A2A').setFontColor('#F5F0E6');
  sheet.setFrozenRows(1);

  // 데이터 행 추가
  const row = headers.map(h => {
    if (h === '수신일시') return new Date();
    if (h === '폼종류') return labels[formType] || formType;
    return data[h] !== undefined ? data[h] : '';
  });
  sheet.appendRow(row);

  // 새 행 하이라이트
  const lastRow = sheet.getLastRow();
  sheet.getRange(lastRow, 1, 1, headers.length).setBackground('#FFF4D6');
}

// ============ 사장님 알림 ============
function sendNotification(formType, data) {
  const labels = { brochure: '소개서', sample: '샘플', inquiry: '거래문의' };
  const subject = `🔔 [로렌츄 B2B] ${labels[formType] || formType} 신청 — ${data.company || ''}`;

  let bodyRows = '';
  Object.entries(data).forEach(([k, v]) => {
    if (k.startsWith('_')) return;
    bodyRows += `<tr><td style="padding:8px 12px;background:#F5F0E6;font-weight:500;border-bottom:1px solid #D8C8AE;">${k}</td><td style="padding:8px 12px;border-bottom:1px solid #D8C8AE;">${v}</td></tr>`;
  });

  const html = `
    <div style="font-family:'Noto Sans KR',sans-serif;color:#2C1A14;max-width:640px;">
      <div style="background:#5A1A2A;color:#F5F0E6;padding:24px;text-align:center;">
        <div style="font-family:'Cormorant Garamond';letter-spacing:6px;font-size:13px;">LAURENCHOO B2B</div>
        <h2 style="margin:8px 0 0;font-weight:600;">${labels[formType] || formType} 신청 도착</h2>
      </div>
      <div style="padding:24px;background:#fff;">
        <p>거래처에서 ${labels[formType] || formType} 신청이 들어왔습니다.</p>
        <table style="width:100%;border-collapse:collapse;font-size:14px;margin-top:16px;">${bodyRows}</table>
        <p style="margin-top:24px;font-size:13px;color:#5A463A;">
          시트: <a href="https://docs.google.com/spreadsheets/d/${SHEET_ID}">바로가기</a>
        </p>
      </div>
    </div>
  `;
  MailApp.sendEmail({ to: NOTIFY_EMAIL, subject, htmlBody: html });
}

// ============ 자동 회신 ============
function sendBrochure(data) {
  const subject = '[로렌츄컴퍼니] 상품 소개서를 보내드립니다';
  const html = `
    <div style="font-family:'Noto Sans KR',sans-serif;color:#2C1A14;max-width:600px;">
      <div style="background:#5A1A2A;color:#F5F0E6;padding:32px;text-align:center;">
        <div style="font-family:'Cormorant Garamond';letter-spacing:6px;font-size:13px;">LAURENCHOO COMPANY</div>
        <h1 style="font-family:'Noto Serif KR';margin:12px 0 0;font-weight:600;">상품 소개서</h1>
      </div>
      <div style="padding:32px;background:#fff;line-height:1.8;">
        <p>${data.name || '담당자'}님, 안녕하세요.</p>
        <p>로렌츄컴퍼니에 관심 가져주셔서 감사합니다. 요청하신 상품 소개서를 아래 링크에서 받으실 수 있습니다.</p>
        <div style="text-align:center;margin:32px 0;">
          <a href="${BROCHURE_PDF_URL}" style="display:inline-block;background:#5A1A2A;color:#F5F0E6;padding:16px 32px;border-radius:999px;text-decoration:none;font-weight:500;">📄 소개서 PDF 다운로드</a>
        </div>
        <p>샘플이 필요하시면 <a href="https://choopermarket.co.kr/sample.html">샘플킷 신청</a> (소비자가 79,200원 상당 4병 → 첫 거래 한정 19,600원 · 배송비 별도)을 이용해 주세요.</p>
        <p style="margin-top:32px;color:#5A463A;font-size:14px;">
          로렌츄컴퍼니 · choopermarket1@gmail.com<br>
          <span style="font-family:'Cormorant Garamond';letter-spacing:4px;font-size:12px;">CHOOPER MARKET B2B</span>
        </p>
      </div>
    </div>
  `;
  MailApp.sendEmail({ to: data.email, subject, htmlBody: html });
}

function sendSampleConfirmation(data) {
  const subject = '[로렌츄컴퍼니] 샘플킷 1+1 주문 안내 — 신청이 접수되었습니다';
  const html = `
    <div style="font-family:'Noto Sans KR',sans-serif;color:#2C1A14;max-width:600px;">
      <div style="background:#5A1A2A;color:#F5F0E6;padding:32px;text-align:center;">
        <div style="font-family:'Cormorant Garamond';letter-spacing:6px;font-size:13px;">LAURENCHOO COMPANY</div>
        <h1 style="font-family:'Noto Serif KR';margin:12px 0 0;font-weight:600;">샘플킷 1+1 주문 안내</h1>
      </div>
      <div style="padding:32px;background:#fff;line-height:1.8;">
        <p>${data.name || '담당자'}님, 안녕하세요.</p>
        <p>신청이 정상적으로 접수되었습니다. 아래 버튼에서 <strong>샘플킷 — 소비자가 79,200원 상당 샘플 4병을 첫 거래 한정 19,600원 (배송비 별도)</strong>에 바로 주문하실 수 있습니다. 종류는 자유 조합 가능합니다 (예: 뱅쇼 대신 버블리 2병). 결제 확인 후 평일 1~2일 내 출고됩니다.</p>
        <div style="text-align:center;margin:28px 0;">
          <a href="https://smartstore.naver.com/choopermarket/products/13628619061" style="display:inline-block;background:#5A1A2A;color:#F5F0E6;padding:16px 32px;border-radius:999px;text-decoration:none;font-weight:600;">🍷 샘플킷 4병 주문하기 (19,600원)</a>
        </div>
        <div style="text-align:center;margin:0 0 24px;">
          <a href="https://drive.google.com/drive/folders/1udDT-KH2_r17-y_plAN1tENTigHiSXpv?usp=sharing" style="display:inline-block;border:1px solid #5A1A2A;color:#5A1A2A;padding:12px 28px;border-radius:999px;text-decoration:none;font-weight:500;">📄 제품 소개서 · B2B 견적서 다운로드</a>
        </div>
        <div style="background:#F5F0E6;padding:20px;border-radius:6px;margin:24px 0;">
          <p style="margin:0;font-size:14px;"><strong>신청 내역</strong></p>
          <p style="margin:8px 0 0;font-size:14px;color:#5A463A;">
            회사: ${data.company || '-'}<br>
            배송지: ${data.address || '-'}
          </p>
        </div>
        <p>상시발주는 375ml 기준 병당 9,800원(부가세 포함, 배송비 별도 · 종류 무관 6병 이상)이며, 궁금하신 점은 본 메일에 회신만 주세요.</p>
        <p style="margin-top:32px;color:#5A463A;font-size:14px;">
          로렌츄컴퍼니 대표 추세은 · choopermarket1@gmail.com<br>
          Tel. 010 2164 2848 (카카오톡 packjigi)
        </p>
      </div>
    </div>
  `;
  MailApp.sendEmail({ to: data.email, subject, htmlBody: html });
}

function sendInquiryConfirmation(data) {
  const subject = '[로렌츄컴퍼니] 거래 문의가 접수되었습니다';
  const html = `
    <div style="font-family:'Noto Sans KR',sans-serif;color:#2C1A14;max-width:600px;">
      <div style="background:#5A1A2A;color:#F5F0E6;padding:32px;text-align:center;">
        <div style="font-family:'Cormorant Garamond';letter-spacing:6px;font-size:13px;">LAURENCHOO COMPANY</div>
        <h1 style="font-family:'Noto Serif KR';margin:12px 0 0;font-weight:600;">거래 문의 접수</h1>
      </div>
      <div style="padding:32px;background:#fff;line-height:1.8;">
        <p>${data.name || '담당자'}님, 안녕하세요.</p>
        <p>거래 문의가 정상 접수되었습니다. 사장님이 직접 1영업일 내 회신드리겠습니다.</p>
        <div style="background:#F5F0E6;padding:20px;border-radius:6px;margin:24px 0;">
          <p style="margin:0;font-size:14px;"><strong>문의 요약</strong></p>
          <p style="margin:8px 0 0;font-size:14px;color:#5A463A;">
            회사: ${data.company || '-'}<br>
            업종: ${data.industry || '-'}<br>
            예상 와인: ${data.qty_wine || 0}병 / 초콜릿: ${data.qty_choco || 0}개 / 기프트: ${data.qty_gift || 0}세트<br>
            희망 납기: ${data.due_date || '-'}
          </p>
        </div>
        <p style="margin-top:32px;color:#5A463A;font-size:14px;">
          로렌츄컴퍼니 · choopermarket1@gmail.com<br>
          <span style="font-family:'Cormorant Garamond';letter-spacing:4px;font-size:12px;">CHOOPER MARKET B2B</span>
        </p>
      </div>
    </div>
  `;
  MailApp.sendEmail({ to: data.email, subject, htmlBody: html });
}
