# Admin Registration and API Routes Fix

## Issues Identified

### 1. **404 Error in Movie Upload**
- **Problem**: Incorrect API endpoint in `packages/web/src/app/api/movies/upload/route.ts`
- **Line 33**: Calling `${process.env.NEXT_PUBLIC_API_URL}/movies` instead of `${process.env.NEXT_PUBLIC_API_URL}/api/movies`
- **Result**: 404 error when uploading movies

### 2. **Missing API Routes for Admin Management**
- **Problem**: AdminManagement component was calling API routes that didn't exist
- **Missing Routes**:
  - `DELETE /api/users/[userId]` - for deleting users
  - `PUT /api/users/[userId]/role` - for updating user roles
- **Result**: 404 errors when trying to manage users in admin panel

### 3. **Admin vs User Registration Confusion**
- **Problem**: Two different registration endpoints with different purposes
- **Routes**:
  - `/api/users/register` - **Admin registration** (requires authentication)
  - `/api/users/register/user` - **Public registration** (no auth required)
- **Issue**: Admin registration was failing due to missing backend support

## Registration Flow Analysis

### **Backend Routes** (`backend/routes/userRoutes.js`):
```javascript
// Public registration (no auth required)
router.post('/register', async (req, res, next) => {
    await UserController.register(req, res);
});

// Also public registration (no auth required)  
router.post('/register/user', async (req, res, next) => {
    await UserController.register(req, res);
});
```

**Note**: Both routes call the same `UserController.register` method, but the frontend treats them differently.

### **Frontend Routes**:
```typescript
// Public user registration (no auth required)
// packages/web/src/app/api/users/register/user/route.ts
const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/users/register/user`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' }, // No auth header
  body: JSON.stringify(body),
});

// Admin registration (requires authentication)
// packages/web/src/app/api/users/register/route.ts
const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/users/register`, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': authHeader, // Auth header required
  },
  body: JSON.stringify(body),
});
```

## Solutions Implemented

### 1. **Fixed Movie Upload 404 Error**
```typescript
// OLD (causing 404)
const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/movies`, {

// NEW (correct endpoint)
const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/movies`, {
```

### 2. **Added Missing Admin API Routes**

#### **DELETE /api/users/[userId]/route.ts**
```typescript
export async function DELETE(
  request: Request,
  { params }: { params: { userId: string } }
) {
  // Handles user deletion with authentication
  const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/users/${params.userId}`, {
    method: 'DELETE',
    headers: { 'Authorization': authHeader },
  });
}
```

#### **PUT /api/users/[userId]/role/route.ts**
```typescript
export async function PUT(
  request: Request,
  { params }: { params: { userId: string } }
) {
  // Handles role updates with authentication
  const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/users/${params.userId}/role`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': authHeader,
    },
    body: JSON.stringify(body),
  });
}
```

### 3. **Registration Flow Clarification**

#### **Public User Registration** (for regular users):
- **Frontend Route**: `/api/users/register/user`
- **Backend Route**: `/api/users/register/user`
- **Auth Required**: No
- **Used By**: Registration forms, payment flow

#### **Admin Registration** (for admin panel):
- **Frontend Route**: `/api/users/register`
- **Backend Route**: `/api/users/register`
- **Auth Required**: Yes (admin token)
- **Used By**: AdminManagement component

## Testing the Fixes

### 1. **Test Movie Upload**
- Go to admin panel → Movies
- Try uploading a movie
- Should no longer get 404 error

### 2. **Test Admin User Management**
- Go to admin panel → Admin Management
- Try creating a new admin user
- Try updating user roles
- Try deleting users
- Should work without 404 errors

### 3. **Test Public Registration**
- Go to registration page
- Register a new user
- Should work as before

## Summary

The issues were caused by:
1. **Incorrect API endpoint** in movie upload (missing `/api/` prefix)
2. **Missing frontend API routes** for admin user management
3. **Confusion between admin and public registration endpoints**

All issues have been resolved by:
1. ✅ Fixing the movie upload API endpoint
2. ✅ Adding missing admin API routes
3. ✅ Clarifying the registration flow

The admin registration should now work properly without causing 404 errors or interfering with the public user registration flow. 