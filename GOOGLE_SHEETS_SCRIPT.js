/**
 * Google Apps Script for RCA Lechon Order Management
 * This script receives order data via webhook and writes it to Google Sheets
 * 
 * SETUP INSTRUCTIONS:
 * 1. Open your Google Sheet: "RCA_Lechon_Order_Management"
 * 2. Go to Extensions > Apps Script
 * 3. Paste this entire script
 * 4. Save the script
 * 5. Deploy > New deployment > Web app
 * 6. Set Execute as: "Me" and Who has access: "Anyone"
 * 7. Copy the Web app URL and use it as VITE_GOOGLE_SHEETS_WEBHOOK_URL in your .env file
 */

function doPost(e) {
  try {
    // Parse the incoming JSON data
    const data = JSON.parse(e.postData.contents);
    
    // Get the active spreadsheet
    const sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
    
    // If sheet is empty, add headers
    if (sheet.getLastRow() === 0) {
      setHeaders(sheet);
    }
    
    // Format items string
    const itemsString = formatItems(data.items);
    
    // Calculate row data
    const rowData = [
      data.orderId || '',
      data.date || '',
      data.customerName || '',
      data.contactNumber || '',
      data.contactNumber2 || '',
      data.serviceType || '',
      data.address || '',
      data.landmark || '',
      data.city || '',
      data.pickupDate || '',
      data.pickupTime || '',
      data.deliveryDate || '',
      data.deliveryTime || '',
      data.paymentMethod || '',
      data.referenceNumber || '',
      data.notes || '',
      data.total || 0,
      itemsString,
      data.deliveryFee || 0  // New delivery fee column
    ];
    
    // Append the new row
    sheet.appendRow(rowData);
    
    // Return success response
    return ContentService.createTextOutput(JSON.stringify({
      success: true,
      message: 'Order synced successfully'
    })).setMimeType(ContentService.MimeType.JSON);
    
  } catch (error) {
    // Log error and return error response
    console.error('Error processing webhook:', error);
    return ContentService.createTextOutput(JSON.stringify({
      success: false,
      error: error.toString()
    })).setMimeType(ContentService.MimeType.JSON);
  }
}

/**
 * Set up column headers in the sheet
 */
function setHeaders(sheet) {
  const headers = [
    'Order ID',
    'Date',
    'Customer Name',
    'Contact Number',
    'Contact Number 2',
    'Service Type',
    'Address',
    'Landmark',
    'City',
    'Pickup Date',
    'Pickup Time',
    'Delivery Date',
    'Delivery Time',
    'Payment Method',
    'Reference Number',
    'Notes',
    'Total',
    'Items',
    'Delivery Fee'  // New delivery fee column header
  ];
  
  sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
  
  // Style the header row
  const headerRange = sheet.getRange(1, 1, 1, headers.length);
  headerRange.setBackground('#2d5016'); // Dark green background
  headerRange.setFontColor('#ffffff'); // White text
  headerRange.setFontWeight('bold');
  headerRange.setHorizontalAlignment('center');
}

/**
 * Format items array into a readable string
 * Format: "1x Item Name - PPrice | 1x Item Name - PPrice"
 */
function formatItems(items) {
  if (!items || items.length === 0) {
    return '';
  }
  
  return items.map(item => {
    let itemString = `${item.quantity}x ${item.name}`;
    
    // Add variation if exists
    if (item.variation) {
      try {
        const variation = typeof item.variation === 'string' 
          ? JSON.parse(item.variation) 
          : item.variation;
        if (variation && variation.name) {
          itemString += ` ${variation.name}`;
        }
      } catch (e) {
        // If parsing fails, skip variation
      }
    }
    
    // Add add-ons if exists
    if (item.addOns) {
      try {
        const addOns = typeof item.addOns === 'string' 
          ? JSON.parse(item.addOns) 
          : item.addOns;
        if (Array.isArray(addOns) && addOns.length > 0) {
          const addOnNames = addOns.map(addOn => addOn.name || addOn).join(', ');
          itemString += ` + ${addOnNames}`;
        }
      } catch (e) {
        // If parsing fails, skip add-ons
      }
    }
    
    // Add price
    itemString += ` - P${item.subtotal || item.unitPrice * item.quantity}`;
    
    return itemString;
  }).join(' | ');
}

/**
 * Test function to verify the script is working
 * Run this from the Apps Script editor to test
 */
function testWebhook() {
  const testData = {
    orderId: 'test-123',
    date: new Date().toLocaleString('en-US', { timeZone: 'Asia/Manila' }),
    customerName: 'Test Customer',
    contactNumber: '0912-345-6789',
    contactNumber2: '',
    serviceType: 'delivery',
    address: 'Test Address',
    landmark: 'Test Landmark',
    city: 'Lapu-Lapu City',
    pickupDate: '',
    pickupTime: '',
    deliveryDate: '2025-12-29',
    deliveryTime: '12:00',
    paymentMethod: 'gcash',
    referenceNumber: '',
    notes: '',
    total: 8100,
    deliveryFee: 50,
    items: [
      {
        name: '5kg Lechon Package Double Set',
        variation: '',
        addOns: '',
        quantity: 1,
        unitPrice: 8100,
        subtotal: 8100
      }
    ]
  };
  
  const mockEvent = {
    postData: {
      contents: JSON.stringify(testData)
    }
  };
  
  const result = doPost(mockEvent);
  Logger.log(result.getContent());
}

