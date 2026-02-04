/**
 * MRI Brain Tumor Classification - Main JavaScript
 * Handles file upload, drag-drop, image preview, and API communication
 */

// DOM Elements
const uploadZone = document.getElementById('uploadZone');
const fileInput = document.getElementById('fileInput');
const uploadSection = document.getElementById('uploadSection');
const previewSection = document.getElementById('previewSection');
const loadingSection = document.getElementById('loadingSection');
const resultsSection = document.getElementById('resultsSection');
const previewImage = document.getElementById('previewImage');
const analyzeBtn = document.getElementById('analyzeBtn');

// State
let currentFile = null;

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    initDragDrop();
    initFileInput();
    initButtons();
    initChatbot();
});

/**
 * Initialize drag and drop functionality
 */
function initDragDrop() {
    // Prevent default drag behaviors
    ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
        uploadZone.addEventListener(eventName, preventDefaults, false);
        document.body.addEventListener(eventName, preventDefaults, false);
    });

    // Highlight drop zone when dragging over
    ['dragenter', 'dragover'].forEach(eventName => {
        uploadZone.addEventListener(eventName, () => {
            uploadZone.classList.add('dragover');
        }, false);
    });

    // Remove highlight when not dragging
    ['dragleave', 'drop'].forEach(eventName => {
        uploadZone.addEventListener(eventName, () => {
            uploadZone.classList.remove('dragover');
        }, false);
    });

    // Handle dropped files
    uploadZone.addEventListener('drop', handleDrop, false);

    // Click to upload
    uploadZone.addEventListener('click', () => fileInput.click());
}

/**
 * Prevent default events
 */
function preventDefaults(e) {
    e.preventDefault();
    e.stopPropagation();
}

/**
 * Handle dropped files
 */
function handleDrop(e) {
    const files = e.dataTransfer.files;
    if (files.length > 0) {
        handleFile(files[0]);
    }
}

/**
 * Initialize file input
 */
function initFileInput() {
    fileInput.addEventListener('change', (e) => {
        if (e.target.files.length > 0) {
            handleFile(e.target.files[0]);
        }
    });
}

/**
 * Initialize button handlers
 */
function initButtons() {
    // Analyze button
    analyzeBtn.addEventListener('click', analyzeMRI);

    // New scan button (will be created dynamically)
    document.addEventListener('click', (e) => {
        if (e.target.id === 'newScanBtn' || e.target.closest('#newScanBtn')) {
            resetToUpload();
        }
        if (e.target.id === 'clearBtn' || e.target.closest('#clearBtn')) {
            resetToUpload();
        }
    });
}

/**
 * Handle selected file
 */
function handleFile(file) {
    // Validate file type
    const validTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    if (!validTypes.includes(file.type)) {
        showError('Please upload a valid image file (JPEG, PNG, GIF, or WebP)');
        return;
    }

    // Validate file size (max 16MB)
    if (file.size > 16 * 1024 * 1024) {
        showError('File size must be less than 16MB');
        return;
    }

    currentFile = file;

    // Create preview
    const reader = new FileReader();
    reader.onload = (e) => {
        previewImage.src = e.target.result;
        showPreview();
    };
    reader.readAsDataURL(file);
}

/**
 * Show preview section
 */
function showPreview() {
    uploadSection.classList.add('hidden');
    previewSection.classList.add('active');
    loadingSection.classList.remove('active');
    resultsSection.classList.remove('active');

    // Animate in
    previewSection.style.animation = 'none';
    previewSection.offsetHeight; // Trigger reflow
    previewSection.style.animation = 'fadeInUp 0.5s ease-out';
}

/**
 * Show loading state
 */
function showLoading() {
    previewSection.classList.remove('active');
    loadingSection.classList.add('active');
    resultsSection.classList.remove('active');
}

/**
 * Show results
 */
function showResults(data) {
    loadingSection.classList.remove('active');
    resultsSection.classList.add('active');
    renderResults(data);

    // Auto-open chatbot after showing results so user can ask questions
    setTimeout(() => {
        const chatbotWidget = document.getElementById('chatbotWidget');
        if (chatbotWidget && !chatbotWidget.classList.contains('open')) {
            chatbotWidget.classList.add('open');

            // Add a contextual message about the result
            const chatMessages = document.getElementById('chatMessages');
            const contextMsg = document.createElement('div');
            contextMsg.className = 'chat-message chat-message--bot';
            contextMsg.innerHTML = `
                <div class="chat-message__avatar">🤖</div>
                <div class="chat-message__content">
                    <p>I see you've received a prediction of <strong>${data.prediction}</strong> with ${data.confidence.toFixed(1)}% confidence. Would you like me to explain what this means or answer any questions about this result?</p>
                </div>
            `;
            chatMessages.appendChild(contextMsg);
            chatMessages.scrollTop = chatMessages.scrollHeight;
        }
    }, 1500); // Delay to let user see results first
}

/**
 * Reset to upload state
 */
function resetToUpload() {
    currentFile = null;
    fileInput.value = '';
    previewImage.src = '';

    uploadSection.classList.remove('hidden');
    previewSection.classList.remove('active');
    loadingSection.classList.remove('active');
    resultsSection.classList.remove('active');

    // Animate in
    uploadSection.style.animation = 'none';
    uploadSection.offsetHeight;
    uploadSection.style.animation = 'fadeInUp 0.5s ease-out';
}

/**
 * Analyze MRI scan
 */
async function analyzeMRI() {
    if (!currentFile) {
        showError('Please select an image first');
        return;
    }

    analyzeBtn.disabled = true;
    showLoading();

    try {
        // Convert file to base64
        const base64 = await fileToBase64(currentFile);

        // Send to API
        const response = await fetch('/predict', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ image: base64 })
        });

        const data = await response.json();

        if (data.error) {
            throw new Error(data.error);
        }

        showResults(data);
    } catch (error) {
        console.error('Analysis error:', error);
        showError('Analysis failed: ' + error.message);
        resetToUpload();
    } finally {
        analyzeBtn.disabled = false;
    }
}

/**
 * Convert file to base64
 */
function fileToBase64(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.onerror = reject;
        reader.readAsDataURL(file);
    });
}

/**
 * Render results
 */
function renderResults(data) {
    const resultHeader = document.getElementById('resultHeader');
    const probabilityGrid = document.getElementById('probabilityGrid');

    // Determine icon type based on prediction
    const isNoTumor = data.prediction === 'No Tumor';
    const iconClass = isNoTumor ? 'success' : 'warning';
    const iconEmoji = isNoTumor ? '✓' : '⚠';

    // Update header
    resultHeader.innerHTML = `
        <div class="result-icon ${iconClass}">
            ${iconEmoji}
        </div>
        <h2 class="result-title">${data.prediction}</h2>
        <p class="result-confidence">
            Confidence: <span class="confidence-value">${data.confidence.toFixed(1)}%</span>
        </p>
    `;

    // Render probability bars
    const probabilities = data.probabilities;
    const labels = {
        'Glioma': { icon: '🔴', class: 'glioma' },
        'Meningioma': { icon: '🟠', class: 'meningioma' },
        'No Tumor': { icon: '🟢', class: 'no-tumor' },
        'Pituitary': { icon: '🔵', class: 'pituitary' }
    };

    let probabilityHTML = '';

    // Sort by probability (highest first)
    const sortedProbs = Object.entries(probabilities)
        .sort((a, b) => b[1] - a[1]);

    for (const [label, value] of sortedProbs) {
        const info = labels[label] || { icon: '⚪', class: 'default' };
        probabilityHTML += `
            <div class="probability-item">
                <div class="probability-header">
                    <span class="probability-label">
                        ${info.icon} ${label}
                    </span>
                    <span class="probability-value">${value.toFixed(1)}%</span>
                </div>
                <div class="probability-bar">
                    <div class="probability-fill ${info.class}" style="width: 0%" data-target="${value}"></div>
                </div>
            </div>
        `;
    }

    probabilityGrid.innerHTML = probabilityHTML;

    // Animate bars
    requestAnimationFrame(() => {
        setTimeout(() => {
            document.querySelectorAll('.probability-fill').forEach(bar => {
                bar.style.width = bar.dataset.target + '%';
            });
        }, 100);
    });
}

/**
 * Show error message
 */
function showError(message) {
    // Create toast notification
    const toast = document.createElement('div');
    toast.className = 'toast toast-error';
    toast.innerHTML = `
        <span>⚠️</span>
        <span>${message}</span>
    `;

    // Add styles for toast if not exists
    if (!document.getElementById('toast-styles')) {
        const styles = document.createElement('style');
        styles.id = 'toast-styles';
        styles.textContent = `
            .toast {
                position: fixed;
                bottom: 100px;
                left: 50%;
                transform: translateX(-50%);
                padding: 16px 24px;
                background: rgba(235, 51, 73, 0.9);
                backdrop-filter: blur(10px);
                border-radius: 12px;
                color: white;
                font-weight: 500;
                display: flex;
                align-items: center;
                gap: 12px;
                z-index: 9999;
                animation: slideUp 0.3s ease-out;
            }
            @keyframes slideUp {
                from {
                    opacity: 0;
                    transform: translateX(-50%) translateY(20px);
                }
                to {
                    opacity: 1;
                    transform: translateX(-50%) translateY(0);
                }
            }
        `;
        document.head.appendChild(styles);
    }

    document.body.appendChild(toast);

    // Remove after 4 seconds
    setTimeout(() => {
        toast.style.animation = 'slideUp 0.3s ease-out reverse';
        setTimeout(() => toast.remove(), 300);
    }, 4000);
}

// ============================================
// CHATBOT FUNCTIONALITY
// ============================================

/**
 * Initialize chatbot
 */
function initChatbot() {
    const chatbotWidget = document.getElementById('chatbotWidget');
    const chatToggle = document.getElementById('chatToggle');
    const chatClose = document.getElementById('chatClose');
    const chatInput = document.getElementById('chatInput');
    const chatSend = document.getElementById('chatSend');

    if (!chatbotWidget) return;

    // Toggle chat window
    chatToggle.addEventListener('click', () => {
        chatbotWidget.classList.toggle('open');
        if (chatbotWidget.classList.contains('open')) {
            chatInput.focus();
        }
    });

    // Close button
    chatClose.addEventListener('click', () => {
        chatbotWidget.classList.remove('open');
    });

    // Send message on button click
    chatSend.addEventListener('click', sendChatMessage);

    // Send message on Enter key
    chatInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            sendChatMessage();
        }
    });
}

/**
 * Send chat message
 */
async function sendChatMessage() {
    const chatInput = document.getElementById('chatInput');
    const chatMessages = document.getElementById('chatMessages');
    const chatSend = document.getElementById('chatSend');

    const message = chatInput.value.trim();
    if (!message) return;

    // Clear input
    chatInput.value = '';
    chatSend.disabled = true;

    // Add user message
    addChatMessage(message, 'user');

    // Add typing indicator
    const typingIndicator = addTypingIndicator();

    // Scroll to bottom
    chatMessages.scrollTop = chatMessages.scrollHeight;

    try {
        const response = await fetch('/chat', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ message })
        });

        const data = await response.json();

        // Remove typing indicator
        typingIndicator.remove();

        // Add bot response
        addChatMessage(data.response || data.error || 'Sorry, I could not process your request.', 'bot');

    } catch (error) {
        console.error('Chat error:', error);
        typingIndicator.remove();
        addChatMessage('Sorry, there was an error connecting to the server.', 'bot');
    } finally {
        chatSend.disabled = false;
        chatInput.focus();
        chatMessages.scrollTop = chatMessages.scrollHeight;
    }
}

/**
 * Add message to chat
 */
function addChatMessage(text, sender) {
    const chatMessages = document.getElementById('chatMessages');

    const messageDiv = document.createElement('div');
    messageDiv.className = `chat-message chat-message--${sender}`;

    const avatar = sender === 'user' ? '👤' : '🤖';

    messageDiv.innerHTML = `
        <div class="chat-message__avatar">${avatar}</div>
        <div class="chat-message__content">
            <p>${escapeHtml(text)}</p>
        </div>
    `;

    chatMessages.appendChild(messageDiv);
    chatMessages.scrollTop = chatMessages.scrollHeight;

    return messageDiv;
}

/**
 * Add typing indicator
 */
function addTypingIndicator() {
    const chatMessages = document.getElementById('chatMessages');

    const typingDiv = document.createElement('div');
    typingDiv.className = 'chat-message chat-message--bot chat-message--typing';
    typingDiv.innerHTML = `
        <div class="chat-message__avatar">🤖</div>
        <div class="chat-message__content">
            <span class="typing-dot"></span>
            <span class="typing-dot"></span>
            <span class="typing-dot"></span>
        </div>
    `;

    chatMessages.appendChild(typingDiv);
    chatMessages.scrollTop = chatMessages.scrollHeight;

    return typingDiv;
}

/**
 * Escape HTML to prevent XSS
 */
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

