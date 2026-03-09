MAIN SYSTEM DIAGRAM
flowchart TD

%% ===== START =====
Start((Start))

%% ===== USER ENTRY =====
Start --> A[User Visits Platform]

A --> B{User Type}

%% =========================================
%% MARKETING LEAD FLOW
%% =========================================
B -->|Marketing Lead| C[Submit Lead Form]

C --> D[Create UserLead Record]

D --> E[DocAdmin Reviews Lead]

E --> F[Assign Relationship Manager]

F --> G[RM Contacts Lead]

G --> H{Lead Interested?}

H -->|No| I[Mark Lead LOST]
I --> End1((End))

H -->|Yes| J[Lead Registers Account]

%% =========================================
%% DIRECT USER REGISTRATION FLOW
%% =========================================
B -->|Direct Website User| J2[User Clicks Register]

J2 --> K2[Fill Registration Form]

K2 --> L2[Create User Account]

L2 --> K[Email Verification]

%% =========================================
%% CLIENT REGISTRATION
%% =========================================
J --> K

K --> L{Email Verified?}

L -->|No| K

L -->|Yes| M[Client Account Created]

%% =========================================
%% KYC PROCESS
%% =========================================
M --> N[Client Uploads KYC Documents]

N --> O[DocAdmin Reviews Documents]

O --> P{Documents Valid?}

P -->|Reject| Q[Send Rejection Notification]

Q --> N

P -->|Approve| R[KYC Verified]

%% =========================================
%% INVESTMENT ACCESS
%% =========================================
R --> S[Client Dashboard Access]

S --> T[Browse Investment Plans]

T --> U[Select Investment + Option]

U --> V[Submit Purchase Request]

%% =========================================
%% RM REVIEW
%% =========================================
V --> W[RM Reviews Request]

W --> X{Approve Request?}

X -->|Reject| Y[Notify Client of Rejection]

Y --> S

X -->|Approve| Z[RM Sets Payout Window]

Z --> AA[Send Request to DocAdmin]

%% =========================================
%% CONTRACT FINALIZATION
%% =========================================
AA --> AB[DocAdmin Uploads Contract]

AB --> AC[Finalize Purchase Request]

AC --> AD[Generate Payout Schedule]

AD --> AE[Investment Contract Active]

%% =========================================
%% PARALLEL OPERATIONS
%% =========================================
AE --> AF{Parallel Operations}

AF --> AG[Client Views Portfolio]

AF --> AH[System Schedules Payouts]

%% ===== END =====
AG --> End((End))
AH --> End

---


LEAD MANAGEMENT ACTIVITY DIAGRAM


flowchart TD

Start((Start))

Start --> A[Lead Submits Enquiry Form]

A --> B[Create UserLead Record]

B --> C[DocAdmin Reviews Lead]

C --> D[Assign Relationship Manager]

D --> E[RM Contacts Lead]

E --> F{Lead Status}

F -->|Contacted| G[Update Status CONTACTED]

G --> H{Interested?}

H -->|Yes| I[Mark Lead INTERESTED]
I --> J[Send Registration Link]

J --> K[User Registers]

K --> L[Lead Status → CONVERTED]

L --> End((End))

H -->|No| M[Mark Lead NOT_INTERESTED]
M --> N[Lead Status LOST]

N --> End


---

INVESTMENT PURCHASE ACTIVITY DIAGRAM


flowchart TD

Start((Start))

Start --> A[Client Selects Investment]

A --> B[Enter Investment Amount]

B --> C[Submit Purchase Request]

C --> D[System Creates Request Status PENDING]

D --> E[Notify RM]

E --> F[RM Reviews Request]

F --> G{Approve?}

G -->|Reject| H[Add Rejection Reason]
H --> I[Notify Client]
I --> End((End))

G -->|Approve| J[Set Payout Window 15 or 30]

J --> K[Update Status APPROVED]

K --> L[Send to DocAdmin]

L --> M[DocAdmin Uploads Contract]

M --> N[Verify Contract]

N --> O{Valid Contract?}

O -->|No| M

O -->|Yes| P[Finalize Request]

P --> Q[Contract Start Date Set]

Q --> R[Generate PayoutSchedule Records]

R --> S[Investment Active]

S --> End


---


PAYOUT PROCESSING ACTIVITY 




flowchart TD

Start((Start))

Start --> A[Daily Cron Job Trigger]

A --> B{Is Today 15th or 30th?}

B -->|No| C[Skip Processing]
C --> End((End))

B -->|Yes| D[Fetch Due PayoutSchedules]

D --> E{Schedule Exists?}

E -->|No| End

E -->|Yes| F[Create Payout Record]

F --> G[Status = PENDING]

G --> H[Show in DocAdmin Dashboard]

H --> I[DocAdmin Reviews Payout]

I --> J[Upload Receipt Document]

J --> K[Verify Receipt]

K --> L[Mark Payout COMPLETED]

L --> M[Create Transaction]

M --> N[Link Receipt + Transaction]

N --> O[Update Schedule isProcessed = true]

O --> P[Send Email to Client]

P --> Q[Client Views Receipt in Dashboard]

Q --> End


---


KYC TIME-BASED AUTOMATION DIAGRAM



flowchart TD

Start((Start))

Start --> A[User Email Verified]

A --> B[RM Assigned]

B --> C[Waiting for KYC Submission]

C --> D{Day 3}

D --> E[Send KYC Reminder Email]

E --> F{KYC Submitted?}

F -->|Yes| G[DocAdmin Verification]

G --> H{Approved?}

H -->|Yes| I[KYC Verified]
I --> End

H -->|No| C

F -->|No| J{Day 6}

J --> K[Send Final Reminder]

K --> L{Still No KYC?}

L -->|Yes| M{Day 7}

M --> N[Account Marked KYC_EXPIRED]

N --> O[Archive Client]

O --> End

L -->|No| G