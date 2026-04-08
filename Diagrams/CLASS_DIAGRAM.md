# Class Diagrams — EMDEE Ventures Wealth Management CRM

---

## 1. Core System Class Diagram

```mermaid
classDiagram

    class User {
        +UUID id
        +String email
        +String password
        +UserRole role
        +String firstName
        +String lastName
        +String? phone
        +AccountStatus status
        +Boolean isActive
        +Boolean emailVerified
        +Int failedLoginAttempts
        +DateTime? accountLockedUntil
        +DateTime? lastLogin
        +Boolean isArchived
        +DateTime createdAt
        +DateTime updatedAt
    }

    class Client {
        +UUID id
        +UUID userId
        +UUID? assignedRMId
        +VerificationStatus verificationStatus
        +String? riskTolerance
        +String? investmentGoals
        +Boolean kycVerified
        +DateTime assignedAt
        +DateTime updatedAt
    }

    class RelationshipManager {
        +UUID id
        +UUID userId
        +String? specialization
        +String? certifications
        +Int? maxClientLimit
        +Decimal totalAUM
        +DateTime createdAt
        +DateTime updatedAt
    }

    class UserLead {
        +UUID id
        +String firstName
        +String lastName
        +String email
        +String phoneNumber
        +LeadSource leadSource
        +String? rmReference
        +LeadStatus status
        +UUID? assignedRMId
        +UUID? userId
        +DateTime createdAt
    }

    class Investment {
        +UUID id
        +String name
        +String? description
        +Decimal minAmount
        +Decimal? maxAmount
        +String currency
        +Int displayOrder
        +Boolean isActive
        +DateTime createdAt
    }

    class InvestmentOption {
        +UUID id
        +UUID investmentId
        +String duration
        +String withdrawalFrequency
        +Decimal roi
        +Decimal annualReturn
        +Int displayOrder
        +Boolean isActive
    }

    class ProductPurchaseRequest {
        +UUID id
        +String trackingNumber
        +UUID clientId
        +UUID investmentId
        +UUID investmentOptionId
        +Decimal amount
        +RequestStatus status
        +UUID? assignedRMId
        +DateTime? processedAt
        +String? payoutWindow
        +UUID? contractDocumentId
        +DateTime? contractStartDate
        +DateTime? completedAt
        +String? rejectionReason
        +DateTime createdAt
    }

    class PayoutSchedule {
        +UUID id
        +UUID productPurchaseRequestId
        +UUID clientId
        +DateTime scheduledDate
        +DateTime periodStart
        +DateTime periodEnd
        +Decimal interestAmount
        +Boolean isProcessed
        +DateTime createdAt
    }

    class Payout {
        +UUID id
        +UUID productPurchaseRequestId
        +UUID payoutScheduleId
        +UUID clientId
        +Decimal amount
        +DateTime periodStart
        +DateTime periodEnd
        +DateTime scheduledDate
        +PayoutStatus status
        +UUID? processedById
        +DateTime? processedAt
        +UUID? receiptDocumentId
    }

    class Transaction {
        +UUID id
        +UUID clientId
        +TransactionType type
        +TransactionStatus status
        +Decimal amount
        +Decimal total
        +Decimal fees
        +Decimal netAmount
        +String currency
        +UUID? processedById
        +UUID? approvedById
        +UUID? payoutId
        +DateTime completedAt
    }

    class Document {
        +UUID id
        +UUID clientId
        +DocumentType documentType
        +String filePath
        +VerificationStatus verificationStatus
        +UUID? verifiedById
        +DateTime? verifiedAt
        +String? rejectionReason
        +String? fileName
        +Int? fileSize
        +String? mimeType
    }

    class Notification {
        +UUID id
        +UUID userId
        +NotificationType type
        +NotificationCategory category
        +String title
        +String message
        +Boolean isRead
        +Boolean isDismissed
        +String? actionUrl
        +String priority
        +DateTime createdAt
    }

    class AuditLog {
        +UUID id
        +UUID? userId
        +AuditAction action
        +String? description
        +String entityType
        +String entityId
        +Json? oldValues
        +Json? newValues
        +String? ipAddress
        +String severity
        +Boolean success
        +DateTime createdAt
    }

    %% Core inheritance / composition
    User "1" --> "0..1" Client : "has profile"
    User "1" --> "0..1" RelationshipManager : "has profile"
    User "1" --> "0..1" UserLead : "converted from"
    User "1" --> "0..*" Notification : receives
    User "1" --> "0..*" AuditLog : generates

    %% Client relationships
    RelationshipManager "1" --> "0..*" Client : manages
    Client "1" --> "0..*" Document : uploads
    Client "1" --> "0..*" Transaction : has
    Client "1" --> "0..*" ProductPurchaseRequest : submits
    Client "1" --> "0..*" PayoutSchedule : scheduled for
    Client "1" --> "0..*" Payout : receives

    %% Lead
    RelationshipManager "1" --> "0..*" UserLead : assigned

    %% Investment catalog
    Investment "1" --> "1..*" InvestmentOption : offers

    %% Purchase request
    ProductPurchaseRequest --> Investment : references
    ProductPurchaseRequest --> InvestmentOption : uses option
    ProductPurchaseRequest --> RelationshipManager : reviewed by

    %% Payout chain
    ProductPurchaseRequest "1" --> "0..*" PayoutSchedule : generates
    PayoutSchedule "1" --> "0..1" Payout : triggers
    Payout "1" --> "1" Transaction : recorded as

    %% Document relations
    Document --> ProductPurchaseRequest : "contract for"
    Document --> Payout : "receipt for"
    User --> Document : verifies
```

---

## 2. Investment & Payout Workflow Class Diagram

```mermaid
classDiagram

    class Client {
        +UUID id
        +VerificationStatus verificationStatus
        +submit()
        +viewPortfolio()
    }

    class Investment {
        +UUID id
        +String name
        +Decimal minAmount
        +Decimal maxAmount
        +Boolean isActive
        +getOptions()
    }

    class InvestmentOption {
        +UUID id
        +String duration
        +Decimal roi
        +Decimal annualReturn
        +String withdrawalFrequency
        +calculateInterest(amount, periods)
    }

    class ProductPurchaseRequest {
        +UUID id
        +String trackingNumber
        +Decimal amount
        +RequestStatus status
        +String payoutWindow
        +approve(rmId, payoutWindow)
        +reject(reason)
        +complete(contractId)
    }

    class PayoutSchedule {
        +UUID id
        +DateTime scheduledDate
        +Decimal interestAmount
        +Boolean isProcessed
        +markProcessed()
    }

    class Payout {
        +UUID id
        +Decimal amount
        +PayoutStatus status
        +complete(processedById, receiptId)
    }

    class Transaction {
        +UUID id
        +TransactionType type
        +Decimal amount
        +TransactionStatus status
    }

    Client --> ProductPurchaseRequest : submits
    Investment "1" --> "1..*" InvestmentOption : offers
    ProductPurchaseRequest --> Investment : for
    ProductPurchaseRequest --> InvestmentOption : with option
    ProductPurchaseRequest "1" --> "0..*" PayoutSchedule : schedules
    PayoutSchedule "1" --> "0..1" Payout : becomes
    Payout "1" --> "1" Transaction : creates
```

---

## 3. Document Verification Class Diagram

```mermaid
classDiagram

    class Client {
        +UUID id
        +VerificationStatus verificationStatus
        +uploadDocument(file, type)
        +getVerificationStatus()
    }

    class Document {
        +UUID id
        +DocumentType documentType
        +VerificationStatus verificationStatus
        +String filePath
        +String? rejectionReason
        +verify(userId)
        +reject(userId, reason)
    }

    class User {
        +UUID id
        +UserRole role
    }

    class AuditLog {
        +UUID id
        +AuditAction action
        +String entityType
        +String entityId
    }

    Client "1" --> "0..*" Document : uploads
    User --> Document : "verifies (DOCADMIN/ADMIN)"
    User "1" --> "0..*" AuditLog : generates
    Document --> AuditLog : audit trail
```

---

## 4. Object Diagram — Single Investment Contract with Payout

```mermaid
classDiagram

    class user_001 {
        id = "usr-001"
        email = "ahmed@email.ae"
        role = CLIENT
        emailVerified = true
        status = ACTIVE
    }

    class client_001 {
        id = "cli-001"
        verificationStatus = VERIFIED
        assignedRMId = "rm-001"
    }

    class rm_001 {
        id = "rm-001"
        specialization = "High Net Worth"
        maxClientLimit = 50
        totalAUM = 5000000
    }

    class investment_plan_1 {
        name = "AED 50,000 - 99,999"
        minAmount = 50000
        maxAmount = 99999
        currency = AED
        isActive = true
    }

    class option_24pct {
        duration = "1 Year"
        roi = 2.00
        annualReturn = 24.00
        withdrawalFrequency = Monthly
    }

    class ppr_4001 {
        trackingNumber = "WM-4001"
        amount = 75000
        status = COMPLETED
        payoutWindow = "1-15"
        contractStartDate = "2025-06-01"
    }

    class schedule_jun {
        scheduledDate = "2025-07-01"
        periodStart = "2025-06-01"
        periodEnd = "2025-06-30"
        interestAmount = 1500
        isProcessed = true
    }

    class payout_001 {
        amount = 1500
        status = COMPLETED
        scheduledDate = "2025-07-01"
    }

    class txn_001 {
        type = INTEREST_PAYOUT
        amount = 1500
        status = COMPLETED
        currency = AED
    }

    user_001 --> client_001
    rm_001 --> client_001
    client_001 --> ppr_4001
    investment_plan_1 --> option_24pct
    ppr_4001 --> investment_plan_1
    ppr_4001 --> option_24pct
    ppr_4001 --> schedule_jun
    schedule_jun --> payout_001
    payout_001 --> txn_001
```

---

## 5. Object Diagram — Lead Converted to Client

```mermaid
classDiagram

    class lead_web_001 {
        email = "sara@example.ae"
        phoneNumber = "+971-50-0001234"
        leadSource = WEBSITE
        status = CONVERTED
        assignedRMId = "rm-002"
    }

    class rm_002 {
        specialization = "Retail Wealth"
        maxClientLimit = 30
    }

    class user_501 {
        id = "usr-501"
        email = "sara@example.ae"
        role = CLIENT
        emailVerified = true
        status = ACTIVE
    }

    class client_501 {
        id = "cli-501"
        verificationStatus = PENDING
        assignedRMId = "rm-002"
    }

    lead_web_001 --> rm_002 : assigned to
    lead_web_001 --> user_501 : converted to
    user_501 --> client_501 : has profile
    rm_002 --> client_501 : manages
```