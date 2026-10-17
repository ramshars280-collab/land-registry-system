# 08. End-to-End Workflows & Sequence Diagrams

## 1. Land Registration Workflow

```mermaid
sequenceDiagram
    autonumber
    actor Owner as Property Owner (Seller)
    participant UI as React Frontend (App.jsx)
    participant Uploader as DocumentUploader.jsx
    participant Pinata as Pinata IPFS Gateway
    participant Ethers as Web3 Provider / Signer
    participant Contract as LandRegistry.sol

    Owner->>UI: Fills Registration Form (Address, SqFt)
    Owner->>Uploader: Drops Deed Document (PDF)
    Uploader->>Pinata: POST /pinning/pinFileToIPFS (multipart form)
    Pinata-->>Uploader: Returns IPFS CID (Qm...)
    Uploader-->>UI: Sets ipfsHash in form state
    Owner->>UI: Clicks "Register Land"
    UI->>Ethers: Encodes registerLand(address, sqFt, ipfsHash)
    Ethers->>Contract: eth_sendRawTransaction
    Contract->>Contract: Validate non-empty inputs
    Contract->>Contract: Increment _totalLands
    Contract->>Contract: Save Land struct & update _ownerLands
    Contract-->>Ethers: Emits LandRegistered event
    Ethers-->>UI: Transaction receipt confirmed
    UI-->>Owner: Displays Success Banner & Parcel ID
```

---

## 2. Government Verification Workflow

```mermaid
sequenceDiagram
    autonumber
    actor Inspector as Land Inspector (Admin)
    participant UI as React Frontend (Inspector Portal)
    participant IPFS as IPFS Gateway Viewer
    participant Ethers as Web3 Provider (Admin Signer)
    participant Contract as LandRegistry.sol

    Inspector->>UI: Navigates to Inspector Verification Dashboard
    UI->>Contract: Query unverified lands (isVerified == false)
    Contract-->>UI: Returns pending parcel array
    Inspector->>UI: Clicks "Inspect Deed Document"
    UI->>IPFS: Opens https://gateway.pinata.cloud/ipfs/{cid} in new tab
    Inspector->>Inspector: Verifies physical boundary vs legal survey
    Inspector->>UI: Clicks "Verify & Approve On-Chain"
    UI->>Ethers: Encodes verifyLand(landId)
    Ethers->>Contract: eth_sendRawTransaction (from Admin address)
    Contract->>Contract: Check msg.sender == admin
    Contract->>Contract: Check !land.isVerified
    Contract->>Contract: Set land.isVerified = true
    Contract-->>Ethers: Emits LandVerified event
    Ethers-->>UI: Transaction receipt confirmed
    UI-->>Inspector: Removes parcel from pending list, marks Verified
```

---

## 3. Marketplace Listing Workflow

```mermaid
sequenceDiagram
    autonumber
    actor Seller as Verified Landowner
    participant UI as React Frontend (My Lands View)
    participant Ethers as Web3 Provider / Signer
    participant Contract as LandRegistry.sol

    Seller->>UI: Opens "My Lands" Dashboard
    Seller->>UI: Selects verified parcel, clicks "List for Sale"
    UI->>Seller: Displays Pricing Modal
    Seller->>UI: Enters price in ETH (e.g. 2.5 ETH)
    UI->>UI: Converts ETH to Wei via ethers.parseEther("2.5")
    UI->>Ethers: Encodes listForSale(landId, priceInWei)
    Ethers->>Contract: eth_sendRawTransaction
    Contract->>Contract: Check msg.sender == land.currentOwner
    Contract->>Contract: Check land.isVerified == true
    Contract->>Contract: Set land.isForSale = true, priceInWei = 2.5 ETH
    Contract-->>Ethers: Emits LandListedForSale event
    Ethers-->>UI: Transaction receipt confirmed
    UI-->>Seller: Displays "Listed on Marketplace" badge
```

---

## 4. Land Purchase & Settlement Workflow

```mermaid
sequenceDiagram
    autonumber
    actor Buyer as Prospective Buyer
    participant UI as React Frontend (Marketplace)
    participant Ethers as Web3 Provider (Buyer Signer)
    participant Contract as LandRegistry.sol
    actor Seller as Property Seller

    Buyer->>UI: Browses Marketplace, selects Listed Parcel
    Buyer->>UI: Clicks "Buy Now"
    UI->>Buyer: Displays Purchase Confirmation Modal (Price + Gas)
    Buyer->>UI: Confirms Purchase
    UI->>Ethers: Encodes buyLand(landId) with { value: priceInWei }
    Ethers->>Contract: eth_sendRawTransaction (nonReentrant)
    Contract->>Contract: Check land.isForSale == true
    Contract->>Contract: Check msg.value == land.priceInWei
    Contract->>Contract: Check msg.sender != land.currentOwner
    Contract->>Contract: Set land.isForSale = false
    Contract->>Contract: Set land.currentOwner = msg.sender
    Contract->>Contract: Update _ownerLands[msg.sender].push(landId)
    Contract->>Seller: Transfers native ETH via low-level call{value: msg.value}("")
    Seller-->>Contract: ETH received
    Contract-->>Ethers: Emits LandSold event
    Ethers-->>UI: Transaction receipt confirmed
    UI-->>Buyer: Shows Purchase Success Modal; parcel appears in "My Lands"
```
