document.addEventListener("DOMContentLoaded", function() {
    const galleryGrid = document.querySelector('.gallery-grid');
  
    fetch('http://127.0.0.1:5000/gallery')
      .then(response => response.json())
      .then(photos => {
        photos.forEach(photo => {
          const item = document.createElement('div');
          item.className = 'gallery-item';
          item.innerHTML = `
            <div class="flip-card">
              <div class="flip-card-inner">
                <div class="flip-card-front">
                  <img src="http://127.0.0.1:5000/uploads/${photo.filename}" alt="${photo.title}">
                  <button class="flip-btn" aria-label="Flip card">↻</button>
                </div>
                <div class="flip-card-back">
                  <div class="blurred-bg" style="background-image: url('http://127.0.0.1:5000/uploads/${photo.filename}');"></div>
                  <div class="photo-info">
                    <h3>${photo.title || "Untitled"}</h3>
                    <p>${photo.tags || "No tags"}</p>
                    <small>${photo.description || "No description"}</small>
                  </div>
                </div>
              </div>
            </div>
          `;
  
          galleryGrid.appendChild(item);
  
          // Flip behavior
          const flipBtn = item.querySelector('.flip-btn');
          const flipInner = item.querySelector('.flip-card-inner');
  
          flipBtn.addEventListener('click', function(e) {
            e.stopPropagation();
            flipInner.classList.toggle('flipped');
          });
        });
      })
      .catch(error => {
        console.error('Error loading gallery:', error);
      });
  });
  