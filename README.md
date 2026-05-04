# Terry Auto Service Platform

A professional business management platform built for Terry's auto service business. Built with the MERN stack (MongoDB, Express, React, Node.js).

## Features

### Admin Dashboard
- **Invoice Management**: Create, view, send, and track invoices
- **Expense Tracking**: Monitor business expenses
- **Quick Invoice Generation**: Generate invoices from templates
- **Email Marketing**: Send campaigns to customers

### Customer Portal
- **Account Access**: Login to view personal invoices
- **Appointment Booking**: Schedule service appointments with availability calendar
- **Contact Options**: Email or phone contact with business owner

### Core Features
- Secure JWT authentication
- Professional modern UI with Tailwind CSS
- Responsive design for all devices
- Email notifications and confirmations

## Tech Stack

- **Frontend**: React 18, TypeScript, Tailwind CSS, Shadcn/ui
- **Backend**: Node.js, Express, TypeScript
- **Database**: MongoDB (Atlas)
- **Email Service**: Resend or SendGrid
- **Deployment**: Vercel (Frontend), Railway/Render (Backend)

## Project Structure

```
terry-auto-service/
├── client/                 # React frontend application
│   ├── src/
│   │   ├── components/     # Reusable components
│   │   ├── pages/          # Page components
│   │   ├── hooks/          # Custom React hooks
│   │   ├── utils/          # Utility functions
│   │   └── App.tsx         # Main app component
│   └── package.json
├── server/                 # Express backend API
│   ├── src/
│   │   ├── routes/         # API routes
│   │   ├── models/         # MongoDB schemas
│   │   ├── controllers/    # Business logic
│   │   ├── middleware/     # Auth, error handling
│   │   └── app.ts          # Express app
│   └── package.json
├── shared/                 # Shared types and constants
├── .gitignore
├── package.json            # Root package.json
└── README.md
```

## Getting Started

### Prerequisites
- Node.js 18+
- MongoDB Atlas account (free tier available)
- Git

### Installation

```bash
# Install all dependencies
npm run install:all

# Or install individually
npm install
npm install --prefix client
npm install --prefix server
```

### Environment Setup

Create `.env` files for both client and server:

**server/.env**
```
MONGODB_URI=your_mongodb_atlas_uri
JWT_SECRET=your_jwt_secret_key
NODE_ENV=development
PORT=5000
FRONTEND_URL=http://localhost:3000
RESEND_API_KEY=your_resend_api_key
```

**client/.env.local**
```
VITE_API_URL=http://localhost:5000/api
```

### Development

```bash
# Run both client and server concurrently
npm run dev

# Or run separately
npm run dev:client
npm run dev:server
```

The application will be available at `http://localhost:3000`

## Building for Production

```bash
npm run build
```

## Deployment

### Frontend (Vercel)
1. Push to GitHub
2. Connect repo to Vercel
3. Auto-deploys on push

### Backend (Railway or Render)
1. Create account on Railway or Render
2. Connect GitHub repo
3. Set environment variables
4. Deploy

### Database (MongoDB Atlas)
1. Create free cluster on MongoDB Atlas
2. Create database user
3. Get connection string
4. Add to backend .env

## Free Hosting & Domain Strategy

- **Frontend**: Vercel (free tier)
- **Backend**: Railway or Render (free tier with credits)
- **Database**: MongoDB Atlas (512MB free tier)
- **Email**: Resend (100 emails/day free)
- **Domain**: Use subdomain on Vercel or Freenom for testing

## License

Proprietary - Built for Terry's Auto Service

## Support

For questions or issues, contact the development team.
