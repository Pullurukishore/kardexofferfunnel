const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');

const prisma = new PrismaClient();

// Cache for performance
const customerCache = new Map();
const userCache = new Map();
const zoneCache = new Map();

async function initializeCaches() {
  console.log('Initializing caches...');
  
  // Cache customers
  const customers = await prisma.customer.findMany({
    where: { isActive: true },
    select: { id: true, companyName: true }
  });
  
  customers.forEach(customer => {
    const normalizedName = customer.companyName.toLowerCase().trim();
    customerCache.set(normalizedName, customer.id);
  });
  
  console.log(`Cached ${customers.length} customers`);
  
  // Cache zones
  const zones = await prisma.serviceZone.findMany({
    where: { isActive: true },
    select: { id: true, name: true }
  });
  
  zones.forEach(zone => {
    const normalizedName = zone.name.toLowerCase().trim();
    zoneCache.set(normalizedName, zone.id);
  });
  
  console.log(`Cached ${zones.length} zones`);
  
  // Cache users
  const users = await prisma.user.findMany({
    where: { isActive: true },
    select: { id: true, name: true }
  });
  
  users.forEach(user => {
    const normalizedName = user.name ? user.name.toLowerCase().trim() : '';
    if (normalizedName) {
      userCache.set(normalizedName, user.id);
    }
  });
  
  console.log(`Cached ${users.length} users`);
}

function findCustomerId(companyName) {
  if (!companyName) return null;
  
  const normalizedName = companyName.toLowerCase().trim();
  
  // Exact match
  if (customerCache.has(normalizedName)) {
    return customerCache.get(normalizedName);
  }
  
  // Fuzzy matching - try partial matches
  for (const [cachedName, id] of customerCache.entries()) {
    if (cachedName.includes(normalizedName) || normalizedName.includes(cachedName)) {
      console.log(`Fuzzy matched customer: "${companyName}" -> "${cachedName}"`);
      return id;
    }
  }
  
  console.warn(`Customer not found: "${companyName}"`);
  return null;
}

function findUserId(userName) {
  if (!userName) return null;
  
  const normalizedName = userName.toLowerCase().trim();
  
  // Exact match
  if (userCache.has(normalizedName)) {
    return userCache.get(normalizedName);
  }
  
  // Try first name matching
  const firstName = normalizedName.split(' ')[0];
  for (const [cachedName, id] of userCache.entries()) {
    if (cachedName.includes(firstName) || firstName.includes(cachedName)) {
      console.log(`First name matched user: "${userName}" -> "${cachedName}"`);
      return id;
    }
  }
  
  console.warn(`User not found: "${userName}"`);
  return null;
}

function findZoneId(zoneName) {
  if (!zoneName) return null;
  
  const normalizedName = zoneName.toLowerCase().trim();
  
  if (zoneCache.has(normalizedName)) {
    return zoneCache.get(normalizedName);
  }
  
  console.warn(`Zone not found: "${zoneName}"`);
  return null;
}

module.exports = {
  initializeCaches,
  findCustomerId,
  findUserId,
  findZoneId
};
