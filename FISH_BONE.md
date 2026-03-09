# Investment & Payout System Factors

flowchart LR

Effect([Successful Investment Lifecycle<br/>Lead → Client → Investment → Payout])

%% Main Bones
A[User Management]
B[Document Verification]
C[Investment Configuration]
D[Purchase Workflow]
E[Payout Processing]
F[System Infrastructure]

%% Connect to effect
A --> Effect
B --> Effect
C --> Effect
D --> Effect
E --> Effect
F --> Effect

%% Sub causes

%% User Management
A1[Lead Capture]
A2[RM Assignment]
A3[Client Registration]
A4[KYC Status Tracking]

A1 --> A
A2 --> A
A3 --> A
A4 --> A

%% Document Verification
B1[Document Upload]
B2[KYC Verification]
B3[Rejection Handling]
B4[Compliance Checks]

B1 --> B
B2 --> B
B3 --> B
B4 --> B

%% Investment Configuration
C1[Investment Plans]
C2[Investment Options]
C3[ROI Calculation]
C4[Product Activation]

C1 --> C
C2 --> C
C3 --> C
C4 --> C

%% Purchase Workflow
D1[Client Purchase Request]
D2[RM Approval]
D3[Payout Window Selection]
D4[Contract Upload]

D1 --> D
D2 --> D
D3 --> D
D4 --> D

%% Payout Processing
E1[Payout Schedule Generation]
E2[Cron Job Trigger]
E3[Receipt Upload]
E4[Transaction Creation]

E1 --> E
E2 --> E
E3 --> E
E4 --> E

%% System Infrastructure
F1[Database Integrity]
F2[Notification System]
F3[Audit Logging]
F4[Email Service]

F1 --> F
F2 --> F
F3 --> F
F4 --> F