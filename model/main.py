from fastapi import FastAPI, UploadFile, File
import onnxruntime as ort
from PIL import Image
import numpy as np
import uuid 
import io

app = FastAPI()

# Load the ONNX model
model_path = "best.onnx"  # Path to your ONNX file
session = ort.InferenceSession(model_path)

@app.post("/predict/")
async def predict(file: UploadFile = File(...)):
    # Load the uploaded image
    image = Image.open(io.BytesIO(await file.read())).convert("RGB")
    
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
       # Ensure that each element in prediction is extracted correctly
        # The model output is likely of the form [x, y, width, height, confidence, class_probs]
        
        x = prediction[0]  # Extracting x coordinate
        y = prediction[1]  # Extracting y coordinate
        width = prediction[2]  # Extracting width
        height = prediction[3]  # Extracting height
        confidence = prediction[4]  # Extracting confidence score
        class_probs = prediction[5:]  # Assuming the remaining values are class probabilities
        
        # Convert to scalars if necessary
        x = np.argmax(x)
        y = np.argmax(y)
        width = np.argmax(width)
        height = np.argmax(height)
        confidence = np.argmax(confidence)
        
        # Determine the class ID with the highest probability
        class_id = np.argmax(class_probs)
        class_name = "male" if class_id == 1 else "female"  # Adjust as per your class mapping
        
        # Generate a detection ID
        detection_id = str(uuid.uuid4())
        
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
    
    
   
