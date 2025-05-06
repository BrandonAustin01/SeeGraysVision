document.addEventListener("DOMContentLoaded", function () {
  const galleryGrid = document.querySelector(".gallery-grid");
  const tagCards = document.querySelectorAll(".tag-card");
  const clearBtn = document.getElementById("clear-filter");

  const isLocal =
    window.location.hostname === "localhost" ||
    window.location.hostname === "127.0.0.1";

  const GALLERY_URL = isLocal
    ? "http://localhost:8888/.netlify/functions/gallery"
    : "/api/gallery";

  let allPhotos = [];

  // Render filtered photos or empty message
  function renderPhotos(filterTag = null) {
    galleryGrid.innerHTML = ""; // Clear current gallery view

    const photosToShow = filterTag
      ? allPhotos.filter(
          (photo) =>
            photo.tags &&
            photo.tags
              .toString()
              .toLowerCase()
              .includes(filterTag.toLowerCase())
        )
      : [];

    // Show placeholder if nothing is selected
    if (!filterTag || photosToShow.length === 0) {
      galleryGrid.innerHTML = `
        <p style="text-align:center; color: var(--text-muted);">
          📂 Select a category above to view matching photos.
        </p>
      `;
      return;
    }

    // Show photos matching selected tag
    photosToShow.reverse().forEach((photo) => {
      const item = document.createElement("div");
      item.className = "gallery-item clean";

      item.innerHTML = `
        <div class="img-wrapper">
          <img src="${photo.url}" alt="${photo.title || "Photo"}">
          <a href="${
            photo.url
          }" class="download-icon" download title="Download Photo">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none"
                 xmlns="http://www.w3.org/2000/svg" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                    d="M4 16v2a2 2 0 002 2h12a2 2 0 002-2v-2m-4-4l-4 4m0 0l-4-4m4 4V4"/>
            </svg>
          </a>
        </div>
        <div class="caption">
          ${photo.title ? `<h3>${photo.title}</h3>` : ""}
          <p>${photo.tags ? photo.tags.join(", ") : ""}</p>
        </div>
      `;

      galleryGrid.appendChild(item);
    });
  }

  // Fetch photo metadata
  fetch(GALLERY_URL)
    .then((response) => response.json())
    .then((photos) => {
      allPhotos = photos;

      galleryGrid.innerHTML = `
        <p style="text-align:center; color: var(--text-muted);">
          📂 Select a category above to view matching photos.
        </p>
      `;
    })
    .catch((error) => {
      console.error("Error loading gallery:", error);
      galleryGrid.innerHTML = `
        <p style="text-align:center; color: red;">
          ⚠️ Failed to load gallery.
        </p>
      `;
    });

  // Tag click filter
  tagCards.forEach((card) => {
    card.addEventListener("click", () => {
      const selectedTag = card.dataset.tag;

      tagCards.forEach((c) => c.classList.remove("active"));
      card.classList.add("active");
      clearBtn.classList.remove("active");

      renderPhotos(selectedTag);
    });
  });

  // Clear filter
  clearBtn.addEventListener("click", () => {
    tagCards.forEach((c) => c.classList.remove("active"));

    galleryGrid.innerHTML = `
      <p style="text-align:center; color: var(--text-muted);">
        📂 Select a category above to view matching photos.
      </p>
    `;

    clearBtn.classList.add("active");
  });
});
