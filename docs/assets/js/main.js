const toggleBtn = document.getElementById("theme-toggle");

function setTheme(mode) {
  document.body.classList.toggle("light", mode === "light");
  localStorage.setItem("theme", mode);
  toggleBtn.textContent = mode === "light" ? "🌙" : "☀️";
}

// Load saved theme
const saved = localStorage.getItem("theme");
if (saved === "light") setTheme("light");
else setTheme("dark");

toggleBtn.addEventListener("click", () => {
  const isLight = document.body.classList.contains("light");
  setTheme(isLight ? "dark" : "light");
});
