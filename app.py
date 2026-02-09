
import os
import random
import numpy as np
from flask import Flask, render_template, request, jsonify
from PIL import Image
import io
import base64
import requests
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()

# ==========================================
# CONFIGURATION
# ==========================================

# OpenRouter API Configuration
OPENROUTER_API_KEY = os.environ.get('OPENROUTER_API_KEY', '')
OPENROUTER_MODEL = "nvidia/nemotron-nano-9b-v2:free"  # Working free model
OPENROUTER_API_URL = "https://openrouter.ai/api/v1/chat/completions"

# Set to True to run without loading the actual model (for UI testing)
DEMO_MODE = os.environ.get('DEMO_MODE', 'false').lower() == 'true'

# TensorFlow import with error handling
os.environ['TF_CPP_MIN_LOG_LEVEL'] = '2'

if not DEMO_MODE:
    try:
        import tensorflow as tf
        TF_AVAILABLE = True
        
        # Configure GPU memory growth to avoid OOM errors
        gpus = tf.config.experimental.list_physical_devices('GPU')
        if gpus:
            try:
                for gpu in gpus:
                    tf.config.experimental.set_memory_growth(gpu, True)
            except RuntimeError as e:
                print(f"GPU configuration error: {e}")
    except ImportError:
        TF_AVAILABLE = False
        print("TensorFlow not available. Running in DEMO mode.")
        DEMO_MODE = True
else:
    TF_AVAILABLE = False
    print("Running in DEMO mode - model predictions will be simulated")

app = Flask(__name__)
app.config['MAX_CONTENT_LENGTH'] = 16 * 1024 * 1024  # 16MB max file size

# Model path
MODEL_PATH = os.path.join(os.path.dirname(__file__), 'model.h5')
CONVERTED_MODEL_PATH = os.path.join(os.path.dirname(__file__), 'model_converted.keras')

# Class labels for brain tumor classification
CLASS_LABELS = ['Glioma', 'Meningioma', 'No Tumor', 'Pituitary']

# Global model variable
model = None


def load_model():
    """Load the trained model with legacy Keras compatibility."""
    global model
    
    if DEMO_MODE:
        print("DEMO MODE: Skipping model loading")
        return None
    
    if model is None:
        print("Loading model...")
        
        # Try loading converted model first
        model_path = CONVERTED_MODEL_PATH if os.path.exists(CONVERTED_MODEL_PATH) else MODEL_PATH
        print(f"Using model: {model_path}")
        
        try:
            # Use tf_keras (legacy Keras 2.x) for loading old format models
            import tf_keras
            model = tf_keras.models.load_model(model_path, compile=False)
            print("Model loaded successfully using tf_keras!")
        except ImportError:
            print("tf_keras not installed. Trying standard TensorFlow...")
            try:
                model = tf.keras.models.load_model(model_path, compile=False)
                print("Model loaded successfully!")
            except Exception as e:
                print(f"Error loading model: {e}")
                raise e
        except Exception as e:
            print(f"Error loading model: {e}")
            print("\n" + "="*60)
            print("MODEL LOADING FAILED")
            print("="*60)
            print("This is likely due to Keras 2.x vs 3.x incompatibility.")
            print("\nOptions:")
            print("1. Run in DEMO mode: Set DEMO_MODE=true environment variable")
            print("2. Install TensorFlow 2.15: pip install tensorflow==2.15.0")
            print("3. Convert the model using convert_model.py")
            print("="*60 + "\n")
            raise e
    
    return model


def preprocess_image(image_data):
    """Preprocess the uploaded image for model prediction."""
    # Open image from bytes
    image = Image.open(io.BytesIO(image_data))
    
    # Convert to RGB if necessary
    if image.mode != 'RGB':
        image = image.convert('RGB')
    
    # Resize to model input size (299x299 based on model.input_shape)
    image = image.resize((299, 299))
    
    # Convert to numpy array and normalize
    img_array = np.array(image) / 255.0
    
    # Add batch dimension
    img_array = np.expand_dims(img_array, axis=0)
    
    return img_array


def demo_predict():
    """Generate a simulated prediction for demo mode."""
    # Generate random probabilities
    probs = np.random.dirichlet(np.ones(4) * 2)  # More realistic distribution
    
    # Sometimes make one class more dominant for realistic results
    if random.random() > 0.3:
        dominant_idx = random.randint(0, 3)
        probs[dominant_idx] += 0.5
        probs = probs / probs.sum()
    
    predicted_idx = np.argmax(probs)
    
    return {
        'prediction': CLASS_LABELS[predicted_idx],
        'confidence': float(probs[predicted_idx]) * 100,
        'probabilities': {
            label: float(prob) * 100 
            for label, prob in zip(CLASS_LABELS, probs)
        }
    }


@app.route('/')
def index():
    """Render the main page."""
    return render_template('index.html')


@app.route('/predict', methods=['POST'])
def predict():
    """Handle image upload and return prediction."""
    try:
        # Check if image is in request
        if 'image' not in request.files:
            # Check for base64 image data
            data = request.get_json()
            if data and 'image' in data:
                # Remove data URL prefix if present
                image_data = data['image']
                if ',' in image_data:
                    image_data = image_data.split(',')[1]
                image_bytes = base64.b64decode(image_data)
            else:
                return jsonify({'error': 'No image provided'}), 400
        else:
            file = request.files['image']
            if file.filename == '':
                return jsonify({'error': 'No image selected'}), 400
            image_bytes = file.read()
        
        # Demo mode: return simulated prediction
        if DEMO_MODE:
            # Small delay to simulate processing
            import time
            time.sleep(0.5)
            
            result = demo_predict()
            return jsonify({
                'success': True,
                'demo_mode': True,
                **result
            })
        
        # Real prediction mode
        loaded_model = load_model()
        
        # Preprocess image
        processed_image = preprocess_image(image_bytes)
        
        # Make prediction
        predictions = loaded_model.predict(processed_image, verbose=0)
        
        # Get prediction results
        predicted_class_idx = np.argmax(predictions[0])
        predicted_class = CLASS_LABELS[predicted_class_idx]
        confidence = float(predictions[0][predicted_class_idx]) * 100
        
        # Get all class probabilities
        probabilities = {
            label: float(prob) * 100 
            for label, prob in zip(CLASS_LABELS, predictions[0])
        }
        
        return jsonify({
            'success': True,
            'prediction': predicted_class,
            'confidence': round(confidence, 2),
            'probabilities': probabilities
        })
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500


# Chatbot system prompt - focused on brain tumor / medical imaging
CHATBOT_SYSTEM_PROMPT = """You are NeuroScan AI Assistant, a helpful medical AI assistant specializing in brain tumor information and MRI imaging. You provide educational information about:

- Brain tumor types (Glioma, Meningioma, Pituitary tumors)
- MRI imaging and how it's used in diagnosis
- General information about symptoms, treatments, and prognosis
- Explaining medical terminology in simple terms

IMPORTANT GUIDELINES:
1. Always clarify that you provide educational information only, NOT medical diagnosis
2. Encourage users to consult qualified healthcare professionals for medical advice
3. Be compassionate and supportive when discussing sensitive health topics
4. If asked about unrelated topics, politely redirect to brain health and MRI topics
5. Keep responses concise but informative (2-3 paragraphs max)

You are integrated into the NeuroScan AI brain tumor classification application."""


@app.route('/chat', methods=['POST'])
def chat():
    """Handle chatbot messages using OpenRouter API."""
    try:
        data = request.get_json()
        user_message = data.get('message', '').strip()
        
        if not user_message:
            return jsonify({'error': 'No message provided'}), 400
        
        # Check if API key is configured
        if not OPENROUTER_API_KEY:
            return jsonify({
                'error': 'Chatbot not configured. Please set OPENROUTER_API_KEY environment variable.',
                'response': 'I apologize, but the chatbot is not configured yet. Please add your OpenRouter API key to enable this feature.'
            }), 200
        
        # Prepare the API request
        headers = {
            'Authorization': f'Bearer {OPENROUTER_API_KEY}',
            'Content-Type': 'application/json',
            'HTTP-Referer': 'https://neuroscan-ai.app',
            'X-Title': 'NeuroScan AI'
        }
        
        payload = {
            'model': OPENROUTER_MODEL,
            'messages': [
                {'role': 'system', 'content': CHATBOT_SYSTEM_PROMPT},
                {'role': 'user', 'content': user_message}
            ],
            'max_tokens': 500,
            'temperature': 0.7
        }
        
        # Make the API request
        response = requests.post(
            OPENROUTER_API_URL,
            headers=headers,
            json=payload,
            timeout=30
        )
        
        if response.status_code != 200:
            error_detail = response.json() if response.text else {}
            error_msg = error_detail.get('error', {}).get('message', 'Unknown error')
            print(f"OpenRouter API error: {response.status_code} - {error_msg}")
            return jsonify({
                'error': f'API error: {response.status_code}',
                'response': f'API Error: {error_msg}. Please try again later.'
            }), 200
        
        result = response.json()
        assistant_message = result['choices'][0]['message']['content']
        
        return jsonify({
            'success': True,
            'response': assistant_message
        })
        
    except requests.Timeout:
        return jsonify({
            'error': 'Request timeout',
            'response': 'The request took too long. Please try again.'
        }), 200
    except Exception as e:
        return jsonify({
            'error': str(e),
            'response': 'An error occurred. Please try again.'
        }), 200


@app.route('/health')
def health():
    """Health check endpoint."""
    return jsonify({
        'status': 'healthy',
        'demo_mode': DEMO_MODE,
        'model_loaded': model is not None,
        'chatbot_configured': bool(OPENROUTER_API_KEY)
    })


if __name__ == '__main__':
    print("="*60)
    print("  🧠 NeuroScan AI - Brain Tumor Classification Server")
    print("="*60)
    
    if DEMO_MODE:
        print("\n⚠️  Running in DEMO MODE")
        print("   Predictions are simulated for UI testing")
        print("   Set DEMO_MODE=false to use the real model")
    else:
        print("\nLoading model...")
        try:
            load_model()
        except Exception as e:
            print(f"\n❌ Model loading failed. Switching to DEMO mode.")
            DEMO_MODE = True
    
    print("\n" + "="*60)
    print("  Server ready! Open http://localhost:5001 in your browser")
    print("="*60 + "\n")
    
    app.run(debug=True, host='0.0.0.0', port=5001)
