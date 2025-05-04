document.addEventListener("DOMContentLoaded", function () {
  const galleryGrid = document.querySelector(".gallery-grid");

  fetch("data/photos.json")
    .then((response) => response.json())
    .then((photos) => {
      photos.forEach((photo) => {
        const item = document.createElement("div");
        item.className = "gallery-item clean";

        item.innerHTML = `
          <div class="img-wrapper">
            <img src="assets/img/uploads/${photo.filename}" alt="${
          photo.title
        }">
            <a href="assets/img/uploads/${
              photo.filename
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
            <p>${photo.tags || ""}</p>
          </div>
        `;

        galleryGrid.appendChild(item);
      });
    })
    .catch((error) => {
      console.error("Error loading gallery:", error);
    });
});
