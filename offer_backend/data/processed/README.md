# Excel Data Processing - Development Ready

This directory contains structured data extracted from the Excel file `Repaired_2025_Zonewise_Open_Closed_Offer funnel_ on 04032025.xlsx`.

## 📊 Data Overview

### Business Metrics
- **Total Offers**: 495 active offers
- **Total Customers**: 245 companies
- **Total Locations**: 126 locations  
- **Machine Serial Numbers**: 1,458 assets
- **Active Users**: 11 users across 4 zones

### Zone Distribution
- **WEST**: 193 offers (₹73.99L) - Users: Yogesh, Ashraf, Rahul, Minesh
- **SOUTH**: 196 offers (₹69.83L) - Users: Gajendra, Pradeep, Sasi
- **NORTH**: 94 offers (₹41.99L) - Users: Vinay, Nitin
- **EAST**: 12 offers (₹5.48L) - Users: Pankaj

## 📁 File Structure

### Core Data Files
- `comprehensive-data.json` - Complete dataset with all relationships
- `import-ready-data.json` - Structured for direct database import
- `all-offers.json` - All 495 offers with full details

### Reference Data
- `customers.json` - 245 customer companies
- `locations.json` - 126 business locations
- `serial-numbers.json` - 1,458 machine serial numbers
- `product-types.json` - Product type mappings

### Analytics
- `summary-data.json` - Zone-wise summary statistics
- `statistics.json` - Detailed breakdown by zone and user

### Individual User Data
- `offers-yogesh.json` through `offers-pankaj.json` - Individual user sheets

## 🚀 Development Usage

### 1. Database Import
```javascript
const importData = require('./import-ready-data.json');

// Import Zones
importData.zones.forEach(zone => {
  // Create zone in database
});

// Import Users  
importData.users.forEach(user => {
  // Create user with zone assignment
});

// Import Customers
importData.customers.forEach(customer => {
  // Create customer record
});

// Import Offers
importData.offers.forEach(offer => {
  // Create offer with relationships
});
```

### 2. Dashboard Data
```javascript
const comprehensiveData = require('./comprehensive-data.json');

// Zone Performance Dashboard
console.log('Zone Stats:', comprehensiveData.statistics.zoneStats);

// User Performance Rankings  
console.log('User Rankings:', comprehensiveData.statistics.userStats);

// Real-time Offer Count
console.log('Total Offers:', comprehensiveData.allOffers.length);
```

### 3. Frontend Integration
```javascript
// Load data for components
const allOffers = require('./all-offers.json');
const customers = require('./customers.json');
const zones = require('./comprehensive-data.json').zones;

// Use in React components
const zoneOffers = allOffers.filter(offer => offer.zone === selectedZone);
const customerList = customers.map(customer => customer.companyName);
```

## 📈 Key Insights for Development

### High-Value Zones
1. **SOUTH**: Highest offer count (196) with strong user performance
2. **WEST**: Highest total value (₹73.99L) with balanced team
3. **NORTH**: Good performance with fewer users (2 users, 94 offers)
4. **EAST**: Developing zone with growth potential

### Top Performers
1. **Pradeep** (SOUTH): 79 offers, ₹36.06L
2. **Nitin** (NORTH): 73 offers, ₹32.40L  
3. **Ashraf** (WEST): 48 offers, ₹21.45L

### Product Types Available
- Contract
- Relocation
- Retrofit kit
- BD Spare
- And more...

## 🔧 Import Scripts Ready

The data is structured and ready for:
1. **Zone Creation** - 4 zones with user assignments
2. **User Setup** - 11 users with proper roles and zones
3. **Customer Migration** - 245 companies with location data
4. **Offer Import** - 495 offers with full relationship mapping
5. **Asset Tracking** - 1,458 machine serial numbers

## 🎯 Next Steps

1. **Run Import Scripts** - Use `import-ready-data.json` for database migration
2. **Update Dashboard** - Replace mock data with real statistics
3. **Test User Access** - Verify zone-based permissions work correctly
4. **Director Dashboard** - Build executive view with real metrics
5. **Live Deployment** - All data is production-ready

## 📊 Sample Data Structure

### Offer Example
```json
{
  "id": 1,
  "offerReferenceNumber": "KXIND/W/SPP/YD24-01",
  "companyName": "Tata Motors LTD",
  "location": "Pune", 
  "department": "D blockstore",
  "contactPersonName": "pankaj Badhe",
  "contactNumber": "8237003521",
  "email": "badhe.pankaj@tatamotors.com",
  "machineSerialNumber": "16002093/002",
  "productType": "Relocation",
  "offerValue": 45394,
  "probability": 0.5,
  "assignedUser": "Yogesh",
  "zone": "WEST"
}
```

### Zone Example
```json
{
  "id": 1,
  "name": "WEST", 
  "shortForm": "W",
  "users": ["Yogesh", "Ashraf", "Rahul", "Minesh"]
}
```

This data is **production-ready** and can make your project immediately valuable for directors and stakeholders!
