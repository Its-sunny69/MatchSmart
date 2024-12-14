import base64
from fastapi import FastAPI
from pydantic import BaseModel
import onnxruntime as ort
from PIL import Image
import numpy as np
import io
import random
import string
import fastapi.middleware.cors as CORSMiddleware

def generate_random_id(length=8):
    characters = string.ascii_letters + string.digits
    return ''.join(random.choice(characters) for _ in range(length))
app = FastAPI()

# app.add_middleware(
#     CORSMiddleware,
#     allow_origins=["https://match-smart-server.vercel.app"],  # Change "*" to specific domains for stricter control
#     allow_credentials=True,
#     allow_methods=["POST"],  # Allow all HTTP methods
#     allow_headers=["Content-Type"],  # Allow all headers
# )
# Load the ONNX model
model_path = "best.onnx"  # Path to your ONNX file
session = ort.InferenceSession(model_path)

class Base64Image(BaseModel):
    base64_string: str

@app.post("/predict/")
async def predict(file: Base64Image):
    # Load the uploaded image
    try:
        base64_string = file.base64_string.split(",")[1] if "," in file.base64_string else file.base64_string
        image_bytes = base64.b64decode(base64_string)
    except Exception as e:
        return {"error": "Invalid base64 string", "details": str(e)}
    
    # Convert base64 string back to image
    try:
        image = Image.open(io.BytesIO(image_bytes)).convert("RGB")
    except Exception as e:
        return {"error": "Unable to process image", "details": str(e)}
    
    # Preprocess the image (resize, normalize, etc.)
    image = image.resize((640, 640))  # Replace with your model's input size
    image_data = np.array(image).astype("float32") / 255.0  # Normalize pixel values
    image_data = np.transpose(image_data, (2, 0, 1))  # Convert to CHW format
    image_data = np.expand_dims(image_data, axis=0)  # Add batch dimension

    # Perform inference
    inputs = {session.get_inputs()[0].name: image_data}
    outputs = session.run(None, inputs)
    
   # Post-process the raw outputs
    raw_predictions = outputs[0] # Raw prediction array

    predictions = []
    for prediction in raw_predictions:
        for i in prediction:
            print(i)
       # Ensure that each element in prediction is extracted correctly
        # The model output is likely of the form [x, y, width, height, confidence, class_probs]
        
        x = prediction[0]  # Extracting x coordinate
        y = prediction[1]  # Extracting y coordinate
        width = prediction[2]  # Extracting width
        height = prediction[3]  # Extracting height
        confidence = prediction[4]  # Extracting confidence score
        class_probs = prediction[5:]  # Assuming the remaining values are class probabilities
        
        # Convert to scalars if necessary
        confidence = confidence[np.argmax(confidence)]
        x = x[np.argmax(confidence)]
        y = y[np.argmax(confidence)]
        width = width[np.argmax(confidence)]
        height = height[np.argmax(confidence)]
        
        # Determine the class ID with the highest probability
        
        class_id = round(class_probs[0][np.argmax(class_probs[0])])
        print(class_probs[0][np.argmax(class_probs[0])])
        class_name = "male" if class_id == 1 else "female"  # Adjust as per your class mapping
        
        # Generate a detection ID
        
        detection_id = generate_random_id()
        
        predictions.append({
            "x": float(x),
            "y": float(y),
            "width": float(width),
            "height": float(height),
            "confidence": float(confidence),
            "class": class_name,
            "class_id": int(class_id),
            "detection_id": detection_id
        })
    
    return {"predictions": predictions}
    
    
   
