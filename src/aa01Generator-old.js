function doPost(e) {
  try {
    const payload = JSON.parse(e.postData.contents || '{}');

    const fileName = payload.fileName || 'aa01.pdf';
    const base64 = payload.base64 || '';

    if (!base64) {
      return jsonOutput({ ok: false, error: '未收到PDF base64內容' });
    }

    const pdfBlob = Utilities.newBlob(
      Utilities.base64Decode(base64),
      'application/pdf',
      fileName
    );

    const docFile = createGoogleDocFromPdfByDriveV3_(pdfBlob, fileName);
    const doc = DocumentApp.openById(docFile.id);
    const text = doc.getBody().getText();

    return jsonOutput({
      ok: true,
      text: text,
      fileName: fileName,
      provider: payload.provider || 'drive-v3-ocr',
      mode: payload.mode || '',
      debug: {
        convertedFileId: docFile.id,
        forcedMimeType: pdfBlob.getContentType(),
        size: pdfBlob.getBytes().length,
        version: 'drive-v3-multipart-safe-crlf'
      }
    });
  } catch (err) {
    return jsonOutput({ ok: false, error: String(err) });
  }
}

function createGoogleDocFromPdfByDriveV3_(pdfBlob, fileName) {
  const CRLF = String.fromCharCode(13) + String.fromCharCode(10);
  const boundary = 'aa01_ocr_boundary_' + Date.now();
  const delimiter = CRLF + '--' + boundary + CRLF;
  const closeDelimiter = CRLF + '--' + boundary + '--';

  const metadata = {
    name: 'OCR_' + fileName,
    mimeType: 'application/vnd.google-apps.document'
  };

  const beforeMedia =
    delimiter +
    'Content-Type: application/json; charset=UTF-8' + CRLF + CRLF +
    JSON.stringify(metadata) +
    delimiter +
    'Content-Type: application/pdf' + CRLF + CRLF;

  const payloadBytes = concatBytes_(
    Utilities.newBlob(beforeMedia).getBytes(),
    pdfBlob.getBytes(),
    Utilities.newBlob(closeDelimiter).getBytes()
  );

  const response = UrlFetchApp.fetch(
    'https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart',
    {
      method: 'post',
      contentType: 'multipart/related; boundary=' + boundary,
      headers: {
        Authorization: 'Bearer ' + ScriptApp.getOAuthToken()
      },
      payload: payloadBytes,
      muteHttpExceptions: true
    }
  );

  const status = response.getResponseCode();
  const raw = response.getContentText();

  if (status < 200 || status >= 300) {
    throw new Error('Drive v3 OCR建立Google文件失敗：HTTP ' + status + '；' + raw);
  }

  return JSON.parse(raw);
}

function concatBytes_(part1, part2, part3) {
  const totalLength = part1.length + part2.length + part3.length;
  const result = new Array(totalLength);
  let offset = 0;

  for (let i = 0; i < part1.length; i++) result[offset++] = part1[i];
  for (let i = 0; i < part2.length; i++) result[offset++] = part2[i];
  for (let i = 0; i < part3.length; i++) result[offset++] = part3[i];

  return result;
}

function doGet(e) {
  return jsonOutput({ ok: true, message: 'AA01 Drive OCR API endpoint is running. version: drive-v3-multipart-safe-bytes' });
}

function jsonOutput(obj) {
  return ContentService
    .createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}

function generateProblemAnalysis(payload) {
  const services = payload.services || [];
  const g = payload.special_needs || {};
  const adl = payload.adl || {};
  const caregiver = payload.caregiver || {};

  const has = (prefix) => services.some((s) => s.code?.startsWith(prefix));
  const hasCode = (code) => services.some((s) => s.code === code);

  const result = {
    care: [],
    transport: [],
    respite: [],
    environment: [],
  };

  if (hasCode("BA13")) {
    result.care.push("個案外出活動需專人陪同，申請陪同外出服務，以維持外出安全及社區參與。");
  }

  if (hasCode("BA14")) {
    result.care.push("個案有就醫或復健需求，外出就醫需專人陪同，申請陪同就醫服務。");
  }

  if (has("BA") && !hasCode("BA13") && !hasCode("BA14")) {
    result.care.push("個案日常生活功能受限，需透過居家服務協助維持基本生活照顧。");
  }

  if (has("C")) {
    result.care.push("個案具專業服務需求，需由專業人員介入評估與指導，以維持功能及照顧安全。");
  }

  if (hasCode("OT01")) {
    result.care.push("個案備餐或營養攝取需協助，申請營養餐飲服務，以維持基本營養與飲食穩定。");
  }

  if (hasCode("DA01")) {
    result.transport.push("個案外出就醫或復健需交通接送協助，申請交通接送服務，以降低外出移動風險。");
  }

  if (has("GA")) {
    result.respite.push("主要照顧者長期承擔照顧責任，需透過喘息服務減輕照顧壓力並維持家庭照顧量能。");
  }

  if (has("SC")) {
    result.respite.push("個案有短期照顧安排需求，申請短照服務，以協助家庭照顧安排及照顧銜接。");
  }

  if (has("E")) {
    result.environment.push("個案日常活動及照顧安全需輔具協助，申請輔具服務，以提升生活安全及照顧便利性。");
  }

  if (has("FA")) {
    result.environment.push("個案居家環境有無障礙改善需求，申請居家無障礙環境改善服務，以降低跌倒及照顧風險。");
  }

  if (!result.care.length) result.care.push("無。");
  if (!result.transport.length) result.transport.push("無。");
  if (!result.respite.length) result.respite.push("無。");
  if (!result.environment.length) result.environment.push("無。");

  return result;
}

function generateGoalSuggestions(payload) {
  const services = payload.services || [];
  const has = (prefix) => services.some((s) => s.code?.startsWith(prefix));
  const hasCode = (code) => services.some((s) => s.code === code);

  const short = [];
  const mid = [];
  const long = [];

  if (has("BA") || has("C") || hasCode("OT01")) {
    short.push("維持個案基本生活功能及居家照顧安全。");
    mid.push("延緩個案功能退化並維持照顧穩定性。");
    long.push("維持個案於社區穩定生活並提升生活品質。");
  }

  if (hasCode("BA13") || hasCode("BA14") || hasCode("DA01")) {
    short.push("協助個案安全外出就醫、復健或參與必要活動。");
    mid.push("維持個案規律就醫及外出活動之可近性。");
    long.push("降低外出風險並維持社區生活穩定。");
  }

  if (has("GA") || has("SC")) {
    short.push("減輕主要照顧者照顧負荷。");
    mid.push("維持家庭照顧量能及照顧品質。");
    long.push("提升家庭照顧安排之穩定性。");
  }

  if (has("E") || has("FA")) {
    short.push("改善個案居家活動安全及照顧便利性。");
    mid.push("降低跌倒、移位及照顧過程風險。");
    long.push("維持個案於熟悉環境中安全生活。");
  }

  return {
    short: short.length ? [...new Set(short)] : ["維持個案基本生活功能及居家安全。"],
    mid: mid.length ? [...new Set(mid)] : ["延緩功能退化並維持照顧穩定性。"],
    long: long.length ? [...new Set(long)] : ["維持個案於社區穩定生活並提升生活品質。"],
  };
}

function buildAA01Draft(payload) {
  const services = payload.services || [];
  const c = payload.communication_memory || {};
  const adl = payload.adl || {};
  const iadl = payload.iadl || {};
  const g = payload.special_needs || {};
  const h = payload.social_environment_behavior || {};
  const caregiver = payload.caregiver || {};
  const problems = generateProblemAnalysis(payload);
  const goals = generateGoalSuggestions(payload);

  const now = new Date();
  const rocYear = now.getFullYear() - 1911;
  const startMonth = now.getDate() <= 15 ? now.getMonth() + 1 : now.getMonth() + 2;
  const fmtMonth = (m) => String(((m - 1) % 12) + 1).padStart(2, "0");

  const serviceGroups = {
    care: services.filter((s) =>
      ["BA", "BB", "BC", "BD", "CA", "CB", "CC", "CD", "OT"].some((p) => s.code?.startsWith(p))
    ),
    transport: services.filter((s) => s.code?.startsWith("DA")),
    respite: services.filter((s) => s.code?.startsWith("GA") || s.code?.startsWith("SC")),
    environment: services.filter((s) => s.code?.startsWith("E") || s.code?.startsWith("FA")),
  };

  const providerText = (items) => {
    const names = [...new Set(items.map((x) => x.providerName).filter(Boolean))];
    return names.length ? names.join("、") : "待確認";
  };

  const adlText = ADL_ITEMS
    .map((item) => cleanOptionText(adl[item.key]))
    .filter((x) => x && x !== "未填寫")
    .join("；");

  const iadlText = IADL_ITEMS
    .map((item) => cleanOptionText(iadl[item.key]))
    .filter((x) => x && x !== "未填寫")
    .join("；");

  const lines = [
    "一、\t個案現況評估",
    "(一)\t身心概況及照顧情形：",
    `1.\t個案${narrative("c1", c.c1)}，${narrative("c2", c.c2)}，${narrative("c3", c.c3)}，${narrative("c4", c.c4)}，${narrative("c5", c.c5)}。${c.cNote || ""}`,
    `2.\t個案日常活動功能概況：${adlText || "待補充"}。工具性日常生活功能概況：${iadlText || "待補充"}。${adl.note || ""}${iadl.note || ""}`,
    `3.\t個案疾病史包含${diseaseList(g.disease_history?.diseases, g.disease_history?.other)}。${g.swallowing?.g6aOptions?.length ? `吞嚥情形為${narrativeList(g.swallowing.g6aOptions)}。` : ""}${g.fall_balance_safety?.g8c ? `${narrative("g8c", g.fall_balance_safety.g8c)}。` : ""}`,

    "(二)\t家庭功能概況：",
    `1.\t個案目前${narrative("h1a", h.h1a)}，同住者包含${narrativeList(h.h1bLivingWith)}。`,
    `2.\t主要照顧者${caregiver.caregiverName || "未填寫"}（${cleanOptionText(caregiver.caregiverRelation)}）；次要照顧者${caregiver.secondaryCaregiverName || "未填寫"}（${cleanOptionText(caregiver.secondaryCaregiverRelation)}）。${caregiver.familyNote || ""}`,
    "3.\t主要聯絡人待個管確認後補充。",

    "(三)\t經濟概況：待個管確認後補充。",
    `(四)\t社會支持概況：${h.h2bActivities?.includes("沒有") ? "無。" : `個案目前社會參與包含${narrativeList(h.h2bActivities)}。`}`,
    `(五)\t輔具及居家環境概況：個案居住樓層為${h.h1cFloor || "未填寫"}，${narrative("h1dElevator", h.h1dElevator)}。居家環境風險包含${narrativeList(h.h1eEnvironmentBarriers)}。${payload.environment_extra?.deviceNote || ""}`,

    "二、\t案家問題及需求：",
    `(一)\t照顧及專業服務：${problems.care.join("；")}`,
    `(二)\t交通接送服務：${problems.transport.join("；")}`,
    `(三)\t喘息服務：${problems.respite.join("；")}`,
    `(四)\t輔具服務及居家無障礙環境改善：${problems.environment.join("；")}`,

    "三、\t計畫執行規劃：",
    `(一)\t短期目標(${rocYear}${fmtMonth(startMonth)}-${rocYear}${fmtMonth(startMonth + 1)})：${goals.short.join("；")}`,
    `(二)\t中期目標(${rocYear}${fmtMonth(startMonth + 2)}-${rocYear}${fmtMonth(startMonth + 3)})：${goals.mid.join("；")}`,
    `(三)\t長期目標(${rocYear}${fmtMonth(startMonth + 4)}-${rocYear}${fmtMonth(startMonth + 5)})：${goals.long.join("；")}`,

    "四、\t經本次評估後，擬核定照顧服務內容如下：",
  ];

  if (serviceGroups.care.length) {
    lines.push("(一)\t照顧及專業服務(給付額度：24,100元/月)：");
    serviceGroups.care.forEach((service, index) => {
      lines.push(`${index + 1}.\t${service.code}[${service.name}]*${service.quantity || "__"}${service.unit || ""}${service.frequency ? `，${service.frequency}` : ""}。`);
    });
    lines.push(`${serviceGroups.care.length + 1}.\t服務單位：${providerText(serviceGroups.care)}。`);
  }

  if (serviceGroups.transport.length) {
    lines.push("(二)\t交通接送(給付額度：1840元/月)：");
    serviceGroups.transport.forEach((service, index) => {
      lines.push(`${index + 1}.\t${service.code}[${service.name}]*${service.quantity || "__"}${service.unit || ""}${service.frequency ? `，${service.frequency}` : ""}。`);
    });
    lines.push(`${serviceGroups.transport.length + 1}.\t服務單位：${providerText(serviceGroups.transport)}。`);
  }

  if (serviceGroups.respite.length) {
    lines.push(`(三)\t喘息服務(剩餘額度：32340元/年，額度區間：${rocYear}${fmtMonth(startMonth)}~${rocYear + 1}${fmtMonth(startMonth - 1 <= 0 ? 12 : startMonth - 1)})：`);
    serviceGroups.respite.forEach((service, index) => {
      lines.push(`${index + 1}.\t${service.name}:${service.code}*${service.quantity || "__"}${service.unit || ""}${service.frequency ? `，${service.frequency}` : ""}。`);
    });
    lines.push(`${serviceGroups.respite.length + 1}.\t服務單位：${providerText(serviceGroups.respite)}。`);
  }

  if (serviceGroups.environment.length) {
    lines.push("(四)\t輔具服務(剩餘額度：40000元/3年)：");
    serviceGroups.environment.forEach((service, index) => {
      lines.push(`${index + 1}.\t${service.code}[${service.name}]*${service.quantity || "__"}${service.unit || ""}。`);
    });
    lines.push(`${serviceGroups.environment.length + 1}.\t服務單位：${providerText(serviceGroups.environment)}。實際核定內容依輔具核定函結果為主。`);
  }

  lines.push(
    "五、\t轉介其他資源：無。",
    "六、\t擬定照顧計畫與服務對象實際欲使用項目落差：",
    `(一)\t照專建議申請項目：${payload.service_detection?.recommendedText || "待個管確認後填寫"}。`,
    `(二)\t案家意願申請項目：${payload.service_detection?.wantedText || "待個管確認後填寫"}。`,
    "案家意願申請項目與建議無落差。",
    "七、\t財團法人伊甸社會福利基金會A個管房立泓於____/__/__送審督導審核。"
  );

  return nlJoin(lines);
}