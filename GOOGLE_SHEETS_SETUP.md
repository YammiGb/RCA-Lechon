# Google Sheets Integration Setup Guide

This guide will help you set up the Google Apps Script webhook to automatically save verified orders to Google Sheets.

## ⚠️ Important: CORS Configuration

Google Apps Script web apps require specific configuration to work with frontend applications. Make sure to:
1. Set "Who has access" to **"Anyone"** when deploying
2. Include the `doOptions()` function in your script (handles CORS preflight)
3. The frontend uses `mode: 'no-cors'` which means you won't see the response, but data will still be saved to your sheet

## Prerequisites

- A Google account
- Access to Google Sheets
- Access to Google Apps Script

## Step 1: Create a Google Sheet

1. Go to [Google Sheets](https://sheets.google.com)
2. Create a new spreadsheet
3. Name it something like "Order Management" or "Just Cafe Orders"
4. Set up the header row in the first row with these columns:
   ```
   Order ID | Date | Customer Name | Contact Number | Contact Number 2 | Service Type | Address | Landmark | City | Pickup Date | Pickup Time | Delivery Date | Delivery Time | Payment Method | Reference Number | Notes | Total | Items
   ```

## Step 2: Create Google Apps Script

1. In your Google Sheet, click on **Extensions** → **Apps Script**
2. Delete any default code
3. Copy and paste the following code:

```javascript
/**
 * Webhook endpoint to receive order data and write to Google Sheets
 * This script receives POST requests from your application
 */

// Replace 'YOUR_SHEET_NAME' with the actual name of your sheet tab
const SHEET_NAME = 'Sheet1'; // Change this to your sheet tab name

/**
 * Handle CORS preflight requests (OPTIONS)
 */
function doOptions() {
  return ContentService.createTextOutput('')
    .setMimeType(ContentService.MimeType.JSON)
    .setHeaders({
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
      'Access-Control-Max-Age': '3600'
    });
}

/**
 * Main function to handle POST requests
 */
function doPost(e) {
  try {
    // Parse the incoming JSON data
    const orderData = JSON.parse(e.postData.contents);
    
    // Get the active spreadsheet
    const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_NAME);
    
    // If sheet doesn't exist, create it
    if (!sheet) {
      const newSheet = SpreadsheetApp.getActiveSpreadsheet().insertSheet(SHEET_NAME);
      setupHeaders(newSheet);
      return ContentService.createTextOutput(JSON.stringify({
        success: true,
        message: 'Sheet created and headers added'
      }))
        .setMimeType(ContentService.MimeType.JSON)
        .setHeaders({
          'Access-Control-Allow-Origin': '*'
        });
    }
    
    // Format items as a readable string
    const itemsString = formatItems(orderData.items);
    
    // Prepare row data
    const rowData = [
      orderData.orderId || '',
      orderData.date || new Date().toLocaleString('en-US', { timeZone: 'Asia/Manila' }),
      orderData.customerName || '',
      orderData.contactNumber || '',
      orderData.contactNumber2 || '',
      orderData.serviceType || '',
      orderData.address || '',
      orderData.landmark || '',
      orderData.city || '',
      orderData.pickupDate || '',
      orderData.pickupTime || '',
      orderData.deliveryDate || '',
      orderData.deliveryTime || '',
      orderData.paymentMethod || '',
      orderData.referenceNumber || '',
      orderData.notes || '',
      orderData.total || 0,
      itemsString
    ];
    
    // Append the row to the sheet
    sheet.appendRow(rowData);
    
    // Return success response with CORS headers
    return ContentService.createTextOutput(JSON.stringify({
      success: true,
      message: 'Order saved successfully',
      orderId: orderData.orderId
    }))
      .setMimeType(ContentService.MimeType.JSON)
      .setHeaders({
        'Access-Control-Allow-Origin': '*'
      });
    
  } catch (error) {
    // Return error response with CORS headers
    return ContentService.createTextOutput(JSON.stringify({
      success: false,
      error: error.toString()
    }))
      .setMimeType(ContentService.MimeType.JSON)
      .setHeaders({
        'Access-Control-Allow-Origin': '*'
      });
  }
}

/**
 * Setup headers if sheet is empty
 */
function setupHeaders(sheet) {
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
    'Items'
  ];
  
  sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
  sheet.getRange(1, 1, 1, headers.length).setFontWeight('bold');
  sheet.getRange(1, 1, 1, headers.length).setBackground('#4285f4');
  sheet.getRange(1, 1, 1, headers.length).setFontColor('#ffffff');
}

/**
 * Format order items as a readable string
 */
function formatItems(items) {
  if (!items || !Array.isArray(items) || items.length === 0) {
    return '';
  }
  
  return items.map(item => {
    let itemString = `${item.quantity}x ${item.name}`;
    
    if (item.variation) {
      try {
        const variation = typeof item.variation === 'string' 
          ? JSON.parse(item.variation) 
          : item.variation;
        if (variation.name) {
          itemString += ` (${variation.name})`;
        }
      } catch (e) {
        // Ignore parsing errors
      }
    }
    
    if (item.addOns) {
      try {
        const addOns = typeof item.addOns === 'string' 
          ? JSON.parse(item.addOns) 
          : item.addOns;
        if (Array.isArray(addOns) && addOns.length > 0) {
          const addOnNames = addOns.map(a => a.name || a).join(', ');
          itemString += ` + ${addOnNames}`;
        }
      } catch (e) {
        // Ignore parsing errors
      }
    }
    
    itemString += ` - ₱${item.subtotal}`;
    return itemString;
  }).join(' | ');
}

/**
 * Test function - you can run this to test the script
 */
function testFunction() {
  const testData = {
    orderId: 'test-123',
    date: new Date().toLocaleString(),
    customerName: 'Test Customer',
    contactNumber: '09123456789',
    serviceType: 'delivery',
    address: '123 Test Street',
    city: 'Cebu City',
    total: 500,
    items: [
      {
        name: 'Test Item',
        quantity: 2,
        subtotal: 500
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
```

## Step 3: Deploy as Web App

1. In the Apps Script editor, click on **Deploy** → **New deployment**
2. Click the gear icon (⚙️) next to "Select type" and choose **Web app**
3. Configure the deployment:
   - **Description**: "Order Webhook" (or any name you prefer)
   - **Execute as**: "Me" (your Google account)
   - **Who has access**: "Anyone" (this allows your app to call it)
4. Click **Deploy**
5. **IMPORTANT**: Copy the **Web app URL** - this is your webhook URL
6. Authorize the script when prompted (click "Authorize access")

## Step 4: Add Webhook URL to Your Application

1. Create a `.env` file in your project root (if it doesn't exist)
2. Add the following line:
   ```
   VITE_GOOGLE_SHEETS_WEBHOOK_URL=https://script.google.com/macros/s/YOUR_SCRIPT_ID/exec
   ```
   Replace `YOUR_SCRIPT_ID` with the actual ID from your webhook URL

3. Restart your development server for the environment variable to take effect

## Step 5: Test the Integration

1. Place a test order through your application
2. Go to the Admin Dashboard → Orders
3. Approve the test order
4. Check your Google Sheet - the order should appear automatically

## Troubleshooting

### CORS Errors (Cross-Origin Request Blocked)

If you see CORS errors in the browser console:

1. **Verify deployment settings**: 
   - Make sure "Who has access" is set to **"Anyone"** (not "Only myself")
   - This is critical for CORS to work properly

2. **Create a new deployment**:
   - If you updated the script, you MUST create a new deployment (not just update)
   - Old deployments don't get updated with new code changes
   - Go to **Deploy** → **Manage deployments** → **Edit** → **New version** → **Deploy**

3. **Check the webhook URL**:
   - Make sure you're using the latest deployment URL
   - The URL should end with `/exec`

4. **Verify doOptions function**:
   - Make sure the `doOptions()` function is in your script
   - This handles CORS preflight requests

5. **Test the webhook directly**:
   - Open the webhook URL in a browser - you should see a blank page or error (this is normal)
   - If you get a 404 or 500 error, the deployment might be incorrect

### Orders not syncing to Sheets

1. **Check the webhook URL**: Make sure `VITE_GOOGLE_SHEETS_WEBHOOK_URL` is set correctly
2. **Check Apps Script logs**: In Apps Script editor, go to **Executions** to see any errors
3. **Verify sheet name**: Make sure `SHEET_NAME` in the script matches your actual sheet tab name
4. **Check permissions**: Make sure the web app is deployed with "Anyone" access
5. **Check browser console**: Look for any error messages when clicking "Sync to Sheets"

### Getting 401 or 403 errors

- The web app might need to be redeployed
- Make sure "Who has access" is set to "Anyone"
- Try running the test function in Apps Script to verify it works
- Create a new deployment version

### Data not appearing correctly

- Check the Apps Script logs for parsing errors
- Verify the JSON structure matches what the script expects
- Make sure the sheet headers match the script's expected format

### Network Errors

- If you see "NetworkError when attempting to fetch resource":
  - This is usually a CORS issue
  - Follow the CORS troubleshooting steps above
  - The frontend uses `mode: 'no-cors'` which means you won't see the response, but data should still be saved
  - Check your Google Sheet to verify data is being saved

## Security Notes

- The webhook URL is public, but only your application knows it
- Consider adding a simple authentication token if needed
- The script only writes data, it doesn't read or modify existing data
- You can restrict access by IP address if needed (requires additional script modifications)

## Optional: Add Authentication

If you want to add basic authentication, modify the `doPost` function:

```javascript
function doPost(e) {
  // Check for authentication token
  const authToken = e.parameter.token || (e.postData && JSON.parse(e.postData.contents).token);
  const expectedToken = 'YOUR_SECRET_TOKEN'; // Set this in your environment variables
  
  if (authToken !== expectedToken) {
    return ContentService.createTextOutput(JSON.stringify({
      success: false,
      error: 'Unauthorized'
    })).setMimeType(ContentService.MimeType.JSON);
  }
  
  // ... rest of the code
}
```

Then update your `useOrders.ts` to include the token in the request body.

## Support

If you encounter any issues, check:
1. Google Apps Script execution logs
2. Browser console for frontend errors
3. Network tab to see the webhook request/response

