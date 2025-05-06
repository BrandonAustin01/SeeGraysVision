document.addEventListener("DOMContentLoaded", function () {
  const galleryGrid = document.querySelector(".gallery-grid");
  const tagCards = document.querySelectorAll(".tag-card");
  const clearBtn = document.getElementById("clear-filter");

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

  // ✅ Fetch live photo metadata from Netlify function (Cloudinary API)
  fetch("/.netlify/functions/gallery")
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

  // When tag button is clicked
  tagCards.forEach((card) => {
    card.addEventListener("click", () => {
      const selectedTag = card.dataset.tag;

      // Mark this tag active, others inactive
      tagCards.forEach((c) => c.classList.remove("active"));
      card.classList.add("active");

      // Remove "Clear Filter" highlight
      clearBtn.classList.remove("active");

      // Render gallery for selected tag
      renderPhotos(selectedTag);
    });
  });

  // Handle Clear Filter button
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
