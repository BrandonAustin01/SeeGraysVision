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

  function renderPhotos(filterTag = null) {
    galleryGrid.innerHTML = "";

    const normalizedTag = filterTag ? filterTag.toLowerCase() : null;

    const photosToShow = normalizedTag
      ? allPhotos.filter((photo) => {
          if (!photo.tags) return false;

          const tagsArray = Array.isArray(photo.tags)
            ? photo.tags
            : photo.tags.split(",").map((t) => t.trim());

          return tagsArray.some((tag) => tag.toLowerCase() === normalizedTag);
        })
      : [];

    console.log("🔍 Selected Tag:", normalizedTag);
    console.log("🖼️ Matching Photos:", photosToShow);

    if (!normalizedTag || photosToShow.length === 0) {
      galleryGrid.innerHTML = `
        <p style="text-align:center; color: var(--text-muted);">
          📂 Select a category above to view matching photos.
        </p>
      `;
      return;
    }

    photosToShow.reverse().forEach((photo) => {
      const item = document.createElement("div");
      item.className = "gallery-item clean";

      const tagsDisplay = Array.isArray(photo.tags)
        ? photo.tags.join(", ")
        : photo.tags;

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
          <p>${tagsDisplay}</p>
        </div>
      `;

      galleryGrid.appendChild(item);
    });
  }

  fetch(GALLERY_URL)
    .then((response) => response.json())
    .then((photos) => {
      allPhotos = photos;

      console.log("📦 All Photos Loaded:", photos);

      galleryGrid.innerHTML = `
        <p style="text-align:center; color: var(--text-muted);">
          📂 Select a category above to view matching photos.
        </p>
      `;
    })
    .catch((error) => {
      console.error("❌ Failed to load gallery:", error);
      galleryGrid.innerHTML = `
        <p style="text-align:center; color: red;">
          ⚠️ Failed to load gallery.
        </p>
      `;
    });

  tagCards.forEach((card) => {
    card.addEventListener("click", () => {
      const selectedTag = card.dataset.tag;
      tagCards.forEach((c) => c.classList.remove("active"));
      card.classList.add("active");
      clearBtn.classList.remove("active");

      renderPhotos(selectedTag);
    });
  });

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
