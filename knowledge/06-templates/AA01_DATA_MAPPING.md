# AA01 資料對應規劃（Data Mapping）

定義資料如何從評估流向 AA01 模板。資料流：

```
assessmentAnswers  →  assessmentSummary  →  AA01 Template
（問卷原始答案）       （分區摘要）           （正式段落）

services（Step4）   ─────────────────────→  四、擬核定照顧服務內容
problemMatrix      ─────────────────────→  二、案家問題及需求
serviceSuggestion  ─────────────────────→  （提示，需個管確認，不自動入版）
Service Goal Library（未來）──────────────→  三、計畫執行規劃
Reviewer Preference（未來）───────────────→  七、送審與退件紀錄
```

## 一、個案現況評估

| 模板段落 | 資料來源 | 經由 | 現況 |
|---|---|---|---|
| （一）身心概況及照顧情形 | C、D、E、F、G 評估答案 | `assessmentSummary`（communication / memory / adl / iadl / health） | ✅ 已串接 |
| （二）家庭功能概況 | 家庭成員 / `form.familyNote` | 直接帶入 | ⚠️ 僅文字備註，無結構化家庭成員 |
| （三）經濟概況 | （尚無欄位） | — | ❌ 待補充欄位 |
| （四）社會支持概況 | H（社會參與 H2a–H2c） | `assessmentSummary.environmentSummary` / 直接彙整 H | ⚠️ 目前與居家環境合併處理 |
| （五）輔具及居家環境概況 | H（居住 H1a–H1e）、輔具服務 | `assessmentSummary.environmentSummary` + services(E/FA) | ⚠️ 目前併入 (一)4，尚未獨立成段 |

## 二、案家問題及需求

| 模板段落 | 資料來源 | 經由 | 現況 |
|---|---|---|---|
| （一）照顧及專業服務 | services(BA/BB/BC/BD/Cx)、Problem Matrix | `generateProblemAnalysis().care` | ✅ |
| （二）交通接送服務 | services(DA) | `.transport` | ✅ |
| （三）喘息服務 | services(GA/SC) | `.respite` | ✅ |
| （四）輔具及無障礙改善 | services(E/FA)、H1e | `.environment` | ✅ |
| （五）營養餐飲服務 | services(營養餐飲碼) | — | ❌ 尚未獨立分類 |

> Problem Matrix（`problemMatrix.ts`）依 E/F/G/H/I 產生照顧問題提示；Service Suggestion（`serviceSuggestion.ts`）依問題提示可能服務碼。兩者皆**僅提示**，需個管確認，不自動寫入 AA01。

## 三、計畫執行規劃

| 模板段落 | 資料來源 | 現況 |
|---|---|---|
| （一）短期目標 | `generateGoalSuggestions().short` | ⚠️ 規則式樣板句，未依服務碼客製 |
| （二）中期目標 | `.mid` | ⚠️ 同上 |
| （三）長期目標 | `.long` | ⚠️ 同上 |

> 未來由 **Service Goal Library**（每個服務碼對應核定內容與計畫目標）取代樣板句。

## 四、擬核定照顧服務內容

| 來源 | 經由 | 現況 |
|---|---|---|
| Step4 `form.services` | `buildAA01Draft` 依碼分類輸出 | ✅ 照顧/交通/喘息/輔具四類；缺營養餐飲分類 |

## 五、轉介其他資源
| 來源 | 現況 |
|---|---|
| （尚無欄位） | ❌ 目前固定輸出「無」 |

## 六、計畫與案家欲使用項目落差
| 來源 | 現況 |
|---|---|
| 照專建議 / 案家意願（尚無欄位） | ⚠️ 目前固定「待個管確認後填寫」 |

## 七、送審與退件紀錄
| 來源 | 經由 | 現況 |
|---|---|---|
| 送審資訊 | 固定字串 | ⚠️ 個管/督導/日期未結構化 |
| 退件紀錄 | **Reviewer Preference（未來）** | ❌ 尚未實作，目前無退件資料 |

## PDF 解析 → assessmentAnswers（Phase 2-2）

```
PDF 文字 → pdfAssessmentParser.parseAssessmentText()
        → ParsedAssessmentAnswer[]（題號 / 偵測碼 / 信心 / 來源）
        → 個管於 Step2 勾選確認
        → applyParsedAssessment(existing, selected)
        → assessmentAnswers（不覆蓋既有人工答案；衝突列入 conflicts）
```
