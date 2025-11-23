# GhostMoney 👻💰

A desktop application for managing gaming lounge clients, tracking purchases, and monitoring payments. Built with Electron, React, and SQLite for offline functionality.

## Features

- **Client Management**: Track all your gaming lounge clients with contact information and balance tracking
- **Product Management**: Manage bundles, snacks, drinks, and other products with categories
- **Transaction Tracking**: Add charges to client accounts and view complete transaction history
- **Payment Recording**: Record payments with multiple payment methods and optional due date alerts
- **User Management**: Admin and worker roles with role-based access control
- **Dashboard**: Overview with key metrics, recent transactions, and overdue payment alerts
- **Reports & Export**: Export data to Excel and PDF formats
- **Offline Support**: Fully functional without internet connection using local SQLite database
- **Desktop Notifications**: Automatic alerts for overdue payments

## Tech Stack

- **Electron**: Cross-platform desktop application framework
- **React**: Frontend UI library with React Router for navigation
- **SQLite**: Embedded database with better-sqlite3 for offline data storage
- **Vite**: Fast build tool and development server
- **ExcelJS**: Excel file generation
- **PDFKit**: PDF document generation

## Installation

### Prerequisites

- Node.js (v16 or higher)
- npm or yarn

### Setup

1. Clone or navigate to the project directory:
```bash
cd /Users/chris/dev/GhostMoney
```

2. Install dependencies:
```bash
npm install
```

3. Run the application in development mode:
```bash
npm run dev
```

4. Build the application for production:
```bash
npm run build        # Build React frontend
npm run build:electron  # Build Windows executable
```

## Default Credentials

On first launch, the app creates a default admin account:
- **Username**: `admin`
- **Password**: `admin123`

**Important**: Change this password after first login!

## Usage Guide

### Dashboard
- View total clients, outstanding payments, and overdue alerts
- See recent transactions at a glance

### Client Management
1. Add new clients with name, phone, email, and notes
2. Add charges by selecting products from your inventory
3. Record payments with various payment methods
4. Set due dates for remaining balances
5. View complete transaction and payment history

### Product Management
1. Create categories (Bundles, Snacks, Drinks, etc.)
2. Add products with prices and descriptions
3. Search and filter products by category

### User Management (Admin Only)
- Create worker and admin accounts
- Manage user permissions
- Update passwords

### Reports
- Export clients, products, transactions, or payments to Excel or PDF
- View summary statistics

## Project Structure

```
GhostMoney/
├── electron/
│   ├── main.js              # Electron main process
│   ├── preload.js           # Secure IPC bridge
│   ├── database/
│   │   ├── schema.sql       # Database schema
│   │   └── db.js            # Database service layer
│   ├── ipc/
│   │   └── handlers.js      # IPC request handlers
│   └── services/
│       ├── exportService.js # Excel/PDF export
│       └── notificationService.js # Payment alerts
├── src/
│   ├── App.jsx              # Main React component
│   ├── main.jsx             # React entry point
│   ├── index.css            # Global styles
│   ├── pages/
│   │   ├── Login.jsx
│   │   ├── Dashboard.jsx
│   │   ├── Clients.jsx
│   │   ├── Products.jsx
│   │   ├── Users.jsx
│   │   └── Reports.jsx
│   └── components/
│       ├── Navbar.jsx
│       ├── Modal.jsx
│       ├── SearchBar.jsx
│       ├── ClientForm.jsx
│       ├── AddChargeModal.jsx
│       ├── RecordPaymentModal.jsx
│       ├── ProductForm.jsx
│       ├── CategoryManager.jsx
│       └── UserForm.jsx
├── package.json
├── vite.config.js
└── index.html
```

## Database Schema

The app uses SQLite with the following tables:
- **users**: Admin and worker accounts
- **clients**: Customer information
- **categories**: Product categories
- **products**: Items for sale
- **transactions**: Charges added to client accounts
- **payments**: Payments received from clients
- **payment_alerts**: Due date tracking and notifications

## Color Scheme

- **Primary**: Black (#0a0a0a, #1a1a1a)
- **Secondary**: Green Terminal (#00ff41, #00cc33)
- **Accents**: Dark backgrounds with green highlights

## Development

```bash
# Run in development mode (with hot reload)
npm run dev

# Build frontend only
npm run build

# Build Windows executable
npm run build:electron
```

## Data Location

The SQLite database is stored in the app's user data directory:
- **Windows**: `%APPDATA%/GhostMoney/database.db`
- **macOS**: `~/Library/Application Support/GhostMoney/database.db`
- **Linux**: `~/.config/GhostMoney/database.db`

## Troubleshooting

### App won't start
- Ensure Node.js is installed and up to date
- Delete `node_modules` and run `npm install` again

### Database errors
- The database is created automatically on first run
- If corrupted, delete the database file (location above) and restart the app

### Export not working
- Ensure you have write permissions to the Documents folder
- Check that ExcelJS and PDFKit are properly installed

## License

MIT

## Support

For issues or questions, please contact your system administrator.
