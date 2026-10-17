# 10. Testing & Quality Assurance Audit

## 1. Testing Framework & Architecture

- **Test Runner**: Hardhat built-in test runner with **Mocha** and **Chai**.
- **Assertions Library**: `@nomicfoundation/hardhat-chai-matchers` (supporting custom Solidity error assertions like `revertedWithCustomError`, event emission checks `emit`, and balance change tracking `changeEtherBalances`).
- **Test File**: `blockchain/test/LandRegistry.test.js` (249 lines of code).

---

## 2. Test Suite Coverage Analysis

The automated test suite contains 5 primary test suites and 16 individual specifications:

### Suite 1: Deployment & State Initialization
- Verifies contract deploys cleanly.
- Asserts `admin` is set to `deployer.address`.
- Asserts initial `getTotalLands()` equals `0`.

### Suite 2: Land Registration
- Validates successful land registration and increments total count to `1`.
- Asserts emission of `LandRegistered` event with accurate indexed parameters.
- Validates revert when `physicalAddress` is empty string (`LandRegistry__InvalidAddress`).
- Validates revert when `areaSqFt == 0` (`LandRegistry__InvalidArea`).
- Validates revert when `ipfsHash` is empty string (`LandRegistry__InvalidIpfsHash`).

### Suite 3: Land Verification (Inspector Role)
- Validates admin can successfully verify a registered land parcel.
- Asserts emission of `LandVerified(landId, adminAddress)`.
- Validates non-admin cannot verify land (`revertedWithCustomError(landRegistry, "LandRegistry__Unauthorized")`).
- Validates double verification reverts (`revertedWithCustomError(landRegistry, "LandRegistry__AlreadyVerified")`).
- Validates non-existent land ID reverts (`revertedWithCustomError(landRegistry, "LandRegistry__LandNotFound")`).

### Suite 4: Marketplace Listing & Delisting
- Validates owner can list verified land for sale.
- Asserts emission of `LandListedForSale(landId, price, seller)`.
- Validates listing unverified land reverts with `LandRegistry__NotVerified`.
- Validates listing with `0` price reverts with `LandRegistry__InvalidPrice`.
- Validates non-owner cannot list land for sale (`LandRegistry__Unauthorized`).
- Validates owner can delist land (`LandDelisted`).
- Validates delisting unlisted land reverts with `LandRegistry__NotForSale`.

### Suite 5: Land Purchase & Atomic Settlement
- Validates buyer can purchase listed land by sending exact ETH value.
- Asserts state changes: `isForSale == false`, `currentOwner == buyer.address`.
- Asserts native ETH balance transfer between buyer and seller (`changeEtherBalances`).
- Asserts emission of `LandSold(landId, seller, buyer, price)`.
- Validates purchase reverts when parcel is not for sale (`LandRegistry__NotForSale`).
- Validates purchase reverts when sent value is insufficient or incorrect (`LandRegistry__IncorrectPrice`).
- Validates owner purchasing their own land reverts (`LandRegistry__BuyerIsOwner`).

---

## 3. Test Execution Verification

### A. Smart Contract Test Execution (`blockchain/`)
The contract test suites (`LandRegistry.test.js` and `LandRegistryRoles.test.js`) were executed against the Hardhat local EVM:
```bash
npx hardhat test
```
**Result**: **33 passing (1s), 0 failing**. 100% assertion pass rate for core registry logic, multi-officer role governance, and ownership array cleanup.

### B. Backend Authentication & RBAC Test Execution (`backend/`)
The backend authentication and security test suite (`test/auth.test.js`) was executed:
```bash
npm test
```
**Result**: **17 passing, 0 failing**. Covers:
- Service health check
- 32-byte cryptographic nonce challenge generation
- Rejection of invalid Ethereum wallet addresses
- Generic invalid credentials error handling (no email enumeration)
- Role isolation blocking wrong portal entry attempts (403 Forbidden)
- Mandatory wallet signature enforcement for government roles
- Mismatched wallet address signature rejection
- Successful Admin authentication with bcrypt + EIP-191 signature
- Replay protection blocking consumed nonces
- Session verification restoring authenticated identity via `/api/auth/me`
- Public citizen self-registration (strictly enforced citizen role)
- Citizen login and RBAC route protection
- Denial of access to officer routes for citizen accounts
- Admin officer provisioning with bcrypt hashing & wallet binding
- Security audit log verification
- Admin officer deactivation
- Session invalidation on logout

---

## 4. Current Quality Assurance Status
- **Total Automated Tests**: 50 tests across contract and backend layers.
- **Pass Rate**: 100% passing with zero failures.
- **`_ownerLands` Cleanup**: Verified passing test in `LandRegistryRoles.test.js`.

