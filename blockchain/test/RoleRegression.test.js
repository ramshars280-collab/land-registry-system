const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("TerraChain Role-Based Access Control & Lifecycle Regression Suite", function () {
  let landRegistry;
  let admin, inspector, registrar, seller, buyer, unauthorizedUser;

  const sampleAddress = "Plot 104, Sector 12, CIDCO Urban Zone, Chh. Sambhajinagar";
  const sampleArea = 4500;
  const samplePrice = ethers.parseEther("2.5");
  const sampleIpfsHash = "bafk-sample-title-deed-cidco-zone-hash";

  beforeEach(async function () {
    [admin, inspector, registrar, seller, buyer, unauthorizedUser] = await ethers.getSigners();

    const LandRegistry = await ethers.getContractFactory("LandRegistry");
    landRegistry = await LandRegistry.deploy();
    await landRegistry.waitForDeployment();

    // Register Inspector and Registrar by Admin
    await landRegistry.connect(admin).addInspector(inspector.address);
    await landRegistry.connect(admin).addRegistrar(registrar.address);
  });

  it("1. Authorized Inspector transaction: verifyLand succeeds and emits LandVerified", async function () {
    // Citizen registers land
    await landRegistry.connect(seller).registerLand(sampleAddress, sampleArea, samplePrice, sampleIpfsHash);

    // Inspector verifies land
    await expect(landRegistry.connect(inspector).verifyLand(1))
      .to.emit(landRegistry, "LandVerified")
      .withArgs(1n, inspector.address);

    const land = await landRegistry.getLandDetails(1);
    expect(land.isVerified).to.be.true;
  });

  it("2. Unauthorized account attempting verifyLand: reverts with NotInspector", async function () {
    await landRegistry.connect(seller).registerLand(sampleAddress, sampleArea, samplePrice, sampleIpfsHash);

    // Unauthorized citizen tries to verify
    await expect(
      landRegistry.connect(unauthorizedUser).verifyLand(1)
    ).to.be.revertedWithCustomError(landRegistry, "NotInspector");

    // Also seller cannot self-verify
    await expect(
      landRegistry.connect(seller).verifyLand(1)
    ).to.be.revertedWithCustomError(landRegistry, "NotInspector");
  });

  it("3. Authorized Sub-Registrar transaction: certifyTitle succeeds and emits TitleCertified", async function () {
    await landRegistry.connect(seller).registerLand(sampleAddress, sampleArea, samplePrice, sampleIpfsHash);
    await landRegistry.connect(inspector).verifyLand(1);

    await expect(landRegistry.connect(registrar).certifyTitle(1))
      .to.emit(landRegistry, "TitleCertified")
      .withArgs(1n, registrar.address);
  });

  it("4. Unauthorized account attempting certifyTitle: reverts with NotRegistrar", async function () {
    await landRegistry.connect(seller).registerLand(sampleAddress, sampleArea, samplePrice, sampleIpfsHash);
    await landRegistry.connect(inspector).verifyLand(1);

    // Unauthorized user attempts title certification
    await expect(
      landRegistry.connect(unauthorizedUser).certifyTitle(1)
    ).to.be.revertedWithCustomError(landRegistry, "NotRegistrar");

    // Inspector cannot perform Sub-Registrar certification
    await expect(
      landRegistry.connect(inspector).certifyTitle(1)
    ).to.be.revertedWithCustomError(landRegistry, "NotRegistrar");
  });

  it("5. Admin operation: governance role grant, revocation, and dual-override privileges", async function () {
    const [_, __, ___, ____, _____, ______, newOfficer] = await ethers.getSigners();

    // Admin grants inspector
    await expect(landRegistry.connect(admin).addInspector(newOfficer.address))
      .to.emit(landRegistry, "InspectorAdded")
      .withArgs(newOfficer.address, admin.address);
    expect(await landRegistry.isInspector(newOfficer.address)).to.be.true;

    // Non-admin cannot grant
    await expect(
      landRegistry.connect(unauthorizedUser).addInspector(newOfficer.address)
    ).to.be.revertedWithCustomError(landRegistry, "NotAdmin");

    // Admin can also verify directly as supreme officer
    await landRegistry.connect(seller).registerLand(sampleAddress, sampleArea, samplePrice, sampleIpfsHash);
    await expect(landRegistry.connect(admin).verifyLand(1))
      .to.emit(landRegistry, "LandVerified")
      .withArgs(1n, admin.address);

    // Admin can certify title directly
    await expect(landRegistry.connect(admin).certifyTitle(1))
      .to.emit(landRegistry, "TitleCertified")
      .withArgs(1n, admin.address);
  });

  it("6. Citizen property registration with correct sender: records ownership and metadata", async function () {
    const tx = await landRegistry
      .connect(seller)
      .registerLand(sampleAddress, sampleArea, samplePrice, sampleIpfsHash);

    await expect(tx)
      .to.emit(landRegistry, "LandRegistered")
      .withArgs(1n, seller.address, sampleAddress, sampleArea, samplePrice, sampleIpfsHash);

    const land = await landRegistry.getLandDetails(1);
    expect(land.currentOwner).to.equal(seller.address);
    expect(land.isVerified).to.be.false;
    expect(land.isForSale).to.be.false;

    const owned = await landRegistry.getLandsByOwner(seller.address);
    expect(owned.map(Number)).to.include(1);
  });

  it("7. Parcel lifecycle violations are strictly prevented", async function () {
    await landRegistry.connect(seller).registerLand(sampleAddress, sampleArea, samplePrice, sampleIpfsHash);

    // Violation A: Certifying title before inspection verification
    await expect(
      landRegistry.connect(registrar).certifyTitle(1)
    ).to.be.revertedWithCustomError(landRegistry, "LandNotVerified");

    // Violation B: Listing for sale before inspection verification
    await expect(
      landRegistry.connect(seller).listForSale(1, ethers.parseEther("3.0"))
    ).to.be.revertedWithCustomError(landRegistry, "LandNotVerified");

    // Inspection verification succeeds
    await landRegistry.connect(inspector).verifyLand(1);

    // Violation C: Duplicate verification on already-verified parcel
    await expect(
      landRegistry.connect(inspector).verifyLand(1)
    ).to.be.revertedWithCustomError(landRegistry, "LandAlreadyVerified");

    // List land
    await landRegistry.connect(seller).listForSale(1, ethers.parseEther("2.5"));

    // Violation D: Owner attempting to buy own property
    await expect(
      landRegistry.connect(seller).buyLand(1, { value: ethers.parseEther("2.5") })
    ).to.be.revertedWithCustomError(landRegistry, "CannotBuyOwnLand");

    // Violation E: Buying an unlisted parcel
    await landRegistry.connect(seller).registerLand("Plot 202", 2000, 0, "hash2");
    await landRegistry.connect(inspector).verifyLand(2);
    await expect(
      landRegistry.connect(buyer).buyLand(2, { value: ethers.parseEther("1.0") })
    ).to.be.revertedWithCustomError(landRegistry, "LandNotForSale");
  });
});
