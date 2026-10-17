# 06. Blockchain & Smart Contract Audit

## 1. Network & Compiler Configuration

- **Contract Source File**: `blockchain/contracts/LandRegistry.sol`
- **Compiler Version**: Solidity `^0.8.20`
- **Optimizer**: Enabled (`runs: 200`)
- **Networks Configured**:
  - `hardhat`: Chain ID `31337` (In-memory testing network)
  - `localhost`: Chain ID `31337` (`http://127.0.0.1:8545`)
  - `sepolia`: Chain ID `11155111` (`https://eth-sepolia.g.alchemy.com/v2/${ALCHEMY_API_KEY}`)
- **Inherited Contracts**: `OpenZeppelin ReentrancyGuard` (`@openzeppelin/contracts/utils/ReentrancyGuard.sol`)

---

## 2. Smart Contract Function Specifications

### Function: `constructor()`
- **Access**: Public
- **Inputs**: None
- **State Changes**: Sets `admin = msg.sender`.
- **Modifiers**: None

### Function: `registerLand(string calldata _physicalAddress, uint256 _areaSqFt, string calldata _ipfsHash)`
- **Access**: Public / External
- **Inputs**:
  - `_physicalAddress`: String location (cannot be empty).
  - `_areaSqFt`: Integer surface area (must be `> 0`).
  - `_ipfsHash`: String IPFS CID (cannot be empty).
- **Validation Checks**:
  - `if (bytes(_physicalAddress).length == 0) revert LandRegistry__InvalidAddress();`
  - `if (_areaSqFt == 0) revert LandRegistry__InvalidArea();`
  - `if (bytes(_ipfsHash).length == 0) revert LandRegistry__InvalidIpfsHash();`
- **State Changes**:
  - Increments `_totalLands` by 1.
  - Stores new `Land` struct in `_lands[_totalLands]`.
  - Pushes `_totalLands` into `_ownerLands[msg.sender]`.
- **Events Emitted**: `LandRegistered(landId, msg.sender, _physicalAddress, _areaSqFt, _ipfsHash)`

### Function: `verifyLand(uint256 _landId)`
- **Access**: Public / External
- **Modifiers**: `onlyAdmin`, `landExists(_landId)`
- **Inputs**: `_landId` (Must exist between `1` and `_totalLands`).
- **Validation Checks**:
  - Caller must be `admin`.
  - `if (_lands[_landId].isVerified) revert LandRegistry__AlreadyVerified();`
- **State Changes**:
  - Sets `_lands[_landId].isVerified = true`.
- **Events Emitted**: `LandVerified(_landId, admin)`

### Function: `listForSale(uint256 _landId, uint256 _priceInWei)`
- **Access**: Public / External
- **Modifiers**: `onlyOwner(_landId)`, `landExists(_landId)`
- **Inputs**:
  - `_landId`: Target parcel.
  - `_priceInWei`: Must be `> 0`.
- **Validation Checks**:
  - Caller must be `_lands[_landId].currentOwner`.
  - `if (!_lands[_landId].isVerified) revert LandRegistry__NotVerified();`
  - `if (_priceInWei == 0) revert LandRegistry__InvalidPrice();`
- **State Changes**:
  - Sets `_lands[_landId].isForSale = true`.
  - Sets `_lands[_landId].priceInWei = _priceInWei`.
- **Events Emitted**: `LandListedForSale(_landId, _priceInWei, msg.sender)`

### Function: `delistLand(uint256 _landId)`
- **Access**: Public / External
- **Modifiers**: `onlyOwner(_landId)`, `landExists(_landId)`
- **Inputs**: `_landId`
- **Validation Checks**:
  - Caller must be `currentOwner`.
  - `if (!_lands[_landId].isForSale) revert LandRegistry__NotForSale();`
- **State Changes**:
  - Sets `_lands[_landId].isForSale = false`.
- **Events Emitted**: `LandDelisted(_landId, msg.sender)`

### Function: `buyLand(uint256 _landId)`
- **Access**: Public / External (Payable)
- **Modifiers**: `nonReentrant`, `landExists(_landId)`
- **Inputs**: `_landId`
- **Payable Value**: `msg.value` must exactly equal `_lands[_landId].priceInWei`.
- **Validation Checks**:
  - `if (!_lands[_landId].isForSale) revert LandRegistry__NotForSale();`
  - `if (msg.value != _lands[_landId].priceInWei) revert LandRegistry__IncorrectPrice();`
  - `if (msg.sender == _lands[_landId].currentOwner) revert LandRegistry__BuyerIsOwner();`
- **State Changes**:
  - Updates `_lands[_landId].isForSale = false`.
  - Captures `previousOwner = _lands[_landId].currentOwner`.
  - Updates `_lands[_landId].currentOwner = msg.sender`.
  - Pushes `_landId` to `_ownerLands[msg.sender]`.
  - **Ownership Array Cleanup**: Removes `_landId` from `_ownerLands[previousOwner]` via swap-and-pop algorithm.
- **Payment Settlement**:
  - Executes low-level transfer: `(bool sent, ) = payable(previousOwner).call{value: msg.value}("");`
  - `if (!sent) revert EtherTransferFailed();`
- **Events Emitted**: `LandPurchased(landId, previousOwner, msg.sender, purchasePrice)`

### Function: `addInspector(address inspector)` & `removeInspector(address inspector)`
- **Access**: External (`onlyAdmin`)
- **Inputs**: `address inspector` (cannot be `address(0)`).
- **State Changes**: Sets `isInspector[inspector] = true / false`.
- **Events Emitted**: `InspectorAdded` / `InspectorRemoved`.

### Function: `addRegistrar(address registrar)` & `removeRegistrar(address registrar)`
- **Access**: External (`onlyAdmin`)
- **Inputs**: `address registrar` (cannot be `address(0)`).
- **State Changes**: Sets `isRegistrar[registrar] = true / false`.
- **Events Emitted**: `RegistrarAdded` / `RegistrarRemoved`.

### Function: `certifyTitle(uint256 landId)`
- **Access**: External (`onlyRegistrar`)
- **Inputs**: `uint256 landId` (must exist and `isVerified == true`).
- **Events Emitted**: `TitleCertified(landId, msg.sender)`.

---

## 3. View & Pure Getter Functions

| Function Name | Visibility | Parameters | Output Return Types |
| :--- | :--- | :--- | :--- |
| `getLandDetails(uint256 _landId)` | `external view` | `uint256 _landId` | `(uint256 id, string physicalAddress, uint256 areaSqFt, uint256 priceInWei, string ipfsHash, address currentOwner, bool isVerified, bool isForSale)` |
| `getTotalLands()` | `external view` | None | `uint256` |
| `getLandsByOwner(address _owner)` | `external view` | `address _owner` | `uint256[] memory` |

---

## 4. Contract Events

```solidity
event LandRegistered(uint256 indexed landId, address indexed owner, string physicalAddress, uint256 areaSqFt, string ipfsHash);
event LandVerified(uint256 indexed landId, address indexed verifiedBy);
event LandListedForSale(uint256 indexed landId, uint256 priceInWei, address indexed seller);
event LandDelisted(uint256 indexed landId, address indexed seller);
event LandSold(uint256 indexed landId, address indexed seller, address indexed buyer, uint256 priceInWei);
```
All state-modifying actions emit typed events with `indexed` parameters for fast JSON-RPC log filtering (`eth_getLogs`).
