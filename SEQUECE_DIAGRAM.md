User Registration


sequenceDiagram
participant Visitor
participant Website
participant System
participant DocAdmin
participant RM
participant Database

Visitor->>Website: Submit Lead Form
Website->>System: POST /user-form
System->>Database: Create UserLead (status: NEW)

System->>DocAdmin: Notify new enquiry

DocAdmin->>System: Assign RM
System->>Database: Update UserLead.assignedRMId

System->>RM: Notify lead assigned

RM->>Visitor: Contact lead

alt Interested
RM->>System: Update LeadStatus = INTERESTED
Visitor->>Website: Register Account
Website->>System: Create User
System->>Database: Save User
System->>Database: Link UserLead.userId
else Not Interested
RM->>System: Update LeadStatus = LOST
end

---

Purchase Request → RM Approval → Contract Creation

sequenceDiagram
participant Client
participant Frontend
participant System
participant RM
participant DocAdmin
participant Database

Client->>Frontend: Submit Purchase Request
Frontend->>System: POST /purchase-request

System->>Database: Create ProductPurchaseRequest (PENDING)

System->>RM: Notify purchase request

RM->>System: Review request

alt Approved
RM->>System: Approve request
RM->>System: Set payout window (15 or 30)
System->>Database: Update request status APPROVED

System->>DocAdmin: Send for contract creation

DocAdmin->>System: Upload contract document

System->>Database: Save Document
System->>Database: Update request COMPLETED

System->>System: Generate PayoutSchedules
System->>Client: Notify investment activated

else Rejected
RM->>System: Reject request
System->>Database: Update request REJECTED
System->>Client: Notify rejection
end


---


Contract Finalization + Schedule Generation


sequenceDiagram

participant DocAdmin
participant System
participant Client
participant Database

DocAdmin->>System: Upload Pre-Signed Contract

System->>Database: Store Contract Document

DocAdmin->>System: Finalize Purchase Request

System->>System: Update Status → COMPLETED

System->>System: Set Contract Start Date

System->>System: Generate PayoutSchedule Records

System->>Client: Notify Investment Activated


---

Interest Payout Processing Flow

sequenceDiagram

participant CronJob
participant System
participant DocAdmin
participant Client

CronJob->>System: Daily Payout Scheduler

System->>System: Check PayoutSchedules

loop For Each Due Schedule
    System->>System: Create Payout Record (PENDING)
end

System->>DocAdmin: Notify Pending Payouts

DocAdmin->>System: Review Payout
DocAdmin->>System: Upload Receipt

DocAdmin->>System: Mark Payout COMPLETED

System->>System: Create Transaction (INTEREST_PAYOUT)

System->>Client: Send Payout Notification


---

Admin Investment Plan Management

sequenceDiagram
    participant Admin
    participant AdminPanel
    participant InvestmentService
    participant Database

    Admin->>AdminPanel: Create Investment Plan
    AdminPanel->>InvestmentService: POST /investments
    InvestmentService->>Database: Create Investment

    Admin->>AdminPanel: Add Investment Option
    AdminPanel->>InvestmentService: POST /investment-options
    InvestmentService->>Database: Create InvestmentOption

    Note over InvestmentService,Database: Existing client contracts\nremain unchanged