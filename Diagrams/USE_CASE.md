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
<mxfile host="app.diagrams.net" agent="Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/146.0.0.0 Safari/537.36" version="29.6.1">
  <diagram name="Wealth Management Use Case" id="0">
    <mxGraphModel dx="2365" dy="2682" grid="1" gridSize="10" guides="1" tooltips="1" connect="1" arrows="1" fold="1" page="1" pageScale="1" pageWidth="827" pageHeight="1169" math="0" shadow="0">
      <root>
        <mxCell id="0" />
        <mxCell id="1" parent="0" />
        <mxCell id="actor1" parent="1" style="shape=umlActor;verticalLabelPosition=bottom;verticalAlign=top;labelBackgroundColor=none;rounded=0;" value="Client" vertex="1">
          <mxGeometry height="80" width="40" x="50" y="250" as="geometry" />
        </mxCell>
        <mxCell id="system" parent="1" style="shape=rectangle;strokeWidth=2;labelBackgroundColor=none;rounded=0;fillColor=#647687;fontColor=#ffffff;strokeColor=#314354;" value="" vertex="1">
          <mxGeometry height="980" width="900" x="310" y="-280" as="geometry" />
        </mxCell>
        <mxCell id="uc1" parent="system" style="ellipse;fontSize=13;labelBackgroundColor=none;rounded=0;" value="Login / Logout" vertex="1">
          <mxGeometry height="70" width="160" x="20" y="80" as="geometry" />
        </mxCell>
        <mxCell id="uc2" parent="system" style="ellipse;labelBackgroundColor=none;rounded=0;" value="Change Password" vertex="1">
          <mxGeometry height="70" width="160" x="370" y="80" as="geometry" />
        </mxCell>
        <mxCell id="uc3" parent="system" style="ellipse;labelBackgroundColor=none;rounded=0;" value="Update Profile" vertex="1">
          <mxGeometry height="70" width="160" x="190" y="80" as="geometry" />
        </mxCell>
        <mxCell id="uc4" parent="system" style="ellipse;labelBackgroundColor=none;rounded=0;" value="Upload Identity Document" vertex="1">
          <mxGeometry height="70" width="200" x="540" y="80" as="geometry" />
        </mxCell>
        <mxCell id="uc5" parent="system" style="ellipse;labelBackgroundColor=none;rounded=0;" value="Upload Investment Agreement" vertex="1">
          <mxGeometry height="70" width="220" x="670" y="470" as="geometry" />
        </mxCell>
        <mxCell id="uc6" parent="system" style="ellipse;labelBackgroundColor=none;rounded=0;" value="Track Verification Status" vertex="1">
          <mxGeometry height="70" width="220" x="677" y="550" as="geometry" />
        </mxCell>
        <mxCell id="uc7" parent="system" style="ellipse;fontSize=13;labelBackgroundColor=none;rounded=0;" value="Browse Investment Plans" vertex="1">
          <mxGeometry height="70" width="200" x="680" y="142" as="geometry" />
        </mxCell>
        <mxCell id="uc8" parent="system" style="ellipse;labelBackgroundColor=none;rounded=0;" value="View Plan Details &amp; ROI" vertex="1">
          <mxGeometry height="70" width="240" x="652" y="388" as="geometry" />
        </mxCell>
        <mxCell id="uc9" parent="system" style="ellipse;labelBackgroundColor=none;rounded=0;" value="Submit Purchase Request" vertex="1">
          <mxGeometry height="70" width="220" x="680" y="630" as="geometry" />
        </mxCell>
        <mxCell id="uc10" parent="system" style="ellipse;labelBackgroundColor=none;rounded=0;" value="Track Request Status (WM-xxxx)" vertex="1">
          <mxGeometry height="70" width="240" x="650" y="800" as="geometry" />
        </mxCell>
        <mxCell id="uc11" parent="system" style="ellipse;labelBackgroundColor=none;rounded=0;" value="View Active Portfolio" vertex="1">
          <mxGeometry height="70" width="200" x="687" y="220" as="geometry" />
        </mxCell>
        <mxCell id="uc12" parent="system" style="ellipse;labelBackgroundColor=none;rounded=0;" value="View Analytics Dashboard" vertex="1">
          <mxGeometry height="70" width="220" x="665" y="300" as="geometry" />
        </mxCell>
        <mxCell id="uc13" parent="system" style="ellipse;labelBackgroundColor=none;rounded=0;" value="Track Payout History" vertex="1">
          <mxGeometry height="70" width="200" x="687" y="720" as="geometry" />
        </mxCell>
        <mxCell id="uc14" parent="system" style="ellipse;labelBackgroundColor=none;rounded=0;" value="Download Payout Receipt" vertex="1">
          <mxGeometry height="70" width="220" x="660" y="890" as="geometry" />
        </mxCell>
        <mxCell id="uc15" parent="system" style="ellipse;labelBackgroundColor=none;rounded=0;" value="View Contracts" vertex="1">
          <mxGeometry height="70" width="180" x="480" y="896" as="geometry" />
        </mxCell>
        <mxCell id="uc16" parent="system" style="ellipse;labelBackgroundColor=none;rounded=0;" value="View In-App Notifications" vertex="1">
          <mxGeometry height="70" width="240" x="230" y="896" as="geometry" />
        </mxCell>
        <mxCell id="uc17" parent="system" style="ellipse;labelBackgroundColor=none;rounded=0;" value="View My RM Details" vertex="1">
          <mxGeometry height="70" width="200" x="20" y="900" as="geometry" />
        </mxCell>
        <mxCell id="e1" edge="1" parent="1" source="actor1" style="endArrow=none;labelBackgroundColor=none;fontColor=default;rounded=0;" target="uc1">
          <mxGeometry relative="1" as="geometry" />
        </mxCell>
        <mxCell id="e2" edge="1" parent="1" source="actor1" style="endArrow=none;labelBackgroundColor=none;fontColor=default;rounded=0;" target="uc2">
          <mxGeometry relative="1" as="geometry" />
        </mxCell>
        <mxCell id="e3" edge="1" parent="1" source="actor1" style="endArrow=none;labelBackgroundColor=none;fontColor=default;rounded=0;" target="uc3">
          <mxGeometry relative="1" as="geometry" />
        </mxCell>
        <mxCell id="e4" edge="1" parent="1" source="actor1" style="endArrow=none;labelBackgroundColor=none;fontColor=default;rounded=0;" target="uc4">
          <mxGeometry relative="1" as="geometry" />
        </mxCell>
        <mxCell id="e5" edge="1" parent="1" source="actor1" style="endArrow=none;labelBackgroundColor=none;fontColor=default;rounded=0;" target="uc5">
          <mxGeometry relative="1" as="geometry" />
        </mxCell>
        <mxCell id="e6" edge="1" parent="1" source="actor1" style="endArrow=none;labelBackgroundColor=none;fontColor=default;rounded=0;" target="uc6">
          <mxGeometry relative="1" as="geometry" />
        </mxCell>
        <mxCell id="e7" edge="1" parent="1" source="actor1" style="endArrow=none;labelBackgroundColor=none;fontColor=default;rounded=0;" target="uc7">
          <mxGeometry relative="1" as="geometry" />
        </mxCell>
        <mxCell id="e8" edge="1" parent="1" source="actor1" style="endArrow=none;labelBackgroundColor=none;fontColor=default;rounded=0;" target="uc8">
          <mxGeometry relative="1" as="geometry" />
        </mxCell>
        <mxCell id="e9" edge="1" parent="1" source="actor1" style="endArrow=none;labelBackgroundColor=none;fontColor=default;rounded=0;" target="uc9">
          <mxGeometry relative="1" as="geometry" />
        </mxCell>
        <mxCell id="e10" edge="1" parent="1" source="actor1" style="endArrow=none;labelBackgroundColor=none;fontColor=default;rounded=0;" target="uc10">
          <mxGeometry relative="1" as="geometry" />
        </mxCell>
        <mxCell id="e11" edge="1" parent="1" source="actor1" style="endArrow=none;labelBackgroundColor=none;fontColor=default;rounded=0;" target="uc11">
          <mxGeometry relative="1" as="geometry" />
        </mxCell>
        <mxCell id="e12" edge="1" parent="1" source="actor1" style="endArrow=none;labelBackgroundColor=none;fontColor=default;rounded=0;" target="uc12">
          <mxGeometry relative="1" as="geometry" />
        </mxCell>
        <mxCell id="e13" edge="1" parent="1" source="actor1" style="endArrow=none;labelBackgroundColor=none;fontColor=default;rounded=0;" target="uc13">
          <mxGeometry relative="1" as="geometry" />
        </mxCell>
        <mxCell id="e14" edge="1" parent="1" source="actor1" style="endArrow=none;labelBackgroundColor=none;fontColor=default;rounded=0;" target="uc14">
          <mxGeometry relative="1" as="geometry" />
        </mxCell>
        <mxCell id="e15" edge="1" parent="1" source="actor1" style="endArrow=none;labelBackgroundColor=none;fontColor=default;rounded=0;" target="uc15">
          <mxGeometry relative="1" as="geometry" />
        </mxCell>
        <mxCell id="e16" edge="1" parent="1" source="actor1" style="endArrow=none;labelBackgroundColor=none;fontColor=default;rounded=0;" target="uc16">
          <mxGeometry relative="1" as="geometry" />
        </mxCell>
        <mxCell id="e17" edge="1" parent="1" source="actor1" style="endArrow=none;labelBackgroundColor=none;fontColor=default;rounded=0;" target="uc17">
          <mxGeometry relative="1" as="geometry" />
        </mxCell>
      </root>
    </mxGraphModel>
  </diagram>
</mxfile>

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
