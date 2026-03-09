# Core System Class Diagram

classDiagram

class User {
  UUID id
  string email
  string password
  UserRole role
  string firstName
  string lastName
  bool emailVerified
  AccountStatus status
}

class Client {
  UUID id
  UUID userId
  UUID assignedRMId
  VerificationStatus verificationStatus
  string riskTolerance
}

class RelationshipManager {
  UUID id
  UUID userId
  string specialization
  int maxClientLimit
}

class UserLead {
  UUID id
  string firstName
  string email
  LeadStatus status
}

class Document {
  UUID id
  UUID clientId
  DocumentType documentType
  VerificationStatus verificationStatus
  string filePath
}

class Investment {
  UUID id
  string name
  decimal minAmount
  decimal maxAmount
  bool isActive
}

class InvestmentOption {
  UUID id
  UUID investmentId
  string duration
  string withdrawalFrequency
  decimal roi
}

class ProductPurchaseRequest {
  UUID id
  UUID clientId
  UUID investmentId
  UUID investmentOptionId
  decimal amount
  RequestStatus status
  string payoutWindow
}

class PayoutSchedule {
  UUID id
  UUID productPurchaseRequestId
  datetime scheduledDate
  decimal interestAmount
}

class Payout {
  UUID id
  UUID payoutScheduleId
  decimal amount
  PayoutStatus status
}

class Transaction {
  UUID id
  UUID clientId
  TransactionType type
  decimal amount
  TransactionStatus status
}

class Notification {
  UUID id
  UUID userId
  string title
  bool isRead
}

class AuditLog {
  UUID id
  UUID userId
  AuditAction action
}

%% Relationships
User "1" --> "0..1" Client : extends
User "1" --> "0..1" RelationshipManager : extends
User "1" --> "0..1" UserLead : converts

RelationshipManager "1" --> "many" Client : manages

Client "1" --> "many" Document : uploads
Client "1" --> "many" Transaction : executes
Client "1" --> "many" ProductPurchaseRequest : creates

Investment "1" --> "many" InvestmentOption : offers

ProductPurchaseRequest --> Investment
ProductPurchaseRequest --> InvestmentOption
ProductPurchaseRequest --> RelationshipManager

ProductPurchaseRequest "1" --> "many" PayoutSchedule : generates
PayoutSchedule "1" --> "1" Payout : executes
Payout "1" --> "1" Transaction : creates

User "1" --> "many" Notification
User "1" --> "many" AuditLog

---

# Investment & Purchase Workflow Class Diagram


classDiagram

class Client {
  UUID id
}

class Investment {
  UUID id
  string name
}

class InvestmentOption {
  UUID id
  decimal roi
  string duration
}

class ProductPurchaseRequest {
  UUID id
  decimal amount
  RequestStatus status
  string payoutWindow
}

class PayoutSchedule {
  datetime scheduledDate
  decimal interestAmount
}

class Payout {
  decimal amount
  PayoutStatus status
}

class Transaction {
  decimal amount
  TransactionType type
}

Client --> ProductPurchaseRequest : submits
Investment --> InvestmentOption : contains

ProductPurchaseRequest --> Investment
ProductPurchaseRequest --> InvestmentOption

ProductPurchaseRequest --> PayoutSchedule : generates
PayoutSchedule --> Payout : creates
Payout --> Transaction : creates


---

# Document Verification Class Diagram


classDiagram

class Client {
  UUID id
  VerificationStatus verificationStatus
}

class Document {
  UUID id
  DocumentType type
  VerificationStatus status
}

class User {
  UUID id
  UserRole role
}

class AuditLog {
  UUID id
  AuditAction action
}

Client --> Document : uploads
User --> Document : verifies
User --> AuditLog : performs

Document --> Client



---

# One client investment contract with payout.


classDiagram

class user_1 {
  id = "u-101"
  role = CLIENT
  email = "client@email.com"
}

class client_1 {
  id = "c-201"
  verificationStatus = VERIFIED
}

class rm_1 {
  id = "rm-10"
  specialization = "High Net Worth"
}

class investment_1 {
  name = "AED 50K - 99K"
}

class option_1 {
  duration = "1 Year"
  roi = 24%
}

class request_1 {
  id = "req-4001"
  amount = 60000
  status = COMPLETED
}

class schedule_1 {
  scheduledDate = "2026-04-15"
  interestAmount = 1200
}

class payout_1 {
  status = COMPLETED
  amount = 1200
}

class transaction_1 {
  type = INTEREST_PAYOUT
  amount = 1200
}

user_1 --> client_1
rm_1 --> client_1
client_1 --> request_1
investment_1 --> option_1
request_1 --> investment_1
request_1 --> option_1
request_1 --> schedule_1
schedule_1 --> payout_1
payout_1 --> transaction_1


---


# Lead → Client Conversion Object Diagram


classDiagram

class lead_1 {
  email = "lead@email.com"
  status = INTERESTED
}

class rm_1 {
  name = "Rahul RM"
}

class user_1 {
  role = CLIENT
  emailVerified = true
}

class client_1 {
  verificationStatus = PENDING
}

lead_1 --> rm_1
lead_1 --> user_1
user_1 --> client_1