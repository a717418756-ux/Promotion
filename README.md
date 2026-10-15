# 升官等記憶樹

刑法、刑事訴訟法、警察勤務三科的互動記憶工具書（PWA，可安裝到手機桌面、離線使用）。

## 第一次開啟 GitHub Pages
Settings → Pages → Build and deployment → Source 選「Deploy from a branch」→ Branch 選 `main`、資料夾 `/ (root)` → Save。
約一分鐘後網址為：https://a717418756-ux.github.io/promotion/

## 安裝到手機
用手機瀏覽器開上面的網址 →（Android Chrome）選單「安裝應用程式」／（iPhone Safari）分享 →「加入主畫面」。安裝後離線也能用。

## 檔案
- `index.html`：頁面
- `data/criminal.json`、`data/procedure.json`、`data/duty.json`：三科內容，各自獨立，改一科不影響其他
- `sw.js`：離線快取。更新內容後把檔案最上面的版本號 `V` 改掉，使用者下次開啟就會換新版
- `manifest.webmanifest`、`icons/`：安裝用設定與圖示

背誦進度（熟／未熟）存在各裝置的瀏覽器裡，不會跨裝置同步。
