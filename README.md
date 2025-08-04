# Thai Sentiment Analysis

A **Thai‑language sentiment analysis web application** consisting of a FastAPI back‑end and a static Nginx front‑end.  The back‑end uses a fine‑tuned **WangchanBERTa** transformer (or any model you drop into the `models/` folder) to classify text into three classes:

| Label | Emoji | English  | Thai     |
| ----- | ----- | -------- | -------- |
| 0     | 😡    | Negative | เชิงลบ   |
| 1     | 😐    | Neutral  | เป็นกลาง |
| 2     | 😄    | Positive | เชิงบวก  |

---

## ✨ Features

- **Single sentence** prediction (`/sentiment/predict`)
- **Batch** prediction from a list or uploaded **.txt / .csv** (`/sentiment/predict_multiple`, `/sentiment/predict_file`)
- **YouTube** comment scraping & sentiment (`/sentiment/youtube`)
- **Probabilities** returned for every class
- Lightweight **Docker‑Compose** deployment (Python 3.10 slim & Nginx alpine)
- CORS enabled – consumable from any JS front‑end

---

## 🚀 Quick Start (with Docker‑Compose)

```bash
# 1 Clone the repo – model weights are NOT included
git clone https://github.com/GeorgieSmile/Thai_Sentiment.git
cd Thai_Sentiment

# 2 Place fine‑tuned model into
#    Thai_Sentiment_API/models/fined_tuned_model/
#    (keep tokenizer.json, config.json, pytorch_model.bin, etc.)

# 3 Build & run both services
docker compose up --build

# 4 Open the app
#   • API docs     → http://localhost:8000/docs
#   • Front‑end UI → http://localhost:8080
```

> **Ports** – 8000 (API) and 8080 (Front‑end) on localhost.  Change them in `docker-compose.yml` if needed.

---

## 🧑‍💻 Local development (without Docker)

```bash
# Backend
cd Thai_Sentiment_API
python -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
uvicorn main:app --reload --port 8000

# Frontend (serve via any static server)
cd ../Thai_Sentiment_FrontEnd
python -m http.server 8080   # or live‑server / nginx etc.
```

---

## 📚 API Reference

All endpoints are mounted under `/sentiment`.  Full interactive documentation is available at `/docs`.

| Method | Endpoint            | Body                                             | Notes                             |
| ------ | ------------------- | ------------------------------------------------ | --------------------------------- |
| POST   | `/predict`          | `{ "text": "สวัสดี" }`                           | ≤ 400 chars                       |
| POST   | `/predict_multiple` | `{ "texts": ["ประโยคที่ 1", "ประโยคที่ 2"] }`    | Max 250 records, each ≤ 400 chars |
| POST   | `/predict_file`     | Multipart file (.txt or .csv w/ **text** column) | Parses up to 250 lines            |
| POST   | `/youtube`          | `{ "url": "https://youtu.be/…" }`                | Scrapes up to 250 recent comments |

### Response schema (example ‑ `/predict`)

```json
{
  "text": "ไม่ชอบเลยค่ะ",
  "sentiment": "เชิงลบ 😡",
  "probabilities": [
    { "label": "เชิงลบ 😡", "probability": 0.806 },
    { "label": "เป็นกลาง 😐", "probability": 0.028 },
    { "label": "เชิงบวก 😄", "probability": 0.166 }
  ],
  "summary": "โมเดลมั่นใจ 80.6% ว่าเป็นข้อความเชิงลบ 😡"
}
```

---

## 🗂️ Repository structure

```text
Thai_Sentiment/
├── Thai_Sentiment_API/        # FastAPI service
│   ├── api/                   # Route definitions
│   ├── utils/                 # Predictor & YouTube helper
│   ├── models/                # 🔒 Put fine‑tuned model here (git‑ignored)
│   ├── Dockerfile
│   └── requirements.txt
├── Thai_Sentiment_FrontEnd/   # Static site served by Nginx
│   ├── *.html  *.css  *.js
│   └── Dockerfile
├── docker-compose.yml         # 2‑service stack
└── README.md                  # This file
```

> The model folder is deliberately **empty** in the repository and listed in `.gitignore`.  Commit a tiny `.gitkeep` so Git preserves the directory, but actual weights stay out of version control.

---

## 📝 Customising the model

1. Fine‑tune any `transformers` encoder (e.g. WangchanBERTa).
2. Save the model and tokenizer to `Thai_Sentiment_API/models/fined_tuned_model/`.
3. Restart the container – the predictor will auto‑load it on first request.

---

## 🙏 Acknowledgements

- [WangchanBERTa](https://huggingface.co/airesearch/wangchanberta-base-att-spm-uncased) – Thai transformer model
- [youtube‑comment‑downloader](https://github.com/egbertbouman/youtube-comment-downloader) – scraping library

---


