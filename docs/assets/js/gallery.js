document.addEventListener("DOMContentLoaded", function () {
  const galleryGrid = document.querySelector(".gallery-grid");
  const tagCards = document.querySelectorAll(".tag-card");

  let allPhotos = [];

  // Function to render photos based on selected tag
  function renderPhotos(filterTag = null) {
    galleryGrid.innerHTML = ""; // Clear current gallery

    const photosToShow = filterTag
      ? allPhotos.filter(
          (photo) => photo.tags && photo.tags.includes(filterTag)
        )
      : allPhotos;

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
          <h3>${photo.title || "Untitled"}</h3>
          <p>${photo.tags ? photo.tags.join(", ") : ""}</p>
        </div>
      `;

      galleryGrid.appendChild(item);
    });
  }

  // Fetch and store all photos
  fetch("data/photos.json")
    .then((response) => response.json())
    .then((photos) => {
      allPhotos = photos;
      renderPhotos(); // Initial render with all photos
    })
    .catch((error) => {
      console.error("Error loading gallery:", error);
      galleryGrid.innerHTML =
        "<p style='text-align:center;'>⚠️ Failed to load gallery.</p>";
    });

  // Handle tag card clicks
  tagCards.forEach((card) => {
    card.addEventListener("click", () => {
      const selectedTag = card.dataset.tag;

      tagCards.forEach((c) => c.classList.remove("active"));
      card.classList.add("active");

      renderPhotos(selectedTag);
    });
  });
});
