const fs = require('fs');
const allOffers = require('../data/processed/all-offers.json');

// Extract unique product types
const productTypes = new Set();
allOffers.forEach(offer => {
  if (offer.productType) {
    productTypes.add(offer.productType.trim());
  }
});

console.log('=== PRODUCT TYPES FOUND IN EXCEL ===');
console.log('Total unique product types:', productTypes.size);
console.log('\nProduct Types:');
Array.from(productTypes).sort().forEach((type, index) => {
  console.log((index + 1) + '. "' + type + '"');
});

// Find potential spelling variations
const normalizedTypes = {};
productTypes.forEach(type => {
  const normalized = type.toLowerCase().replace(/[^a-z]/g, '');
  if (!normalizedTypes[normalized]) {
    normalizedTypes[normalized] = [];
  }
  normalizedTypes[normalized].push(type);
});

console.log('\n=== POTENTIAL SPELLING VARIATIONS ===');
Object.keys(normalizedTypes).forEach(normalized => {
  if (normalizedTypes[normalized].length > 1) {
    console.log('Similar types:', normalizedTypes[normalized].join(' | '));
  }
});
