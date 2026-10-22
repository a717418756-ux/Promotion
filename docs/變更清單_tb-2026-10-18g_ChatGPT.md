# 變更清單｜tb-2026-10-18g_ChatGPT

只從雲端「修改中」的 f 版衍生測試版本；不動正式 `tb-2026-10-18d`，也不覆寫 f 版；本輪所有代碼沿用 HTML／JS／JSON 原始格式。

| 檔案 | 修改函式／區段 | 原因及影響 | 怎麼測 |
|---|---|---|---|
| `index.html` | CSS `.essay-compose`, `.essay-selfcheck`, `.essay-map`，JS `viewEssay`、`renderVisual` | 先默寫、逐格揭露、顯示完整答案後才自核骨架、隨機抽題；不碰 `viewTree`、`viewCards` 等五模式 | 三科各抽題；輸入草稿→揭露/收起→文字不消失；手動存檔→離開回來再讀；清除測試 |
| `data/essay-memory.json` | 僅 `procedure-01`、`procedure-03` 的 `answer`、`verifiedNote`、`sources`，和根版本欄位 | 官方條文補足無令狀搜索三款與 GPS 計日/聲請時點；其他33題內容及原始章節不變 | 檢視刑訴第1、第3題完整答案及官方連結 |
| `review/預測題...刑訴10題...g_ChatGPT.md` | 第1及第3題答案 | 使紙本解答與 PWA 一致；原 f 文件仍保留 | 全文搜尋「三款事由」、「不足24小時，以1日計」 |
| `sw.js` | `CACHE` 前綴、`activate`、`fetch` | 防止刪除相同 origin 其他PWA的快取；限制來源及路徑；保留 `const V` 日期字母規則 | 在獨立測試站驗證首次安裝、離線、更新及其他PWA快取；已有 Node 模擬測試通過 |
| `README_使用前必看.txt` | 版本及測試提示 | 協助測試而非立即覆蓋正式網站 | 閱讀檢查部署步驟 |
| `35題申論_題幹與骨架分開自測...md` | 新增衍生學習講義 | 只提取35題已有的題幹與小標，未新增法律結論 | 與程式35題對照，先做第一部分、再讀第二部分 |

### 明確保留

- `data/criminal.json`、`data/procedure.json`、`data/duty.json`、`manifest.webmanifest`、`icons/` 位元組未修改。
- 不修改現行 d 版、不上傳 GitHub、不刪除原檔、不將猜題主觀機率當作客觀數據。
- f 版曾針對其他法律事項所作校訂沒有在此版擴張，疑義繼續保留在 f 版審查報告。

### 已測與未測

Chromium 模擬瀏覽器測試與 Node JS/資料比對、SW 事件模擬已通過；GitHub Pages HTTPS 真實載入、SW 安裝/離線更新、Android/BOOX 裝置仍需實測。正式升級需要先實測 OK 並另得使用者同意。
