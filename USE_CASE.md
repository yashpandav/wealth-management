# Use Case Diagrams — EMDEE Ventures Wealth Management CRM

---

## 1. Public Visitor Use Cases

```mermaid
flowchart LR

    Visitor((Public\nVisitor))

    subgraph System ["Wealth Management System"]
        UC1[Submit Enquiry Form]
        UC2[Enter Contact Details\nName · Email · Phone]
        UC3[Select Lead Source\nInstagram / YouTube / Referral…]
        UC4[Enter RM Reference\nOptional]
        UC5[Lead Created in System]
        UC6[Await RM Contact]
        UC7[Register Account\n/register]
        UC8[Verify Email Address]
    end

    Visitor --> UC1
    UC1 --> UC2
    UC1 --> UC3
    UC1 --> UC4
    UC2 --> UC5
    UC5 --> UC6
    UC6 --> UC7
    UC7 --> UC8
```

---

## 2. Client Use Cases

```mermaid
flowchart LR

    Client((Client))

    subgraph System ["Wealth Management System"]
        direction TB

        subgraph Auth ["Authentication"]
            UC1[Login / Logout]
            UC2[Change Password]
            UC3[Update Profile]
        end

        subgraph KYC ["KYC & Verification"]
            UC4[Upload Identity Document]
            UC5[Upload Investment Agreement]
            UC6[Track Verification Status]
        end

        subgraph Investment ["Investment"]
            UC7[Browse Investment Plans]
            UC8[View Plan Details & ROI]
            UC9[Submit Purchase Request]
            UC10[Track Request Status\nWM-xxxx]
        end

        subgraph Portfolio ["Portfolio & Analytics"]
            UC11[View Active Portfolio]
            UC12[View Analytics Dashboard]
            UC13[Track Payout History]
            UC14[Download Payout Receipt]
            UC15[View Contracts]
        end

        subgraph Notifications ["Notifications"]
            UC16[View In-App Notifications]
            UC17[View My RM Details]
        end
    end

    Client --> UC1
    Client --> UC2
    Client --> UC3
    Client --> UC4
    Client --> UC5
    Client --> UC6
    Client --> UC7
    Client --> UC8
    Client --> UC9
    Client --> UC10
    Client --> UC11
    Client --> UC12
    Client --> UC13
    Client --> UC14
    Client --> UC15
    Client --> UC16
    Client --> UC17
```

---

## 3. Relationship Manager (RM) Use Cases

```mermaid
flowchart LR

    RM((Relationship\nManager))

    subgraph System ["Wealth Management System"]
        direction TB

        subgraph Leads ["Lead Management"]
            UC1[View Assigned Leads]
            UC2[Update Lead Status\nContacted/Interested/Lost]
        end

        subgraph Clients ["Client Management"]
            UC3[View Registered Clients]
            UC4[View KYC Pending Clients]
            UC5[View Active Clients\nFully verified + invested]
            UC6[View Client Portfolio Details]
        end

        subgraph Requests ["Purchase Requests"]
            UC7[View Pending Purchase Requests]
            UC8[Approve Purchase Request\n+ Set Payout Window]
            UC9[Reject Purchase Request\n+ Give Reason]
        end

        subgraph Payouts ["Payouts"]
            UC10[View Pending Payouts]
            UC11[View Client Payout History]
        end

        subgraph Dashboard ["Dashboard"]
            UC12[View My Performance Dashboard\nClients · AUM · Approval Rate]
        end
    end

    RM --> UC1
    RM --> UC2
    RM --> UC3
    RM --> UC4
    RM --> UC5
    RM --> UC6
    RM --> UC7
    RM --> UC8
    RM --> UC9
    RM --> UC10
    RM --> UC11
    RM --> UC12
```

---

## 4. Document Admin (DocAdmin) Use Cases

```mermaid
flowchart LR

    DA((DocAdmin))

    subgraph System ["Wealth Management System"]
        direction TB

        subgraph Leads ["Lead Assignment"]
            UC1[View New Enquiries]
            UC2[Assign RM to Lead]
        end

        subgraph KYC ["KYC Document Management"]
            UC3[View Pending/Under-Review Documents]
            UC4[Verify KYC Document]
            UC5[Reject KYC Document with Reason]
            UC6[Update Client Verification Status]
        end

        subgraph Contracts ["Investment Contract Processing"]
            UC7[View RM-Approved Requests]
            UC8[Upload Investment Agreement]
            UC9[Finalize Contract\nActivates Investment]
        end

        subgraph Payouts ["Payout Processing"]
            UC10[View Due Payouts]
            UC11[Upload Payout Receipt/Proof]
            UC12[Mark Payout as Completed]
        end
    end

    DA --> UC1
    DA --> UC2
    DA --> UC3
    DA --> UC4
    DA --> UC5
    DA --> UC6
    DA --> UC7
    DA --> UC8
    DA --> UC9
    DA --> UC10
    DA --> UC11
    DA --> UC12
```

---

## 5. Admin Use Cases

```mermaid
flowchart LR

    Admin((Admin))

    subgraph System ["Wealth Management System"]
        direction TB

        subgraph Users ["User Management"]
            UC1[Create New User\nAny Role]
            UC2[Activate / Deactivate User]
            UC3[View All Users]
        end

        subgraph RMs ["RM Management"]
            UC4[Assign Client to RM]
            UC5[Reassign Client to New RM]
            UC6[Monitor RM Performance\nClients · AUM · Approval Rate]
        end

        subgraph Plans ["Investment Plan Management"]
            UC7[Create Investment Tier\nAED 50K–99K etc]
            UC8[Add Investment Option\nDuration · ROI · Frequency]
            UC9[Activate / Deactivate Investment Plan]
            UC10[Edit Investment Option]
        end

        subgraph Analytics ["System Analytics & Monitoring"]
            UC11[View Admin Dashboard\nPlatform AUM · Clients · Transactions]
            UC12[View Purchase Requests]
            UC13[View Audit Logs]
        end
    end

    Admin --> UC1
    Admin --> UC2
    Admin --> UC3
    Admin --> UC4
    Admin --> UC5
    Admin --> UC6
    Admin --> UC7
    Admin --> UC8
    Admin --> UC9
    Admin --> UC10
    Admin --> UC11
    Admin --> UC12
    Admin --> UC13
```

---

## 6. Automated Payout System Use Case

```mermaid
flowchart LR

    Cron((Cron Job\nDaily 2AM))
    DA((DocAdmin))
    Client((Client))

    subgraph System ["Wealth Management System — Payout Module"]
        UC1[Scan Due PayoutSchedules]
        UC2[Create Pending Payout Records]
        UC3[Notify DocAdmin of Due Payouts]
        UC4[DocAdmin Reviews Payout Queue]
        UC5[Upload Payment Receipt]
        UC6[Mark Payout COMPLETED]
        UC7[Create INTEREST_PAYOUT Transaction]
        UC8[Create Notification for Client]
        UC9[Send Payout Email to Client]
        UC10[Client Views Payout History]
        UC11[Client Downloads Receipt]
    end

    Cron --> UC1
    UC1 --> UC2
    UC2 --> UC3
    UC3 --> UC4
    DA --> UC4
    DA --> UC5
    DA --> UC6
    UC6 --> UC7
    UC7 --> UC8
    UC8 --> UC9
    Client --> UC10
    Client --> UC11
```
