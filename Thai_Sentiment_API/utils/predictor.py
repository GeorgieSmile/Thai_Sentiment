#import joblib
#from utils.tokenizer import thai_tokenizer
import torch
from transformers import AutoTokenizer, AutoModelForSequenceClassification
import numpy as np

_MODEL   = None   
_TOKENIZER = None 
device  = "cuda" if torch.cuda.is_available() else "cpu"

def load_model():

    """
    Load a pre-trained model.
        
    Returns:
        model: Loaded model and vectorizer or tokenizer object.
    """

    # Logistic Regression Model
    #model = joblib.load('models/logreg_thai_sentiment.pkl')
    #vectorizer = joblib.load('models/tfidf_vectorizer.pkl')

    #Fine Tuned Transformer Model
    global _MODEL, _TOKENIZER     

    if _MODEL is None:
        model_folder = "models/fined_tuned_model"        
        _TOKENIZER = AutoTokenizer.from_pretrained(model_folder)
        _MODEL     = AutoModelForSequenceClassification.from_pretrained(model_folder)
        _MODEL.to(device).eval()               

    
    return _MODEL, _TOKENIZER

@torch.inference_mode() 
def predict_sentiment(text):
    """
    Predict the sentiment of a given Thai text.
    
    Args:
        text (str): Input text in Thai.
        
    Returns:
        str: Predicted sentiment label.
    """
    # Logistic Regression
    # model, vectorizer = load_model()
    # vectorized_text = vectorizer.transform([text])

    # prediction = model.predict(vectorized_text)
    # prediction_proba = model.predict_proba(vectorized_text)
    #return prediction[0], prediction_proba

    model, tokenizer = load_model()
    
    inputs = tokenizer(text,
                       return_tensors="pt",
                       truncation=True,
                       max_length=400)          
    inputs = {k: v.to(device) for k, v in inputs.items()}

    logits = model(**inputs).logits           
    probs  = torch.softmax(logits, dim=-1)
    probs_array = probs.detach().cpu().numpy()

    pred_idx = int(np.argmax(probs, axis=-1)[0])
    
    return pred_idx, probs_array

#Test the function
#pred, pred_proba = predict_sentiment("ไม่ชอบเลยค่ะ")
#print(f"Predicted sentiment: {pred}")
#print(f"Prediction probabilities: {pred_proba}")




