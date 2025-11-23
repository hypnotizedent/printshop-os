
let pricingData = {};
let currentInk = "";
let currentSize = "";
let currentColors = "";
let currentSetup = "NEW";

async function loadPricing() {
  const res = await fetch('screenprint_pricing_from_working.json');
  pricingData = await res.json();

  populateInkTypes();
  updateDropdowns();
}

function populateInkTypes() {
  const inkTypeDropdown = document.getElementById('inkType');
  inkTypeDropdown.innerHTML = '';

  const inkTypes = Object.keys(pricingData);
  inkTypes.forEach(type => {
    const opt = document.createElement('option');
    opt.value = type;
    opt.textContent = type.charAt(0) + type.slice(1).toLowerCase();
    inkTypeDropdown.appendChild(opt);
  });

  currentInk = inkTypes[0];
  inkTypeDropdown.value = currentInk;
}

function updateDropdowns() {
  const sizeDropdown = document.getElementById('size');
  const colorDropdown = document.getElementById('colors');

  const inkData = pricingData[currentInk] || {};

  sizeDropdown.innerHTML = '';
  Object.keys(inkData).forEach(size => {
    const opt = document.createElement('option');
    opt.value = size;
    opt.textContent = size;
    sizeDropdown.appendChild(opt);
  });
  currentSize = Object.keys(inkData)[0];
  sizeDropdown.value = currentSize;

  colorDropdown.innerHTML = '';
  const colorOptions = Object.keys(inkData[currentSize] || {});
  colorOptions.forEach(color => {
    const opt = document.createElement('option');
    opt.value = color;
    opt.textContent = color + " color" + (parseInt(color) > 1 ? 's' : '');
    colorDropdown.appendChild(opt);
  });
  currentColors = colorOptions[0];
  colorDropdown.value = currentColors;

  updatePrice();
}

function updatePrice() {
  const qty = parseInt(document.getElementById('quantity').value, 10) || 0;
  currentSetup = document.getElementById('setup').value;

  const prices = pricingData?.[currentInk]?.[currentSize]?.[currentColors]?.[currentSetup];
  if (!prices || prices.length === 0) {
    document.getElementById('price').textContent = 'Total Price: $0.00';
    document.getElementById('price-detail').textContent = '';
    return;
  }

  let pricePerUnit = prices[prices.length - 1];
  for (let i = 0; i < prices.length; i++) {
    if (qty <= (i + 1) * 5) {
      pricePerUnit = prices[i];
      break;
    }
  }

  const total = pricePerUnit * qty;
  document.getElementById('price').textContent = `Total Price: $${total.toFixed(2)}`;
  document.getElementById('price-detail').textContent = `($${pricePerUnit.toFixed(2)} per unit × ${qty})`;
}

document.getElementById('inkType').addEventListener('change', e => {
  currentInk = e.target.value;
  updateDropdowns();
});

document.getElementById('size').addEventListener('change', e => {
  currentSize = e.target.value;
  updateDropdowns();
});

document.getElementById('colors').addEventListener('change', e => {
  currentColors = e.target.value;
  updatePrice();
});

document.getElementById('setup').addEventListener('change', updatePrice);
document.getElementById('quantity').addEventListener('input', updatePrice);

loadPricing();
