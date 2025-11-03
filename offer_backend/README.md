# Offer Funnel Backend API

Backend API for managing sales offer funnel with zone-based access control.

## Features

- **Offer Management**: Create, track, and manage sales offers
- **Zone-based Access**: Admin and Zone user roles with appropriate permissions
- **Customer Integration**: Shared customer and service zone data with KardexCare
- **Excel Import**: Import offers from Excel files
- **RESTful API**: Standard REST endpoints for all operations
- **PostgreSQL Database**: Robust data persistence with Prisma ORM

## Tech Stack

- **Runtime**: Node.js with TypeScript
- **Framework**: Express.js
- **Database**: PostgreSQL
- **ORM**: Prisma
- **Authentication**: JWT

## Getting Started

### Prerequisites

- Node.js 18+ 
- PostgreSQL 14+
- npm or yarn

### Installation

1. Clone the repository and navigate to backend directory:
```bash
cd "c:\KardexCare\offer funnel\backend"
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
```bash
cp .env.example .env
# Edit .env with your database credentials
```

4. Run database migrations:
```bash
npm run prisma:migrate
```

5. Generate Prisma client:
```bash
npm run prisma:generate
```

### Development

Start the development server:
```bash
npm run dev
```

Server will run on http://localhost:5001

### Production

Build and start:
```bash
npm run build
npm start
```

## API Endpoints

### Authentication
- `POST /api/auth/login` - User login
- `POST /api/auth/logout` - User logout
- `POST /api/auth/refresh` - Refresh access token

### Offers (Admin & Zone)
- `GET /api/offers` - List offers (filtered by zone for zone users)
- `GET /api/offers/:id` - Get offer details
- `POST /api/offers` - Create new offer (admin only)
- `PUT /api/offers/:id` - Update offer
- `DELETE /api/offers/:id` - Delete offer (admin only)
- `PATCH /api/offers/:id/status` - Update offer status

### Dashboard
- `GET /api/admin/dashboard` - Admin dashboard stats
- `GET /api/zone/dashboard` - Zone dashboard stats

### Reports
- `GET /api/admin/reports/offers` - Generate offer reports
- `GET /api/zone/reports/offers` - Zone-specific offer reports

## Database Schema

See `prisma/schema.prisma` for the complete database schema.

## Roles

- **ADMIN**: Full access to all offers and zones
- **ZONE_USER**: Access to offers within assigned zones only

## Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm start` - Start production server
- `npm run prisma:studio` - Open Prisma Studio
- `npm run import:excel` - Import data from Excel
- `npm run analyze:excel` - Analyze Excel file structure

## License

ISC
