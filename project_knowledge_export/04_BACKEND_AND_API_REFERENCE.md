# 04. Backend & Network Communication Reference

## 1. Architectural Architecture Notice

**AUTHENTICATION & RBAC BACKEND INTEGRATION:**  
TerraChain utilizes a lightweight, dedicated Node.js/Express service (`backend/server.js`) on port `5000` to enforce secure identity verification, bcrypt password hashing, cryptographic challenge (nonce) issuance, session management, and officer provisioning.

The backend service operates alongside:
1. **Direct JSON-RPC 2.0 calls** to the Ethereum Virtual Machine (EVM) node (Local Hardhat node on port `8545` or public Sepolia endpoints) for on-chain state execution.
2. **Direct HTTPS REST API requests** to the Pinata Cloud IPFS pinning service for decentralized title deed storage.

This dual-layer architecture guarantees that client identity is verified via server-side cryptographic signatures before privileged blockchain operations are authorized.

---

## 2. External API Service: Pinata IPFS Integration

The frontend communicates with Pinata Cloud to store physical land title deeds and ownership certificates off-chain.

- **Service File**: `frontend/src/services/pinataService.js`
- **Base URL**: `https://api.pinata.cloud`
- **Authentication**: `pinata_api_key` and `pinata_secret_api_key` transmitted as HTTP request headers.

### Pinata API Endpoint Inventory

| HTTP Method | Remote Endpoint | Purpose | Request Payload | Response Body | Code Reference |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `POST` | `/pinning/pinFileToIPFS` | Uploads and pins deed document to the IPFS swarm | `multipart/form-data` containing `file` binary and optional metadata JSON | `{ IpfsHash: "Qm...", PinSize: 1048576, Timestamp: "2024-..." }` | `frontend/src/services/pinataService.js:L21-65` |
| `GET` | `https://gateway.pinata.cloud/ipfs/{cid}` | Retrieves and views pinned deed PDF/image | None (URL path parameter `cid`) | Binary stream (PDF, PNG, JPEG) | `frontend/src/utils/ipfs.js:L10-25` |

### Pinata Upload Implementation Details
```javascript
// Excerpt from frontend/src/services/pinataService.js
const formData = new FormData();
formData.append('file', file);

const metadata = JSON.stringify({
  name: `Deed_${Date.now()}_${file.name}`,
  keyvalues: {
    app: 'TerraChain',
    fileType: file.type
  }
});
formData.append('pinataMetadata', metadata);

const res = await axios.post("https://api.pinata.cloud/pinning/pinFileToIPFS", formData, {
  maxBodyLength: "Infinity",
  headers: {
    'Content-Type': `multipart/form-data; boundary=${formData._boundary}`,
    pinata_api_key: PINATA_API_KEY,
    pinata_secret_api_key: PINATA_SECRET_API_KEY
  }
});
return res.data.IpfsHash;
```

---

## 3. Web3 JSON-RPC Communication (Ethereum Node)

The frontend uses Ethers.js v6 to serialize method calls into Ethereum JSON-RPC 2.0 protocol specifications.

- **RPC Endpoint**: `http://127.0.0.1:8545` (Chain ID: `31337`)
- **Transport**: HTTP POST with JSON body: `{"jsonrpc":"2.0","method":"...","params":[...],"id":1}`

### Smart Contract RPC Method Inventory

| EVM Method Type | Contract Function | Purpose | Caller Authority | Parameters | Return Value | Gas Estimate (Avg) |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| `eth_sendRawTransaction` | `registerLand` | Registers a new parcel and deed hash | Any verified user | `(string _physicalAddress, uint256 _areaSqFt, string _ipfsHash)` | `uint256 landId` (emitted via event) | ~180,000 |
| `eth_sendRawTransaction` | `verifyLand` | Approves and verifies land parcel | Government Inspector (`onlyAdmin`) | `(uint256 _landId)` | None (emits `LandVerified`) | ~45,000 |
| `eth_sendRawTransaction` | `listForSale` | Places verified parcel on marketplace | Registered Owner (`onlyOwner`) | `(uint256 _landId, uint256 _priceInWei)` | None (emits `LandListedForSale`) | ~50,000 |
| `eth_sendRawTransaction` | `delistLand` | Removes parcel from marketplace | Registered Owner (`onlyOwner`) | `(uint256 _landId)` | None (emits `LandDelisted`) | ~35,000 |
| `eth_sendRawTransaction` | `buyLand` | Executes purchase and atomic ownership transfer | Anyone except current owner | `(uint256 _landId)` (with `msg.value == priceInWei`) | None (emits `LandSold`) | ~110,000 |
| `eth_call` (Read-only) | `getLandDetails` | Queries full metadata of single parcel | Public (Gasless) | `(uint256 _landId)` | `(id, physicalAddress, areaSqFt, priceInWei, ipfsHash, currentOwner, isVerified, isForSale)` | 0 (local execution) |
| `eth_call` (Read-only) | `getTotalLands` | Gets total count of registered parcels | Public (Gasless) | None | `uint256` | 0 (local execution) |
| `eth_call` (Read-only) | `getLandsByOwner` | Queries land ID list owned by address | Public (Gasless) | `(address _owner)` | `uint256[]` | 0 (local execution) |
| `eth_call` (Read-only) | `admin` | Reads deployer/inspector address | Public (Gasless) | None | `address` | 0 (local execution) |

---

## 4. Error Handling & Revert Decoding

When an Ethereum transaction fails, the EVM returns a hex error selector. The frontend catches these and matches them against the contract's custom errors:

| Custom Error Selector | Error Name | Trigger Condition |
| :--- | :--- | :--- |
| `0x2c5211c6` | `LandRegistry__Unauthorized()` | Caller is not `admin` (inspector) or not `currentOwner`. |
| `0x...` | `LandRegistry__InvalidAddress()` | Zero address provided or empty physical address string. |
| `0x...` | `LandRegistry__InvalidArea()` | `areaSqFt == 0`. |
| `0x...` | `LandRegistry__InvalidIpfsHash()` | `bytes(_ipfsHash).length == 0`. |
| `0x...` | `LandRegistry__LandNotFound()` | `landId == 0` or `landId > _totalLands`. |
| `0x...` | `LandRegistry__AlreadyVerified()` | Attempting to verify a parcel where `isVerified == true`. |
| `0x...` | `LandRegistry__NotVerified()` | Attempting to list an unverified parcel for sale. |
| `0x...` | `LandRegistry__NotForSale()` | Calling `buyLand` on a parcel where `isForSale == false`. |
| `0x...` | `LandRegistry__IncorrectPrice()` | `msg.value != land.priceInWei`. |
| `0x...` | `LandRegistry__BuyerIsOwner()` | Landowner calling `buyLand` on their own parcel. |
| `0x...` | `LandRegistry__TransferFailed()` | Native ETH `call{value: ...}("")` to seller reverted. |

---

## 5. Authentication & RBAC Service REST API (`http://localhost:5000`)

| Method | Endpoint | Purpose | Authentication | Request Payload | Response | Implementation Status |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| `GET` | `/api/health` | Service health status | None | None | `{ status: "healthy", service: "..." }` | Implemented & Verified |
| `POST` | `/api/auth/nonce` | Issues short-lived 32-byte cryptographic challenge | None | `{ walletAddress, role }` | `{ nonce, message, expiresInSeconds: 300 }` | Implemented & Verified |
| `POST` | `/api/auth/login` | Authenticates user with bcrypt password and wallet signature | None (Rate Limited) | `{ emailOrUsername, password, role, walletAddress, signature, nonce, message }` | `{ success: true, token, user: { id, email, role, ... } }` | Implemented & Verified |
| `POST` | `/api/auth/register-citizen` | Self-service registration for Citizen participants | None | `{ username, email, password, name, walletAddress }` | `{ success: true, message, user }` | Implemented & Verified |
| `GET` | `/api/auth/me` | Validates session and returns authenticated identity | Cookie / Bearer Token | None | `{ user: { id, email, role, ... } }` | Implemented & Verified |
| `POST` | `/api/auth/logout` | Clears HTTP-only session cookie and invalidates session | Authenticated | None | `{ success: true, message }` | Implemented & Verified |
| `GET` | `/api/officers` | Lists provisioned inspectors & registrars | Admin Only | None | `{ officers: [...] }` | Implemented & Verified |
| `POST` | `/api/officers/provision` | Provisions a new government inspector or registrar | Admin Only | `{ username, email, password, name, role, department, walletAddress }` | `{ success: true, officer: { ... } }` | Implemented & Verified |
| `DELETE` | `/api/officers/:id` | Deactivates an officer account | Admin Only | None (URL parameter `id`) | `{ success: true, message }` | Implemented & Verified |
| `GET` | `/api/audit-logs` | Retrieves security audit logs | Admin Only | None | `{ logs: [...] }` | Implemented & Verified |

