// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {ReentrancyGuard} from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

/**
 * @title LandRegistry
 * @dev Production-grade decentralized land registry and title transfer system.
 * Implements role-based access control, ReentrancyGuard, and gas-efficient custom errors.
 */
contract LandRegistry is ReentrancyGuard {
    // ==========================================
    // CUSTOM ERRORS (Gas-Efficient)
    // ==========================================
    error NotAdmin();
    error NotInspector();
    error NotRegistrar();
    error InvalidOfficerAddress();
    error NotOwner();
    error LandNotFound();
    error LandAlreadyVerified();
    error LandNotVerified();
    error LandNotForSale();
    error InsufficientPayment(uint256 required, uint256 provided);
    error CannotBuyOwnLand();
    error InvalidArea();
    error InvalidPrice();
    error EmptyAddress();
    error EmptyIpfsHash();
    error EtherTransferFailed();

    // ==========================================
    // DATA STRUCTURES
    // ==========================================
    struct Land {
        uint256 id;
        string physicalAddress;
        uint256 areaSqFt;
        uint256 priceInWei;
        string ipfsHash;
        address payable currentOwner;
        bool isVerified;
        bool isForSale;
    }

    // ==========================================
    // STATE VARIABLES
    // ==========================================
    address public immutable admin;
    uint256 private _nextLandId = 1;

    // Role mappings for government officers
    mapping(address => bool) public isInspector;
    mapping(address => bool) public isRegistrar;

    // Mapping from land ID => Land metadata
    mapping(uint256 => Land) private _lands;

    // Mapping from owner address => list of owned land IDs
    mapping(address => uint256[]) private _ownerLands;

    // ==========================================
    // EVENTS
    // ==========================================
    event InspectorAdded(address indexed inspector, address indexed admin);
    event InspectorRemoved(address indexed inspector, address indexed admin);
    event RegistrarAdded(address indexed registrar, address indexed admin);
    event RegistrarRemoved(address indexed registrar, address indexed admin);
    event TitleCertified(uint256 indexed landId, address indexed registrar);

    event LandRegistered(
        uint256 indexed landId,
        address indexed owner,
        string physicalAddress,
        uint256 areaSqFt,
        uint256 priceInWei,
        string ipfsHash
    );

    event LandVerified(uint256 indexed landId, address indexed inspector);

    event LandListed(
        uint256 indexed landId,
        uint256 newPrice,
        address indexed owner
    );

    event LandDelisted(
        uint256 indexed landId,
        address indexed owner
    );

    event LandPurchased(
        uint256 indexed landId,
        address indexed previousOwner,
        address indexed newOwner,
        uint256 price
    );

    // ==========================================
    // MODIFIERS
    // ==========================================
    modifier onlyAdmin() {
        if (msg.sender != admin) {
            revert NotAdmin();
        }
        _;
    }

    modifier onlyInspector() {
        if (msg.sender != admin && !isInspector[msg.sender]) {
            revert NotInspector();
        }
        _;
    }

    modifier onlyRegistrar() {
        if (msg.sender != admin && !isRegistrar[msg.sender]) {
            revert NotRegistrar();
        }
        _;
    }

    modifier onlyOwner(uint256 landId) {
        if (_lands[landId].id == 0) {
            revert LandNotFound();
        }
        if (_lands[landId].currentOwner != msg.sender) {
            revert NotOwner();
        }
        _;
    }

    // ==========================================
    // CONSTRUCTOR
    // ==========================================
    constructor() {
        admin = msg.sender;
        isInspector[msg.sender] = true;
        isRegistrar[msg.sender] = true;
    }

    // ==========================================
    // CORE FUNCTIONS
    // ==========================================

    /**
     * @notice Registers a new parcel of land on-chain.
     * @dev Newly registered land begins in an unverified state (isVerified = false, isForSale = false).
     * @param physicalAddress Physical location / postal address of the land.
     * @param areaSqFt Total area of the parcel in square feet.
     * @param priceInWei Valuation / desired price in Wei (set to 0 if not intended for listing).
     * @param ipfsHash IPFS CID of cadastral deed, survey report, or government title document.
     * @return landId The unique identifier of the registered parcel.
     */
    function registerLand(
        string calldata physicalAddress,
        uint256 areaSqFt,
        uint256 priceInWei,
        string calldata ipfsHash
    ) external returns (uint256 landId) {
        if (bytes(physicalAddress).length == 0) {
            revert EmptyAddress();
        }
        if (areaSqFt == 0) {
            revert InvalidArea();
        }
        if (bytes(ipfsHash).length == 0) {
            revert EmptyIpfsHash();
        }

        landId = _nextLandId++;

        _lands[landId] = Land({
            id: landId,
            physicalAddress: physicalAddress,
            areaSqFt: areaSqFt,
            priceInWei: priceInWei,
            ipfsHash: ipfsHash,
            currentOwner: payable(msg.sender),
            isVerified: false,
            isForSale: false
        });

        _ownerLands[msg.sender].push(landId);

        emit LandRegistered(
            landId,
            msg.sender,
            physicalAddress,
            areaSqFt,
            priceInWei,
            ipfsHash
        );
    }

    /**
     * @notice Verifies a registered land parcel.
     * @dev Only the contract admin or authorized land inspector can verify property titles.
     * @param landId The unique identifier of the land to verify.
     */
    function verifyLand(uint256 landId) external onlyInspector {
        Land storage land = _lands[landId];
        if (land.id == 0) {
            revert LandNotFound();
        }
        if (land.isVerified) {
            revert LandAlreadyVerified();
        }

        land.isVerified = true;

        emit LandVerified(landId, msg.sender);
    }

    /**
     * @notice Lists a verified land parcel for sale with an updated price.
     * @dev Can only be called by the current owner, and only if the land has been verified by the Admin.
     * @param landId The unique identifier of the land.
     * @param newPrice The asking price in Wei (must be > 0).
     */
    function listForSale(uint256 landId, uint256 newPrice) external onlyOwner(landId) {
        Land storage land = _lands[landId];

        if (!land.isVerified) {
            revert LandNotVerified();
        }
        if (newPrice == 0) {
            revert InvalidPrice();
        }

        land.priceInWei = newPrice;
        land.isForSale = true;

        emit LandListed(landId, newPrice, msg.sender);
    }

    /**
     * @notice Delists a land parcel from the marketplace.
     * @dev Can only be called by the current owner.
     * @param landId The unique identifier of the land.
     */
    function delistLand(uint256 landId) external onlyOwner(landId) {
        Land storage land = _lands[landId];

        if (!land.isForSale) {
            revert LandNotForSale();
        }

        land.isForSale = false;

        emit LandDelisted(landId, msg.sender);
    }

    /**
     * @notice Purchases a verified land parcel currently listed for sale.
     * @dev Protected by ReentrancyGuard. Transfers payment to the seller and reassigns title ownership.
     * @param landId The unique identifier of the land parcel to purchase.
     */
    function buyLand(uint256 landId) external payable nonReentrant {
        Land storage land = _lands[landId];

        if (land.id == 0) {
            revert LandNotFound();
        }
        if (!land.isVerified) {
            revert LandNotVerified();
        }
        if (!land.isForSale) {
            revert LandNotForSale();
        }
        if (msg.sender == land.currentOwner) {
            revert CannotBuyOwnLand();
        }
        if (msg.value < land.priceInWei) {
            revert InsufficientPayment(land.priceInWei, msg.value);
        }

        address payable previousOwner = land.currentOwner;
        uint256 purchasePrice = land.priceInWei;

        // Update land state (Checks-Effects-Interactions pattern)
        land.currentOwner = payable(msg.sender);
        land.isForSale = false;

        _ownerLands[msg.sender].push(landId);

        // Remove landId from previousOwner's dynamic list
        uint256[] storage prevLands = _ownerLands[previousOwner];
        for (uint256 i = 0; i < prevLands.length; i++) {
            if (prevLands[i] == landId) {
                prevLands[i] = prevLands[prevLands.length - 1];
                prevLands.pop();
                break;
            }
        }

        // Secure transfer of funds to previous owner
        (bool success, ) = previousOwner.call{value: purchasePrice}("");
        if (!success) {
            revert EtherTransferFailed();
        }

        // Refund any excess payment
        if (msg.value > purchasePrice) {
            uint256 refundAmount = msg.value - purchasePrice;
            (bool refundSuccess, ) = payable(msg.sender).call{value: refundAmount}("");
            if (!refundSuccess) {
                revert EtherTransferFailed();
            }
        }

        emit LandPurchased(landId, previousOwner, msg.sender, purchasePrice);
    }

    // ==========================================
    // OFFICER & REGISTRAR ROLE MANAGEMENT
    // ==========================================

    /**
     * @notice Designates an authorized government land inspector.
     * @param inspector Address of the inspector.
     */
    function addInspector(address inspector) external onlyAdmin {
        if (inspector == address(0)) {
            revert InvalidOfficerAddress();
        }
        isInspector[inspector] = true;
        emit InspectorAdded(inspector, msg.sender);
    }

    /**
     * @notice Revokes a land inspector's verification privileges.
     * @param inspector Address of the inspector to revoke.
     */
    function removeInspector(address inspector) external onlyAdmin {
        isInspector[inspector] = false;
        emit InspectorRemoved(inspector, msg.sender);
    }

    /**
     * @notice Designates an authorized government land registrar.
     * @param registrar Address of the registrar.
     */
    function addRegistrar(address registrar) external onlyAdmin {
        if (registrar == address(0)) {
            revert InvalidOfficerAddress();
        }
        isRegistrar[registrar] = true;
        emit RegistrarAdded(registrar, msg.sender);
    }

    /**
     * @notice Revokes a land registrar's approval privileges.
     * @param registrar Address of the registrar to revoke.
     */
    function removeRegistrar(address registrar) external onlyAdmin {
        isRegistrar[registrar] = false;
        emit RegistrarRemoved(registrar, msg.sender);
    }

    /**
     * @notice Certifies an inspected title deed on-chain.
     * @dev Accessible only to the government Land Registrar or Admin.
     * @param landId The unique identifier of the land.
     */
    function certifyTitle(uint256 landId) external onlyRegistrar {
        Land storage land = _lands[landId];
        if (land.id == 0) {
            revert LandNotFound();
        }
        if (!land.isVerified) {
            revert LandNotVerified();
        }

        emit TitleCertified(landId, msg.sender);
    }

    /**
     * @notice Returns complete metadata for a given land parcel.
     * @param landId The unique identifier of the land.
     * @return land Full Land struct.
     */
    function getLandDetails(uint256 landId) external view returns (Land memory land) {
        land = _lands[landId];
        if (land.id == 0) {
            revert LandNotFound();
        }
    }

    /**
     * @notice Returns total number of registered parcels.
     */
    function getTotalLands() external view returns (uint256) {
        return _nextLandId - 1;
    }

    /**
     * @notice Returns an array of land IDs owned by an address.
     * @param owner Address of the owner.
     */
    function getLandsByOwner(address owner) external view returns (uint256[] memory) {
        return _ownerLands[owner];
    }
}
