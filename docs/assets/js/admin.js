// ========================
// SeeGraysVision Admin Panel Script
// Secure Upload Panel Only
// ========================

const isLocal =
  window.location.hostname === "localhost" ||
  window.location.hostname === "127.0.0.1";

const SERVER_UPLOAD_URL = isLocal
  ? "http://127.0.0.1:8888/.netlify/functions/upload"
  : "/.netlify/functions/upload";

/**
 * Displays a temporary flash message after actions.
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
 * Skips hard login, reveal upload on button press.
 * Fallbacks to default Netlify secretless panel if username/password are not present.
 */
function handleLogin(event) {
  event.preventDefault();

  const usernameField = document.getElementById("username");
  const passwordField = document.getElementById("password");
  const loginError = document.getElementById("login-error");

  // If fields don't exist (minimal panel), skip login check
  if (!usernameField || !passwordField) {
    document.getElementById("login-section").style.display = "none";
    document.getElementById("upload-section").style.display = "block";
    return;
  }

  const username = usernameField.value.trim();
  const password = passwordField.value.trim();

  fetch("/.netlify/functions/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username, password }),
  })
    .then((res) => {
      if (!res.ok) throw new Error("Unauthorized");
      return res.json();
    })
    .then(() => {
      document.getElementById("login-section").style.display = "none";
      document.getElementById("upload-section").style.display = "block";
      loginError.textContent = "";
    })
    .catch(() => {
      loginError.textContent = "Invalid login. Please try again.";
    });
}

/**
 * Upload handler with secure key passed in form
 */
function handleUpload(event) {
  event.preventDefault();

  const fileInput = document.getElementById("photo");
  const title = document.getElementById("photo-title").value.trim();
  const tagCheckboxes = document.querySelectorAll(
    '#photo-tags input[type="checkbox"]'
  );
  const selectedTags = Array.from(tagCheckboxes)
    .filter((cb) => cb.checked)
    .map((cb) => cb.value);

  if (selectedTags.length === 0) {
    showFlashMessage("❌ Please select at least one tag.", true);
    return;
  }
  const tags = selectedTags.join(", ");
  const description = document.getElementById("photo-description").value.trim();
  const uploadKey = document.getElementById("upload-key").value.trim();

  if (fileInput.files.length === 0) {
    showFlashMessage("❌ Please select a file to upload.", true);
    return;
  }

  const formData = new FormData();
  formData.append("file", fileInput.files[0]); // ✅ match Cloudinary backend
  formData.append("title", title);
  formData.append("tags", tags);
  formData.append("description", description);
  formData.append("uploadKey", uploadKey);

  fetch(SERVER_UPLOAD_URL, {
    method: "POST",
    body: formData,
  })
    .then((res) => res.json())
    .then((data) => {
      if (data.success) {
        showFlashMessage("✅ Photo uploaded successfully!");
        document.getElementById("upload-form").reset(); // ✅ cleaner reset
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

document.getElementById("login-form").addEventListener("submit", handleLogin);
document.getElementById("upload-form").addEventListener("submit", handleUpload);
