# LedgerLite – Team Expense Tracker

LedgerLite is a Team Expense Tracker built using **Angular (TypeScript - Strict Mode)** and **Firebase (Authentication & Firestore)**. It enables teams to manage and monitor expenses through secure role-based access control. Members can manage their own expenses, while Managers have read-only access to view all team expenses.

---

# Features

- Secure Firebase Email/Password Authentication
- Role-Based Access Control (Member & Manager)
- Add, Edit and Delete Expenses (Members only)
- Manager View (Read-Only)
- Live Firestore Synchronization
- Category-wise Expense Summary
- Category Filter
- Date Range Filter


---

# Technologies Used

- Angular
- TypeScript (Strict Mode)
- Firebase Authentication
- Cloud Firestore
- HTML5
- CSS3

---

# Project Setup

## 1. Install Dependencies

Ensure Node.js is installed.

```bash
npm install
```

---

## 2. Configure Firebase

Open:

```
src/environments/environment.ts
```

Replace the placeholder configuration with your Firebase project's configuration.

```typescript
export const environment = {
  production: false,
  firebase: {
    apiKey: "YOUR_FIREBASE_API_KEY",
    authDomain: "YOUR_FIREBASE_AUTH_DOMAIN",
    projectId: "YOUR_FIREBASE_PROJECT_ID",
    storageBucket: "YOUR_FIREBASE_STORAGE_BUCKET",
    messagingSenderId: "YOUR_FIREBASE_MESSAGING_SENDER_ID",
    appId: "YOUR_FIREBASE_APP_ID"
  }
};
```

---

## 3. Install Firebase Dependencies

If required:

```bash
npm install firebase
```

---

## 4. Run the Application

```bash
npm start
```

Open:

```
http://localhost:4200
```

---

## 5. Build the Project

```bash
npm run build
```

---

# Firebase Configuration

## Authentication

Enable:

- Email/Password Authentication

---

## Firestore Database

Create the following collections.

### users

Document ID should be the Firebase Authentication UID.

Fields:

| Field | Type |
|--------|------|
| uid | string |
| name | string |
| role | string |

Role values:

- member
- manager

---

### expenses

Each expense document contains:

| Field | Type |
|--------|------|
| amount | number |
| category | string |
| date | string |
| note | string |
| userId | string |

---

# Demo Credentials

## Member

Email

```
member@ledgerlite.com
```

Password

```
password123
```

Role

```
member
```

---

## Manager

Email

```
manager@ledgerlite.com
```

Password

```
password123
```

Role

```
manager
```

---

# Application Usage

## Member

Members can:

- Add Expense
- Edit Expense
- Delete Expense
- View their own expenses
- View Category Summary
- Filter by Category
- Filter by Date Range

---

## Manager

Managers can:

- View all team expenses
- View Category Summary
- Filter by Category
- Filter by Date Range

Managers **cannot**:

- Add Expense
- Edit Expense
- Delete Expense

---

# Expense Categories

The application uses the following categories:

- Food
- Travel
- Equipment
- Utilities
- Other

---


# Date Format

Dates are displayed in:

```
DD/MM/YYYY
```

The original stored date format in Firestore is preserved.

---

# Role-Based Access

### Member

- Can manage only their own expenses.
- Full CRUD permissions.

### Manager

- Can view all expenses.
- Read-only access.
- CRUD operations are restricted.

---

# Project Structure

```
src
│
├── app
│   ├── components
│   ├── guards
│   ├── services
│   ├── models
│   └── routes
│
├── environments
│
├── assets
│
└── styles
```

---

# Security

- Firebase Authentication protects user access.
- Route Guards prevent unauthorized access.
- Firestore stores all expense data securely.
- Role-based authorization controls CRUD operations.

---


# Developed Using

- Angular
- TypeScript
- Firebase
- Firestore
