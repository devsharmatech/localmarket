# Admin Panel API Documentation

This document provides comprehensive API documentation for the Admin Panel backend. All APIs are RESTful endpoints that can be integrated into mobile applications.

**Base URL**: `https://admin-panel-rho-sepia-57.vercel.app` (Production)

---

## Table of Contents

1. [Authentication](#authentication)
2. [Users API](#users-api)
3. [Vendors API](#vendors-api)
4. [Categories API](#categories-api)
5. [Master Products API](#master-products-api)
6. [Vendor Products API](#vendor-products-api)
7. [Themes API](#themes-api)
8. [Locations API](#locations-api)
9. [Reports & Analytics API](#reports--analytics-api)
10. [Notifications API](#notifications-api)
11. [Banners API](#banners-api)
12. [Festive Offers API](#festive-offers-api)
13. [E-Auctions API](#e-auctions-api)
14. [Feedback API](#feedback-api)
15. [Price Verification API](#price-verification-api)
16. [Payment Fees API](#payment-fees-api)

---

## Authentication

Currently, the admin panel APIs use service role authentication server-side. For mobile app integration, you may need to implement proper authentication tokens or API keys.

---

## Users API

### Get Users

**Endpoint**: `GET /api/users`

**Query Parameters**:
- `q` (string, optional): Search query (searches name, email, phone)
- `status` (string, optional): Filter by status (`Active`, `Blocked`, `Pending`, or `all`)
- `state` (string, optional): Filter by state
- `city` (string, optional): Filter by city
- `page` (number, optional): Page number (default: 1)
- `limit` (number, optional): Items per page (default: 20, max: 100)

**Response**:
```json
{
  "users": [
    {
      "id": "uuid",
      "name": "John Doe",
      "email": "john@example.com",
      "phone": "1234567890",
      "state": "Delhi",
      "city": "New Delhi",
      "status": "Active",
      "joinedDate": "2024-01-01T00:00:00Z",
      "lastActiveAt": "2024-01-20T10:30:00Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 100,
    "totalPages": 5
  }
}
```

**Example**:
```bash
GET /api/users?status=Active&state=Delhi&page=1&limit=20
GET /api/users?q=john&status=Active
```

### Update User

**Endpoint**: `PATCH /api/users`

**Request Body**:
```json
{
  "id": "uuid",
  "status": "Active" | "Blocked" | "Pending",
  "name": "John Doe",
  "email": "john@example.com",
  "phone": "1234567890",
  "state": "Delhi",
  "city": "New Delhi"
}
```

**Response**:
```json
{
  "user": {
    "id": "uuid",
    "name": "John Doe",
    "email": "john@example.com",
    "phone": "1234567890",
    "state": "Delhi",
    "city": "New Delhi",
    "status": "Active"
  }
}
```

### Export Users

**Endpoint**: `GET /api/users/export`

**Query Parameters**: Same as Get Users

**Response**: Excel file download

### Import Users

**Endpoint**: `POST /api/users/import`

**Request**: Multipart form data with Excel file

**Response**:
```json
{
  "success": true,
  "inserted": 50,
  "skipped": 5,
  "errors": []
}
```

### Get Users Template

**Endpoint**: `GET /api/users/template`

**Response**: Excel template file download

---

## Vendors API

### Get Vendors

**Endpoint**: `GET /api/vendors`

**Query Parameters**:
- `status` (string, optional): Filter by status (`Active`, `Pending`, `Blocked`, or `all`)
- `q` (string, optional): Search query (searches name, owner)
- `state` (string, optional): Filter by state
- `city` (string, optional): Filter by city
- `town` (string, optional): Filter by town
- `tehsil` (string, optional): Filter by tehsil
- `subTehsil` (string, optional): Filter by sub-tehsil
- `page` (number, optional): Page number (default: 1)
- `limit` (number, optional): Items per page (default: 20, max: 100)

**Response**:
```json
{
  "vendors": [
    {
      "id": "uuid",
      "name": "Shop Name",
      "owner": "Owner Name",
      "status": "Active",
      "kycStatus": "Approved",
      "productCount": 25,
      "state": "Delhi",
      "city": "New Delhi",
      "town": "Connaught Place",
      "tehsil": "Central",
      "subTehsil": "CP",
      "circle": "North",
      "joinedDate": "2024-01-01T00:00:00Z",
      "lastActive": "2024-01-20T10:30:00Z",
      "category": "Electronics",
      "rating": 4.5,
      "reviewCount": 10,
      "contactNumber": "1234567890",
      "email": "shop@example.com",
      "address": "123 Main St",
      "landmark": "Near Metro",
      "pincode": "110001"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 200,
    "totalPages": 10
  }
}
```

**Example**:
```bash
GET /api/vendors?status=Active&city=New Delhi&page=1&limit=20
GET /api/vendors?q=electronics&status=Active
```

### Update Vendor Status

**Endpoint**: `PATCH /api/vendors/status`

**Request Body**:
```json
{
  "id": "uuid",
  "status": "Active" | "Pending" | "Blocked"
}
```

**Response**:
```json
{
  "success": true,
  "vendor": { ... }
}
```

### Get Pending Vendors

**Endpoint**: `GET /api/vendors/pending`

**Response**: Same format as Get Vendors, filtered to pending vendors

### Export Vendors

**Endpoint**: `GET /api/vendors/export`

**Query Parameters**: Same as Get Vendors

**Response**: Excel file download

### Import Vendors

**Endpoint**: `POST /api/vendors/import`

**Request**: Multipart form data with Excel file

**Response**:
```json
{
  "success": true,
  "inserted": 50,
  "skipped": 5,
  "errors": []
}
```

### Get Vendors Template

**Endpoint**: `GET /api/vendors/template`

**Response**: Excel template file download

---

## Categories API

### Get Categories

**Endpoint**: `GET /api/categories`

**Query Parameters**:
- `q` (string, optional): Search query (searches name)

**Response**:
```json
{
  "categories": [
    {
      "id": "uuid",
      "name": "Electronics",
      "iconName": "electronics",
      "iconUrl": "https://example.com/icon.png",
      "priority": 1,
      "visible": true,
      "productCount": 100
    }
  ]
}
```

### Create Category

**Endpoint**: `POST /api/categories`

**Request Body**:
```json
{
  "name": "Electronics",
  "iconName": "electronics",
  "iconUrl": "https://example.com/icon.png",
  "priority": 1,
  "visible": true
}
```

**Response**:
```json
{
  "success": true,
  "category": { ... }
}
```

### Export Categories

**Endpoint**: `GET /api/categories/export`

**Response**: Excel file download

### Import Categories

**Endpoint**: `POST /api/categories/import`

**Request**: Multipart form data with Excel file

**Response**:
```json
{
  "success": true,
  "inserted": 20,
  "skipped": 2,
  "errors": []
}
```

### Get Categories Template

**Endpoint**: `GET /api/categories/template`

**Response**: Excel template file download

---

## Master Products API

### Get Master Products

**Endpoint**: `GET /api/master-products`

**Query Parameters**:
- `q` (string, optional): Search query
- `category` (string, optional): Filter by category

**Response**:
```json
{
  "products": [
    {
      "id": "uuid",
      "name": "Product Name",
      "category": "Electronics",
      "description": "Product description",
      "imageUrl": "https://example.com/image.jpg",
      "createdAt": "2024-01-01T00:00:00Z"
    }
  ]
}
```

### Create Master Product

**Endpoint**: `POST /api/master-products`

**Request Body**:
```json
{
  "name": "Product Name",
  "category": "Electronics",
  "description": "Product description",
  "imageUrl": "https://example.com/image.jpg"
}
```

### Assign Categories to Master Products

**Endpoint**: `POST /api/master-products/assign-categories`

**Request Body**:
```json
{
  "productIds": ["uuid1", "uuid2"],
  "categoryIds": ["uuid1", "uuid2"]
}
```

### Export Master Products

**Endpoint**: `GET /api/master-products/export`

**Response**: Excel file download

### Import Master Products

**Endpoint**: `POST /api/master-products/import`

**Request**: Multipart form data with Excel file

**Response**:
```json
{
  "success": true,
  "inserted": 100,
  "skipped": 5,
  "errors": []
}
```

### Get Import History

**Endpoint**: `GET /api/master-products/import-history`

**Response**:
```json
{
  "history": [
    {
      "id": "uuid",
      "fileName": "products.xlsx",
      "inserted": 100,
      "skipped": 5,
      "importedAt": "2024-01-20T10:30:00Z"
    }
  ]
}
```

### Get Master Products Template

**Endpoint**: `GET /api/master-products/template`

**Response**: Excel template file download

---

## Vendor Products API

### Get Vendor Products

**Endpoint**: `GET /api/vendor-products`

**Query Parameters**:
- `vendorId` (string, optional): Filter by vendor ID
- `category` (string, optional): Filter by category

**Response**:
```json
{
  "products": [
    {
      "id": "uuid",
      "vendorId": "uuid",
      "name": "Product Name",
      "price": 1000,
      "mrp": 1200,
      "category": "Electronics",
      "inStock": true,
      "imageUrl": "https://example.com/image.jpg"
    }
  ]
}
```

### Bulk Price Update

**Endpoint**: `POST /api/vendor-products/bulk-price`

**Request Body**:
```json
{
  "productIds": ["uuid1", "uuid2"],
  "price": 1000,
  "mrp": 1200
}
```

### Get Vendor Products Template

**Endpoint**: `GET /api/vendor-products/template`

**Response**: Excel template file download

---

## Themes API

### Get Themes

**Endpoint**: `GET /api/themes`

**Query Parameters**:
- `active` (boolean, optional): Get only active theme (`?active=true`)

**Response**:
```json
{
  "themes": [
    {
      "id": "diwali",
      "name": "Diwali",
      "description": "Festival of Lights",
      "icon": "🪔",
      "colors": {
        "primary": "#FF6B35",
        "secondary": "#F7931E",
        "accent": "#FFD700",
        "background": "#FFF8E1",
        "text": "#1A1A1A"
      },
      "is_default": true,
      "is_active": false,
      "created_at": "2024-01-01T00:00:00Z"
    }
  ]
}
```

### Create Theme

**Endpoint**: `POST /api/themes`

**Request Body**:
```json
{
  "id": "custom_theme_1",
  "name": "Custom Theme",
  "description": "Custom theme description",
  "icon": "🎨",
  "colors": {
    "primary": "#E86A2C",
    "secondary": "#4A6CF7",
    "accent": "#FFD700",
    "background": "#FFFFFF",
    "text": "#1A1A1A"
  },
  "is_default": false
}
```

### Update Theme / Set Active Theme

**Endpoint**: `PATCH /api/themes`

**Request Body**:
```json
{
  "id": "diwali",
  "is_active": true
}
```

**Note**: Setting `is_active: true` will:
- Deactivate all other themes
- Update all users' `selected_theme` to this theme

### Delete Theme

**Endpoint**: `DELETE /api/themes/[id]`

**Example**: `DELETE /api/themes/custom_theme_1`

**Response**:
```json
{
  "success": true
}
```

---

## Locations API

### Get Locations

**Endpoint**: `GET /api/locations`

**Query Parameters**:
- `state` (string, optional): Filter by state
- `city` (string, optional): Filter by city
- `limit` (number, optional): Limit results (default: 100, max: 2000)

**Response**:
```json
{
  "locations": [
    {
      "id": "uuid",
      "state": "Delhi",
      "city": "New Delhi",
      "town": "Connaught Place",
      "tehsil": "Central",
      "sub_tehsil": "CP",
      "circle": "North"
    }
  ]
}
```

### Import Locations

**Endpoint**: `POST /api/locations/import`

**Request**: Multipart form data with Excel file

**Response**:
```json
{
  "success": true,
  "inserted": 100,
  "skipped": 10,
  "errors": []
}
```

### Get Locations Template

**Endpoint**: `GET /api/locations/template`

**Response**: Excel template file download

---

## Reports & Analytics API

### Dashboard Metrics

**Endpoint**: `GET /api/reports/dashboard`

**Response**:
```json
{
  "totalVendors": 500,
  "activeVendors": 450,
  "pendingApprovals": 20,
  "totalCategories": 50,
  "totalMasterProducts": 1000,
  "totalProducts": 5000,
  "flaggedProducts": 5,
  "dailySearches": 1000,
  "totalUsers": 2000,
  "searchTrends": [
    {
      "date": "Jan 15",
      "searches": 100
    }
  ],
  "vendorsWithHighViews": 50,
  "priceUpdatesCount": 200,
  "pendingActions": 5,
  "vendorChange": "+10%",
  "activeVendorChange": "+5%",
  "pendingChange": "-2%",
  "categoryChange": "+3%",
  "masterProductChange": "+15%",
  "productChange": "+20%",
  "flaggedChange": "-1",
  "searchChange": "+25%",
  "userChange": "+12%"
}
```

### Search Reports

**Endpoint**: `GET /api/reports/search`

**Query Parameters**:
- `state` (string, optional): Filter by state
- `city` (string, optional): Filter by city

**Response**:
```json
{
  "reports": [
    {
      "product": "Product Name",
      "count": 100,
      "location": "Delhi",
      "trend": "+10%"
    }
  ]
}
```

### Vendor Activity Reports

**Endpoint**: `GET /api/reports/vendor-activity`

**Response**:
```json
{
  "activities": [
    {
      "vendorId": "uuid",
      "vendorName": "Shop Name",
      "activityType": "profile_viewed",
      "count": 50,
      "lastActivity": "2024-01-20T10:30:00Z"
    }
  ]
}
```

### Circle Analytics

**Endpoint**: `GET /api/analytics/circle`

**Query Parameters**:
- `circle` (string, optional): Filter by specific circle

**Response**:
```json
{
  "circles": ["Circle1", "Circle2"],
  "useCircles": true,
  "groupingKey": "circle",
  "displayLabel": "Circle",
  "displayLabelPlural": "Circles",
  "usersByGroup": {
    "Circle1": 100,
    "Circle2": 150
  },
  "searchesByGroup": {
    "Circle1": 500,
    "Circle2": 750
  },
  "vendorsByGroup": {
    "Circle1": 20,
    "Circle2": 30
  },
  "categoryDemandData": [
    {
      "category": "Electronics",
      "searches": 100,
      "purchases": 30,
      "contacts": 50
    }
  ],
  "circleUserLimits": [
    {
      "circle": "Circle1",
      "currentUsers": 100,
      "maxUsers": 500,
      "percentage": 20
    }
  ],
  "userEngagement": [
    {
      "circle": "Circle1",
      "users": 100,
      "vendors": 20,
      "total": 120
    }
  ]
}
```

---

## Notifications API

### Get Notifications

**Endpoint**: `GET /api/notifications`

**Response**:
```json
{
  "notifications": [
    {
      "id": "uuid",
      "title": "Notification Title",
      "message": "Notification message",
      "type": "info",
      "created_at": "2024-01-20T10:30:00Z",
      "read": false
    }
  ]
}
```

### Send Notification

**Endpoint**: `POST /api/send-notification`

**Request Body**:
```json
{
  "userIds": ["uuid1", "uuid2"],
  "title": "Notification Title",
  "message": "Notification message",
  "type": "info"
}
```

### Send Topic Notification

**Endpoint**: `POST /api/send-notification-topic`

**Request Body**:
```json
{
  "topic": "all_users" | "all_vendors" | "specific_topic",
  "title": "Notification Title",
  "message": "Notification message",
  "type": "info"
}
```

### Auto Notifications

**Endpoint**: `GET /api/auto-notifications`

**Response**:
```json
{
  "settings": {
    "enabled": true,
    "rules": [
      {
        "trigger": "new_vendor",
        "enabled": true,
        "message": "New vendor registered"
      }
    ]
  }
}
```

---

## Banners API

### Get Banners

**Endpoint**: `GET /api/banners`

**Response**:
```json
{
  "banners": [
    {
      "id": "uuid",
      "title": "Banner Title",
      "imageUrl": "https://example.com/banner.jpg",
      "linkUrl": "https://example.com",
      "priority": 1,
      "active": true,
      "startDate": "2024-01-01T00:00:00Z",
      "endDate": "2024-12-31T23:59:59Z"
    }
  ]
}
```

### Create Banner

**Endpoint**: `POST /api/banners`

**Request Body**:
```json
{
  "title": "Banner Title",
  "imageUrl": "https://example.com/banner.jpg",
  "linkUrl": "https://example.com",
  "priority": 1,
  "active": true,
  "startDate": "2024-01-01T00:00:00Z",
  "endDate": "2024-12-31T23:59:59Z"
}
```

### Update Banner

**Endpoint**: `PATCH /api/banners`

**Request Body**:
```json
{
  "id": "uuid",
  "title": "Updated Title",
  "active": false
}
```

### Delete Banner

**Endpoint**: `DELETE /api/banners`

**Request Body**:
```json
{
  "id": "uuid"
}
```

---

## Festive Offers API

### Get Festive Offers

**Endpoint**: `GET /api/festive-offers`

**Response**:
```json
{
  "offers": [
    {
      "id": "uuid",
      "title": "Diwali Offer",
      "description": "Special Diwali discount",
      "discount": 20,
      "startDate": "2024-01-01T00:00:00Z",
      "endDate": "2024-01-31T23:59:59Z",
      "active": true,
      "themeId": "diwali"
    }
  ]
}
```

### Create Festive Offer

**Endpoint**: `POST /api/festive-offers`

**Request Body**:
```json
{
  "title": "Diwali Offer",
  "description": "Special Diwali discount",
  "discount": 20,
  "startDate": "2024-01-01T00:00:00Z",
  "endDate": "2024-01-31T23:59:59Z",
  "active": true,
  "themeId": "diwali"
}
```

### Update Festive Offer

**Endpoint**: `PATCH /api/festive-offers`

**Request Body**:
```json
{
  "id": "uuid",
  "active": false
}
```

---

## E-Auctions API

### Get E-Auctions

**Endpoint**: `GET /api/e-auctions`

**Response**:
```json
{
  "auctions": [
    {
      "id": "uuid",
      "title": "Auction Title",
      "description": "Auction description",
      "startDate": "2024-01-01T00:00:00Z",
      "endDate": "2024-01-31T23:59:59Z",
      "status": "active",
      "participants": 10
    }
  ]
}
```

### Create E-Auction

**Endpoint**: `POST /api/e-auctions`

**Request Body**:
```json
{
  "title": "Auction Title",
  "description": "Auction description",
  "startDate": "2024-01-01T00:00:00Z",
  "endDate": "2024-01-31T23:59:59Z"
}
```

### Send Offer

**Endpoint**: `POST /api/e-auctions/[id]/send-offer`

**Request Body**:
```json
{
  "userId": "uuid",
  "offer": 1000
}
```

---

## Feedback API

### Get Feedback

**Endpoint**: `GET /api/feedback`

**Query Parameters**:
- `status` (string, optional): Filter by status
- `type` (string, optional): Filter by type

**Response**:
```json
{
  "feedback": [
    {
      "id": "uuid",
      "userId": "uuid",
      "type": "suggestion",
      "message": "Feedback message",
      "status": "pending",
      "created_at": "2024-01-20T10:30:00Z"
    }
  ]
}
```

### Create Feedback

**Endpoint**: `POST /api/feedback`

**Request Body**:
```json
{
  "userId": "uuid",
  "type": "suggestion",
  "message": "Feedback message"
}
```

---

## Price Verification API

### Get Price Verification Settings

**Endpoint**: `GET /api/price-verification/settings`

**Response**:
```json
{
  "settings": {
    "enabled": true,
    "threshold": 20,
    "autoFlag": true
  }
}
```

### Update Price Verification Settings

**Endpoint**: `PATCH /api/price-verification/settings`

**Request Body**:
```json
{
  "enabled": true,
  "threshold": 20,
  "autoFlag": true
}
```

### Get Price Flags

**Endpoint**: `GET /api/price-verification/flags`

**Query Parameters**:
- `status` (string, optional): Filter by status (`pending`, `resolved`, `rejected`)

**Response**:
```json
{
  "flags": [
    {
      "id": "uuid",
      "productId": "uuid",
      "vendorId": "uuid",
      "reportedPrice": 1000,
      "expectedPrice": 800,
      "difference": 200,
      "status": "pending",
      "flaggedAt": "2024-01-20T10:30:00Z"
    }
  ]
}
```

---

## Payment Fees API

### Get Payment Fees Config

**Endpoint**: `GET /api/payment-fees/config`

**Response**:
```json
{
  "config": {
    "platformFee": 2.5,
    "paymentGatewayFee": 1.5,
    "minimumOrder": 100
  }
}
```

### Update Payment Fees Config

**Endpoint**: `PATCH /api/payment-fees/config`

**Request Body**:
```json
{
  "platformFee": 2.5,
  "paymentGatewayFee": 1.5,
  "minimumOrder": 100
}
```

### Get Vendor Payment Fees

**Endpoint**: `GET /api/payment-fees/vendors`

**Query Parameters**:
- `vendorId` (string, optional): Filter by vendor ID

**Response**:
```json
{
  "fees": [
    {
      "vendorId": "uuid",
      "vendorName": "Shop Name",
      "totalEarnings": 10000,
      "platformFee": 250,
      "netEarnings": 9750
    }
  ]
}
```

---

## Error Responses

All APIs may return error responses in the following format:

```json
{
  "error": "Error message description"
}
```

**Common HTTP Status Codes**:
- `200` - Success
- `201` - Created
- `400` - Bad Request (invalid parameters)
- `404` - Not Found
- `500` - Internal Server Error

---

## Notes for Mobile Integration

1. **Base URL**: Use the production URL: `https://admin-panel-rho-sepia-57.vercel.app`

2. **Headers**: All requests should include:
   ```
   Content-Type: application/json
   ```

3. **Pagination**: Most list endpoints support pagination with `page` and `limit` parameters

4. **Search**: Many endpoints support search with the `q` parameter

5. **Filtering**: Use query parameters for filtering (e.g., `status`, `state`, `city`)

6. **File Uploads**: Import endpoints expect multipart form data with Excel files

7. **Date Formats**: All dates are in ISO 8601 format (e.g., `2024-01-20T10:30:00Z`)

8. **Error Handling**: Always check the response status and handle errors appropriately

9. **Rate Limiting**: Be mindful of API rate limits (not currently implemented but recommended)

10. **Authentication**: For production mobile apps, implement proper authentication tokens

---

## Example Mobile App Integration (React Native)

```javascript
const API_BASE_URL = 'https://admin-panel-rho-sepia-57.vercel.app';

// Get Users
const getUsers = async (page = 1, limit = 20, filters = {}) => {
  const params = new URLSearchParams({
    page: page.toString(),
    limit: limit.toString(),
    ...filters
  });
  
  const response = await fetch(`${API_BASE_URL}/api/users?${params}`);
  const data = await response.json();
  return data;
};

// Update User Status
const updateUserStatus = async (userId, status) => {
  const response = await fetch(`${API_BASE_URL}/api/users`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      id: userId,
      status: status
    })
  });
  const data = await response.json();
  return data;
};

// Get Dashboard Metrics
const getDashboardMetrics = async () => {
  const response = await fetch(`${API_BASE_URL}/api/reports/dashboard`);
  const data = await response.json();
  return data;
};

// Get Active Theme
const getActiveTheme = async () => {
  const response = await fetch(`${API_BASE_URL}/api/themes?active=true`);
  const data = await response.json();
  return data[0] || null;
};
```

---

## Support

For API issues or questions, please refer to the admin panel codebase or contact the development team.

**Last Updated**: January 2024

---

## AI Services API

### Start AI Session

**Endpoint**: `POST /api/ai/start`

**Request Body**:
```json
{
  "userId": "uuid",
  "location": {
    "lat": 12.3456,
    "lng": 78.9012
  }
}
```

**Response**:
```json
{
  "message": "Hi! How can I help you today?",
  "nextStep": "intent",
  "question": "What service are you looking for?",
  "options": [
    { "label": "Home Services", "value": "home_services" },
    { "label": "Food", "value": "food" }
  ]
}
```

### Process Answer

**Endpoint**: `POST /api/ai/process-answer`

**Request Body**:
```json
{
  "step": "intent",
  "answer": "Plumber",
  "context": {
    "intent": "plumber"
  }
}
```

**Response**:
```json
{
  "nextStep": "details",
  "message": "Got it. Tell me more.",
  "question": "What specifically needs fixing?",
  "updatedContext": {
    "intent": "plumber",
    "details": "leaking tap"
  }
}
```

### Get Recommendations

**Endpoint**: `POST /api/ai/recommendations`

**Request Body**:
```json
{
  "context": {
    "intent": "plumber",
    "details": "leaking tap",
    "urgency": "now"
  }
}
```

**Response**:
```json
{
  "vendors": [
    {
      "id": "v1",
      "name": "Ace Plumbing",
      "rating": 4.8,
      "distance": "1.2 km",
      "isTopMatch": true,
      "explanation": "Best rated availability"
    }
  ]
}
```
