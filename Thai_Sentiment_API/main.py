from fastapi import FastAPI
from api.sentiment import router as sentiment_router
from fastapi.middleware.cors import CORSMiddleware

# Initialize the FastAPI app
app = FastAPI()
# Include the sentiment analysis routes
app.include_router(sentiment_router, prefix="/sentiment", tags=["Sentiment Prediction"])



app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], 
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
# Default Route (Welcome Information)
@app.get("/")
def api_info():
    return {"My first Project": "Thai-Sentiment-Analysis"}