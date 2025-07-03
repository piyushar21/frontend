document.addEventListener('DOMContentLoaded', () => {
    document.getElementById('current-year').textContent = new Date().getFullYear();
});

const backButton = document.getElementById('backButton');
backButton.addEventListener('click', function(e) {
    e.preventDefault();
    history.back();
});

const microphoneButton = document.getElementById('microphoneButton');
const statusMessage = document.getElementById('statusMessage');
const userSpeechText = document.getElementById('userSpeechText');
const aiResponseText = document.getElementById('aiResponseText');
const errorMessageDiv = document.getElementById('errorMessage');

let isListening = false;
let recognition; // Variable to hold SpeechRecognition object
let synth = window.speechSynthesis; // SpeechSynthesis object

// Function to display error message to the user
function showErrorMessage(message) {
    errorMessageDiv.textContent = message;
    errorMessageDiv.classList.remove('hidden');
}

// Function to hide error message
function hideErrorMessage() {
    errorMessageDiv.classList.add('hidden');
    errorMessageDiv.textContent = '';
}

// Function to speak text
function speakText(text) {
    if (synth.speaking) {
        console.log('SpeechSynthesis is already speaking.');
        return;
    }
    if (text !== '') {
        const utterThis = new SpeechSynthesisUtterance(text);
        utterThis.lang = 'en-US'; // Set desired language for speech

        utterThis.onend = function (event) {
            console.log('SpeechSynthesisUtterance.onend');
            statusMessage.textContent = "Click the microphone to start listening.";
            microphoneButton.classList.remove('pulse');
            isListening = false;
        };

        utterThis.onerror = function (event) {
            console.error('SpeechSynthesisUtterance.onerror', event.error);
            showErrorMessage('Speech synthesis error: ' + event.error);
            statusMessage.textContent = "Click the microphone to start listening.";
            microphoneButton.classList.remove('pulse');
            isListening = false;
        };

        synth.speak(utterThis);
    }
}

// Function to get AI response from Gemini API
async function getAiResponse(userQuery) {
    try {
        // IMPORTANT: For local testing, replace "YOUR_API_KEY_HERE" with your actual Gemini API Key.
        // In a production environment, you would proxy this request through a secure backend.
        const apiKey = "AIzaSyCswE17I_VA5WAPwM89AluLKMKF0dwABB4"; // <--- CHANGE THIS LINE FOR LOCAL TESTING
        // const apiKey = ""; // Keep this line if running in a Canvas environment that injects the key
        const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`;

        let chatHistory = [];
        // Add a system instruction to guide the model's response for farming context
        chatHistory.push({
            role: "user",
            parts: [{ text: `You are an AI assistant for AgroGuard, a crop protection system. Provide concise, helpful answers related to farming, crop diseases, sensors, marketplace, and general agricultural advice. Keep responses to 2-4 sentences. User query: ${userQuery}` }]
        });

        const payload = {
            contents: chatHistory,
            generationConfig: {
                // You can adjust temperature for creativity (0.0-1.0)
                // You can adjust topK and topP for diversity
                temperature: 0.7,
            }
        };

        const response = await fetch(apiUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        const result = await response.json();
        console.log("Gemini API Full Response:", result);

        if (result.error) {
            console.error("Gemini API Error:", result.error);
            showErrorMessage(`API Error: ${result.error.message || 'Unknown API error'}. Please check the console.`);
            return "Sorry, I encountered an error with the AI. Please try again.";
        }

        if (result.candidates && result.candidates.length > 0 &&
            result.candidates[0].content && result.candidates[0].content.parts &&
            result.candidates[0].content.parts.length > 0) {
            return result.candidates[0].content.parts[0].text;
        } else {
            console.warn("Gemini API returned no content or unexpected structure:", result);
            return "I'm sorry, I couldn't generate a response for that. The AI might be unable to process the query.";
        }

    } catch (error) {
        console.error("Network or API call error:", error);
        showErrorMessage("Network error: Could not connect to the AI. Check your internet connection.");
        return "I'm experiencing connectivity issues. Please check your internet connection.";
    }
}

// Initialize SpeechRecognition
function initializeSpeechRecognition() {
    // Check for Web Speech API compatibility
    if (!('SpeechRecognition' in window) && !('webkitSpeechRecognition' in window)) {
        showErrorMessage("Speech recognition is not supported in your browser. Please use Chrome for this feature.");
        microphoneButton.disabled = true;
        return null;
    }

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    recognition = new SpeechRecognition();
    recognition.lang = 'en-IN'; // Example: Indian English. Adjust as needed (e.g., 'en-US', 'hi-IN')
    recognition.interimResults = false; // Only return final results
    recognition.maxAlternatives = 1; // Get only the most probable result

    recognition.onstart = function() {
        isListening = true;
        hideErrorMessage();
        statusMessage.textContent = "Listening... Speak clearly.";
        microphoneButton.classList.add('pulse');
        userSpeechText.textContent = "Listening...";
        aiResponseText.textContent = "Processing your request...";
    };

    recognition.onresult = async function(event) {
        const speechResult = event.results[0][0].transcript;
        userSpeechText.textContent = speechResult;
        statusMessage.textContent = "Processing...";
        microphoneButton.classList.remove('pulse'); // Stop pulse immediately after result

        // Get AI response
        const botResponse = await getAiResponse(speechResult);
        aiResponseText.textContent = botResponse;

        // Speak the AI response
        speakText(botResponse);
    };

    recognition.onerror = function(event) {
        console.error('Speech recognition error:', event.error);
        if (event.error === 'not-allowed') {
            showErrorMessage("Microphone access denied. Please allow microphone access in your browser settings.");
        } else if (event.error === 'no-speech') {
            showErrorMessage("No speech detected. Please try speaking louder or clearer.");
        } else if (event.error === 'audio-capture') {
            showErrorMessage("No microphone found or audio capture failed. Ensure your microphone is connected and working.");
        } else {
            showErrorMessage("Speech recognition error: " + event.error + ". Please try again.");
        }
        statusMessage.textContent = "Click the microphone to start listening.";
        microphoneButton.classList.remove('pulse');
        isListening = false;
    };

    recognition.onend = function() {
        console.log('Speech recognition ended.');
        if (isListening) { // If it ended unexpectedly while still supposed to be listening
            statusMessage.textContent = "Recognition stopped. Click to try again.";
            microphoneButton.classList.remove('pulse');
            isListening = false;
        }
    };

    return recognition;
}

// Main button click handler
microphoneButton.addEventListener('click', () => {
    if (!recognition) {
        recognition = initializeSpeechRecognition();
        if (!recognition) return; // If initialization failed, stop here
    }

    if (isListening) {
        recognition.stop(); // Stop listening
        isListening = false;
        statusMessage.textContent = "Stopped listening.";
        microphoneButton.classList.remove('pulse');
        // If AI is still speaking, stop it
        if (synth.speaking) {
            synth.cancel();
        }
    } else {
        hideErrorMessage();
        recognition.start(); // Start listening
    }
});