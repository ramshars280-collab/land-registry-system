import os
import docx
from docx import Document
from docx.shared import Inches, Pt, RGBColor
from docx.enum.text import WD_ALIGN_PARAGRAPH
from docx.enum.table import WD_TABLE_ALIGNMENT, WD_ALIGN_VERTICAL
from docx.oxml import OxmlElement, parse_xml
from docx.oxml.ns import nsdecls, qn

def set_cell_background(cell, fill_hex):
    tcPr = cell._tc.get_or_add_tcPr()
    tcPr.append(parse_xml(f'<w:shd {nsdecls("w")} w:fill="{fill_hex}"/>'))

def set_cell_margins(cell, top=100, bottom=100, left=150, right=150):
    tcPr = cell._tc.get_or_add_tcPr()
    tcMar = OxmlElement('w:tcMar')
    for m, val in [('w:top', top), ('w:bottom', bottom), ('w:left', left), ('w:right', right)]:
        node = OxmlElement(m)
        node.set(qn('w:w'), str(val))
        node.set(qn('w:type'), 'dxa')
        tcMar.append(node)
    tcPr.append(tcMar)

def generate_indepth_docx(output_path):
    doc = Document()

    # Configure Margins (0.8 inch)
    for section in doc.sections:
        section.top_margin = Inches(0.8)
        section.bottom_margin = Inches(0.8)
        section.left_margin = Inches(0.8)
        section.right_margin = Inches(0.8)
        
        # Header & Footer setup
        header = section.header
        hp = header.paragraphs[0]
        hp.alignment = WD_ALIGN_PARAGRAPH.RIGHT
        hrun = hp.add_run("TERRACHAIN (LANDBLOCK) | In-Depth Technical Specification & Architecture")
        hrun.font.name = "Arial"
        hrun.font.size = Pt(8.5)
        hrun.font.color.rgb = RGBColor(100, 116, 139) # Slate 500

        footer = section.footer
        fp = footer.paragraphs[0]
        fp.alignment = WD_ALIGN_PARAGRAPH.LEFT
        frun = fp.add_run("Solidity 0.8.20 • Hardhat • Ethers.js v6 • Pinata IPFS • React 18 • OpenZeppelin")
        frun.font.name = "Arial"
        frun.font.size = Pt(8.5)
        frun.font.color.rgb = RGBColor(100, 116, 139)

    # Base Normal Style
    normal = doc.styles['Normal']
    normal.font.name = 'Calibri'
    normal.font.size = Pt(11)
    normal.font.color.rgb = RGBColor(30, 41, 59) # Slate 800

    def add_title(text):
        p = doc.add_paragraph()
        p.paragraph_format.space_before = Pt(18)
        p.paragraph_format.space_after = Pt(2)
        r = p.add_run(text)
        r.font.name = 'Arial Black'
        r.font.size = Pt(24)
        r.font.color.rgb = RGBColor(5, 150, 105) # Emerald 600
        return p

    def add_subtitle(text):
        p = doc.add_paragraph()
        p.paragraph_format.space_before = Pt(2)
        p.paragraph_format.space_after = Pt(16)
        r = p.add_run(text)
        r.font.name = 'Calibri'
        r.font.size = Pt(13)
        r.font.bold = True
        r.font.color.rgb = RGBColor(71, 85, 105) # Slate 600
        return p

    def add_h1(text):
        p = doc.add_paragraph()
        p.paragraph_format.space_before = Pt(20)
        p.paragraph_format.space_after = Pt(6)
        p.paragraph_format.keep_with_next = True
        r = p.add_run(text)
        r.font.name = 'Arial'
        r.font.size = Pt(15)
        r.font.bold = True
        r.font.color.rgb = RGBColor(5, 150, 105) # Emerald 600
        return p

    def add_h2(text):
        p = doc.add_paragraph()
        p.paragraph_format.space_before = Pt(14)
        p.paragraph_format.space_after = Pt(4)
        p.paragraph_format.keep_with_next = True
        r = p.add_run(text)
        r.font.name = 'Calibri'
        r.font.size = Pt(12.5)
        r.font.bold = True
        r.font.color.rgb = RGBColor(15, 23, 42) # Slate 900
        return p

    def add_h3(text):
        p = doc.add_paragraph()
        p.paragraph_format.space_before = Pt(10)
        p.paragraph_format.space_after = Pt(2)
        p.paragraph_format.keep_with_next = True
        r = p.add_run(text)
        r.font.name = 'Calibri'
        r.font.size = Pt(11.5)
        r.font.bold = True
        r.font.color.rgb = RGBColor(30, 41, 59)
        return p

    def add_body(text, space_after=6):
        p = doc.add_paragraph()
        p.paragraph_format.space_before = Pt(0)
        p.paragraph_format.space_after = Pt(space_after)
        p.paragraph_format.line_spacing = 1.15
        r = p.add_run(text)
        r.font.name = 'Calibri'
        r.font.size = Pt(11)
        r.font.color.rgb = RGBColor(30, 41, 59)
        return p

    def add_bullet(bold_prefix, regular_text):
        p = doc.add_paragraph(style='List Bullet')
        p.paragraph_format.space_before = Pt(1)
        p.paragraph_format.space_after = Pt(3)
        p.paragraph_format.line_spacing = 1.15
        if bold_prefix:
            r1 = p.add_run(bold_prefix)
            r1.font.name = 'Calibri'
            r1.font.size = Pt(11)
            r1.font.bold = True
            r1.font.color.rgb = RGBColor(15, 23, 42)
        if regular_text:
            r2 = p.add_run(regular_text)
            r2.font.name = 'Calibri'
            r2.font.size = Pt(11)
            r2.font.bold = False
            r2.font.color.rgb = RGBColor(30, 41, 59)
        return p

    def add_callout(text, title="KEY ARCHITECTURAL HIGHLIGHT"):
        tbl = doc.add_table(rows=1, cols=1)
        tbl.alignment = WD_TABLE_ALIGNMENT.CENTER
        cell = tbl.cell(0, 0)
        cell.width = Inches(6.8)
        set_cell_background(cell, "F0FDF4") # Light emerald
        set_cell_margins(cell, top=140, bottom=140, left=200, right=200)

        p = cell.paragraphs[0]
        p.paragraph_format.space_before = Pt(0)
        p.paragraph_format.space_after = Pt(2)
        r_title = p.add_run(f"[{title}]\n")
        r_title.bold = True
        r_title.font.name = 'Arial'
        r_title.font.size = Pt(10)
        r_title.font.color.rgb = RGBColor(4, 120, 87) # Emerald 700

        r_text = p.add_run(text)
        r_text.font.name = 'Calibri'
        r_text.font.size = Pt(10.5)
        r_text.font.color.rgb = RGBColor(22, 101, 52)
        doc.add_paragraph().paragraph_format.space_after = Pt(4)

    def add_code_block(code_str):
        tbl = doc.add_table(rows=1, cols=1)
        tbl.alignment = WD_TABLE_ALIGNMENT.CENTER
        cell = tbl.cell(0, 0)
        cell.width = Inches(6.8)
        set_cell_background(cell, "F8FAFC") # Light Slate
        set_cell_margins(cell, top=120, bottom=120, left=180, right=180)

        p = cell.paragraphs[0]
        p.paragraph_format.space_before = Pt(0)
        p.paragraph_format.space_after = Pt(0)
        r = p.add_run(code_str)
        r.font.name = 'Consolas'
        r.font.size = Pt(9)
        r.font.color.rgb = RGBColor(30, 41, 59)
        doc.add_paragraph().paragraph_format.space_after = Pt(4)

    def style_table(table, col_widths, headers, data):
        table.alignment = WD_TABLE_ALIGNMENT.CENTER
        # Format Header
        hdr_cells = table.rows[0].cells
        for i, h_text in enumerate(headers):
            hdr_cells[i].text = ""
            p = hdr_cells[i].paragraphs[0]
            p.paragraph_format.space_before = Pt(4)
            p.paragraph_format.space_after = Pt(4)
            r = p.add_run(h_text)
            r.bold = True
            r.font.name = 'Arial'
            r.font.size = Pt(9.5)
            r.font.color.rgb = RGBColor(255, 255, 255)
            set_cell_background(hdr_cells[i], "0F766E") # Dark Teal
            set_cell_margins(hdr_cells[i], top=100, bottom=100, left=120, right=120)

        # Format Data Rows
        for r_idx, row_data in enumerate(data):
            row = table.rows[r_idx + 1]
            bg = "F8FAFC" if r_idx % 2 == 1 else "FFFFFF"
            for c_idx, val in enumerate(row_data):
                cell = row.cells[c_idx]
                cell.text = ""
                p = cell.paragraphs[0]
                p.paragraph_format.space_before = Pt(3)
                p.paragraph_format.space_after = Pt(3)
                r = p.add_run(str(val))
                r.font.name = 'Calibri'
                r.font.size = Pt(9.5)
                r.font.color.rgb = RGBColor(30, 41, 59)
                set_cell_background(cell, bg)
                set_cell_margins(cell, top=80, bottom=80, left=120, right=120)

        # Apply column widths
        for row in table.rows:
            for idx, width in enumerate(col_widths):
                row.cells[idx].width = Inches(width)

        doc.add_paragraph().paragraph_format.space_after = Pt(6)

    # =========================================================================
    # DOCUMENT CONTENT GENERATION
    # =========================================================================

    add_title("TERRACHAIN (LANDBLOCK)")
    add_subtitle("In-Depth System Architecture, Cryptographic Verification, Smart Contract Engineering & Technical Operational Manual")

    # Project Metadata Table
    meta_table = doc.add_table(rows=7, cols=2)
    meta_data = [
        ("System Name", "TerraChain — Decentralized Land Title & Real Estate Escrow Registry"),
        ("Smart Contract Engine", "Solidity v0.8.20, Hardhat Framework, OpenZeppelin ReentrancyGuard"),
        ("Storage Subsystem", "Pinata IPFS (InterPlanetary File System) REST API v0/v1 (CID-pinned)"),
        ("Frontend & Web3 Stack", "React 18, Vite, Tailwind CSS, Ethers.js v6, MetaMask (EIP-1193)"),
        ("Consensus & Chains", "EVM Compatible — Localhost (Chain ID: 31337), Sepolia (Chain ID: 11155111)"),
        ("Validation & Testing", "21/21 Hardhat Unit Tests Passing (100% assertions, atomic balances verified)"),
        ("Core Security Model", "Two-Tier Inspector Gatekeeper, Checks-Effects-Interactions, Custom Errors")
    ]
    for idx, (k, v) in enumerate(meta_data):
        row = meta_table.rows[idx]
        p0 = row.cells[0].paragraphs[0]
        p0.paragraph_format.space_before = Pt(3)
        p0.paragraph_format.space_after = Pt(3)
        r0 = p0.add_run(k)
        r0.bold = True
        r0.font.size = Pt(9.5)
        set_cell_background(row.cells[0], "F1F5F9")
        set_cell_margins(row.cells[0], top=60, bottom=60, left=100, right=100)

        p1 = row.cells[1].paragraphs[0]
        p1.paragraph_format.space_before = Pt(3)
        p1.paragraph_format.space_after = Pt(3)
        r1 = p1.add_run(v)
        r1.font.size = Pt(9.5)
        set_cell_background(row.cells[1], "FFFFFF")
        set_cell_margins(row.cells[1], top=60, bottom=60, left=100, right=100)

        row.cells[0].width = Inches(2.2)
        row.cells[1].width = Inches(4.6)

    doc.add_paragraph().paragraph_format.space_after = Pt(12)

    # -------------------------------------------------------------------------
    # CHAPTER 1: EXECUTIVE SUMMARY & PROBLEM FORMULATION
    # -------------------------------------------------------------------------
    add_h1("1. Executive Summary & Problem Formulation")
    add_body(
        "Land administration forms the bedrock of real estate capital markets, municipal urban planning, and sovereign property law. "
        "However, property titling across the world remains one of the most corrupt, fragmented, and litigious domains in public governance. "
        "Studies conducted by international economic institutes and the World Bank reveal that in developing jurisdictions, real property disputes "
        "account for over 60% to 70% of all ongoing civil court backlogs."
    )
    add_body(
        "The fundamental vulnerabilities of traditional centralized registries stem from architectural defects:"
    )
    add_bullet("1. Double Selling & Fraudulent Conveyance: ",
               "Because property deed registration in conventional municipal offices requires days or weeks to reflect across departmental archives, "
               "unscrupulous sellers exploit this latency window to execute multiple concurrent sale deeds with different buyers for the exact same plot.")
    add_bullet("2. Centralized Database Vulnerabilities: ",
               "Standard computerized municipal systems rely on relational databases (e.g., MySQL, Oracle, PostgreSQL). In such architectures, "
               "any administrator holding root credentials, rogue municipal operator, or compromised IT vendor can execute direct SQL UPDATE or DELETE "
               "commands, altering cadastral records without producing a public, immutable cryptographic audit trail.")
    add_bullet("3. Physical Record Decay & Destruction: ",
               "Paper-based deeds, cadastral survey maps, and revenue logs stored in physical record rooms remain susceptible to insect destruction, "
               "fire incidents, flooding, and deliberate destruction during political or social upheavals.")
    add_bullet("4. Prohibitive Intermediary Overhead: ",
               "Prospective buyers must pay exorbitant title search fees to private agents, attorneys, and notarization brokers, enduring weeks of "
               "bureaucratic delay to verify historical chains of title.")

    add_callout(
        "TerraChain eliminates these structural points of failure by replacing centralized databases with an autonomous, mathematically "
        "verifiable smart contract ledger on the Ethereum Virtual Machine (EVM), combined with peer-to-peer decentralized document storage on IPFS.",
        "CORE VALUE PROPOSITION"
    )

    # -------------------------------------------------------------------------
    # CHAPTER 2: DECENTRALIZED SYSTEM ARCHITECTURE
    # -------------------------------------------------------------------------
    add_h1("2. Decentralized System Architecture & Hybrid Storage")
    add_body(
        "A critical engineering challenge in building blockchain-based enterprise systems is EVM gas economics. Storing high-resolution deed documents, "
        "architectural blueprints, and satellite GIS boundary surveys directly in Ethereum contract storage (SSTORE opcode) is economically prohibitive—storing "
        "a single 2 MB PDF would cost thousands of dollars in gas."
    )
    add_body(
        "To solve this, TerraChain implements a state-of-the-art Hybrid On-Chain / Off-Chain Architecture divided into three distinct operational tiers:"
    )

    arch_headers = ["Layer / Tier", "Technology", "Primary Responsibility", "Key Invariants Enforced"]
    arch_data = [
        ["Tier 1: Execution Engine", "Solidity 0.8.20, Hardhat, OpenZeppelin", "On-chain state machine, ownership registry, escrow settlement", "ReentrancyGuard, immutable admin, Checks-Effects-Interactions"],
        ["Tier 2: Content Storage", "Pinata IPFS (InterPlanetary File System)", "Decentralized document pinning, cryptographic CID generation", "Content addressing, SHA-256 / Keccak-256 cryptographic immutability"],
        ["Tier 3: Presentation", "React 18, Vite, Tailwind CSS, Ethers.js v6", "MetaMask provider integration, multi-role dynamic UI, real-time toasts", "Zero centralized server dependencies, client-side role validation"]
    ]
    t_arch = doc.add_table(rows=len(arch_data)+1, cols=4)
    style_table(t_arch, [1.5, 1.6, 2.0, 1.7], arch_headers, arch_data)

    add_h2("The Cryptographic IPFS CID Binding Mechanism")
    add_body(
        "When an owner uploads a cadastral title deed or survey certificate, the file is processed through the IPFS protocol via Pinata's REST API. "
        "The IPFS engine computes a unique cryptographic hash called a Content Identifier (CID, e.g., QmYwAPJzv5CZsnA625s3Xf2nemtYgPpHdWEz79ojWnPbdG). "
        "This 32-byte CID represents the mathematical digest of the file's binary contents. TerraChain immutably records this string directly into the smart "
        "contract's Land struct. If a malicious party alters even a single pixel or comma in the deed document, its recalculated hash completely diverges, "
        "rendering tampering instantly detectable."
    )

    # -------------------------------------------------------------------------
    # CHAPTER 3: SMART CONTRACT DEEP-DIVE (LandRegistry.sol)
    # -------------------------------------------------------------------------
    add_h1("3. Smart Contract Deep Dive: LandRegistry.sol")
    add_body(
        "The smart contract LandRegistry.sol is deployed on the EVM and serves as the autonomous, tamper-proof title registry. "
        "It integrates OpenZeppelin's ReentrancyGuard and utilizes Solidity 0.8.20 modern language features."
    )

    add_h2("3.1 On-Chain Data Structures & State Mappings")
    add_body(
        "Every real estate parcel is structured as an immutable Land entity stored within a private mapping indexed by an auto-incrementing uint256 ID:"
    )
    add_code_block(
        "struct Land {\n"
        "    uint256 id;                  // Unique auto-incrementing parcel identifier\n"
        "    string physicalAddress;      // Real-world physical street address / plot details\n"
        "    uint256 areaSqFt;            // Certified land surface area in square feet\n"
        "    uint256 priceInWei;          // Current valuation / listing price in Wei (1 ETH = 10^18 Wei)\n"
        "    string ipfsHash;             // 32-byte IPFS Content Identifier (CID) of the deed PDF\n"
        "    address payable currentOwner;// Ethereum wallet address of the verified title holder\n"
        "    bool isVerified;             // True only after physical audit by Land Inspector\n"
        "    bool isForSale;              // Flag indicating whether parcel is active on marketplace\n"
        "}\n\n"
        "address public immutable admin;                // Set at deployment to contract deployer\n"
        "uint256 private _nextLandId = 1;               // Auto-incrementing primary key counter\n"
        "mapping(uint256 => Land) private _lands;       // Primary on-chain registry mapping\n"
        "mapping(address => uint256[]) private _ownerLands; // Reverse portfolio index"
    )

    add_h2("3.2 Gas-Optimized Custom Errors")
    add_body(
        "Standard Solidity require(condition, 'string error') statements store arbitrary string literals directly in contract runtime bytecode, "
        "inflating deployment gas costs and consuming extra execution gas during reverts. TerraChain leverages Solidity 0.8.20 Custom Errors, "
        "which compile to compact 4-byte function selectors, minimizing EVM execution costs by up to 40%:"
    )
    add_code_block(
        "error NotAdmin();\n"
        "error NotOwner();\n"
        "error LandNotFound();\n"
        "error LandAlreadyVerified();\n"
        "error LandNotVerified();\n"
        "error LandNotForSale();\n"
        "error InsufficientPayment(uint256 required, uint256 provided);\n"
        "error CannotBuyOwnLand();\n"
        "error InvalidArea();\n"
        "error InvalidPrice();\n"
        "error EmptyAddress();\n"
        "error EmptyIpfsHash();\n"
        "error EtherTransferFailed();"
    )

    add_h2("3.3 Core Function Execution Logic")
    func_headers = ["Function Signature", "Access Scope", "Modifiers", "Core Operational Logic"]
    func_data = [
        ["registerLand(string, uint, uint, string)", "External (Public)", "None", "Validates inputs, increments _nextLandId, stores parcel (isVerified=false, isForSale=false), emits LandRegistered."],
        ["verifyLand(uint256 landId)", "External", "onlyAdmin", "Restricted to Admin / Land Inspector. Asserts parcel exists and unverified, flips isVerified=true, emits LandVerified."],
        ["listForSale(uint256 landId, uint256 price)", "External", "onlyOwner(landId)", "Requires isVerified==true and price>0. Updates priceInWei, sets isForSale=true, emits LandListed."],
        ["delistLand(uint256 landId)", "External", "onlyOwner(landId)", "Requires isForSale==true. Resets isForSale=false, removes from active marketplace, emits LandDelisted."],
        ["buyLand(uint256 landId)", "External (Payable)", "nonReentrant", "Atomic escrow: Checks valid sale, prevents self-purchase, validates msg.value>=price, updates title, transfers ETH, refunds excess."],
        ["getLandDetails(uint256 landId)", "External View", "None", "Returns complete Land memory struct. Reverts with LandNotFound if id does not exist."],
        ["getLandsByOwner(address owner)", "External View", "None", "Returns dynamic uint256[] array of all land IDs owned by the given address."]
    ]
    t_func = doc.add_table(rows=len(func_data)+1, cols=4)
    style_table(t_func, [1.8, 1.0, 1.2, 2.8], func_headers, func_data)

    add_h2("3.4 Atomic Escrow Settlement & Reentrancy Guard")
    add_body(
        "The buyLand() method implements the strict Checks-Effects-Interactions (CEI) design pattern to eliminate reentrancy vulnerabilities. "
        "When a buyer invokes buyLand(uint256 landId) and sends Ether:"
    )
    add_bullet("1. Pre-Execution Checks: ", "Validates that the land exists, is verified by the inspector, is currently marked for sale, that the caller is not already the owner, and that msg.value >= land.priceInWei.")
    add_bullet("2. Internal State Mutations (Effects): ", "Before any cryptocurrency is transferred, land.currentOwner is updated to payable(msg.sender), land.isForSale is flipped to false, and the land ID is appended to the buyer's _ownerLands array. This guarantees that any malicious re-entrant callback finds the property already sold.")
    add_bullet("3. External Fund Transfer (Interactions): ", "The contract dispatches the exact purchase price to the previous owner using low-level call{value: purchasePrice}(''). If the transfer fails, the transaction reverts.")
    add_bullet("4. Automatic Excess Payment Refund: ", "If the buyer submitted surplus Ether (msg.value > purchasePrice), the contract calculates refundAmount = msg.value - purchasePrice and dispatches it back to the buyer.")

    # -------------------------------------------------------------------------
    # CHAPTER 4: DECENTRALIZED STORAGE INTEGRATION (PINATA IPFS)
    # -------------------------------------------------------------------------
    add_h1("4. Decentralized Document Ingestion (Pinata IPFS)")
    add_body(
        "The decentralized storage pipeline is orchestrated via frontend/src/services/pinataService.js and "
        "frontend/src/components/DocumentUploader.jsx. It provides a production-grade file ingestion workflow:"
    )
    add_bullet("• Dual Authentication Handshake: ", "Supports both modern Pinata JWT Bearer tokens and legacy API Key / Secret pairs. The service performs an initial testAuthentication() ping to verify gateway status.")
    add_bullet("• Drag-and-Drop Ingestion: ", "Users can drag deed PDFs, satellite surveys, or site photographs directly into the upload dropzone. The component enforces a 15 MB file size limit and restricts MIME types to PDF, PNG, JPG, and WebP.")
    add_bullet("• Granular Progress Tracking: ", "Leverages Axios onUploadProgress to calculate percentage completion in real-time, providing visual progress feedback.")
    add_bullet("• Metadata Key-Value Tagging: ", "Appends project name, property location, area, and upload timestamp into the Pinata metadata header, enabling structured IPFS cataloging.")
    add_bullet("• Dedicated Gateway Resolution: ", "Formats raw CIDs into accessible HTTPS gateway endpoints (e.g., https://gateway.pinata.cloud/ipfs/<CID>), enabling one-click browser viewing for evaluators and buyers.")

    # -------------------------------------------------------------------------
    # CHAPTER 5: WEB3 CLIENT & ROLE-BASED UX
    # -------------------------------------------------------------------------
    add_h1("5. Web3 Client & Dynamic Role-Based UX Architecture")
    add_body(
        "The user interface (built with React 18, Vite, Tailwind CSS, and Ethers.js v6) automatically queries the connected Ethereum account "
        "against the smart contract state to dynamically compute the active persona. There is no hardcoded simulation—all roles are derived from on-chain truth:"
    )

    persona_headers = ["Persona Role", "On-Chain Activation Rule", "Accessible UI Views & Actions"]
    persona_data = [
        ["Admin / Inspector", "Connected wallet address == landRegistry.admin()", "Access to Inspector Panel; ability to review unverified deeds on IPFS and execute on-chain verifyLand() title certification."],
        ["Verified Owner (<count>)", "Connected wallet holds verified parcels in _ownerLands", "Displays owned parcels in 'My Assets' with active listing controls (price setting in ETH) and delisting buttons."],
        ["Buyer / Citizen", "Default wallet state (no admin rights, exploring)", "Browses verified listings in 'Explore Marketplace', reviews deed documents on IPFS, and triggers atomic buyLand() purchases."]
    ]
    t_pers = doc.add_table(rows=len(persona_data)+1, cols=3)
    style_table(t_pers, [1.5, 2.2, 3.1], persona_headers, persona_data)

    add_h2("Real-Time Transaction Status Toasts")
    add_body(
        "To provide clear Web3 UX feedback, TerraChain features a floating transaction alert banner that transitions through three explicit states:"
    )
    add_bullet("• Pending (Blue with Spinner): ", "Notifies the user that the transaction has been broadcast to the mempool, displaying the truncated transaction hash.")
    add_bullet("• Success (Emerald with Checkmark): ", "Alerts the user when the transaction is mined into a block, automatically triggering a refresh of on-chain state.")
    add_bullet("• Reverted (Red with Alert Circle): ", "Captures smart contract custom errors or user wallet rejections, translating cryptic revert bytes into human-readable error messages.")

    # -------------------------------------------------------------------------
    # CHAPTER 6: AUTOMATED TESTING & VERIFICATION MATRIX
    # -------------------------------------------------------------------------
    add_h1("6. Automated Testing & Verification Suite")
    add_body(
        "To guarantee mathematical correctness and cryptographic security, TerraChain contains 21 exhaustive automated unit tests "
        "in blockchain/test/LandRegistry.test.js executed via the Hardhat Network and Chai assertion library. All 21 tests pass with zero failures."
    )

    test_headers = ["Test Suite Category", "Test Cases Count", "Key Test Assertions & Invariants Verified"]
    test_data = [
        ["1. Deployment & Roles", "2 Tests", "Asserts deployer address is correctly initialized as immutable admin; verifies initial total registered parcels is 0."],
        ["2. Land Registration", "4 Tests", "Validates successful registration; asserts isVerified=false and isForSale=false; reverts on empty physical address, zero area, or missing IPFS hash."],
        ["3. Admin Title Verification", "4 Tests", "Verifies LandVerified event emission; asserts only admin can verify; reverts duplicate verification; reverts on non-existent parcel ID."],
        ["4. Marketplace Listing", "5 Tests", "Reverts listing unverified land; reverts non-owner listing; reverts zero price; asserts LandListed event; asserts LandDelisted event; reverts delisting unlisted land."],
        ["5. Purchase & Escrow Settlement", "6 Tests", "Reverts purchase if unlisted; reverts self-purchase; reverts underpayment; asserts seller balance increase == exact price; asserts title reassignment; asserts excess ETH refund."]
    ]
    t_test = doc.add_table(rows=len(test_data)+1, cols=3)
    style_table(t_test, [1.8, 1.2, 3.8], test_headers, test_data)

    # -------------------------------------------------------------------------
    # CHAPTER 7: MULTI-WALLET EVALUATOR DEMONSTRATION WALKTHROUGH
    # -------------------------------------------------------------------------
    add_h1("7. Multi-Wallet Live Demonstration Walkthrough")
    add_body(
        "The system can be fully demonstrated on a local machine using three distinct test accounts provided by the Hardhat development node:"
    )

    wallet_headers = ["Account Role", "Public Ethereum Address", "Hardhat Private Key (Import into MetaMask)"]
    wallet_data = [
        ["Account #0: Admin / Inspector", "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266", "0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80"],
        ["Account #1: Seller / Owner", "0x70997970C51812dc3A010C7d01b50e0d17dc79C8", "0x59c6995e998f97a5a0044966f0945389dc9e86dae88c7a8412f4603b6b78690d"],
        ["Account #2: Buyer", "0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC", "0x5de4111afa1a4b94908f83103eb1f1706367c2e68ca870fc3fb9a804cdab365a"]
    ]
    t_wallets = doc.add_table(rows=len(wallet_data)+1, cols=3)
    style_table(t_wallets, [1.8, 2.5, 2.5], wallet_headers, wallet_data)

    add_h2("Demonstration Execution Steps")
    add_bullet("Step 1: Service Initialization: ", "Start local node (npx hardhat node in blockchain/), deploy contract and auto-sync ABI (npx hardhat run scripts/deploy.js --network localhost), launch React UI (npm run dev in frontend/).")
    add_bullet("Step 2: Property Registration (Seller): ", "Connect MetaMask with Account #1. Open 'Register Property'. Upload deed document to Pinata IPFS. Set address and area. Submit on-chain. Parcel enters unverified state.")
    add_bullet("Step 3: Inspector Audit & Verification (Admin): ", "Switch MetaMask to Account #0. Notice navbar role updates to 'Admin / Inspector'. Navigate to 'Inspector Panel'. Click IPFS link to inspect deed. Click 'Verify Title'.")
    add_bullet("Step 4: Marketplace Listing (Seller): ", "Switch back to Account #1. Navbar displays 'Verified Owner (1)'. Navigate to 'My Assets'. Click 'List for Sale' and enter asking price (e.g. 2.5 ETH).")
    add_bullet("Step 5: Atomic Purchase (Buyer): ", "Switch to Account #2. Open 'Explore Marketplace'. Click 'Buy Now'. Confirm payment in MetaMask. Demonstrate that Seller balance increases by +2.5 ETH, Buyer receives ownership title, and the parcel automatically delists.")

    # -------------------------------------------------------------------------
    # CHAPTER 8: SECURITY THREAT MODELING & RISK MITIGATION
    # -------------------------------------------------------------------------
    add_h1("8. Security Threat Modeling & Risk Mitigation")
    add_body(
        "TerraChain is architected against standard blockchain vulnerabilities and real-world attack vectors:"
    )
    add_bullet("1. The Oracle Problem (Physical vs On-Chain Discrepancy): ",
               "Blockchain guarantees that data cannot be altered once written, but cannot independently verify if physical land exists in reality. "
               "TerraChain resolves this through a Two-Tier Gatekeeper Model: newly registered properties are locked in an unverified state until a certified "
               "Government Land Inspector physically inspects boundaries and signs an on-chain verification transaction.")
    add_bullet("2. Reentrancy Vulnerabilities: ",
               "Reentrancy occurs when an external call allows a malicious recipient contract to call back into the victim function before internal state updates. "
               "TerraChain combines OpenZeppelin's ReentrancyGuard nonReentrant modifier with strict Checks-Effects-Interactions: ownership reassignment "
               "and listing state resets are executed before any ETH transfers occur.")
    add_bullet("3. Private Key Loss & Inheritance: ",
               "In production deployments, the system can integrate ERC-4337 Account Abstraction and Social Recovery smart contract wallets, allowing "
               "designated guardians (e.g., family members, registrar, legal notary) to rotate lost keys upon official probate court proof.")
    add_bullet("4. Sybil Attacks & Spam Registration: ",
               "EVM transaction gas fees inherently disincentivize automated bot spamming. Furthermore, unverified registrations cannot enter the marketplace "
               "or influence legitimate titles without inspector approval.")

    # -------------------------------------------------------------------------
    # CHAPTER 9: ORAL EXAM & VIVA DEFENSE GUIDE (10 Q&A)
    # -------------------------------------------------------------------------
    add_h1("9. Oral Exam & Technical Viva Defense Guide")
    viva_questions = [
        ("Q1: What is the Oracle Problem, and how does TerraChain address it in land titling?",
         "A: The Oracle Problem is the gap between real-world physical reality and on-chain cryptographic state. A blockchain cannot physically inspect whether a seller actually owns the dirt plot. TerraChain resolves this via a two-tier gatekeeper workflow: registrations begin in an unverified quarantine. Only an authorized Government Land Inspector holding the deployer admin key can audit surveyor deeds on IPFS and certify title validity on-chain."),
        
        ("Q2: Why store only the IPFS CID on-chain rather than the entire PDF deed?",
         "A: Ethereum gas economics penalize large data storage (SSTORE opcode). Storing 1 MB on Ethereum can cost thousands of dollars. In contrast, storing the 32-byte IPFS CID costs ~20,000 gas. Because IPFS CIDs are cryptographic content digests, modifying even one pixel in the off-chain PDF completely breaks the hash, guaranteeing tamper-evident integrity at negligible cost."),
        
        ("Q3: How does buyLand() prevent reentrancy attacks during fund transfer?",
         "A: Through two complementary mechanisms: First, the nonReentrant modifier from OpenZeppelin sets an execution lock flag. Second, the code follows the Checks-Effects-Interactions pattern: land.currentOwner is updated and land.isForSale is set to false BEFORE the contract executes previousOwner.call{value: purchasePrice}('')."),
        
        ("Q4: Why use Solidity 0.8.20 Custom Errors instead of standard require strings?",
         "A: Standard require(condition, 'error string') embeds full ASCII string literals into contract bytecode, increasing contract deployment cost and consuming extra gas on reverts. Custom errors compile into compact 4-byte function selectors, reducing gas consumption by up to 40%."),
        
        ("Q5: What happens if a buyer transmits more Ether than the property asking price?",
         "A: The buyLand() function checks if msg.value > purchasePrice. If surplus Ether was sent, the contract calculates refundAmount = msg.value - purchasePrice and dispatches the refund back to the buyer via payable(msg.sender).call{value: refundAmount}(''), ensuring zero funds are locked or lost."),
        
        ("Q6: How does the React frontend know whether a user is an Admin, Owner, or Buyer?",
         "A: Upon wallet connection via Ethers.js v6, the application queries the contract's immutable admin() address and executes getLandsByOwner(userAddress). If the address equals admin, the Admin/Inspector persona is activated. If the address owns properties, the Verified Owner persona is activated. Otherwise, the Citizen/Buyer persona is rendered."),
        
        ("Q7: How is Pinata IPFS integrated into the frontend workflow?",
         "A: The frontend uses pinataService.js and DocumentUploader.jsx. When a file is selected, Axios dispatches a multipart/form-data POST request to https://api.pinata.cloud/pinning/pinFileToIPFS. It tracks percentage upload progress, attaches project metadata keyvalues, and returns the IPFS CID to populate the registration form."),
        
        ("Q8: Why build on EVM instead of a private permissioned ledger like Hyperledger Fabric?",
         "A: Public EVM blockchains provide decentralized censorship resistance, zero-trust public transparency, and global auditability. In private permissioned ledgers, a consortium of corrupt municipal actors could collude to modify ledger history. Public EVM prevents any single authority from altering history."),
        
        ("Q9: What happens if a property owner permanently loses their private key?",
         "A: In the current prototype, title control is tied to the key. In an enterprise production deployment, this is resolved via ERC-4337 Account Abstraction and Smart Contract Wallets with Social Recovery, allowing multi-signature legal guardians (e.g., family members, court registrar, notary) to authorize key rotation upon legal proof."),
        
        ("Q10: What are the key areas for future improvement and scaling?",
         "A: 1) Deploying on Layer-2 Rollups (Arbitrum, Optimism, Base) for sub-cent gas fees; 2) Integrating Chainlink oracles for real-time cadastral GIS boundary verification; 3) Fractionalizing large commercial properties using ERC-1155 or ERC-20 tokens; 4) Zero-Knowledge Proofs (zk-SNARKs) for privacy-preserving title audits.")
    ]

    for q, a in viva_questions:
        add_h2(q)
        add_body(a)

    doc.save(output_path)
    print(f"[DOCX GENERATION SUCCESS] File saved successfully to: {output_path}")

if __name__ == '__main__':
    target_docx = r"C:\LandBlock\TerraChain_In_Depth_Project_Guide.docx"
    generate_indepth_docx(target_docx)
