const fs = require('fs');
const path = require('path');
const XLSX = require('xlsx');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function analyzeLostOffers() {
  try {
    console.log('=== ANALYZING LOST OFFERS ===');
    
    // Check processed JSON for any lost indicators
    const processedOffersPath = path.join(__dirname, '..', 'data', 'processed', 'all-offers.json');
    
    if (fs.existsSync(processedOffersPath)) {
      const processedOffers = JSON.parse(fs.readFileSync(processedOffersPath, 'utf8'));
      console.log(`Loaded ${processedOffers.length} processed offers`);
      
      // Check for any fields that might indicate lost status
      const sampleOffer = processedOffers[0];
      console.log('\nAvailable fields in processed data:');
      Object.keys(sampleOffer).forEach(key => {
        console.log(`  ${key}: ${sampleOffer[key]}`);
      });
      
      // Look for any negative values or indicators
      const negativeIndicators = processedOffers.filter(offer => {
        return offer.poReceived < 0 || 
               offer.offerValue < 0 ||
               (offer.probability && offer.probability.toLowerCase().includes('lost')) ||
               (offer.status && offer.status.toLowerCase().includes('lost'));
      });
      
      console.log(`\nOffers with negative indicators: ${negativeIndicators.length}`);
      if (negativeIndicators.length > 0) {
        console.log('Sample negative offers:');
        negativeIndicators.slice(0, 5).forEach(offer => {
          console.log(`  ${offer.offerReferenceNumber} - PO: ${offer.poReceived} - Value: ${offer.offerValue}`);
        });
      }
    }
    
    // Check Excel file for lost data
    console.log('\n=== CHECKING EXCEL FOR LOST DATA ===');
    const excelPath = path.join(__dirname, '..', 'data', 'Repaired_2025_Zonewise_Open_Closed_Offer funnel_ on 04032025.xlsx');
    
    if (fs.existsSync(excelPath)) {
      const workbook = XLSX.readFile(excelPath);
      
      // Check Summary sheet for lost information
      if (workbook.Sheets['Summary']) {
        const summaryWorksheet = workbook.Sheets['Summary'];
        const summaryData = XLSX.utils.sheet_to_json(summaryWorksheet);
        
        console.log('\nSummary sheet data (looking for lost info):');
        summaryData.slice(0, 5).forEach((row, index) => {
          console.log(`\nRow ${index + 1}:`);
          Object.entries(row).forEach(([key, value]) => {
            if (key.toLowerCase().includes('lost') || 
                key.toLowerCase().includes('close') ||
                key.toLowerCase().includes('cancel')) {
              console.log(`  ${key}: ${value}`);
            }
          });
        });
      }
      
      // Check individual sheets for lost indicators
      const userSheets = ['Yogesh', 'Ashraf', 'Rahul'];
      userSheets.forEach(sheetName => {
        if (!workbook.Sheets[sheetName]) return;
        
        const worksheet = workbook.Sheets[sheetName];
        const jsonData = XLSX.utils.sheet_to_json(worksheet);
        
        // Look for lost-related columns
        const lostColumns = Object.keys(jsonData[0] || {}).filter(key => 
          key.toLowerCase().includes('lost') ||
          key.toLowerCase().includes('close') ||
          key.toLowerCase().includes('cancel') ||
          key.toLowerCase().includes('reject')
        );
        
        if (lostColumns.length > 0) {
          console.log(`\n${sheetName} - Found lost-related columns: ${lostColumns.join(', ')}`);
          
          // Show sample data from these columns
          jsonData.slice(0, 3).forEach((row, index) => {
            console.log(`Row ${index + 1}:`);
            lostColumns.forEach(col => {
              if (row[col] !== undefined && row[col] !== null && row[col] !== '') {
                console.log(`  ${col}: ${row[col]}`);
              }
            });
          });
        }
      });
    }
    
    // Check current database for any offers that might be lost
    console.log('\n=== CURRENT DATABASE ANALYSIS ===');
    const currentOffers = await prisma.offer.findMany({
      select: {
        id: true,
        offerReferenceNumber: true,
        stage: true,
        probabilityPercentage: true,
        offerValue: true,
        poExpectedMonth: true,
        createdAt: true
      },
      take: 10
    });
    
    console.log('Sample current offers:');
    currentOffers.forEach(offer => {
      console.log(`${offer.offerReferenceNumber} - Stage: ${offer.stage} - Probability: ${offer.probabilityPercentage}% - Expected: ${offer.poExpectedMonth || 'Not set'}`);
    });
    
    console.log('\n=== LOST OFFER CALCULATION OPTIONS ===');
    console.log('Based on your data, here are ways to identify LOST offers:');
    console.log('1. **Negative PO received values** (if any exist)');
    console.log('2. **Very old offers** not updated in months');
    console.log('3. **Zero probability** or very low probability (< 10%)');
    console.log('4. **Past expected PO month** with no progress');
    console.log('5. **Explicit lost status** in Excel (if available)');
    console.log('6. **Manual marking** - you identify and mark specific offers as lost');
    
    console.log('\nWhich method would you like to use for calculating LOST offers?');
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

analyzeLostOffers();
