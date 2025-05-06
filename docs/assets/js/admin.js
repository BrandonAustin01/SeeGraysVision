// ========================
// SeeGraysVision Admin Panel Script
// Secure Upload + Deletion Panel
// ========================

const isLocal =
  window.location.hostname === "localhost" ||
  window.location.hostname === "127.0.0.1";

const SERVER_UPLOAD_URL = isLocal
  ? "http://localhost:8888/.netlify/functions/upload"
  : "/api/upload"; // ✅ uses Netlify redirect

const SERVER_DELETE_URL = isLocal
  ? "http://localhost:8888/.netlify/functions/delete"
  : "/api/delete"; // ✅ uses Netlify redirect

/**
 * Upload flash message
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
 * Deletion toast
 */
function showDeleteToast(message, isError = false) {
  const toast = document.getElementById("delete-flash");
  toast.textContent = message;
  toast.style.backgroundColor = isError ? "#d93025" : "#32d74b";
  toast.classList.add("show");

  setTimeout(() => {
    toast.classList.remove("show");
    toast.textContent = "";
  }, 3000);
}

/**
 * Skip hard login, reveal both upload and delete sections
 */
function handleLogin(event) {
  event.preventDefault();

  const usernameField = document.getElementById("username");
  const passwordField = document.getElementById("password");
  const loginError = document.getElementById("login-error");

  if (!usernameField || !passwordField) {
    document.getElementById("login-section").style.display = "none";
    document.getElementById("upload-section").style.display = "block";
    document.getElementById("delete-section").style.display = "block";
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
      document.getElementById("delete-section").style.display = "block";
      loginError.textContent = "";
    })
    .catch(() => {
      loginError.textContent = "Invalid login. Please try again.";
    });
}

/**
 * Upload handler
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
  formData.append("file", fileInput.files[0]);
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
        document.getElementById("upload-form").reset();
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

/**
 * Delete handler
 */
function handleDelete(event) {
  event.preventDefault();

  const deleteKeyInput = document.getElementById("delete-key");
  const deleteBtn = document.getElementById("delete-btn");
  const loadBtn = document.getElementById("load-btn");

  const key = deleteKeyInput.value.trim();
  const selected = document.querySelectorAll(".delete-checkbox:checked");

  if (!selected.length) {
    showDeleteToast("⚠️ No images selected.", true);
    return;
  }

  const confirmDelete = confirm(
    `Are you sure you want to delete ${selected.length} photo(s)?`
  );
  if (!confirmDelete) return;

  deleteBtn.disabled = true;
  showDeleteToast("⏳ Deleting selected images...");

  const failed = [];

  const deleteTasks = Array.from(selected).map(async (checkbox) => {
    const public_id = checkbox.dataset.id;
    try {
      const res = await fetch(SERVER_DELETE_URL, {
        method: "POST",
        body: JSON.stringify({ public_id, uploadKey: key }),
      });
      const result = await res.json();
      if (!result.success) failed.push(public_id);
    } catch {
      failed.push(public_id);
    }
  });

  Promise.all(deleteTasks).then(() => {
    deleteBtn.disabled = false;
    if (failed.length === 0) {
      showDeleteToast("✅ Images deleted.");
    } else {
      showDeleteToast(`⚠️ Some deletions failed. (${failed.length})`, true);
    }
    loadBtn.click(); // 🔄 refresh list
  });
}

// Wire it up
document.getElementById("login-form").addEventListener("submit", handleLogin);
document.getElementById("upload-form").addEventListener("submit", handleUpload);
document.getElementById("delete-btn").addEventListener("click", handleDelete);
