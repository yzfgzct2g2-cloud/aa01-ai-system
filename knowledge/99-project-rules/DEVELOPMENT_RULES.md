# 開發規則與 AI 限制原則

本文件為 AA01 系統的開發守則，所有人（含 AI 協作）皆須遵守。

## 一、AI 絕對不得

1. 自行推論評估結果
2. 自行新增服務項目
3. 自動核定服務
4. 自動勾選服務碼
5. 用自由輸入取代量表選項
6. 改寫照顧管理評估量表原始選項
7. 產生無來源的疾病、功能狀況、家庭狀況
8. 建立過度複雜或無用的程式碼
9. 任意新增大量檔案
10. 留下未使用的 import、function、type、mock data、debug code

## 二、AI 可以

1. 依 `assessmentAnswers` 產生摘要
2. 依 `assessmentSummary` 產生 AA01 草稿
3. 依 `problemMatrix` 提示照顧問題
4. 依 `serviceSuggestion` 提示可能服務需求

> 但所有結果都必須由個管確認，系統輸出僅為「草稿／提示」。

## 三、程式碼與 token 控制

1. 不為小功能建立過多檔案
2. 不建立過度抽象的 utils
3. 不新增未使用測試
4. 不新增 mock data
5. 不新增 console.log
6. 不重寫已正常運作的邏輯
7. 不一次修改過多核心檔案
8. 每次修改前先說明將修改哪些檔案
9. 優先修正現有結構
10. 能用現有元件完成就不新增元件；若新增需說明理由
11. 保持 TypeScript 型別簡單

## 四、架構分層

- **業務規則** → `src/rules/`（不可藏在 UI 元件內）
- **題庫 / 服務碼資料** → `src/data/`
- **樣式與 UI** → `src/Components/`
- **型別** → `src/types.ts`

## 五、完成條件（每次變更後）

```
npm run build
npm run lint
npm test        # node --test
```

三者皆通過後才 commit / push。

## 六、知識庫使用原則

- 知識庫只放「真實、已確認」的資料；不得放入虛構案例或臆測規則。
- 量表原始選項以 `01-official` 為準，不可改寫。
- 退件案例尚無，僅維護 `05-reviewer-preferences/退件紀錄格式.md`。
