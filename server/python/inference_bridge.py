#!/usr/bin/env python3
import sys
import json
import torch
import torch.nn as nn
import torchvision.transforms as transforms
import cv2
import numpy as np
from pathlib import Path

MODEL_DIR = Path(__file__).parent.parent.parent / 'models'
IMAGE_PATH = sys.argv[1] if len(sys.argv) > 1 else None

if not IMAGE_PATH or not Path(IMAGE_PATH).exists():
    print(json.dumps({"error": "Image not found"}))
    sys.exit(1)

device = torch.device('cuda' if torch.cuda.is_available() else 'cpu')

try:
    # Load Anterior Segment Model
    anterior_model = torch.hub.load('pytorch/vision:v0.10.0', 'efficientnet_b0', pretrained=False)
    anterior_model.classifier[1] = nn.Linear(1280, 6)
    anterior_path = str(MODEL_DIR / 'eye_model_v2_best.pth')
    if Path(anterior_path).exists():
        anterior_model.load_state_dict(torch.load(anterior_path, map_location=device))
    anterior_model.to(device).eval()

    # Load Fundus Model
    fundus_model = torch.hub.load('pytorch/vision:v0.10.0', 'efficientnet_b0', pretrained=False)
    fundus_model.classifier[1] = nn.Linear(1280, 8)
    fundus_path = str(MODEL_DIR / 'odir_model.pth')
    if Path(fundus_path).exists():
        fundus_model.load_state_dict(torch.load(fundus_path, map_location=device))
    fundus_model.to(device).eval()

except Exception as e:
    print(json.dumps({"error": f"Model loading failed: {str(e)}"}))
    sys.exit(1)

def preprocess_image(image_path):
    img = cv2.imread(image_path)
    if img is None:
        raise ValueError(f"Failed to read image")
    
    gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
    
    cascade_path = str(MODEL_DIR / 'haarcascade_eye.xml')
    if Path(cascade_path).exists():
        cascade = cv2.CascadeClassifier(cascade_path)
        eyes = cascade.detectMultiScale(gray, 1.3, 5)
        if len(eyes) > 0:
            x, y, w, h = eyes[0]
            eye_region = img[y:y+h, x:x+w]
        else:
            eye_region = img
    else:
        eye_region = img
    
    clahe = cv2.createCLAHE(clipLimit=3.0, tileGridSize=(8, 8))
    eye_region_gray = cv2.cvtColor(eye_region, cv2.COLOR_BGR2GRAY)
    eye_region_enhanced = clahe.apply(eye_region_gray)
    
    eye_region_resized = cv2.resize(eye_region_enhanced, (224, 224))
    eye_region_rgb = cv2.cvtColor(eye_region_resized, cv2.COLOR_GRAY2RGB)
    
    tensor = transforms.ToTensor()(eye_region_rgb)
    tensor = transforms.Normalize(mean=[0.485, 0.456, 0.406],
                                  std=[0.229, 0.224, 0.225])(tensor)
    
    return tensor.unsqueeze(0).to(device)

try:
    input_tensor = preprocess_image(IMAGE_PATH)
    
    with torch.no_grad():
        anterior_output = anterior_model(input_tensor)
        fundus_output = fundus_model(input_tensor)
    
    anterior_probs = torch.softmax(anterior_output, dim=1)[0].cpu().numpy()
    fundus_probs = torch.sigmoid(fundus_output)[0].cpu().numpy()
    
    anterior_labels = ['Normal', 'Cataract', 'Uveitis', 'Glaucoma', 'Myopia', 'Hyperopia']
    fundus_labels = ['Normal', 'Diabetic Retinopathy', 'Glaucoma', 'Cataracts', 'AMD', 'Hypertensive', 'Myopia', 'Other']
    
    results = {
        "status": "success",
        "anterior_segment": {label: float(prob) for label, prob in zip(anterior_labels, anterior_probs)},
        "fundus": {label: float(prob) for label, prob in zip(fundus_labels, fundus_probs)},
        "primary_diagnosis": anterior_labels[np.argmax(anterior_probs)],
        "confidence": float(np.max(anterior_probs))
    }
    
    print(json.dumps(results))

except Exception as e:
    print(json.dumps({"error": str(e)}))
    sys.exit(1)