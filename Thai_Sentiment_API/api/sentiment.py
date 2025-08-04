from fastapi import APIRouter, HTTPException
from fastapi import UploadFile, File
from utils.predictor import predict_sentiment
from pydantic import BaseModel
from utils.youtube_comment_fetcher import fetch_comments
import pandas as pd
import io

router = APIRouter()
class SentimentRequest(BaseModel):
    text: str

class Probabilities(BaseModel):
    label: str
    probability: float

class SentimentResponse(BaseModel):
    text: str
    sentiment: str
    probabilities: list[Probabilities]
    summary: str

class MultipleSentimentRequest(BaseModel):
    texts: list[str]

class MultipleSentimentResponse(BaseModel):
    result: list[SentimentResponse]

class YouTubeRequest(BaseModel):
    url: str

async def extract_text_from_file(file: UploadFile):
    """
    Extract text from a file.
    
    Args:
        file (UploadFile): The uploaded file.
        
    Returns:
        str: List of extracted text.
    """
    contents = await file.read()
    decoded = contents.decode("utf-8")
    texts = []

    if file.filename.endswith('.txt'):
        for line in decoded.splitlines():
            line = line.strip()
            if line:
                texts.append(line)

    elif file.filename.endswith('.csv'):
        df = pd.read_csv(io.StringIO(decoded))
        if 'text' not in df.columns:
            raise ValueError("CSV ต้องมีคอลัมน์ 'text'")
        for text in df['text'].dropna().tolist():
            text = str(text).strip()
            if text:
                texts.append(text)

    else:
        raise ValueError("รองรับเฉพาะไฟล์ .txt and .csv เท่านั้น")
    
    return texts

@router.post("/predict")
def predict(request: SentimentRequest):
    if not request.text.strip():
        raise HTTPException(status_code=400, detail="ไม่สามารถวิเคราะห์ข้อความว่างเปล่าได้")
    if len(request.text) > 400:
        raise HTTPException(status_code=400, 
                            detail=f"ข้อความยาวเกินไป ({len(request.text)} ตัวอักษร). ความยาวสูงสุดคือ 400 ตัวอักษร.")
    sentiment_idx, probabilities = predict_sentiment(request.text)
    labels = ["เชิงลบ 😡", "เป็นกลาง 😐", "เชิงบวก 😄"]
    sentiment = labels[sentiment_idx]
    confidence = round(max(probabilities[0]) * 100, 2)
    prob_object = []
    for i in range(len(probabilities[0])):
        label = labels[i]
        prob_object.append(Probabilities(label=label, probability=round(probabilities[0][i], 3)))

    summary = f"โมเดลมั่นใจ {confidence:.1f}% ว่าเป็นข้อความ{sentiment}"
    return SentimentResponse(text=request.text, sentiment=sentiment, probabilities=prob_object, summary=summary)

@router.post("/predict_multiple")
def predict_multiple(request: MultipleSentimentRequest):
    texts_to_process = request.texts[:250]
    if not texts_to_process:
        raise HTTPException(status_code=400, detail="ไม่สามารถวิเคราะห์ข้อความว่างเปล่าได้")
    if any(len(text) > 400 for text in texts_to_process):
        raise HTTPException(status_code=400, 
                            detail="มีข้อความที่ยาวเกินไป. ความยาวสูงสุดคือ 400 ตัวอักษร.")
    labels = ["เชิงลบ 😡", "เป็นกลาง 😐", "เชิงบวก 😄"]
    result = []
    for text in texts_to_process:
        sentiment_idx, prob = predict_sentiment(text)
        
        sentiment = labels[sentiment_idx]
        confidence = round(max(prob[0]) * 100, 2)
        prob_object = []
        for i in range(len(prob[0])):
            label = labels[i]
            prob_object.append(Probabilities(label=label, probability=round(prob[0][i], 3)))
        
        summary = f"โมเดลมั่นใจ {confidence}% ว่าเป็นข้อความ{sentiment}"
        result.append(SentimentResponse(text=text, sentiment=sentiment, probabilities=prob_object, summary=summary))

    return MultipleSentimentResponse(result=result)

@router.post("/predict_file")
async def predict_file(file: UploadFile = File(...)):    
    try:
        texts = await extract_text_from_file(file)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    
    if not texts:
        raise HTTPException(status_code=400, detail="ไม่พบข้อความที่ประมวณผลได้ในไฟล์")
    
    request = MultipleSentimentRequest(texts=texts)

    return predict_multiple(request)


@router.post("/youtube")
def sentiment_from_youtube(data: YouTubeRequest):
    comments = fetch_comments(data.url, limit=250)
    if not comments:
        raise HTTPException(status_code=400, detail="ไม่พบความคิดเห็นหรือวิดีโอนี้ไม่สามารถเข้าถึงได้")
    
    request = MultipleSentimentRequest(texts=comments)
    return predict_multiple(request)