// script.js

// Set current year in footer dynamically
document.addEventListener('DOMContentLoaded', () => {
    document.getElementById('current-year').textContent = new Date().getFullYear();

    // --- Card Scroll Animation Logic ---
    const cards = document.querySelectorAll('.team-card');
    const observerOptions = {
        root: null,
        rootMargin: '0px',
        threshold: 0.2
    };

    const observerCallback = (entries, observer) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('animate-in');
                observer.unobserve(entry.target);
            }
        });
    };

    const observer = new IntersectionObserver(observerCallback, observerOptions);
    cards.forEach(card => {
        observer.observe(card);
    });

    // --- Chatbot Logic ---
    const userInput = document.getElementById('user-input');
    const sendButton = document.getElementById('send-button');
    const chatHistory = document.getElementById('chat-history');

    // Function to scroll chat history to the bottom
    function scrollToBottom() {
        chatHistory.scrollTop = chatHistory.scrollHeight;
    }

    /**
     * AI-powered Chatbot Function using Google Gemini API.
     * This function makes an API call to the Google Gemini model
     * to get the bot's response.
     * @param {string} userMessage - The input message from the user.
     * @returns {Promise<string>} A promise that resolves with the bot's response.
     */
    async function agroguardChatbotAI(userMessage) {
        // !! IMPORTANT SECURITY WARNING !!
        // Storing your API key directly in client-side code (like this) is HIGHLY INSECURE.
        // For any production application, you MUST proxy these requests through a secure
        // backend server to protect your API key.
        const GEMINI_API_KEY = 'AIzaSyCswE17I_VA5WAPwM89AluLKMKF0dwABB4'; // Replace with your actual Google Gemini API Key from Google AI Studio
        
        // Corrected model to gemini-1.5-flash for broader client-side availability
        const GEMINI_API_ENDPOINT = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`;

        try {
            // Construct the prompt to instruct the AI for a 4-point answer
            const formattedPrompt = `Please provide your answer in exactly four points: ${userMessage}`;

            const response = await fetch(GEMINI_API_ENDPOINT, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    // For Gemini, when the key is in the URL, no 'Authorization' header is needed.
                },
                body: JSON.stringify({
                    contents: [{
                        parts: [{
                            text: formattedPrompt // Send the formatted prompt to the AI
                        }]
                    }],
                    generationConfig: {
                        temperature: 0.7, // Controls randomness (0.0 to 1.0, higher means more creative)
                        maxOutputTokens: 500, // Increased maxOutputTokens to allow for potentially longer 4-point answers
                    },
                    // You can add safety settings here if needed, e.g.:
                    // safetySettings: [
                    //     { category: 'HARM_CATEGORY_HARASSMENT', threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
                    //     { category: 'HARM_CATEGORY_HATE_SPEECH', threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
                    // ],
                })
            });

            // Check if the HTTP response was successful (status code 200-299)
            if (!response.ok) {
                const errorData = await response.json();
                console.error('Gemini API Error Response:', errorData); // Log the detailed error from Google
                // Construct a more informative error message for the user
                const errorMessage = errorData.error ? errorData.error.message : `API responded with status ${response.status}.`;
                throw new Error(`AI API Error: ${errorMessage}`);
            }

            const data = await response.json();
            console.log('Gemini API Full Response Data:', data); // Log the full successful response for debugging

            // Correctly parse the response from Google Gemini's generateContent API
            if (data.candidates && data.candidates[0] && data.candidates[0].content && data.candidates[0].content.parts && data.candidates[0].content.parts[0]) {
                return data.candidates[0].content.parts[0].text.trim();
            } else {
                // Fallback for unexpected or empty responses from the API
                console.warn("Unexpected Gemini API response structure, or no text generated:", data);
                return "I received an unexpected response from the AI. Please try again or ask something different.";
            }

        } catch (error) {
            // This catch block handles network errors or errors thrown by our 'if (!response.ok)' check
            console.error("Error fetching response from AI model:", error);
            // User-friendly message for any errors caught during the process
            return "Oops! I'm currently unable to process your request due to a connection or API issue. Please try again in a moment.";
        }
    }

    /**
     * Adds a message to the chat history display.
     * @param {string} sender - 'user' or 'bot'.
     * @param {string} message - The message text to display.
     */
    function addMessage(sender, message) {
        const messageDiv = document.createElement('div');
        messageDiv.classList.add('flex', 'mb-3');

        if (sender === 'user') {
            messageDiv.classList.add('justify-end');
            messageDiv.innerHTML = `
                <div class="bg-blue-500 text-white p-3 rounded-xl rounded-br-none shadow inline-block max-w-[80%]">
                    ${message}
                </div>
            `;
        } else { // bot message
            messageDiv.innerHTML = `
                <div class="bg-green-100 text-green-800 p-3 rounded-xl rounded-bl-none shadow inline-block max-w-[80%]">
                    ${message}
                </div>
            `;
        }
        chatHistory.appendChild(messageDiv);
        scrollToBottom();
    }

    /**
     * Handles the sending of a user message.
     * Clears the input, adds the message to history, and gets a bot response.
     */
    async function handleSendMessage() {
        const message = userInput.value.trim();
        if (message) {
            addMessage('user', message);
            userInput.value = '';

            addMessage('bot', '...');
            const thinkingMessage = chatHistory.lastChild;

            try {
                const botResponse = await agroguardChatbotAI(message);
                thinkingMessage.querySelector('div').textContent = botResponse;
            } catch (error) {
                thinkingMessage.querySelector('div').textContent = "Error: Could not get a response.";
                console.error("Failed to get AI response:", error);
            } finally {
                scrollToBottom();
            }
        }
    }

    // Event listeners for sending message
    sendButton.addEventListener('click', handleSendMessage);
    userInput.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            handleSendMessage();
        }
    });

    // Smooth scrolling for navigation links
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();

            document.querySelector(this.getAttribute('href')).scrollIntoView({
                behavior: 'smooth'
            });
        });
    });


    // --- Mobile Menu Dropdown Logic (NEW) ---
    const mobileMenuButton = document.getElementById('mobile-menu-button');
    const mobileMenu = document.getElementById('mobile-menu');

    if (mobileMenuButton && mobileMenu) { // Ensure elements exist before adding listeners
        mobileMenuButton.addEventListener('click', function() {
            mobileMenu.classList.toggle('hidden'); // Toggles Tailwind's 'hidden' class
            mobileMenu.classList.toggle('active'); // Toggles our custom 'active' class for animation
        });

        // Hide mobile menu when a link inside it is clicked
        mobileMenu.querySelectorAll('a').forEach(link => {
            link.addEventListener('click', () => {
                mobileMenu.classList.add('hidden');
                mobileMenu.classList.remove('active');
            });
        });

        // Hide mobile menu when the window is resized to a desktop size
        window.addEventListener('resize', function() {
            if (window.innerWidth >= 768) { // Corresponds to Tailwind's 'md' breakpoint
                mobileMenu.classList.add('hidden');
                mobileMenu.classList.remove('active');
            }
        });
    }
});