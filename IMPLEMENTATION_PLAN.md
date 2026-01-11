# Implementation Plan: Client & Admin Portal Enhancements

This plan outlines the steps to implement the requested changes for the Client and Admin portals.

## 1. Client Portal - Authentications

### Sign Up / Sign In
- [x] **Modify `src/app/(auth)/login/login-form.tsx`**:
    - Add `useState` for password visibility.
    - Add "eye" icon button to toggle password visibility.
    - Add "Remember Me" checkbox (UI only, or leveraging `next-auth` if applicable).
- [x] **Modify `src/app/(auth)/register/register-form.tsx`**:
    - Split `phone` field into `countryCode` (select) and `phoneNumber` (input).
    - Add "eye" icon to both `password` and `confirmPassword` fields.
    - Make "Contact Number" mandatory (remove "(Optional)" label, add validation).

## 2. Client Portal - Dashboard & Portfolio

### My Portfolio
- [x] **Modify `src/components/client/ClientStatusBanner.tsx`** (or relevant component):
    - Add logic: If KYC documents are not uploaded/verified, show a prominent link "Upload Documents".
- [x] **Modify `src/app/(dashboard)/client/portfolio/page.tsx`** (or `PortfolioDashboard`):
    - Add buttons: "Go to Investment Products" and "Upload KYC".

### Investment Products
- [x] **Global Rename**: Rename "Investment Ventures" to "Investment Products" in all UI text (check `src/app/(dashboard)/client/products/page.tsx` and `src/components/client/ProductsBrowse.tsx`).
- [x] **Modify `src/app/(dashboard)/client/products/page.tsx`**:
    - Remove "FAQs" section.
    - **Task**: Update Product Names. (Need to clarify new names or use "Investment Products" as generic. Will check for `prisma/seed.ts` updates if names need to change in DB).

## 3. Client Portal - Requests & Withdrawal

### My Requests
- [ ] **Modify `src/app/(dashboard)/client/requests/page.tsx`**:
    - Remove "Browse Instruments" button/link.
    - Logic change: "Show only Browse Plans".
    - Logic change: Filter out `INSTRUMENT` type requests (show only `PRODUCT` type).
    - Ensure only "Product Plan Details" are shown.

### Withdrawal
- [ ] **Modify `src/app/(dashboard)/client/withdraw/page.tsx`** (or verify location):
    - Remove the option/button to create a new Withdrawal Request.
    - Rename/Repurpose page to "Withdrawal History" (Transaction History).
    - Show: Investment history, ROI paid history.

### Instrument Removal
- [ ] **Global**: Remove "Instrument" related links/pages from Client, RM, and Admin sidebars/navs.
    - Check `src/components/layout/Sidebar.tsx` or similar.

## 4. Client Portal - KYC Documents

### KYC Documents
- [ ] **Modify `src/app/(auth)/upload-documents/document-upload-form.tsx`** (or `client/documents`):
    - Remove fields: "Income Proof", "Bank Statement", "Address Proof".
    - Keep: Identity Proof (or whatever is required).
    - **Note**: This might affect the implementation of `POST /api/client/product-requests` which currently checks for 'ADDRESS_PROOF'. I will need to update the backend validation logic in `src/app/api/client/product-requests/route.ts` if these docs are no longer required.

## 5. Admin Portal Enhancements

### Top RM Chart
- [ ] **Modify `src/app/(dashboard)/admin/page.tsx`** (or relevant chart component):
    - Rename label "AUM" to "Investment Amount" everywhere.

### Terminology Updates
- [ ] **Global Search/Replace**:
    - "Purchase" -> "Investment" (in UI labels).
    - "Withdrawal Request" -> "Withdrawal History".

### Tracking Series Name
- [ ] **Modify `src/app/api/client/product-requests/route.ts`**:
    - Update `generateTrackingNumber` to use prefix `EMdee` instead of `PPR`.
    - Check if "309393" vs "44298" implies a format change (likely just prefix and random).

### Doc Admin
- [ ] **Modify `src/app/(dashboard)/docadmin/layout.tsx`** or `page.tsx`:
    - Add notification badges (numbers) to "Pending RM" and "Pending Contract Upload" tabs.

## 6. Implementation Order
1.  **Auth Changes** (Sign In / Sign Up).
2.  **Client Dashboard & Portfolio**.
3.  **Product & Requests** (Renaming, Filtering).
4.  **KYC & Withdrawal** (Removing fields/buttons).
5.  **Admin Terminology & Tracking**.
6.  **Cleanup** (Removing Instruments).
