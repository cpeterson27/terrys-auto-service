# Terry Auto Service Platform - Development Instructions

## Project Overview
Professional MERN stack application for auto service business management. Includes admin dashboard, customer portal, invoice management, booking system, and email marketing capabilities.

## Architecture
- **Frontend**: React 18 + TypeScript + Tailwind CSS + Shadcn/ui
- **Backend**: Express + TypeScript + MongoDB
- **Structure**: Monorepo with separate client/server folders
- **Auth**: JWT-based authentication

## Development Guidelines

### Code Organization
- Keep components small and focused (single responsibility)
- Use TypeScript for type safety
- Reusable components go in `components/`
- Page-level components go in `pages/`
- Utility functions in `utils/`
- API calls in dedicated service files

### Styling
- Use Tailwind CSS utility classes
- Import Shadcn/ui components for consistent UI
- Follow modern minimal design principles
- Mobile-first responsive design

### Database Schema
- Design with MongoDB best practices
- Use appropriate indexing for performance
- Plan for scalability from the start

### API Design
- RESTful endpoints with clear naming
- Proper HTTP status codes
- Error handling middleware
- Request validation

### Authentication
- JWT tokens stored securely
- Refresh token rotation
- Separate admin and customer auth flows

## Build & Deploy Strategy
- Frontend: Vercel (free tier, auto-deploy from GitHub)
- Backend: Railway or Render (free tier)
- Database: MongoDB Atlas (free tier)
- Email: Resend API (free tier for testing)

## Key Priorities
1. Professional, clean, modern UI
2. Secure authentication and authorization
3. Fast, responsive performance
4. Easy for Terry to maintain and handoff
5. Scalable architecture for future additions
