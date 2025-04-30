// ========================
// SeeGraysVision Admin Panel Script
// Handles Login + Upload with Flash Feedback
// ========================

// --- Configuration ---
const ADMIN_USERNAME = "admin";
const ADMIN_PASSWORD = "password";
const UPLOAD_SECRET = "seegraysvision_secret";
const SERVER_UPLOAD_URL = "http://127.0.0.1:5000/upload";

// --- Helper Functions ---

/**
 * Displays a temporary flash message after actions.
 * @param {string} message - The text to display
 * @param {boolean} isError - Whether it's an error message
 */
function showFlashMessage(message, isError = false) {
  const flash = document.getElementById("upload-flash");
  flash.textContent = message;
  
  if (isError) {
    flash.style.backgroundColor = "#d93025"; // Red for error
  } else {
    flash.style.backgroundColor = "#32d74b"; // Green for success
  }

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
    const titleInput = document.getElementById("photo-title").value.trim();
    const tagsInput = document.getElementById("photo-tags").value.trim();
    const descriptionInput = document.getElementById("photo-description").value.trim();
  
    if (fileInput.files.length === 0) {
      showFlashMessage("❌ Please select a file to upload.", true);
      return;
    }
  
    const formData = new FormData();
    formData.append("photo", fileInput.files[0]);
    formData.append("title", titleInput);
    formData.append("tags", tagsInput);
    formData.append("description", descriptionInput);
  
    fetch(SERVER_UPLOAD_URL, {
      method: "POST",
      headers: {
        "Authorization": UPLOAD_SECRET
      },
      body: formData
    })
    .then(response => response.json())
    .then(data => {
      if (data.success) {
        showFlashMessage("✅ Photo uploaded successfully!");
        fileInput.value = "";
        document.getElementById("photo-title").value = "";
        document.getElementById("photo-tags").value = "";
        document.getElementById("photo-description").value = "";
      } else {
        showFlashMessage(`❌ Upload failed: ${data.error || "Unknown error"}`, true);
      }
    })
    .catch(error => {
      console.error("Upload Error:", error);
      showFlashMessage("❌ Upload failed: Network error.", true);
    });
  }
  

// --- Event Listeners ---
document.getElementById("login-form").addEventListener("submit", handleLogin);
document.getElementById("upload-form").addEventListener("submit", handleUpload);
