const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("LandRegistry Production Smart Contract", function () {
  let landRegistry;
  let admin, seller, buyer, unauthorizedUser;

  const sampleAddress = "450 Blockchain Blvd, Silicon Hills, CA 94025";
  const sampleArea = 3500; // sq ft
  const samplePrice = ethers.parseEther("2.5");
  const sampleIpfsHash = "QmYwAPJzv5CZsnA625s3Xf2nemtYgPpHdWEz79ojWnPbdG";

  beforeEach(async function () {
    [admin, seller, buyer, unauthorizedUser] = await ethers.getSigners();

    const LandRegistry = await ethers.getContractFactory("LandRegistry");
    landRegistry = await LandRegistry.deploy();
    await landRegistry.waitForDeployment();
  });

  describe("1. Deployment & Roles", function () {
    it("Should correctly set the deployer as admin", async function () {
      expect(await landRegistry.admin()).to.equal(admin.address);
    });

    it("Should initialize with zero registered lands", async function () {
      expect(await landRegistry.getTotalLands()).to.equal(0n);
    });
  });

  describe("2. Land Registration", function () {
    it("Should register a new parcel in unverified and unlisted status", async function () {
      await expect(
        landRegistry
          .connect(seller)
          .registerLand(sampleAddress, sampleArea, samplePrice, sampleIpfsHash)
      )
        .to.emit(landRegistry, "LandRegistered")
        .withArgs(1n, seller.address, sampleAddress, sampleArea, samplePrice, sampleIpfsHash);

      expect(await landRegistry.getTotalLands()).to.equal(1n);

      const land = await landRegistry.getLandDetails(1);
      expect(land.id).to.equal(1n);
      expect(land.physicalAddress).to.equal(sampleAddress);
      expect(land.areaSqFt).to.equal(sampleArea);
      expect(land.priceInWei).to.equal(samplePrice);
      expect(land.ipfsHash).to.equal(sampleIpfsHash);
      expect(land.currentOwner).to.equal(seller.address);
      expect(land.isVerified).to.be.false;
      expect(land.isForSale).to.be.false;
    });

    it("Should revert if registering with empty physical address", async function () {
      await expect(
        landRegistry.connect(seller).registerLand("", sampleArea, samplePrice, sampleIpfsHash)
      ).to.be.revertedWithCustomError(landRegistry, "EmptyAddress");
    });

    it("Should revert if registering with zero area", async function () {
      await expect(
        landRegistry.connect(seller).registerLand(sampleAddress, 0, samplePrice, sampleIpfsHash)
      ).to.be.revertedWithCustomError(landRegistry, "InvalidArea");
    });

    it("Should revert if registering with empty IPFS hash", async function () {
      await expect(
        landRegistry.connect(seller).registerLand(sampleAddress, sampleArea, samplePrice, "")
      ).to.be.revertedWithCustomError(landRegistry, "EmptyIpfsHash");
    });
  });

  describe("3. Admin Title Verification", function () {
    beforeEach(async function () {
      await landRegistry
        .connect(seller)
        .registerLand(sampleAddress, sampleArea, samplePrice, sampleIpfsHash);
    });

    it("Should allow admin to verify land and emit LandVerified event", async function () {
      await expect(landRegistry.connect(admin).verifyLand(1))
        .to.emit(landRegistry, "LandVerified")
        .withArgs(1n, admin.address);

      const land = await landRegistry.getLandDetails(1);
      expect(land.isVerified).to.be.true;
    });

    it("Should revert if non-admin attempts verification", async function () {
      await expect(
        landRegistry.connect(unauthorizedUser).verifyLand(1)
      ).to.be.revertedWithCustomError(landRegistry, "NotAdmin");
    });

    it("Should revert if verifying already verified land", async function () {
      await landRegistry.connect(admin).verifyLand(1);
      await expect(
        landRegistry.connect(admin).verifyLand(1)
      ).to.be.revertedWithCustomError(landRegistry, "LandAlreadyVerified");
    });

    it("Should revert when verifying non-existent land ID", async function () {
      await expect(
        landRegistry.connect(admin).verifyLand(999)
      ).to.be.revertedWithCustomError(landRegistry, "LandNotFound");
    });
  });

  describe("4. Listing for Sale", function () {
    beforeEach(async function () {
      await landRegistry
        .connect(seller)
        .registerLand(sampleAddress, sampleArea, samplePrice, sampleIpfsHash);
    });

    it("Should revert if attempting to list unverified land", async function () {
      await expect(
        landRegistry.connect(seller).listForSale(1, ethers.parseEther("3.0"))
      ).to.be.revertedWithCustomError(landRegistry, "LandNotVerified");
    });

    it("Should revert if non-owner attempts to list", async function () {
      await landRegistry.connect(admin).verifyLand(1);
      await expect(
        landRegistry.connect(unauthorizedUser).listForSale(1, ethers.parseEther("3.0"))
      ).to.be.revertedWithCustomError(landRegistry, "NotOwner");
    });

    it("Should revert if price is zero", async function () {
      await landRegistry.connect(admin).verifyLand(1);
      await expect(
        landRegistry.connect(seller).listForSale(1, 0)
      ).to.be.revertedWithCustomError(landRegistry, "InvalidPrice");
    });

    it("Should allow owner to list verified land for sale and emit LandListed", async function () {
      await landRegistry.connect(admin).verifyLand(1);
      const newPrice = ethers.parseEther("3.2");

      await expect(landRegistry.connect(seller).listForSale(1, newPrice))
        .to.emit(landRegistry, "LandListed")
        .withArgs(1n, newPrice, seller.address);

      const land = await landRegistry.getLandDetails(1);
      expect(land.isForSale).to.be.true;
      expect(land.priceInWei).to.equal(newPrice);
    });

    it("Should allow owner to delist land from marketplace and emit LandDelisted", async function () {
      await landRegistry.connect(admin).verifyLand(1);
      await landRegistry.connect(seller).listForSale(1, ethers.parseEther("1.0"));

      await expect(landRegistry.connect(seller).delistLand(1))
        .to.emit(landRegistry, "LandDelisted")
        .withArgs(1n, seller.address);

      const land = await landRegistry.getLandDetails(1);
      expect(land.isForSale).to.be.false;
    });

    it("Should revert if delisting land that is not for sale", async function () {
      await landRegistry.connect(admin).verifyLand(1);
      await expect(
        landRegistry.connect(seller).delistLand(1)
      ).to.be.revertedWithCustomError(landRegistry, "LandNotForSale");
    });
  });

  describe("5. Purchase Handling & Balance Assertions", function () {
    const listPrice = ethers.parseEther("2.0");

    beforeEach(async function () {
      await landRegistry
        .connect(seller)
        .registerLand(sampleAddress, sampleArea, samplePrice, sampleIpfsHash);
      await landRegistry.connect(admin).verifyLand(1);
      await landRegistry.connect(seller).listForSale(1, listPrice);
    });

    it("Should revert purchase if land is not for sale", async function () {
      // Register land #2, verify it, but do not list it
      await landRegistry
        .connect(seller)
        .registerLand("Plot #2", 2000, 0, "QmHash2");
      await landRegistry.connect(admin).verifyLand(2);

      await expect(
        landRegistry.connect(buyer).buyLand(2, { value: ethers.parseEther("1.0") })
      ).to.be.revertedWithCustomError(landRegistry, "LandNotForSale");
    });

    it("Should revert if current owner attempts to buy own land", async function () {
      await expect(
        landRegistry.connect(seller).buyLand(1, { value: listPrice })
      ).to.be.revertedWithCustomError(landRegistry, "CannotBuyOwnLand");
    });

    it("Should revert if payment is insufficient", async function () {
      const underpayment = ethers.parseEther("1.5");
      await expect(
        landRegistry.connect(buyer).buyLand(1, { value: underpayment })
      )
        .to.be.revertedWithCustomError(landRegistry, "InsufficientPayment")
        .withArgs(listPrice, underpayment);
    });

    it("Should execute successful purchase with balance assertions and event emission", async function () {
      const sellerBalanceBefore = await ethers.provider.getBalance(seller.address);

      // Buyer sends exact payment
      const tx = await landRegistry.connect(buyer).buyLand(1, { value: listPrice });
      await expect(tx)
        .to.emit(landRegistry, "LandPurchased")
        .withArgs(1n, seller.address, buyer.address, listPrice);

      // 1. Assert seller received exact sale price
      const sellerBalanceAfter = await ethers.provider.getBalance(seller.address);
      expect(sellerBalanceAfter - sellerBalanceBefore).to.equal(listPrice);

      // 2. Assert land ownership transferred and unlisted
      const land = await landRegistry.getLandDetails(1);
      expect(land.currentOwner).to.equal(buyer.address);
      expect(land.isForSale).to.be.false;

      // 3. Verify buyer owns this land ID in mapping
      const buyerLands = await landRegistry.getLandsByOwner(buyer.address);
      expect(buyerLands.map((id) => Number(id))).to.include(1);
    });

    it("Should refund excess payment if buyer sends more than asking price", async function () {
      const excessPayment = ethers.parseEther("3.0"); // 1.0 ETH excess
      const sellerBalanceBefore = await ethers.provider.getBalance(seller.address);
      const buyerBalanceBefore = await ethers.provider.getBalance(buyer.address);

      const tx = await landRegistry.connect(buyer).buyLand(1, { value: excessPayment });
      const receipt = await tx.wait();
      const gasSpent = receipt.gasUsed * receipt.gasPrice;

      // Seller should only receive listPrice (2.0 ETH)
      const sellerBalanceAfter = await ethers.provider.getBalance(seller.address);
      expect(sellerBalanceAfter - sellerBalanceBefore).to.equal(listPrice);

      // Buyer should only have lost listPrice + gas
      const buyerBalanceAfter = await ethers.provider.getBalance(buyer.address);
      expect(buyerBalanceBefore - buyerBalanceAfter - gasSpent).to.equal(listPrice);
    });
  });
});
