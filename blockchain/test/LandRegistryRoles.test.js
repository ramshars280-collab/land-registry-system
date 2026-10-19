const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("LandRegistry Role-Based Access Control (Admin, Inspector, Registrar, Citizen)", function () {
  let landRegistry;
  let admin, inspector, registrar, citizenSeller, citizenBuyer, unauthorized;

  const sampleAddress = "Sector 14, MGM Cyber City, Chh. Sambhajinagar";
  const sampleArea = 4200;
  const samplePrice = ethers.parseEther("1.8");
  const sampleIpfsHash = "QmTestCadastralHashForRoleVerification";

  beforeEach(async function () {
    [admin, inspector, registrar, citizenSeller, citizenBuyer, unauthorized] = await ethers.getSigners();

    const LandRegistry = await ethers.getContractFactory("LandRegistry");
    landRegistry = await LandRegistry.deploy();
    await landRegistry.waitForDeployment();
  });

  describe("1. Initial Role Assignment", function () {
    it("Deployer should be Admin, Inspector, and Registrar", async function () {
      expect(await landRegistry.admin()).to.equal(admin.address);
      expect(await landRegistry.isInspector(admin.address)).to.be.true;
      expect(await landRegistry.isRegistrar(admin.address)).to.be.true;
    });

    it("Other addresses should not have officer privileges initially", async function () {
      expect(await landRegistry.isInspector(inspector.address)).to.be.false;
      expect(await landRegistry.isRegistrar(registrar.address)).to.be.false;
    });
  });

  describe("2. Inspector Role Governance", function () {
    it("Admin can add an inspector", async function () {
      await expect(landRegistry.connect(admin).addInspector(inspector.address))
        .to.emit(landRegistry, "InspectorAdded")
        .withArgs(inspector.address, admin.address);

      expect(await landRegistry.isInspector(inspector.address)).to.be.true;
    });

    it("Non-admin cannot add an inspector", async function () {
      await expect(
        landRegistry.connect(unauthorized).addInspector(inspector.address)
      ).to.be.revertedWithCustomError(landRegistry, "NotAdmin");
    });

    it("Cannot add zero address as inspector", async function () {
      await expect(
        landRegistry.connect(admin).addInspector(ethers.ZeroAddress)
      ).to.be.revertedWithCustomError(landRegistry, "InvalidOfficerAddress");
    });

    it("Added inspector can verify land", async function () {
      // Citizen registers land
      await landRegistry.connect(citizenSeller).registerLand(sampleAddress, sampleArea, samplePrice, sampleIpfsHash);
      // Admin adds inspector
      await landRegistry.connect(admin).addInspector(inspector.address);

      // Inspector verifies land
      await expect(landRegistry.connect(inspector).verifyLand(1))
        .to.emit(landRegistry, "LandVerified")
        .withArgs(1n, inspector.address);

      const details = await landRegistry.getLandDetails(1);
      expect(details.isVerified).to.be.true;
    });

    it("Revoking inspector prevents subsequent verification", async function () {
      await landRegistry.connect(citizenSeller).registerLand(sampleAddress, sampleArea, samplePrice, sampleIpfsHash);
      await landRegistry.connect(admin).addInspector(inspector.address);
      await landRegistry.connect(admin).removeInspector(inspector.address);

      expect(await landRegistry.isInspector(inspector.address)).to.be.false;

      await expect(
        landRegistry.connect(inspector).verifyLand(1)
      ).to.be.revertedWithCustomError(landRegistry, "NotInspector");
    });
  });

  describe("3. Registrar Role Governance", function () {
    beforeEach(async function () {
      await landRegistry.connect(citizenSeller).registerLand(sampleAddress, sampleArea, samplePrice, sampleIpfsHash);
      await landRegistry.connect(admin).addInspector(inspector.address);
      await landRegistry.connect(inspector).verifyLand(1);
    });

    it("Admin can add a registrar", async function () {
      await expect(landRegistry.connect(admin).addRegistrar(registrar.address))
        .to.emit(landRegistry, "RegistrarAdded")
        .withArgs(registrar.address, admin.address);

      expect(await landRegistry.isRegistrar(registrar.address)).to.be.true;
    });

    it("Non-admin cannot add a registrar", async function () {
      await expect(
        landRegistry.connect(unauthorized).addRegistrar(registrar.address)
      ).to.be.revertedWithCustomError(landRegistry, "NotAdmin");
    });

    it("Authorized registrar can certify title deed", async function () {
      await landRegistry.connect(admin).addRegistrar(registrar.address);

      await expect(landRegistry.connect(registrar).certifyTitle(1))
        .to.emit(landRegistry, "TitleCertified")
        .withArgs(1n, registrar.address);
    });

    it("Non-registrar cannot certify title deed", async function () {
      await expect(
        landRegistry.connect(unauthorized).certifyTitle(1)
      ).to.be.revertedWithCustomError(landRegistry, "NotRegistrar");
    });
  });

  describe("4. Ownership Array Cleanup on Purchase", function () {
    it("Purchased land is removed from seller's getLandsByOwner and added to buyer's", async function () {
      await landRegistry.connect(citizenSeller).registerLand(sampleAddress, sampleArea, samplePrice, sampleIpfsHash);
      await landRegistry.connect(admin).verifyLand(1);
      await landRegistry.connect(citizenSeller).listForSale(1, samplePrice);

      // Verify seller initially has land 1
      let sellerLands = await landRegistry.getLandsByOwner(citizenSeller.address);
      expect(sellerLands.map((id) => Number(id))).to.include(1);

      // Buyer purchases land
      await landRegistry.connect(citizenBuyer).buyLand(1, { value: samplePrice });

      // Seller should NO LONGER have land 1 in their dynamic list
      sellerLands = await landRegistry.getLandsByOwner(citizenSeller.address);
      expect(sellerLands.map((id) => Number(id))).to.not.include(1);

      // Buyer MUST have land 1
      const buyerLands = await landRegistry.getLandsByOwner(citizenBuyer.address);
      expect(buyerLands.map((id) => Number(id))).to.include(1);
    });
  });
});
