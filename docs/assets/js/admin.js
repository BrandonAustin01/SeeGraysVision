// ========================
// SeeGraysVision Admin Panel Script
// Handles Login + Upload with Flash Feedback
// ========================

// --- Configuration ---
const ADMIN_USERNAME = "CJBanco";
const ADMIN_PASSWORD = "IAmMusic";
const UPLOAD_SECRET = "seegraysvision_secret";

// Dynamically switch between local and deployed Netlify environments
const isLocal =
  window.location.hostname === "localhost" ||
  window.location.hostname === "127.0.0.1";
const SERVER_UPLOAD_URL = isLocal
  ? "http://127.0.0.1:8888/.netlify/functions/upload"
  : "/.netlify/functions/upload";

// --- Helper Functions ---

/**
 * Displays a temporary flash message after actions.
 * @param {string} message - The text to display
 * @param {boolean} isError - Whether it's an error message
 */
function showFlashMessage(message, isError = false) {
  const flash = document.getElementById("upload-flash");
  flash.textContent = message;

  flash.style.backgroundColor = isError ? "#d93025" : "#32d74b";
  flash.classList.add("show");

  setTimeout(() => {
    flash.classList.remove("show");
    flash.textContent = "";
  }, 3000);
}

/**
 * Handles login form submission.
 * Validates user credentials before showing upload section.
 */
function handleLogin(event) {
  event.preventDefault();

  const username = document.getElementById("username").value.trim();
  const password = document.getElementById("password").value.trim();
  const loginError = document.getElementById("login-error");

  if (username === ADMIN_USERNAME && password === ADMIN_PASSWORD) {
    document.getElementById("login-section").style.display = "none";
    document.getElementById("upload-section").style.display = "block";
    loginError.textContent = "";
  } else {
    loginError.textContent = "Invalid login. Please try again.";
  }
}

/**
 * Handles photo upload form submission.
 * Sends image to server with authorization.
 */
function handleUpload(event) {
  event.preventDefault();

  const fileInput = document.getElementById("photo");
  const title = document.getElementById("photo-title").value.trim();
  const tags = document.getElementById("photo-tags").value.trim();
  const description = document.getElementById("photo-description").value.trim();

  if (fileInput.files.length === 0) {
    showFlashMessage("❌ Please select a file to upload.", true);
    return;
  }

  const formData = new FormData();
  formData.append("photo", fileInput.files[0]);
  formData.append("title", title);
  formData.append("tags", tags);
  formData.append("description", description);

  fetch(SERVER_UPLOAD_URL, {
    method: "POST",
    headers: {
      Authorization: UPLOAD_SECRET,
      // ⚠️ Do NOT manually set Content-Type when using FormData
    },
    body: formData,
  })
    .then((res) => res.json())
    .then((data) => {
      if (data.success) {
        showFlashMessage("✅ Photo uploaded successfully!");
        fileInput.value = "";
        document.getElementById("photo-title").value = "";
        document.getElementById("photo-tags").value = "";
        document.getElementById("photo-description").value = "";
      } else {
        showFlashMessage(
          `❌ Upload failed: ${data.error || "Unknown error"}`,
          true
        );
      }
    })
    .catch((error) => {
      console.error("Upload Error:", error);
      showFlashMessage("❌ Upload failed: Network error.", true);
    });
}

// --- Event Listeners ---
document.getElementById("login-form").addEventListener("submit", handleLogin);
document.getElementById("upload-form").addEventListener("submit", handleUpload);
