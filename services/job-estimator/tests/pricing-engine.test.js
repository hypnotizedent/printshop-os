const assert = require('assert');
const fs = require('fs');
const path = require('path');

function toNumber(v) {
  if (v === null || v === undefined) return undefined;
  if (typeof v === 'number') return v;
  const s = String(v).replace(/[^0-9.\-\.]/g, '').trim();
  if (s === '') return undefined;
  const n = Number(s);
  return isNaN(n) ? undefined : n;
}

function parseQuantitySpec(q) {
  if (q === null || q === undefined) return { minQty: 1 };
  const s = String(q).trim();
  if (s.includes('-')) {
    const parts = s.split('-').map(p => p.trim());
    const minQ = parseInt(parts[0], 10);
    const maxQ = parseInt(parts[1], 10);
    return { minQty: isNaN(minQ) ? 1 : minQ, maxQty: isNaN(maxQ) ? undefined : maxQ };
  }
  if (s.endsWith('+')) {
    const n = parseInt(s.slice(0, -1), 10);
    return { minQty: isNaN(n) ? 1 : n };
  }
  const n = parseInt(s, 10);
  if (!isNaN(n)) return { minQty: n, maxQty: n };
  return { minQty: 1 };
}

function loadRulesFromRows(rows) {
  return rows.map(row => {
    const qty = parseQuantitySpec(row.quantity || row.Quantity || row['Quantity Range']);
    const unit = toNumber(row.unit_price || row['Unit Price'] || row.unit_price_usd || row['Unit']) || 0;
    const setup = toNumber(row.setup_price || row['Setup Price'] || row.setup) || 0;
    const colors = toNumber(row.colors || row.Colors) || null;
    return { minQty: qty.minQty, maxQty: qty.maxQty, unitPrice: unit, setupPrice: setup, colors };
  }).sort((a,b)=>a.minQty-b.minQty);
}

function quote(rules, quantity) {
  let candidate = null;
  for (const r of rules) {
    if (r.minQty <= quantity && (r.maxQty === undefined || quantity <= r.maxQty)) {
      candidate = r; break;
    }
  }
  if (!candidate) candidate = rules[rules.length-1];
  const total = candidate.unitPrice * quantity + (candidate.setupPrice||0);
  return { total: Number(total.toFixed(2)), rule: candidate };
}

// Load fixture
const fixturePath = path.resolve(__dirname, 'fixtures', 'pricing-screen-sample.json');
const rows = JSON.parse(fs.readFileSync(fixturePath, 'utf8'));
const rules = loadRulesFromRows(rows);

console.log('Loaded rules:', rules);

// Test 1: quantity 30 should match 25-99 rule (unitPrice 6.5)
const q30 = quote(rules, 30);
console.log('Quote 30:', q30);
assert.strictEqual(q30.rule.unitPrice, 6.5);
assert.strictEqual(q30.total, Number((6.5*30 + 25).toFixed(2)));

// Test 2: quantity 10 should match 1-24 rule (unitPrice 8.0)
const q10 = quote(rules, 10);
console.log('Quote 10:', q10);
assert.strictEqual(q10.rule.unitPrice, 8.0);
assert.strictEqual(q10.total, Number((8.0*10 + 25).toFixed(2)));

// Test 3: large quantity 4245 should match 100+ rule (unitPrice 5.0)
const q4245 = quote(rules, 4245);
console.log('Quote 4245:', q4245);
assert.strictEqual(q4245.rule.unitPrice, 5.0);
assert.strictEqual(q4245.total, Number((5.0*4245 + 25).toFixed(2)));

console.log('All tests passed.');
