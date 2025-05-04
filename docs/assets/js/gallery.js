document.addEventListener("DOMContentLoaded", function () {
  const galleryGrid = document.querySelector(".gallery-grid");

  fetch("data/photos.json")
    .then((response) => response.json())
    .then((photos) => {
      photos.forEach((photo) => {
        const item = document.createElement("div");
        item.className = "gallery-item clean";

        item.innerHTML = `
          <img src="assets/img/uploads/${photo.filename}" alt="${photo.title}">
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
