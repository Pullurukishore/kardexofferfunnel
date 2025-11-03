# Offer Funnel - Sales Management System

A comprehensive sales offer funnel management system built with modern web technologies, designed to track and manage sales opportunities across multiple service zones.

## Overview

Offer Funnel is a full-stack application that helps organizations manage their sales pipeline with zone-based access control. It features separate interfaces for administrators and zone users, with complete offer lifecycle management from initial contact to closure.

## Key Features

### 🎯 Core Functionality
- **Offer Management**: Create, track, and manage sales offers throughout their lifecycle
- **Zone-Based Access**: Multi-zone support with role-based permissions
- **Customer Management**: Integrated customer and contact management
- **Status Tracking**: Comprehensive status and stage tracking for offers
- **Activity Logging**: Complete audit trail of all offer-related activities
- **Dashboard Analytics**: Real-time statistics and insights

### 👥 User Roles

#### Admin
- Full access to all zones and offers
- Create and manage offers across all zones
- View comprehensive analytics
- Manage users and zones

#### Zone User
- Access to assigned zone only
- Update offer status and stages
- View zone-specific analytics
- Manage offers within zone

## Technology Stack

### Backend
- **Runtime**: Node.js with TypeScript
- **Framework**: Express.js
- **Database**: PostgreSQL
- **ORM**: Prisma
- **Authentication**: JWT with refresh tokens
- **Validation**: Express Validator & Joi

### Frontend
- **Framework**: Next.js 13 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **UI Components**: Radix UI primitives
- **State**: React Context API
- **HTTP**: Axios

## Project Structure

```
offer funnel/
├── backend/                    # Backend API
│   ├── src/
│   │   ├── controllers/       # Route controllers
│   │   ├── routes/           # API routes
│   │   ├── middleware/       # Auth & validation middleware
│   │   ├── services/         # Business logic services
│   │   ├── lib/             # Utilities (Prisma client)
│   │   └── utils/           # Helper functions
│   ├── prisma/
│   │   └── schema.prisma    # Database schema
│   ├── scripts/             # Seed & import scripts
│   └── package.json
│
├── frontend/                  # Frontend application
│   ├── src/
│   │   ├── app/             # Next.js pages
│   │   │   ├── admin/       # Admin dashboard
│   │   │   ├── auth/        # Authentication
│   │   │   └── zone/        # Zone dashboard
│   │   ├── components/      # React components
│   │   ├── contexts/        # React contexts
│   │   ├── services/        # API services
│   │   ├── lib/            # Utilities
│   │   └── types/          # TypeScript types
│   └── package.json
│
└── SETUP.md                  # Setup instructions
```

## Quick Start

### Prerequisites
- Node.js 18+
- PostgreSQL 14+
- npm or yarn

### Installation

1. **Clone or navigate to the project:**
```bash
cd "c:\KardexCare\offer funnel"
```

2. **Set up backend:**
```bash
cd backend
npm install
cp .env.example .env
# Edit .env with your database credentials
npm run prisma:generate
npm run prisma:migrate
npx ts-node scripts/seed.ts
npm run dev
```

3. **Set up frontend:**
```bash
cd ../frontend
npm install
cp .env.example .env.local
npm run dev
```

4. **Access the application:**
- Frontend: http://localhost:3002
- Backend API: http://localhost:5001
- Login: admin@offerfunnel.com / admin123

For detailed setup instructions, see [SETUP.md](./SETUP.md)

## Database Schema

### Core Models

- **User**: Admin and zone user accounts
- **ServiceZone**: Geographic/organizational zones
- **Customer**: Customer companies
- **Contact**: Customer contact persons
- **Offer**: Sales offers with full lifecycle tracking
- **OfferProduct**: Products/services in offers
- **OfferNote**: Notes and comments
- **OfferStatusHistory**: Status change tracking
- **AuditLog**: Complete audit trail

## API Endpoints

### Authentication
- `POST /api/auth/login` - User login
- `POST /api/auth/logout` - User logout
- `POST /api/auth/refresh` - Refresh access token
- `GET /api/auth/me` - Get current user

### Offers
- `GET /api/offers` - List offers (zone-filtered)
- `GET /api/offers/:id` - Get offer details
- `POST /api/offers` - Create offer (admin only)
- `PUT /api/offers/:id` - Update offer
- `PATCH /api/offers/:id/status` - Update status
- `DELETE /api/offers/:id` - Delete offer (admin only)
- `POST /api/offers/:id/notes` - Add note

### Dashboard
- `GET /api/dashboard/admin` - Admin dashboard stats
- `GET /api/dashboard/zone` - Zone dashboard stats

## Features in Detail

### Offer Lifecycle

1. **Initial Contact** - First contact with customer
2. **Requirement Gathering** - Understanding needs
3. **Proposal Sent** - Formal proposal submitted
4. **Demo Scheduled/Completed** - Product demonstration
5. **Negotiation** - Price and terms discussion
6. **Final Approval** - Awaiting approval
7. **Contract Sent** - Contract documentation sent
8. **Won/Lost** - Final outcome

### Status Types

- **OPEN**: New opportunity
- **IN_PROGRESS**: Active discussions
- **QUOTED**: Formal quote provided
- **NEGOTIATION**: Terms being negotiated
- **WON**: Successfully closed
- **LOST**: Opportunity lost
- **ON_HOLD**: Temporarily paused
- **CANCELLED**: Cancelled by either party

### Dashboard Statistics

- Total offers count
- Open offers
- Won/Lost ratio
- Win rate percentage
- Total estimated value
- Actual won value
- Zone-wise distribution
- Stage-wise breakdown

## Security Features

- JWT-based authentication
- Refresh token rotation
- Role-based access control (RBAC)
- Zone-level data isolation
- Password hashing with bcrypt
- SQL injection prevention (Prisma)
- CORS configuration
- Request validation

## Data Import

Import existing offer data from Excel:

```bash
cd backend
npm run analyze:excel  # Analyze Excel structure
npm run import:excel   # Import data
```

The import script supports:
- Multiple worksheets (one per zone)
- Automatic customer creation
- Contact management
- Status mapping
- Duplicate detection

## Development

### Backend Development

```bash
cd backend
npm run dev          # Start dev server
npm run build        # Build for production
npm run prisma:studio # Open Prisma Studio
```

### Frontend Development

```bash
cd frontend
npm run dev    # Start dev server
npm run build  # Build for production
npm run lint   # Run ESLint
```

## Environment Variables

### Backend (.env)
```env
DATABASE_URL=postgresql://user:password@localhost:5432/offer_funnel
PORT=5001
NODE_ENV=development
CORS_ORIGIN=http://localhost:3002
JWT_SECRET=your-secret-key
REFRESH_TOKEN_SECRET=your-refresh-secret
```

### Frontend (.env.local)
```env
NEXT_PUBLIC_API_URL=http://localhost:5001/api
```

## Default Credentials

| Role | Email | Password |
|------|-------|----------|
| Admin | admin@offerfunnel.com | admin123 |
| Zone User | bangalore@offerfunnel.com | zone123 |
| Zone User | mumbai@offerfunnel.com | zone123 |

**⚠️ Change these credentials in production!**

## Deployment

### Production Checklist

1. Update environment variables with production values
2. Set strong JWT secrets
3. Configure production database
4. Enable HTTPS
5. Set NODE_ENV=production
6. Configure proper CORS origins
7. Set up logging and monitoring
8. Back up database regularly

### Build Commands

```bash
# Backend
cd backend
npm run build
npm start

# Frontend
cd frontend
npm run build
npm start
```

## Integration with KardexCare

This project shares the following with KardexCare:

- **Customer Database**: Same customer records
- **Service Zones**: Identical zone structure
- **User Roles**: Compatible role system (Admin & Zone User)
- **Authentication**: Similar JWT-based auth

Both systems can operate independently or share the same database for customers and zones.

## Customization

### Adding New Offer Stages

Edit `prisma/schema.prisma`:
```prisma
enum OfferStage {
  // Add new stages here
  YOUR_NEW_STAGE
}
```

Then migrate: `npm run prisma:migrate`

### Adding Custom Fields

Modify the Offer model in `prisma/schema.prisma` and create migrations.

## Troubleshooting

### Database Connection Issues
- Verify PostgreSQL is running
- Check DATABASE_URL format
- Ensure database exists

### CORS Errors
- Verify CORS_ORIGIN in backend .env
- Check frontend URL matches

### Build Errors
- Clear node_modules and reinstall
- Check Node.js version (18+)
- Verify TypeScript version

## Performance

- Database queries optimized with Prisma
- Zone-based filtering for scalability
- Indexed columns for fast searches
- Pagination for large datasets
- Minimal API payload sizes

## License

ISC

## Support

For issues or questions:
1. Check SETUP.md for detailed setup
2. Review logs in backend/logs/
3. Check API documentation in backend/README.md

---

**Built with ❤️ using modern web technologies**
