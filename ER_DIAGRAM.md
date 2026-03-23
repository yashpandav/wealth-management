flowchart TD

classDef entity fill:#1f2937,stroke:#94a3b8,stroke-width:2px,color:#ffffff;
classDef relation fill:#7c3aed,stroke:#c4b5fd,stroke-width:2px,color:#ffffff;

User[User]:::entity
Client[Client]:::entity
RM[RelationshipManager]:::entity
Lead[UserLead]:::entity
Document[Document]:::entity
Investment[Investment]:::entity
InvestmentOption[InvestmentOption]:::entity
PurchaseRequest[ProductPurchaseRequest]:::entity
PayoutSchedule[PayoutSchedule]:::entity
Payout[Payout]:::entity
Transaction[Transaction]:::entity
Notification[Notification]:::entity
AuditLog[AuditLog]:::entity
VerificationToken[VerificationToken]:::entity

ExtendsClient{Extends}:::relation
ExtendsRM{Extends}:::relation
Converts{Converts}:::relation
Manages{Manages}:::relation
Uploads{Uploads}:::relation
Requests{Requests}:::relation
Executes{Executes}:::relation
Offers{Offers}:::relation
SelectedIn{Selected In}:::relation
ChosenIn{Chosen In}:::relation
Generates{Generates}:::relation
ExecutesAs{Executes As}:::relation
CreatesTx{Creates Transaction}:::relation
Verifies{Verifies}:::relation
Approves{Approves}:::relation
Receives{Receives}:::relation
Performs{Performs}:::relation
VerifiesEmail{Verifies Email}:::relation

User --- ExtendsClient --- Client
User --- ExtendsRM --- RM
Lead --- Converts --- User

RM --- Manages --- Client

Client --- Uploads --- Document
Client --- Requests --- PurchaseRequest
Client --- Executes --- Transaction

User --- Receives --- Notification
User --- Performs --- AuditLog
User --- Verifies --- Document
User --- Approves --- Transaction

Investment --- Offers --- InvestmentOption
Investment --- SelectedIn --- PurchaseRequest
InvestmentOption --- ChosenIn --- PurchaseRequest

RM --- Manages --- PurchaseRequest
PurchaseRequest --- Generates --- PayoutSchedule

PayoutSchedule --- ExecutesAs --- Payout
Payout --- CreatesTx --- Transaction

PurchaseRequest --- Uploads --- Document
Payout --- Uploads --- Document

VerificationToken --- VerifiesEmail --- User