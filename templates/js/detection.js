document.addEventListener("DOMContentLoaded", () => {
  document.getElementById("current-year").textContent =
    new Date().getFullYear();
});

const imageUpload = document.getElementById("imageUpload");
const imagePreview = document.getElementById("imagePreview");
const imagePreviewImg = imagePreview.querySelector("img");
const detectButton = document.getElementById("detectButton");
const loadingSpinner = document.getElementById("loadingSpinner");
const buttonText = document.getElementById("buttonText");
const resultsSection = document.getElementById("resultsSection");
const diseaseName = document.getElementById("diseaseName");
const confidenceScore = document.getElementById("confidenceScore");
const recommendation = document.getElementById("recommendation");
const backButton = document.getElementById("backButton");

let uploadedImageBase64 = null;
let uploadedImageMimeType = null;

backButton.addEventListener("click", function (e) {
  e.preventDefault();
  history.back();
});

imageUpload.addEventListener("change", function (event) {
  const file = event.target.files[0];
  if (file) {
    const reader = new FileReader();
    reader.onload = function (e) {
      imagePreviewImg.src = e.target.result;
      imagePreview.classList.remove("hidden");
      detectButton.disabled = false;

      const [mimeTypePart, base64Data] = e.target.result.split(",");
      uploadedImageBase64 = base64Data;
      uploadedImageMimeType = mimeTypePart
        .replace("data:", "")
        .replace(";base64", "");
    };
    reader.readAsDataURL(file);
  } else {
    imagePreview.classList.add("hidden");
    imagePreviewImg.src = "#";
    detectButton.disabled = true;
    uploadedImageBase64 = null;
    uploadedImageMimeType = null;
  }
});

detectButton.addEventListener("click", async function () {
  if (!uploadedImageBase64 || !uploadedImageMimeType) {
    console.error("No image uploaded or MIME type missing for detection.");
    return;
  }

  detectButton.disabled = true;
  buttonText.textContent = "Detecting...";
  loadingSpinner.classList.remove("hidden");
  resultsSection.classList.add("hidden");

  try {
    const prompt =
      'Analyze this plant image for signs of disease. Respond ONLY with a JSON object. The JSON should have three fields: \'disease\' (string), \'confidence\' (number, 0-100%), and \'recommendation\' (string, a very brief suggestion). Example JSON: {"disease": "Bacterial Blight", "confidence": 92.5, "recommendation": "Apply copper-based bactericides."}. If no specific disease is detected or you are unsure, set disease to \'No specific disease detected\' and confidence to 0, and provide a general recommendation.';

    let chatHistory = [];
    chatHistory.push({ role: "user", parts: [{ text: prompt }] });
    const payload = {
      contents: [
        {
          role: "user",
          parts: [
            { text: prompt },
            {
              inlineData: {
                mimeType: uploadedImageMimeType,
                data: uploadedImageBase64,
              },
            },
          ],
        },
      ],
      generationConfig: {
        responseMimeType: "application/json",
        responseSchema: {
          type: "OBJECT",
          properties: {
            disease: { type: "STRING" },
            confidence: { type: "NUMBER" },
            recommendation: { type: "STRING" },
          },
          propertyOrdering: ["disease", "confidence", "recommendation"],
        },
      },
    };

    const apiKey = "AIzaSyCswE17I_VA5WAPwM89AluLKMKF0dwABB4";
    const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`;

    const response = await fetch(apiUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    const result = await response.json();
    console.log("Gemini API Full Response:", result);
    if (result.error) {
      console.error("Gemini API Error:", result.error);
      diseaseName.textContent = `API Error: ${
        result.error.message || "Unknown API error"
      }`;
      confidenceScore.textContent = "0%";
      recommendation.textContent =
        "An error occurred with the AI service. Please try again later or check API key/limits. (See console for details).";
      resultsSection.classList.remove("hidden");
      return;
    }

    if (
      result.candidates &&
      result.candidates.length > 0 &&
      result.candidates[0].content &&
      result.candidates[0].content.parts &&
      result.candidates[0].content.parts.length > 0
    ) {
      const jsonString = result.candidates[0].content.parts[0].text;
      console.log("Raw JSON string from API:", jsonString);

      try {
        const parsedResult = JSON.parse(jsonString);

        if (
          typeof parsedResult.disease === "string" &&
          typeof parsedResult.confidence === "number" &&
          typeof parsedResult.recommendation === "string"
        ) {
          diseaseName.textContent = parsedResult.disease;
          confidenceScore.textContent =
            parsedResult.confidence.toFixed(2) + "%";
          recommendation.textContent = parsedResult.recommendation;
          resultsSection.classList.remove("hidden");
        } else {
          console.error(
            "Parsed JSON is missing expected properties or has wrong types:",
            parsedResult
          );
          diseaseName.textContent = "Error: Incomplete AI Data";
          confidenceScore.textContent = "0%";
          recommendation.textContent =
            "The AI returned valid JSON but it was missing expected disease, confidence, or recommendation fields. Please try again or with a different image.";
          resultsSection.classList.remove("hidden");
        }
      } catch (jsonError) {
        console.error(
          "Error parsing JSON response from Gemini API:",
          jsonError
        );
        diseaseName.textContent = "Error: Invalid AI Response Format";
        confidenceScore.textContent = "0%";
        recommendation.textContent =
          "The AI returned data in an unexpected, non-JSON format. Check the console for the raw response. Please try again or with a different image.";
        resultsSection.classList.remove("hidden");
      }
    } else {
      console.error(
        "Unexpected Gemini API response structure: Missing candidates or content.",
        result
      );
      diseaseName.textContent = "Error: No AI Response Content";
      confidenceScore.textContent = "0%";
      recommendation.textContent =
        "The AI did not generate any detectable content. This might be due to safety filters, low confidence, or an ambiguous image. Please try again or upload a clearer image.";
      resultsSection.classList.remove("hidden");
    }
  } catch (error) {
    console.error("Network or API call error during AI detection:", error);
    diseaseName.textContent = "Error: Network/API Issue";
    confidenceScore.textContent = "0%";
    recommendation.textContent =
      "A network error or problem with the AI service occurred. Please check your internet connection or try again later.";
    resultsSection.classList.remove("hidden");
  } finally {
    detectButton.disabled = false;
    buttonText.textContent = "Detect Disease";
    loadingSpinner.classList.add("hidden");
  }
});
