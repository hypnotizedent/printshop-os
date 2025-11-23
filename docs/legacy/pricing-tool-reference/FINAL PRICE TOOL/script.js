window.addEventListener('DOMContentLoaded', () => {
  let pricingData;
  let currentInk, currentSize, currentColor;
  const breakpoints = [1,5,10,15,20,25,50,75,100,250,750,1000,2500,5000,7500,10000];

  async function init() {
    pricingData = await fetch('screenprint_pricing_clean.json').then(r => r.json());
    setupListeners();
    populateInk();
    populateSize();
    populateColor();
    updatePrice();
  }

  function setupListeners() {
    document.getElementById('inkType').addEventListener('change', () => {
      currentInk = document.getElementById('inkType').value;
      populateSize();
      populateColor();
      updatePrice();
    });
    document.getElementById('size').addEventListener('change', () => {
      currentSize = document.getElementById('size').value;
      populateColor();
      updatePrice();
    });
    document.getElementById('colors').addEventListener('change', () => {
      currentColor = document.getElementById('colors').value;
      updatePrice();
    });
    document.getElementById('quantity').addEventListener('input', updatePrice);
  }

  function populateInk() {
    const inkDD = document.getElementById('inkType');
    inkDD.innerHTML = '';
    Object.keys(pricingData).forEach(ink => {
      const opt = document.createElement('option');
      opt.value = ink;
      opt.textContent = ink;
      inkDD.appendChild(opt);
    });
    currentInk = inkDD.value;
  }

  function populateSize() {
    const sizeDD = document.getElementById('size');
    sizeDD.innerHTML = '';
    Object.keys(pricingData[currentInk] || {}).forEach(sz => {
      const opt = document.createElement('option');
      opt.value = sz;
      opt.textContent = sz;
      sizeDD.appendChild(opt);
    });
    currentSize = sizeDD.value;
  }

  function populateColor() {
    const colorDD = document.getElementById('colors');
    colorDD.innerHTML = '';
    let colors = Object.keys((pricingData[currentInk] && pricingData[currentInk][currentSize]) || {});
    if (currentInk === 'SPECIALTY') {
      colors = ['1'];
    } else if (currentInk === 'BLOCKER') {
      colors = colors.filter(c => parseInt(c) <= 9);
    }
    colors.forEach(c => {
      const opt = document.createElement('option');
      opt.value = c;
      opt.textContent = c + (parseInt(c) > 1 ? ' colors' : ' color');
      colorDD.appendChild(opt);
    });
    currentColor = colorDD.value;
  }

  function updatePrice() {
    const qty = parseInt(document.getElementById('quantity').value) || 1;
    const idx = breakpoints.findIndex(b => qty <= b);
    const cell = ((pricingData[currentInk] || {})[currentSize] || {})[currentColor] || {};
    let raw = cell.price_breaks && cell.price_breaks[idx] !== undefined
      ? cell.price_breaks[idx]
      : 0;
    let per = typeof raw === 'string'
      ? parseFloat(raw.replace(/[^0-9.]/g, '')) || 0
      : raw;
    const total = per * qty;
    document.getElementById('price').textContent = `$${total.toFixed(2)}`;
    const detailEl = document.getElementById('price-detail');
    detailEl.style.display = 'block';
    detailEl.textContent = `${qty} × $${per.toFixed(2)}`;
  }

  init();
});