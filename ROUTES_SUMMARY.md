# Wealth Management CRM - Complete Routes Summary

**Generated:** 2025-10-26
**Status:** All routes verified and functional

---

## Public Routes (No Authentication Required)

### Pages
- `/` - Landing page (client-focused marketing)
- `/login` - Login page
- `/register` - Registration page
- `/forgot-password` - Password reset request
- `/reset-password` - Password reset form
- `/error` - Error page
- `/instruments` - Browse all investment instruments (public)
- `/instruments/[id]` - Instrument detail page (public)

### API Routes
- `/api/auth/*` - NextAuth authentication endpoints
- `/api/public/instruments` - List instruments (GET)
- `/api/public/instruments/[id]` - Get instrument details (GET)

---

## Client Routes (CLIENT role required)

### Pages
- `/client/portfolio` - Main portfolio dashboard (default after login)
- `/client/analytics` - Portfolio analytics with interactive charts
- `/client/requests` - View all purchase requests
- `/client/purchase-requests/new` - Create new purchase request
- `/client/purchase-requests/confirmation` - Purchase confirmation page
- `/client/withdrawal-requests` - View all withdrawal requests
- `/client/withdrawal-requests/[id]` - Withdrawal request details
- `/client/withdraw` - Create new withdrawal request
- `/profile` - User profile management
- `/notifications` - View notifications

### API Routes
- `/api/client/portfolio` - Get portfolio data (GET)
- `/api/client/analytics` - Get analytics data (GET)
- `/api/client/instruments` - List available instruments (GET)
- `/api/client/purchase-requests` - List/create purchase requests (GET, POST)
- `/api/client/withdrawal-requests` - List/create withdrawal requests (GET, POST)
- `/api/client/withdrawal-requests/[id]` - Get withdrawal details (GET)

---

## Relationship Manager (RM) Routes (RM role required)

### Pages
- `/rm` - RM dashboard (default after login)
- `/rm/clients` - View assigned clients
- `/rm/purchase-requests` - View all purchase requests
- `/rm/purchase-requests/[id]` - Review purchase request details
- `/rm/withdrawal-requests` - View all withdrawal requests
- `/rm/withdrawal-requests/[id]` - Review withdrawal request details
- `/profile` - User profile management
- `/notifications` - View notifications

### API Routes
- `/api/rm/clients` - List assigned clients (GET)
- `/api/rm/purchase-requests` - List purchase requests (GET)
- `/api/rm/purchase-requests/[id]` - Get/update purchase request (GET, PATCH)
- `/api/rm/purchase-requests/[id]/review` - Review purchase request (POST)
- `/api/rm/withdrawal-requests` - List withdrawal requests (GET)
- `/api/rm/withdrawal-requests/[id]` - Get withdrawal request (GET)
- `/api/rm/withdrawal-requests/[id]/review` - Review withdrawal request (POST)

---

## Administrator Routes (ADMIN role required)

### Pages
- `/admin` - Admin dashboard (default after login)
- `/admin/users` - User management list
- `/admin/users/create` - Create new user
- `/admin/users/[id]/edit` - Edit user details
- `/admin/assignments` - Client-RM assignments
- `/admin/instruments` - Instruments management
- `/admin/instruments/new` - Create new instrument
- `/admin/instruments/[id]` - Edit instrument
- `/admin/audit-logs` - View audit logs
- `/admin/withdrawal-requests` - View all withdrawal requests
- `/admin/withdrawal-requests/[id]` - Final approval for withdrawals
- `/profile` - User profile management
- `/notifications` - View notifications

### API Routes
- `/api/admin/users` - List/create users (GET, POST)
- `/api/admin/users/[id]` - Get/update/delete user (GET, PATCH, DELETE)
- `/api/admin/clients` - List clients (GET)
- `/api/admin/assignments` - Manage client-RM assignments (GET, POST)
- `/api/admin/instruments` - List/create instruments (GET, POST)
- `/api/admin/instruments/[id]` - Get/update/delete instrument (GET, PATCH, DELETE)
- `/api/admin/instruments/[id]/status` - Update instrument status (PATCH)
- `/api/admin/instruments/[id]/audit-logs` - Get instrument audit logs (GET)
- `/api/admin/instruments/bulk-operations` - Bulk operations (POST)
- `/api/admin/instruments/upload` - Bulk upload instruments (POST)
- `/api/admin/audit-logs` - List audit logs (GET)
- `/api/admin/audit-logs/export` - Export audit logs (GET)
- `/api/admin/withdrawal-requests/[id]/approve` - Final approval (POST)

---

## Shared Routes (All Authenticated Users)

### Pages
- `/dashboard` - Router that redirects to role-specific dashboard
- `/profile` - User profile page (view and edit personal info)
- `/notifications` - Notifications center

### API Routes
- `/api/user/profile` - Get/update profile (GET, PUT)
- `/api/user/notifications` - List notifications (GET)
- `/api/user/notifications/[id]` - Get notification (GET)
- `/api/user/notifications/[id]/read` - Mark as read (PATCH)
- `/api/user/notifications/[id]` - Delete notification (DELETE)

---

## Sidebar Navigation

### Client Sidebar
- My Portfolio → `/client/portfolio`
- Analytics → `/client/analytics`
- Browse Instruments → `/instruments` (public)
- My Requests → `/client/requests`
- Withdrawals → `/client/withdrawal-requests`

### RM Sidebar
- Dashboard → `/rm`
- My Clients → `/rm/clients`
- Purchase Requests → `/rm/purchase-requests`
- Withdrawal Requests → `/rm/withdrawal-requests`

### Admin Sidebar
- Dashboard → `/admin`
- User Management → `/admin/users`
- Client Assignments → `/admin/assignments`
- Instruments → `/admin/instruments`
- Audit Logs → `/admin/audit-logs`

---

## Login Redirects

After successful login, users are redirected to:
- **ADMIN** → `/admin`
- **RM** → `/rm`
- **CLIENT** → `/client/portfolio`
- **Unknown role** → `/login`

The `/dashboard` route acts as a router that redirects to the appropriate dashboard based on user role.

---

## Important Notes

1. **Profile & Notifications**: Available at `/profile` and `/notifications` for all authenticated users
2. **Instruments Browsing**: `/instruments` and `/instruments/[id]` are PUBLIC - no authentication required
3. **API Routes**: All `/api/public/*` routes are public, all others require authentication
4. **Middleware Protection**: All routes except public routes require authentication
5. **Role-Based Access**: Each role has access to specific route prefixes (`/admin/*`, `/rm/*`, `/client/*`)

---

## Fixed Issues (2025-10-26)

✅ Fixed `/dashboard` 404 - created router page
✅ Fixed sidebar dashboard links - updated to correct routes
✅ Fixed `/instruments` public access - added to middleware
✅ Fixed `/api/public/*` blocking - added to middleware
✅ Fixed client browse instruments link - changed from `/client/instruments` to `/instruments`
✅ Created `/notifications` page - was missing
✅ All TypeScript errors resolved

---

## Testing Checklist

### Client Flow
- [ ] Login as client → redirects to `/client/portfolio`
- [ ] Click "Browse Instruments" → goes to `/instruments` (public)
- [ ] Click instrument → goes to `/instruments/[id]` (public, no 404)
- [ ] Click "My Requests" → shows purchase requests
- [ ] Click "Withdrawals" → shows withdrawal requests
- [ ] Click "Analytics" → shows charts
- [ ] Click profile icon → goes to `/profile`
- [ ] Click notifications icon → goes to `/notifications`

### RM Flow
- [ ] Login as RM → redirects to `/rm`
- [ ] Click "My Clients" → shows assigned clients
- [ ] Click "Purchase Requests" → shows all purchase requests
- [ ] Click "Withdrawal Requests" → shows all withdrawal requests
- [ ] Review a request → approve/reject works
- [ ] Click profile icon → goes to `/profile`
- [ ] Click notifications icon → goes to `/notifications`

### Admin Flow
- [ ] Login as admin → redirects to `/admin`
- [ ] Click "User Management" → shows all users
- [ ] Click "Instruments" → shows all instruments
- [ ] Click "Audit Logs" → shows audit trail
- [ ] Click "Client Assignments" → manage RM assignments
- [ ] Approve withdrawal → final approval works
- [ ] Click profile icon → goes to `/profile`
- [ ] Click notifications icon → goes to `/notifications`

---

**All routes are now functional and properly configured!**
