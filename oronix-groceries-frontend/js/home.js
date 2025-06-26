let currentIndex = 0;
let visibleItems = 4;
let totalItems = 0;

document.addEventListener("DOMContentLoaded", async () => {
  const track = document.getElementById("categoryTrack");

  try {
    const res = await fetch("data/oronix_categories.json");
    const categories = await res.json();

    totalItems = categories.length;

    categories.forEach(cat => {
      const cleanName = cat.category_name.trim();
      const imageName = cleanName.toLowerCase().replace(/\s/g, '');
      const urlParam = encodeURIComponent(cleanName);

      const div = document.createElement("div");
      div.className = "w-1/4 flex-shrink-0 px-2";
      div.innerHTML = `
        <a href="products.html?category=${urlParam}">
          <img src="images/categories/${imageName}.png" alt="${cleanName}" class="rounded-xl object-cover w-full shadow-md hover:scale-105"/>
        </a>
      `;
      track.appendChild(div);
    });

    setInterval(() => scrollCategories(1), 3000);

  } catch (err) {
    console.error("Failed to load categories:", err);
  }
});

function scrollCategories(direction) {
  const track = document.getElementById("categoryTrack");
  const maxIndex = Math.ceil(totalItems / visibleItems) - 1;
  
  currentIndex += direction;
  if (currentIndex < 0) currentIndex = maxIndex;
  if (currentIndex > maxIndex) currentIndex = 0;

  const itemWidth = track.children[0]?.offsetWidth || 0;
  const scrollAmount = currentIndex * itemWidth * visibleItems;

  track.style.transform = `translateX(-${scrollAmount}px)`;
}
