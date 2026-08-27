# ⛽ Gas Station Management System (سیستم مدیریت تانک تیل)

> A complete offline Gas Station Management System designed for Afghan gas stations, supporting **Dari (دری)**, **Pashto (پښتو)**, and **English** with full RTL/LTR support.

![Next.js](https://img.shields.io/badge/Next.js-16-black) ![TypeScript](https://img.shields.io/badge/TypeScript-5-blue) ![SQLite](https://img.shields.io/badge/SQLite-Offline-green) ![Tailwind](https://img.shields.io/badge/Tailwind-CSS_4-38bdf8)

## ✨ Features

### 📊 Dashboard
- Real-time KPIs (today's sales, profit, expenses, transactions)
- Daily sales target with progress bar and projected total
- Sales vs Expenses comparison chart (7-day)
- Expense trend chart (14-day)
- Fuel price history with trend chart
- Profit margin analytics per fuel type
- Top customers and top fuel types rankings
- Tank level overview with mini circular gauges
- Weekly & monthly revenue comparison with growth %
- Live clock and auto-refreshing notifications

### 🛒 Sales Management
- Quick Sale POS-style checkout (floating action button)
- Full sale CRUD (create, edit, delete, receipt)
- Printable thermal receipts with pump readings
- Cash/Credit (نسیه) payment tracking
- Quick date filters (Today, 7 days, 30 days)
- CSV export with Excel UTF-8 support
- Sale table with footer totals and zebra striping

### 🛢️ Tank & Fuel Management
- Tank CRUD with circular gauge visualization
- Low stock alerts (warning/critical levels)
- Fuel type management with price history tracking
- Pump management with meter readings
- Fuel refill tracking with supplier linkage

### 👥 Customer Management
- Customer CRUD with credit (نسیه) balance tracking
- Payment recording (reduces balance)
- Customer detail view (profile, KPIs, charts, sales/payment history)
- Printable customer statements with running balance
- Top customers ranking

### 🏢 Supplier Management
- Supplier CRUD with payable balance tracking
- Payment recording to suppliers
- Linked to refills (auto-updates payable)

### 💰 Expenses
- Expense CRUD with category badges
- Quick date filters and CSV export
- Category breakdown (electricity, salary, maintenance, rent, transport, other)

### 📦 Products
- Product CRUD with stock tracking
- Low stock alerts with progress bars
- Category management (oil, lubricant, filter, accessory)

### 👨‍💼 Staff & Shifts
- Staff CRUD with positions (manager, attendant, accountant, guard)
- Shift management (start/end with opening/closing cash)
- Shift summary report with cash reconciliation
- Hourly activity chart per shift

### 📈 Reports
- Date range selector with quick presets
- Profit analysis chart (sales bars + profit line)
- Sales by fuel type breakdown
- Expense breakdown by category (pie chart)
- Detailed sales table
- CSV export

### ⚙️ Settings
- Station information management
- Daily target configuration
- Language switcher (Dari/Pashto/English)
- Theme toggle (light/dark)
- Data backup export (JSON)
- Data restore from backup
- Offline mode indicator

### 🎯 Additional Features
- **Command Palette** (Cmd/Ctrl+K) for instant navigation
- **Keyboard shortcuts** (D=Dashboard, S=Sales, T=Tanks, C=Customers, R=Reports)
- **Notifications dropdown** with low stock, high credit, and long shift alerts
- **Tri-lingual** support with full RTL for Dari and Pashto
- **Offline-first** architecture using SQLite
- **Responsive** design (mobile, tablet, desktop)

---

## 🚀 Installation Guide

### روش نصب / د نصب طریقه

#### Prerequisites | پیش‌نیازها | مخکینی اړتیاوې

1. **Node.js** (v18 or higher) - [Download](https://nodejs.org/)
2. **Bun** (runtime) - Install with:
   ```bash
   curl -fsSL https://bun.sh/install | bash
   ```

#### Step 1: Clone the Repository

```bash
git clone https://github.com/M-1-hashim/gas-station-management-system.git
cd gas-station-management-system
```

#### Step 2: Install Dependencies

```bash
bun install
```

#### Step 3: Set Up the Database

The project uses SQLite (offline, no internet needed). Set up the database:

```bash
# Create the database schema
bun run db:push
```

#### Step 4: Start the Development Server

```bash
bun run dev
```

The application will be available at `http://localhost:3000`

#### Step 5: Seed Demo Data (Optional)

Open your browser and visit the app. On first launch, it will automatically seed initial demo data (fuel types, tanks, pumps, customers, staff, products).

To generate additional historical data for charts:
- Visit `http://localhost:3000` - demo data auto-seeds on first load
- The dashboard will show populated charts and KPIs

---

### 📦 Production Build (For Real Installation)

To install this system permanently on a computer:

#### Step 1: Build the Project

```bash
bun run build
```

#### Step 2: Start the Production Server

```bash
bun run start
```

#### Step 3: Access the Application

Open your browser to `http://localhost:3000`

The application runs completely offline. All data is stored locally in SQLite.

---

### 🖥️ Desktop Installation (Optional)

To run as a desktop application:

1. Install **PM2** for process management:
   ```bash
   npm install -g pm2
   ```

2. Start the app with PM2:
   ```bash
   pm2 start "bun run start" --name gas-station
   pm2 save
   pm2 startup  # auto-start on boot
   ```

3. The app will now run continuously at `http://localhost:3000`

---

## 🗂️ Project Structure

```
src/
├── app/
│   ├── api/gas-station/     # API routes (REST)
│   │   ├── dashboard/       # Dashboard statistics
│   │   ├── sales/           # Sales CRUD
│   │   ├── tanks/           # Tank CRUD
│   │   ├── customers/       # Customer CRUD
│   │   ├── expenses/        # Expense CRUD
│   │   ├── shifts/          # Shift management
│   │   ├── suppliers/       # Supplier CRUD
│   │   ├── reports/         # Report generation
│   │   ├── alerts/          # Notification alerts
│   │   ├── price-history/   # Fuel price tracking
│   │   └── ...
│   ├── globals.css          # Global styles + RTL support
│   ├── layout.tsx           # Root layout
│   └── page.tsx             # Main page
├── components/
│   ├── gas-station/
│   │   ├── modules/         # 14 feature modules
│   │   ├── app-shell.tsx    # Main layout shell
│   │   ├── quick-sale-fab.tsx
│   │   ├── command-palette.tsx
│   │   ├── receipt.tsx
│   │   └── ...
│   └── ui/                  # shadcn/ui components
├── lib/
│   ├── db.ts                # Prisma database client
│   ├── i18n/                # Internationalization
│   │   ├── translations.ts  # 3 languages (en/da/ps)
│   │   └── store.ts         # Language state
│   ├── types.ts             # TypeScript types
│   └── format.ts            # Currency/date formatting
└── prisma/
    └── schema.prisma        # Database schema

```

---

## 🌍 Languages | ژبه‌ها | ژبې

| Language | Native | Direction |
|----------|--------|-----------|
| English  | English | LTR →     |
| Dari     | دری    | ← RTL     |
| Pashto   | پښتو   | ← RTL     |

---

## 🛠️ Tech Stack

| Technology | Purpose |
|-----------|---------|
| **Next.js 16** | React framework with App Router |
| **TypeScript 5** | Type-safe development |
| **Tailwind CSS 4** | Utility-first styling |
| **shadcn/ui** | Component library |
| **Prisma ORM** | Database ORM |
| **SQLite** | Offline local database |
| **Recharts** | Data visualization |
| **Zustand** | State management |
| **TanStack Query** | Server state management |
| **next-themes** | Dark/light mode |

---

## 📊 Database Schema

The system uses 15 Prisma models:
- Station, FuelType, Tank, Pump, Refill
- Sale, Customer, Payment, Supplier
- Expense, Product, ProductSale
- Staff, Shift, PriceHistory

---

## 🔒 Security Note

⚠️ **Important**: This system is designed for **offline local use**. Data is stored in SQLite on the local computer. 

- Make regular backups using Settings → Export Backup
- The system does not include authentication (single-user mode)
- For multi-user scenarios, add authentication middleware

---

## 📝 License

This project is open source and available for use.

---

## 🤝 Support

For questions or issues:
- Create an issue on GitHub
- Check the worklog.md for development history

---

**Built with ❤️ for Afghan gas stations**
**ساخته شده برای تانک‌های تیل افغانستان**
**د افغانستان د تیلو د ټانکونو لپاره جوړ شوی**
