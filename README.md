# Terry's Auto Service Platform

Business website, customer portal, and admin dashboard for Terry's Auto Service.

## What It Does

- Public homepage with service information, contact form, and gallery media.
- Customer signup/login with email verification, password reset, and customer portal.
- Appointment booking, rescheduling, cancellation, and admin appointment management.
- Admin dashboard for invoices, expenses, customers, messages, settings, and gallery content.
- Gallery manager with Cloudinary image/video uploads and multiple media files per gallery card.
- Resend-powered transactional email for verification, password reset, booking, and admin notifications.
- Klaviyo email marketing opt-in during customer signup.

## Tech Stack

- Frontend: React 18, TypeScript, Vite, Tailwind CSS, lucide-react, Vercel Analytics
- Backend: Node.js 20, Express, TypeScript, MongoDB/Mongoose
- Media: Cloudinary
- Email: Resend
- Marketing: Klaviyo
- Deployment: Vercel for the client, Render-compatible Node server for the API

## Project Structure

```text
.
├── client/                 # React/Vite frontend
│   ├── src/components/     # Shared UI such as Navbar and ProtectedRoute
│   ├── src/pages/          # Public, customer, and admin pages
│   └── src/lib/api.ts      # Axios API client
├── server/                 # Express API
│   ├── src/models/         # Mongoose models
│   ├── src/routes/         # API routes
│   ├── src/controllers/    # Request handlers and business workflow logic
│   ├── src/scripts/        # Admin seed, smoke test, Cloudinary check
│   └── src/utils/          # Email, invoice, Klaviyo, Cloudinary helpers
└── package.json            # Root scripts
```

## Environment Variables

Create `server/.env`:

```env
NODE_ENV=development
PORT=5000
MONGODB_URI=mongodb+srv://...
JWT_SECRET=replace-with-a-long-random-secret
FRONTEND_URL=http://localhost:3000

RESEND_API_KEY=re_...
ADMIN_EMAIL=terry.tucker63@yahoo.com
ADMIN_PASSWORD=replace-for-seed-and-smoke-tests
ADMIN_PHONE=
BUSINESS_PHONE=

CLOUDINARY_CLOUD_NAME=...
CLOUDINARY_API_KEY=...
CLOUDINARY_API_SECRET=...
# Or use CLOUDINARY_URL instead of the three separate Cloudinary values.

KLAVIYO_API_KEY=pk_or_private_key_from_klaviyo
KLAVIYO_MARKETING_LIST_ID=list_id_for_marketing_subscribers
```

Create `client/.env.local`:

```env
VITE_API_URL=http://localhost:5000/api
```

For production, set `FRONTEND_URL` to the live site origin, and set `VITE_API_URL` to the live API URL ending in `/api`.

## Klaviyo Welcome Email Setup

Use Klaviyo's **Create welcome series** option under Flows.

The app sends opted-in signup customers to Klaviyo only when they check:

```text
Yes, I want to receive deals, service reminders, and special offers from Terry's Auto Service.
```

The backend subscribes that customer to `KLAVIYO_MARKETING_LIST_ID`. In Klaviyo, set the welcome flow trigger to that same list, usually shown as **When someone subscribes to List** or **Subscribed to newsletter/list**. Build the welcome email inside that flow and turn it live when ready.

## Local Development

Install dependencies:

```bash
npm run install:all
```

Run client and server together:

```bash
npm run dev
```

Or run them separately:

```bash
npm run dev:client
npm run dev:server
```

Default local URLs:

- Client: `http://localhost:3000`
- API: `http://localhost:5000/api`
- Health check: `http://localhost:5000/api/health`

## Useful Commands

```bash
npm run build
npm run build:client
npm run build:server
npm start
npm run seed:admin --prefix server
npm run check:cloudinary --prefix server
npm run smoke:api --prefix server
npm run test:schemas --prefix server
```

Notes:

- `seed:admin` requires `ADMIN_PASSWORD` and creates/updates the Terry admin account.
- `check:cloudinary` verifies Cloudinary credentials and upload permissions.
- `smoke:api` requires `ADMIN_PASSWORD` and exercises the API against the configured database/API URL.

## Deployment Checklist

- Client deployed on Vercel with `VITE_API_URL` set to the production API.
- API deployed with all server environment variables set.
- MongoDB Atlas connection string added to the API environment.
- Resend API key configured and sending domain verified.
- Cloudinary credentials configured and `npm run check:cloudinary --prefix server` passes.
- Klaviyo API key and marketing list ID configured.
- Klaviyo welcome flow uses the same list ID as `KLAVIYO_MARKETING_LIST_ID`.
- `FRONTEND_URL` includes the live website origin for CORS and email links.
- Run `npm run build` before handoff.

## Terry Handoff Notes

Terry can use the admin dashboard to manage:

- Appointments from `/dashboard`
- Invoices from `/invoices`
- Expenses from `/expenses`
- Customers from `/customers`
- Homepage/gallery media from `/gallery`
- Contact form submissions from `/messages`
- Business profile/settings from `/profile`

Customer-facing flows are:

- Signup/login at `/login`
- Email verification from the emailed link
- Customer portal at `/portal`
- Booking management at `/bookings`

## License

Proprietary. Built for Terry's Auto Service.
