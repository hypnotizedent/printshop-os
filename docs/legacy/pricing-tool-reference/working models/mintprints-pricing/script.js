
const breakpoints = [1, 5, 10, 15, 20, 25, 50, 75, 100, 250, 750, 1000, 2500, 5000, 7500, 10000];

const sizeInfoMap = {
  A6: "3.9″ × 3.9″",
  A5: "5.9″ × 8.3″ or 4.1″ × 11.8″",
  A4: "8.3″ × 11.8″ or 5.9″ × 15.7″",
  A3: "11.8″ × 17.7″",
  A2: "17.7″ × 27.2″"
};

let pricingData = {};
let currentStyle = 'standard';

async function loadPricing() {
  const res = await fetch('screenprint_pricing_nested.json');
  pricingData = await res.json();
  updateColorOptions();
  updatePrice();
  updateSizeInfo();
}

function findPrice(size, colors, qty) {
  const colorData = pricingData?.[currentStyle]?.[size]?.[colors];
  if (!Array.isArray(colorData) || colorData.length === 0) return 0;

  const levels = colorData[0]; // First variant
  if (!Array.isArray(levels)) return 0;

  for (let i = 0; i < breakpoints.length; i++) {
    if (qty <= breakpoints[i]) return levels[i];
  }
  return levels[levels.length - 1];
}

function updatePrice() {
  const size = document.getElementById('size').value;
  const colors = document.getElementById('colors').value;
  const qty = parseInt(document.getElementById('quantity').value, 10) || 0;

  const pricePerUnit = findPrice(size, colors, qty);
  const totalPrice = pricePerUnit * qty;

  document.getElementById('price').textContent = `$${totalPrice.toFixed(2)}`;
  document.getElementById('price-detail').textContent = `($${pricePerUnit.toFixed(2)} per unit × ${qty})`;
}

function updateSizeInfo() {
  const size = document.getElementById('size').value;
  document.getElementById('size-info').textContent = sizeInfoMap[size];
}

function updateColorOptions() {
  const size = document.getElementById('size').value;
  const colorsDropdown = document.getElementById('colors');
  const colorsAvailable = pricingData?.[currentStyle]?.[size];

  colorsDropdown.innerHTML = '';

  if (!colorsAvailable) return;

  Object.keys(colorsAvailable).forEach(colorCount => {
    const option = document.createElement('option');
    option.value = colorCount;
    option.textContent = `${colorCount} color${colorCount > 1 ? 's' : ''}`;
    colorsDropdown.appendChild(option);
  });

  updatePrice();
}

document.getElementById('printStyleDropdown').addEventListener('change', (e) => {
  currentStyle = e.target.value;
  updateColorOptions();
});

document.getElementById('size').addEventListener('change', () => {
  updateColorOptions();
  updateSizeInfo();
});

document.getElementById('colors').addEventListener('change', updatePrice);
document.getElementById('quantity').addEventListener('input', updatePrice);

loadPricing();
