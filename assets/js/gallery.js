document.addEventListener("DOMContentLoaded", function() {
  const galleryGrid = document.querySelector('.gallery-grid');

  fetch('http://127.0.0.1:5000/gallery')
    .then(response => response.json())
    .then(photos => {
      photos.forEach(photo => {
        const item = document.createElement('div');
        item.className = 'gallery-item clean';

        item.innerHTML = `
          <img src="http://127.0.0.1:5000/uploads/${photo.filename}" alt="${photo.title}">
          <div class="caption">
            <h3>${photo.title || "Untitled"}</h3>
            <p>${photo.tags || ""}</p>
          </div>
        `;

        galleryGrid.appendChild(item);
      });
    })
    .catch(error => {
      console.error('Error loading gallery:', error);
    });
});
