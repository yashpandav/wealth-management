1. Original PoC Scope vs. Expanded Scope
1.1 Original PoC Scope (As Defined)
The initial PoC was designed as a minimal demonstrable prototype with:
3 User Roles: Investor, RM, Admin (basic RBAC)
Simple Workflows: Portfolio view, withdrawal request, basic approval
No Email/Notification System
No Document Management
No Lifecycle State Management
No Contract Management
Timeline: 4-6 weeks
Effort Estimate: 320-400 development hours
1.2 Expanded Scope (Based on New Requirements)
The expanded scope now includes:
Feature Area
Original PoC
New Requirements
User Lifecycle Management
Simple user creation
6-stage lead-to-client pipeline with automated state transitions
DocAdmin Role & Workflows
Not included
Complete DocAdmin portal with 5 dedicated tabs, RM assignment, KYC verification, contract management
RM Dashboard Views
1 simple view
6 dedicated filtered views with status tracking and follow-up management
Time-Based KYC Rules
Not included
7-day automated timeline with reminder emails, account state changes, archival logic
Purchase & Payout low
Basic transaction
Multi-stage approval workflow including contract finalization and periodic interest payout management
Contract Management System
Not included
Contract creation, upload, validity tracking, signature collection, finalization, storage
Email Notification System
Not included
10+ automated email triggers across entire user journey
Product Page & Cart UI
Static product list
Interactive slider, real-time ROI calculator, FAQ system, dynamic calculations
Registration Without RM
Not considered
Conditional access logic, banner notifications, restricted functionality
Data Archival & Cleanup
Not included
Automated archival of expired KYC accounts to separate tables


2. Detailed Impact Analysis by Module
2.1 New Enquiry (Lead) Lifecycle Management
Original PoC: Direct user creation with immediate portfolio access.
New Requirements:
6-stage lifecycle: New Enquiry → RM Assigned → KYC Pending → KYC Approved → Contract Pending → Completed
State machine logic with validation rules at each transition
Automated state progression based on document submission and approval events
Historical state tracking and audit trail
Technical Implications:
Database schema redesign to accommodate lead lifecycle states
State transition engine with business rule validation
Workflow orchestration layer
Migration strategy for existing mock data
Additional Effort: 80-100 hours

2.2 DocAdmin Role & Dashboard (6 Dedicated Tabs)
Original PoC: Admin had basic CRUD operations only.
New Requirements:
Tab 1: New Enquiries
Display all leads with form data
RM assignment interface with dropdown/search
Lead status filtering and sorting
Tab 2: KYC Pending
Document preview interface
Verification checklist
Approve/Reject workflow with comments
Tab 3: Product Requested
Client-product mapping display
Investment amount details
Tab 4: Contract Pending
Contract upload interface
Product and terms selection UI
Pre-signed contract upload for RM and client signatures
Tab 5: Completed
Finalized contracts repository
Search and filter by client/date/product
Transaction creation trigger
Portfolio update automation
Tab 6: Pending Receipts (Payout Management)
Manage and finalize payout receipts for active contracts based on configured payout schedules.
Features:
List of contracts with pending payout receipts
Display payout details:
Client name
Contract ID
Payout period (monthly / quarterly)
Payout window (1–15 or 16–30)
Interest amount due


Upload payout receipt (PDF)
Mark payout as Completed
Auto-link receipt to:
Contract
Client portfolio
Transaction history
Prevent duplicate receipt uploads for the same payout cycle
Technical Implications
6 distinct UI components with unique data models
Dedicated Payout / Receipt entity linked to Contract
Secure document storage for receipts
PDF preview support
Permission-restricted DocAdmin actions
Integration with:
Contract engine
Portfolio engine
Transaction ledger
Email notification system
Additional Effort: 120-140 hours

2.3 Enhanced RM Dashboard (6 Dedicated Views)
Original PoC: Single view of assigned clients with basic portfolio data.
New Requirements:
View 1: Leads (Not Registered)
Contact information display
Follow-up notes system (CRUD)
Status management (New / Contacted / Interested / Lost)
Activity timeline
View 2: Registered Clients (No KYC)
Email verification status
Push KYC reminder button
Assignment confirmation
View 3: KYC Pending Clients
KYC Pending Clients list
Real-time KYC status from DocAdmin
Cannot approve (read-only)
View 4: Active Clients
Fully verified client list
View 5: Purchase Requests
Pending purchase approvals
Client details, product, amount
Approve/Reject with notes
View 6: Withdrawal Requests
Pending withdrawal approvals
Transaction history context
Approve/Reject workflow
Technical Implications:
6 independent data queries with optimized indexing
Real-time status synchronization across modules
Notes and activity tracking system
Responsive UI for each view with filtering/sorting
Permission checks for each action
Additional Effort: 100-120 hours

2.4 Time-Based KYC Rules & Automation
Original PoC: Manual KYC flow with no time constraints.
New Requirements:
Day 0: Email Verified
User can log in
RM is assigned (by DocAdmin)
Day 3
First KYC reminder email is sent
In-app alert is triggered
RM can contact the client
Day 6
Final reminder is sent, along with a deactivation warning
Day 7: Account State
Client cannot transact
Account is marked as KYC_EXPIRED

Technical Implications:
Background job scheduler (cron/queue-based)
Email service integration (SendGrid/AWS SES)
Database table for archived accounts
State change automation
Notification service with template management
Additional Effort: 60-80 hours

2.5 Multi-Stage Purchase Request Flow
Original PoC: Simple purchase creation with admin approval.
New Requirements:
Step-by-Step Flow:
Client Submission: Product selection + amount 
RM Review: Approve/Reject and decide the payout date.
Pre-Signed Contract Upload: DocAdmin uploads contracts pre-signed by RM and client after RM approval
Finalization: DocAdmin finalizes → Transaction created, portfolio updated
Contract Period Start: Same day as finalization
Interest Payout Cycle Begins:
Payout schedule activated based on contract configuration
Interest accrues and is distributed via DocAdmin-controlled payout workflow
Technical Implications:
Multi-stage approval engine with conditional routing
Transaction state management (Pending → RM Approved → Contract Uploaded → Pre-Signed → Finalized)
Contract validity period calculation
Portfolio update automation on finalization
Rollback mechanisms for rejected requests
Email notifications at each stage
Additional Effort: 80-100 hours

2.6 Contract Management System
Original PoC: No contract management.
New Requirements:
Pre-signed contract storage (separate field/version)
Product and terms association
Validity period tracking
Contract repository with search/filter
Contract expiry notifications (60 days before end date)
Technical Implications:
Document management system (DMS) integration
Secure storage with encryption
Metadata management (product, terms, validity)
Additional Effort: 70-90 hours

2.7 Comprehensive Email Notification System
Original PoC: No email system.
New Requirements - Email Triggers:
A. Client (End User) Emails
Registration & Verification:
Email verification
Welcome email and notification for KYC
KYC & Account Status:
KYC reminder – Day 3
KYC final reminder + deactivation warning – Day 6
KYC final + deactivation email (on account expiry)
KYC rejection notification
Document Verification Success
Transactions & Contracts:
Purchase request submitted
Purchase approved / rejected
Contract Created
Post-Investment & Payout:
Payout date reminder
Payout completed notification (with receipt)
Contract renewal reminder (60 days before expiry)
Withdrawal approved / escalated to Admin
B. Relationship Manager (RM) Emails
New lead assigned
Client registered but KYC pending
Purchase request received
Contract signed notification
Withdrawal request submitted by client
C. Document Admin (DocAdmin) Emails
KYC documents submitted by client
D. Admin Emails
Withdrawal request escalated by RM
Technical Implications:
Email service provider integration (SendGrid/AWS SES)
Template management system
Dynamic content rendering
Email queue management
Delivery tracking and retry logic
Email logs and audit trail
Additional Effort: 50-70 hours

2.8 Product Page & Cart UI Enhancements
Original PoC: Basic product list with details.
New Requirements:
Enhanced product listing with key details highlighted
Dedicated FAQ section per product
Interactive investment amount slider on cart page
Dynamic return projections with visual charts
Responsive and accessible UI
Technical Implications:
Advanced UI component library (charts, sliders)
Real-time calculation engine
FAQ management
Responsive design for mobile/tablet
Performance optimization for calculations
Additional Effort: 40-60 hours

2.9 Registration Without RM (Conditional Access)
Original PoC: Not considered.
New Requirements:
Client can log in after email verification
Can see product
Cannot request products or submit purchases
Banner notification: "RM not assigned / KYC pending"
Conditional UI rendering based on account state
Restricted navigation
Technical Implications:
Frontend permission middleware
Conditional rendering logic
Banner notification component
State-based route guards
Additional Effort: 20-30 hours

2.10 Data Archival & Cleanup Logic
Original PoC: No data archival.
New Requirements:	
After Day 7 (KYC expired), move user data to separate archive table
Do not send further emails to archived users
Reactivation workflow if user returns
Technical Implications:
Separate database table for archived accounts
Automated migration job
Data integrity maintenance
Reactivation logic and testing
Additional Effort: 30-40 hours

3. Payout Management & Interest Distribution System
Original PoC
No payout or interest distribution logic
No visibility of returns timeline
No accounting confirmation mechanism



New Requirements
The platform will support a controlled, role-based payout system that manages periodic interest distribution for active contracts in a transparent and auditable manner.
Relationship Manager (RM) determines the payout window during purchase approval.
DocAdmin executes and confirms payouts strictly based on the approved configuration.
Clients cannot manually withdraw interest or principal.
All interest payouts are DocAdmin-controlled, receipt-backed, and fully auditable.

Payout Configuration Flow
1. Payout Frequency (Defined by Product / Contract)
Monthly
Quarterly
This is derived from the selected product and stored in the contract.

2. Payout Window Selection (Selected by RM)
During purchase request approval, the RM selects the payout window based on:
Product request timing
Operational alignment


This payout window is:
Saved against the purchase request
Locked into the contract during finalization
Used for all future payout calculations

Payout Schedule Logic
Monthly Payouts
If payout window = 1–15 → payout occurs on 15th of every month
If payout window = 16–30 → payout occurs on 30th or last day of the month

Quarterly Payouts
Same payout window logic
Applied every 3 months from contract start date
Example:
Contract start month: January
Quarterly payout months: April, July, October
Payout date depends on selected window (15th or 30th)
Payout Execution Flow (DocAdmin-Controlled)
At the end of each payout cycle:
System automatically lists all contracts due for payout
DocAdmin reviews:
Contract details
Approved payout window
Calculated interest amount
DocAdmin uploads or generates a payout receipt
DocAdmin marks the payout as Completed
System records the payout against:
Contract
Client portfolio
Transaction history
Duplicate payouts for the same cycle are prevented.
B. Upload Flow (Step-by-Step)
DocAdmin opens Pending Receipts tab
Clicks Upload Receipt on a specific payout row
Modal opens with:
Client name (read-only)
Contract ID (read-only)
Payout period (Month / Quarter)
Interest amount (system-calculated, read-only)
DocAdmin uploads:


PDF / Image receipt


Clicks Confirm & Mark Paid



Client Dashboard Impact
Once a payout is marked Completed:
client can come to their dashboard and from their there will be option to download the receipt under the transaction
The client dashboard reflects:
Total interest earned
Payout history
Receipt download
Active contract status
Clients have read-only visibility and cannot initiate payouts.

Email & Notification Triggers
On payout completion:
Client receives an email:
 “Interest credited for your investment”
Payout receipt is attached
In-app notification is generated
DocAdmin
One email on 15th
One email on 30th

Technical Implications
New Payout data model linked to Contract
Payout status tracking: Pending → Completed
RM-selected payout window stored in contract metadata
Scheduled cron job to surface contracts due for payout
Secure receipt storage and PDF preview
Integration with:
Contract engine
Portfolio engine
Email notification system
Full audit logging for payout action
Additional Effort Estimate: 40–60 hours
4. Admin – Scope Changes & Current Responsibilities
4.1 RM Assignment Responsibility Shift
Earlier: Admin was responsible for assigning Relationship Managers (RMs) to clients.
Change Implemented:
 RM assignment responsibility has been moved from Admin to DocAdmin.
Current State:
Admin no longer assigns or manages RM-client mappings.
DocAdmin now handles RM assignment as part of the operational and document verification flow.
Impact:
Clear separation between system administration and operational execution.
Reduced operational load on Admin role.

4.2 Investment Plan & Option Management (Admin-Owned)
Admin users are now responsible for defining investment offerings, with strict safeguards to protect existing client investments.
Admin capabilities include:
Creating new Investment Plans.
Adding and managing Investment Options, including:
Duration
ROI
Payout frequency (Monthly / Quarterly)
Key Safeguard:
Any changes made by Admin do not affect existing client investments.
Once an investment option is used by a client:
Its financial terms are locked for that client.
Future changes apply only to new investments.	
