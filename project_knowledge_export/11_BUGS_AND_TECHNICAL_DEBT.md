# 11. Bugs, Technical Debt & Architectural Gaps

## 1. Prioritized Defect Inventory

| Defect ID | Severity | Category | Description | Affected File |
| :--- | :--- | :--- | :--- | :--- |
| **BUG-01** | **Medium** | Smart Contract Logic | `_ownerLands` array never removes sold land IDs upon purchase. | `blockchain/contracts/LandRegistry.sol:L257` |
| **BUG-02** | **Medium** | Architecture / Scalability | Sequential O(N) RPC loops in frontend to fetch all lands. | `frontend/src/App.jsx:L165-210` |
| **BUG-03** | **Low** | Security / Configuration | Client-side exposure of Pinata API keys in Vite bundle. | `frontend/src/services/pinataService.js` |
| **BUG-04** | **Low** | UI / Mock Fallback | Fallback to dummy CID `QmTestDeed...` when Pinata keys are missing. | `frontend/src/components/DocumentUploader.jsx:L48` |
| **BUG-05** | **Low** | Code Smells | Monolithic `App.jsx` containing 985 lines of mixed view/state logic. | `frontend/src/App.jsx` |

---

## 2. Technical Debt Deep Dive

### BUG-01: Historical Owner Array Accumulation
- **Impact**: In `LandRegistry.sol`, when a parcel is purchased, `_ownerLands[msg.sender].push(landId)` is executed. However, `_ownerLands[previousOwner]` remains untouched.
- **Consequence**: Over time, an active seller's `_ownerLands` list grows indefinitely, containing parcels they no longer own. Any client relying solely on `getLandsByOwner(address)` will display invalid ownership.
- **Recommended Fix**:
  ```solidity
  function _removeLandFromOwner(address _owner, uint256 _landId) internal {
      uint256[] storage lands = _ownerLands[_owner];
      uint256 length = lands.length;
      for (uint256 i = 0; i < length; i++) {
          if (lands[i] == _landId) {
              lands[i] = lands[length - 1];
              lands.pop();
              break;
          }
      }
  }
  ```

### BUG-02: O(N) On-Chain Sequential Traversal
- **Impact**: `loadLands()` in `App.jsx` retrieves `_totalLands` and loops sequentially:
  ```javascript
  const count = await contract.getTotalLands();
  for (let i = 1; i <= count; i++) {
    const details = await contract.getLandDetails(i);
    // ...
  }
  ```
- **Consequence**: For 50 registered parcels, this triggers 51 discrete JSON-RPC network calls over HTTP. This causes UI stuttering, RPC rate-limiting, and slow load times on live testnets (Sepolia).
- **Recommended Fix**: Add a batch view function to `LandRegistry.sol`:
  ```solidity
  function getAllLands() external view returns (Land[] memory) {
      Land[] memory items = new Land[](_totalLands);
      for (uint256 i = 1; i <= _totalLands; i++) {
          items[i - 1] = _lands[i];
      }
      return items;
  }
  ```

### BUG-03 & BUG-04: Pinata Fallback & Key Exposure
- **Impact**: When users run the application without setting up Pinata credentials in `frontend/.env`, the uploader catches the HTTP error and returns a mock CID: `QmTestDeedDocumentHashForDemonstrationPurposesOnly`.
- **Consequence**: Clicking "View Document" opens an invalid IPFS link on public gateways.
- **Recommended Fix**: Display an explicit warning badge in the UI informing the user that IPFS credentials are unset, rather than silently substituting a dummy hash.

### BUG-05: Monolithic Component Architecture
- **Impact**: `App.jsx` exceeds 980 lines and contains:
  - Navigation state
  - Web3 wallet hooks
  - Data loading and caching
  - Modal rendering (Listing modal, Verification modal, Buy modal)
  - Marketplace grid, My Lands grid, Inspector table, and Audit trail views
- **Recommended Fix**: Refactor `App.jsx` into modular view components inside `frontend/src/views/` (`MarketplaceView.jsx`, `MyLandsView.jsx`, `InspectorDashboard.jsx`, `AuditTrailView.jsx`).
