# 🧠 NeuroScan AI - Brain Tumor Classification

<div align="center">

![Python](https://img.shields.io/badge/Python-3.9+-blue?style=for-the-badge&logo=python&logoColor=white)
![TensorFlow](https://img.shields.io/badge/TensorFlow-2.15+-orange?style=for-the-badge&logo=tensorflow&logoColor=white)
![Flask](https://img.shields.io/badge/Flask-3.0+-black?style=for-the-badge&logo=flask&logoColor=white)
![License](https://img.shields.io/badge/License-MIT-green?style=for-the-badge)

**AI-powered MRI Brain Tumor Classification using Deep Learning**

[Demo](#demo) • [Features](#features) • [Installation](#installation) • [Usage](#usage) • [Model](#model)

</div>

---

## ✨ Features

- 🎨 **Modern UI** - Beautiful dark theme with glassmorphism design
- 🖱️ **Drag & Drop** - Easy image upload with drag-and-drop support
- 🧠 **4-Class Classification** - Detects Glioma, Meningioma, Pituitary tumors, and No Tumor
- 📊 **Confidence Scores** - View probability distribution for all classes
- 📱 **Responsive** - Works seamlessly on desktop and mobile devices
- ⚡ **Real-time** - Instant predictions powered by TensorFlow

## 🎯 Demo

<div align="center">
  <img src="docs/demo.gif" alt="NeuroScan AI Demo" width="600">
</div>

## 🏗️ Project Structure

```
Mri/
├── app.py                 # Flask backend server
├── model.h5               # Trained TensorFlow model
├── requirements.txt       # Python dependencies
├── README.md             # Project documentation
├── static/
│   ├── css/
│   │   └── style.css     # Premium dark theme styles
│   └── js/
│       └── main.js       # Frontend JavaScript
└── templates/
    └── index.html        # Main HTML template
```

## 🚀 Installation

### Prerequisites

- Python 3.9 or higher
- pip package manager

### Setup

1. **Clone the repository**
   ```bash
   git clone https://github.com/Haseebabbas2/NeuroScan-AI.git
   cd NeuroScan-AI
   ```

2. **Create virtual environment** (recommended)
   ```bash
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   ```

3. **Install dependencies**
   ```bash
   pip install -r requirements.txt
   ```

4. **Run the application**
   ```bash
   python app.py
   ```

5. **Open in browser**
   ```
   http://localhost:5000
   ```

## 📖 Usage

1. **Upload** - Drag and drop an MRI brain scan image or click to browse
2. **Analyze** - Click "Analyze MRI Scan" to run the prediction
3. **Results** - View the classification result with confidence scores for all tumor types

### Supported Image Formats
- JPEG / JPG
- PNG
- WebP
- GIF

## 🧠 Model

The classification model is a Convolutional Neural Network (CNN) trained on brain MRI images.

### Classes
| Class | Description |
|-------|-------------|
| **Glioma** | A type of tumor that occurs in the brain and spinal cord |
| **Meningioma** | A tumor that arises from the meninges |
| **Pituitary** | A tumor that forms in the pituitary gland |
| **No Tumor** | Brain MRI with no detectable tumor |

### Model Architecture
- Input: 150x150 RGB images
- CNN with multiple convolutional layers
- Trained using categorical cross-entropy loss
- Output: Softmax activation for 4-class classification

## 🛠️ Tech Stack

- **Backend**: Flask, TensorFlow/Keras
- **Frontend**: HTML5, CSS3 (Glassmorphism), JavaScript
- **Fonts**: Inter (Google Fonts)
- **Design**: Custom dark theme with animated gradients

## ⚠️ Disclaimer

This application is for **educational and research purposes only**. It is not intended to be used for actual medical diagnosis. Always consult qualified healthcare professionals for medical advice.

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📬 Contact

- **GitHub**: [@haseebabbas](https://github.com/Haseebabbas2)
---

<div align="center">
  Made with by Haseeb Abbas
</div>
