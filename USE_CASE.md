flowchart LR

%% Actors
Client((Client))

%% System
subgraph Wealth_Management_System

UC1[Register Account]
UC2[Verify Email]
UC3[Upload KYC Documents]
UC4[View Investment Plans]
UC5[Submit Purchase Request]
UC6[View Portfolio]
UC7[View Payout History]
UC8[Download Payout Receipt]
UC9[View Notifications]
UC10[View Contracts]

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

---

flowchart LR

RM((Relationship Manager))

subgraph Wealth_Management_System

UC1[View Assigned Leads]
UC2[Contact Lead]
UC3[Update Lead Status]
UC4[View Registered Clients]
UC5[Track KYC Status]
UC6[View Active Clients]
UC7[Approve Purchase Request]
UC8[Reject Purchase Request]
UC9[Set Payout Window]
UC10[View Client Transactions]

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



---

flowchart LR

DocAdmin((Document Admin))

subgraph Wealth_Management_System

UC1[View New Enquiries]
UC2[Assign RM to Lead]
UC3[Verify KYC Documents]
UC4[Approve / Reject KYC]
UC5[View Product Requests]
UC6[Upload Investment Contract]
UC7[Finalize Contract]
UC8[Generate Payout Schedule]
UC9[Upload Payout Receipt]
UC10[Mark Payout Completed]

end

DocAdmin --> UC1
DocAdmin --> UC2
DocAdmin --> UC3
DocAdmin --> UC4
DocAdmin --> UC5
DocAdmin --> UC6
DocAdmin --> UC7
DocAdmin --> UC8
DocAdmin --> UC9
DocAdmin --> UC10



---



flowchart LR

Admin((Admin))

subgraph Wealth_Management_System

UC1[Manage Users]
UC2[Create Investment Plans]
UC3[Manage Investment Options]
UC4[Activate / Deactivate Plans]
UC5[View System Metrics]
UC6[View Purchase Requests]
UC7[Monitor RM Performance]
UC8[View Audit Logs]
UC9[Export Reports]

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



---


flowchart LR

Visitor((Public Visitor))

subgraph Wealth_Management_System

UC1[Submit Enquiry Form]
UC2[Provide Contact Details]
UC3[Select Investment Interest]
UC4[Lead Stored in System]
UC5[Await RM Assignment]

end

Visitor --> UC1
Visitor --> UC2
Visitor --> UC3
Visitor --> UC4
Visitor --> UC5


---

flowchart LR

DocAdmin((DocAdmin))
Client((Client))

subgraph Wealth_Management_System

UC1[Calculate Interest]
UC2[Generate Payout Schedule]
UC3[List Due Payouts]
UC4[Upload Receipt]
UC5[Mark Payout Completed]
UC6[Create Transaction]
UC7[Notify Client]

end

DocAdmin --> UC3
DocAdmin --> UC4
DocAdmin --> UC5

UC5 --> UC6
UC6 --> UC7

Client --> UC7




---



