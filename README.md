# English Shadowing Tool

一個靜態網頁英文學習工具，整合 Shadowing 跟讀練習、單字拆解、字根字首分析與單字家族功能。

## 功能特色

- **TTS 發音** - 使用瀏覽器內建 SpeechSynthesis，支援正常/慢速播放
- **Shadowing 模式** - 先聽一遍 → 暫停 → 慢速跟讀，搭配逐字高亮
- **單字拆解** - 點擊單字顯示翻譯、字根/字首/字尾、聯想記憶
- **單字家族** - 顯示相關詞彙，點擊可查看詳細資訊
- **響應式設計** - 支援手機與桌面瀏覽器

## 快速開始

### 方法一：直接開啟

```bash
# Linux
xdg-open index.html

# macOS
open index.html

# Windows
start index.html
```

### 方法二：本地伺服器（建議）

```bash
# 使用 Python
python3 -m http.server 8000

# 或使用 Node.js
npx serve .
```

然後開啟 http://localhost:8000

> 建議使用本地伺服器，避免 `fetch()` 載入 JSON 時的 CORS 問題。

## 使用方式

1. 在輸入框貼上英文句子或單字
2. 點擊按鈕：
   - **Play** - 正常速度播放
   - **Slow** - 慢速播放 (0.7x)
   - **Shadowing** - 跟讀模式（聽 → 準備 → 跟讀）
3. 點擊 Shadowing 區域的單字查看拆解
4. 點擊 Word Family 中的相關詞彙繼續學習

## 檔案結構

```
eng-tool/
├── index.html          # 主頁面
├── css/
│   └── style.css       # 樣式
├── js/
│   ├── app.js          # 主程式邏輯
│   ├── tts.js          # TTS 發音模組
│   └── dictionary.js   # 字典查詢模組
└── data/
    └── words.json      # 字根字首資料庫
```

## 擴充字典

編輯 `data/words.json` 新增單字：

```json
{
  "example": {
    "translation": "例子、範例",
    "breakdown": {
      "prefix": "ex-",
      "prefixMeaning": "出、外",
      "root": "ampl-",
      "rootMeaning": "拿取（拉丁語 emere）"
    },
    "association": "拿出來展示的東西 = 範例",
    "family": ["exemplify", "exemplary", "sample"]
  }
}
```

### 欄位說明

| 欄位 | 說明 |
|------|------|
| `translation` | 中文翻譯 |
| `breakdown.prefix` | 字首 |
| `breakdown.prefixMeaning` | 字首意義 |
| `breakdown.root` | 字根 |
| `breakdown.rootMeaning` | 字根意義 |
| `breakdown.suffix` | 字尾 |
| `breakdown.suffixMeaning` | 字尾意義 |
| `association` | 聯想記憶法 |
| `family` | 單字家族（相關詞彙） |

## 技術細節

- 純前端實作（HTML/CSS/JavaScript）
- 使用 `SpeechSynthesisUtterance` API 進行 TTS
- 混合式單字高亮：優先使用 `onboundary` 事件，備援時間估算
- 無需後端，可部署至 GitHub Pages

## 瀏覽器支援

- Chrome (推薦)
- Firefox
- Safari
- Edge

## License

MIT
