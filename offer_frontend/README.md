# Offer Funnel Frontend

Modern Next.js frontend for the Offer Funnel sales management system.

## Features

- **Role-based Dashboards**: Separate interfaces for Admin and Zone users
- **Offer Management**: Create, track, and manage sales offers
- **Real-time Updates**: Live dashboard statistics
- **Responsive Design**: Mobile-first design with Tailwind CSS
- **Authentication**: Secure JWT-based authentication

## Tech Stack

- **Framework**: Next.js 13 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **UI Components**: Custom components with Radix UI primitives
- **State Management**: React Context API
- **HTTP Client**: Axios
- **Charts**: Chart.js & Recharts

## Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn
- Backend API running on port 5001

### Installation

1. Navigate to frontend directory:
```bash
cd "c:\KardexCare\offer funnel\frontend"
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
```bash
cp .env.example .env.local
# Edit .env.local with your API URL
```

4. Run the development server:
```bash
npm run dev
```

5. Open [http://localhost:3002](http://localhost:3002) in your browser.

## Project Structure

```
src/
├── app/              # Next.js app router pages
│   ├── admin/        # Admin dashboard pages
│   ├── auth/         # Authentication pages
│   └── zone/         # Zone user pages
├── components/       # Reusable components
│   └── ui/          # UI primitives
├── contexts/         # React contexts
├── hooks/           # Custom React hooks
├── lib/             # Utility functions
├── services/        # API services
└── types/           # TypeScript types
```

## Key Features

### Admin Dashboard
- View all offers across zones
- Create and manage offers
- Zone-wise analytics
- Customer insights

### Zone Dashboard
- View offers in assigned zone
- Update offer status and stage
- Track assigned offers
- Zone-specific analytics

## Login Credentials

### Development

- **Admin**: `admin@offerfunnel.com` / `admin123`
- **Zone User (Bangalore)**: `bangalore@offerfunnel.com` / `zone123`
- **Zone User (Mumbai)**: `mumbai@offerfunnel.com` / `zone123`

## Available Scripts

- `npm run dev` - Start development server on port 3002
- `npm run build` - Build for production
- `npm start` - Start production server
- `npm run lint` - Run ESLint

## API Integration

The frontend communicates with the backend API through the `apiService` in `src/services/api.ts`. All API calls include:

- Automatic JWT token handling
- Token refresh on 401 errors
- Error handling and logging

## Deployment

Build for production:
```bash
npm run build
```

The build output will be in the `.next` directory. The project is configured for standalone output for easy deployment.

## Environment Variables

- `NEXT_PUBLIC_API_URL` - Backend API URL (default: http://localhost:5001/api)

## License

ISC
