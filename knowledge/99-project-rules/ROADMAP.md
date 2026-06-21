# AA01 系統 Roadmap

本文件描述 AA01 照顧計畫輔助系統的階段性開發目標。
原則：先把現有結構整理穩定，再逐步加入智慧輔助；AI 永遠只「提示」，不「決定」。

---

## Phase 1：UI/UX 系統一致化
目標：讓各頁看起來像同一套系統，而不是拼裝頁面。

- 建立統一 Layout（外框、標題、間距一致）
- 建立 Sidebar / Topbar / Case Summary Panel（顯示目前個案重點）
- 統一卡片、按鈕、表單樣式
- 完成 Step3 條件式展開
- 優化 Step7 AA01 輸出排版

## Phase 2：Problem Matrix 2.0
目標：將 E/F/G/H/I 評估結果轉成照顧問題提示。

- 不自動判斷服務
- 只產生「問題提示」，每項標註來源題目
- 由個管確認後才採用

## Phase 3：Service Suggestion 2.0
目標：依照顧問題提示可能的服務碼。

- 每個服務碼需有 reason / caution
- 不自動加入服務規劃、不自動勾選
- 僅供個管評估參考

## Phase 4：Service Goal Library
目標：每個服務碼建立核定內容與計畫目標。

- 例如 BA13、BA14、BA15-2、DA01 等
- 建立可口語化／正式化的 AA01 文字片段
- 每項服務需對應核定內容與計畫目標

## Phase 5：AA01 Style Engine
目標：讓產文逐漸符合個管文風。

- 讀取 `knowledge/03-plan-examples`
- 讀取 `knowledge/04-care-manager-style`
- 學習用語與結構，但不直接複製範例

## Phase 6：PDF OCR / Regex
目標：匯入照專評估表 PDF 並自動填表。

- OCR → Regex 解析
- 自動填入 C/D/E/F/G/H/I
- 個管人工確認後才寫入

## Phase 7：Reviewer Preference
目標：累積照專退件原因，形成偏好記憶。

- 記錄退件原因與修正後版本
- 建立不同照專偏好
- 修正後版型可記憶為該照專適合版型

## Phase 8：AI Assisted Drafting
目標：最後才接 AI（OpenAI API 或其他）。

- 僅用於語句通順化與風格調整
- 不用於判斷評估結果
- 不取代個管確認流程

---

## 目前進度
- ✅ Vite + React + TypeScript、GitHub Pages、GitHub Actions deploy
- ✅ Step 流程（基本資料／PDF匯入／評估表／服務規劃／摘要確認／檢核提醒／AA01輸出）
- ✅ assessmentAnswers 結構化、assessmentSummary、aa01Generator、serviceValidation
- ✅ assessmentOptions（C/D/E/F/G/H/I）
- ✅ Step3 條件式展開、single/multi/text/number
- ✅ problemMatrix（Phase 2 初版）、serviceSuggestion（Phase 3 初版）與測試
- 🔜 Phase 1 UI/UX 一致化（進行中）
