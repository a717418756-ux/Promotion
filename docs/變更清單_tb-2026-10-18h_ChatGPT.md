# tb-2026-10-18h｜變更清單

| 檔案 | 修改區段／函式 | 原因與影響 | 測試建議 |
|---|---|---|---|
| `index.html` | `DRAFT_KEY` 後新增 `ERROR_KEY`、`saveErrors`、`stopEssayTimer`、`clockText` | 錯漏註記與倒數計時使用新狀態，不影響原有 `tb-v1` | 建立錯漏、重整、切科目 |
| `index.html` | `viewEssay` 的題目篩選、計時區、`draw` 的錯漏欄 | 寫作訓練加入計時與錯漏篩選 | 倒數、暫停、重置、存檔、只看錯漏 |
| `index.html` | `render` 及 `.essay-timer` CSS | 其他模式不繼續執行申論 timer；改善手機尺寸 | 切回樹狀／閃卡、390px及電子紙 |
| `sw.js` | `const V` | 更新本專案快取，仍僅刪除 promotion 前綴舊快取 | 實際 HTTPS 離線升級待測 |
| `data/essay-memory.json` | 版本 metadata | 與新測試版一致，不更動35題實質內容 | 與 g 版逐題比對 |
| `README_使用前必看.txt` | 使用／測試提醒 | 測試部署注意事項 | 完整讀取 |

**未修改：**三科原始 JSON、35 題答案、法條見解、圖示、manifest。未覆蓋正式現行版本，亦未上傳 GitHub。

**驗證界限：** 靜態語法與 JSON 比對通過；本次 Chromium 被環境政策擋下，因此端到端互動、真實離線及實機待測。
