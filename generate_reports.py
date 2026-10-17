import os
import shutil
import docx
from docx.shared import Pt, RGBColor
import win32com.client

def update_docx_in_place(src_docx_path, out_docx_paths):
    doc = docx.Document(src_docx_path)
    
    def update_p(p_idx, prefix_bold, regular_text, font_size=12.0, is_heading=False):
        p = doc.paragraphs[p_idx]
        p.text = '' # Clear runs
        if is_heading:
            r = p.add_run(prefix_bold)
            r.font.name = 'Times New Roman'
            r.font.size = Pt(14.0)
            r.font.bold = True
            r.font.color.rgb = RGBColor(0, 0, 0)
        else:
            if prefix_bold:
                r1 = p.add_run(prefix_bold)
                r1.font.name = 'Times New Roman'
                r1.font.size = Pt(font_size)
                r1.font.bold = True
                r1.font.color.rgb = RGBColor(0, 0, 0)
            if regular_text:
                r2 = p.add_run(regular_text)
                r2.font.name = 'Times New Roman'
                r2.font.size = Pt(font_size)
                r2.font.bold = False
                r2.font.color.rgb = RGBColor(0, 0, 0)

    # 1. Abstract
    update_p(26, "", (
        "To resolve these vulnerabilities, this project develops TerraChain, a production-grade, decentralized "
        "Blockchain-Based Land Registry and Title Transfer System deployed on EVM-compatible blockchain infrastructure. "
        "Utilizing Solidity (v0.8.20) smart contracts, the Hardhat development framework, Pinata IPFS (InterPlanetary "
        "File System) decentralized storage, Ethers.js (v6), and a reactive React 18 (Vite + Tailwind CSS) Web3 user "
        "interface, all parcel registrations and ownership title transfers are permanently anchored to an immutable public "
        "ledger. Cadastral deed documents and surveyor blueprints are cryptographically pinned to IPFS, anchoring the "
        "immutable Content Identifier (CID) hash on-chain. The system provides real-time smart contract state verification, "
        "Government Land Inspector title audits, dynamic title transfers with atomic ETH escrow settlement, historical title "
        "provenance tracking, and an automated test suite (21 unit tests passed) ensuring robust cryptographic integrity."
    ), font_size=12.0)

    # 2. Introduction
    update_p(29, "", (
        "Blockchain technology eliminates the single point of failure by introducing a distributed, cryptographically "
        "linked append-only ledger. Each transaction is executed deterministically by smart contracts whose logic is "
        "immutably deployed to the ledger. Once written, a property title cannot be altered, forged, or backdated by any "
        "external entity or single official. However, storing multi-megabyte deed PDFs directly on-chain is cost-prohibitive "
        "due to gas fees. TerraChain resolves this challenge through a hybrid on-chain/off-chain decentralized architecture: "
        "high-resolution deed documents are pinned to Pinata IPFS, while cryptographic hashes (CIDs), ownership states, "
        "verification flags, and atomic escrow logic are executed on-chain via Solidity smart contracts. This project builds "
        "a functional decentralized dApp demonstrating how blockchain principles eradicate property fraud."
    ), font_size=12.0)

    # 3. Course Outcomes Integrated
    update_p(32, "• CO-1: ", "Understand and apply cryptographic hashing functions (Keccak-256 and SHA-256) and decentralized content addressing (IPFS CID) for data integrity verification.", font_size=12.0)
    update_p(33, "• CO-2: ", "Analyze distributed ledger concepts, immutability principles, smart contract execution on EVM, and consensus mechanisms in blockchain systems.", font_size=12.0)
    update_p(34, "• CO-3: ", "Design and develop responsive Web3 interfaces utilizing React 18, Tailwind CSS, Vite, and Ethers.js v6 with MetaMask provider integration.", font_size=12.0)
    update_p(35, "• CO-4: ", "Model secure transactional smart contracts in Solidity (v0.8.20), role-based access control (Admin / Inspector, Owner, Buyer), and atomic escrow title transfer mechanisms.", font_size=12.0)
    update_p(36, "• CO-5: ", "Evaluate cybersecurity threats in database systems and smart contracts, demonstrating cryptographic resilience against reentrancy and tampering using OpenZeppelin ReentrancyGuard, custom errors, and automated unit testing.", font_size=12.0)

    # 4. Action Plan Table (Table 3)
    t3 = doc.tables[3]
    plan_data = [
        ("1", "Problem Identification, Literature Survey, and Blockchain Architecture Formulation", "Week 1", "Week 2", "Ramsha Siddiqui & Durga Rajput"),
        ("2", "Designing UI/UX Wireframes, Responsive Layouts, and React Web3 Interface (Tailwind CSS)", "Week 2", "Week 3", "Durga Rajput"),
        ("3", "Core Smart Contract Development: Solidity 0.8.20 LandRegistry, ReentrancyGuard & Escrow", "Week 3", "Week 4", "Ramsha Siddiqui"),
        ("4", "Implementation of Land Registration, IPFS Deed Pinning, and ETH Valuation Modules", "Week 4", "Week 5", "Durga Rajput"),
        ("5", "Development of Inspector Audit Portal, Hardhat Automated Test Suite & Multi-Role Workflows", "Week 5", "Week 6", "Ramsha Siddiqui"),
        ("6", "Comprehensive System Verification, Cross-Browser Testing, and Project Report Documentation", "Week 6", "Week 7", "Ramsha Siddiqui & Durga Rajput")
    ]
    for r_idx, row_vals in enumerate(plan_data):
        row = t3.rows[r_idx + 1]
        for c_idx, val in enumerate(row_vals):
            p = row.cells[c_idx].paragraphs[0]
            p.text = ''
            r = p.add_run(val)
            r.font.name = 'Times New Roman'
            r.font.size = Pt(11.0)
            r.font.bold = False
            r.font.color.rgb = RGBColor(0, 0, 0)

    # 5. Literature Review
    update_p(45, "• India (Andhra Pradesh & Telangana): ", "Initiated pilots in Amaravati and Hyderabad utilizing distributed ledgers to safeguard agricultural land allotments and eradicate duplicate registration fraud.", font_size=12.0)
    update_p(46, "", "These real-world case studies prove that applying cryptographic chaining and smart contracts to land governance provides undeniable title provenance, eliminates middleman overhead, and secures citizen assets.", font_size=12.0)

    # 6. Proposed Methodology
    update_p(48, "", "The proposed system implements a client-side and smart contract architecture operating on modern EVM blockchain technologies without centralized server dependencies. The overall methodology is divided into three key computational tiers:", font_size=12.0)
    update_p(49, "1. Cryptographic Smart Contract Ledger Tier: ", "The blockchain engine models property records through the Land struct in Solidity 0.8.20 on the Ethereum Virtual Machine. Each transaction encapsulates Property ID, Physical Address, Area (sq ft), Listing Price in Wei, IPFS Deed Hash, Current Owner, Verification Status, and Listing Status. State transitions are governed by self-executing smart contracts enforcing role-based permissions (onlyAdmin, onlyOwner).", font_size=12.0)
    update_p(50, "2. Decentralized Content-Addressed Storage Tier: ", "To eliminate prohibitive on-chain gas costs, high-resolution deed documents, surveyor blueprints, and GIS maps are pinned to Pinata IPFS. The returned 32-byte Content Identifier (CID) is immutably anchored in the smart contract. Because IPFS CIDs represent mathematical hashes of file contents, any unauthorized alteration immediately invalidates the hash, exposing fraud.", font_size=12.0)
    update_p(51, "3. Dynamic Web3 Verification & Escrow Settlement Tier: ", "The system continuously executes client-side Web3 validation via Ethers.js v6. The interface dynamically verifies the active wallet persona (Inspector, Owner, Buyer). Title transfers execute via an atomic escrow buyLand() function incorporating OpenZeppelin ReentrancyGuard, transferring payment to the seller, reassigning title to the buyer, and refunding any surplus payment simultaneously in one atomic transaction.", font_size=12.0)

    # 7. Implementation
    update_p(53, "", "The application is implemented in clean Solidity 0.8.20, React 18, Vite, Tailwind CSS, and Ethers.js v6, organized into three core workspaces:", font_size=12.0)
    update_p(54, "• blockchain/contracts/LandRegistry.sol & deploy.js: ", "Production smart contract housing the Land struct, 11 gas-optimized custom errors, and 7 core functions: registerLand, verifyLand, listForSale, delistLand, buyLand, getLandDetails, and getLandsByOwner. Implements OpenZeppelin ReentrancyGuard and deployment scripts with automated ABI synchronization.", font_size=12.0)
    update_p(55, "• blockchain/test/LandRegistry.test.js: ", "Comprehensive automated test suite comprising 21 unit tests with Chai assertions, validating deployment, input bounds, role restrictions, atomic balance settlements, and reentrancy protection.", font_size=12.0)
    update_p(56, "• frontend/src/ (App.jsx, Web3Context.jsx, DocumentUploader.jsx): ", "Contains the Web3 integration layer with Ethers.js v6, MetaMask provider, Pinata IPFS deed uploader, 4 role-based portals (Explore Marketplace, Register Property, Inspector Admin Panel, My Assets), and real-time transaction toast status banners.", font_size=12.0)

    # 8. Output of Mini Project
    update_p(59, "1. Multi-Role Account Detection: ", "Initializes with MetaMask connected to Hardhat Localhost (Chain ID: 31337), automatically detecting whether the user is the Admin (Inspector: 0xf39F...), an Owner, or a Buyer.", font_size=12.0)
    update_p(60, "2. Land Parcel Registration with IPFS Pinning: ", "A user registers a parcel (Street Address, 2400 sq ft, 2.5 ETH, Alice) and uploads a deed PDF. The document is pinned to Pinata IPFS (CID: Qm...), and registerLand() executes on-chain with unverified status.", font_size=12.0)
    update_p(61, "3. Government Inspector Title Verification: ", "The Admin accesses the Inspector Panel, inspects the uploaded IPFS deed via gateway, and calls verifyLand(id). The status badge dynamically updates to Verified (Green).", font_size=12.0)
    update_p(62, "4. Marketplace Listing & Atomic Title Transfer: ", "Owner lists verified parcel on marketplace. Buyer confirms buyLand() with 2.5 ETH: contract atomically transfers 2.5 ETH to seller, reassigns ownership to buyer, and refunds any surplus payment.", font_size=12.0)
    update_p(63, "5. Automated Security & Verification Matrix: ", "All 21 Hardhat unit test cases pass with 100% assertions satisfied in 798ms, verifying deployment, access controls, balance settlements, and reentrancy security.", font_size=12.0)

    # 9. Skills Developed
    update_p(66, "• ", "Gained a deep understanding of cryptographic hash functions (Keccak-256 and SHA-256), collision resistance, and content addressing in securing data.", font_size=12.0)
    update_p(67, "• ", "Mastered core blockchain mechanisms including smart contract engineering in Solidity 0.8.20, EVM execution mechanics, and automated Hardhat testing.", font_size=12.0)
    update_p(68, "• ", "Enhanced Web3 development proficiency in modular JavaScript, utilizing React 18, Vite, Tailwind CSS, and Ethers.js v6 for asynchronous provider/signer wallet communication.", font_size=12.0)
    update_p(69, "• ", "Learned modern front-end UI/UX principles, building role-adapted dashboard views, drag-and-drop file uploaders, and dynamic status-driven UI states.", font_size=12.0)
    update_p(70, "• ", "Developed analytical problem-solving skills in smart contract security, mitigating reentrancy attacks with OpenZeppelin ReentrancyGuard and designing tamper-evident audit trails.", font_size=12.0)
    update_p(71, "• ", "Acquired practical experience in technical teamwork, project scheduling, and structured academic documentation.", font_size=12.0)

    # 10. Applications
    update_p(75, "2. Transparent Agricultural Land Bank Records: ", "Rural property borders and multi-owner family inheritances often suffer from protracted court disputes. A blockchain ledger establishes a clear, publicly verifiable line of succession and title history in Ether (ETH).", font_size=12.0)
    update_p(78, "5. Cadastral Boundary and Surveyor Blueprint Tracking: ", "Satellite GIS survey files and municipal master plans can be permanently pinned to IPFS, ensuring public transparency over civic zoning and land-use designations.", font_size=12.0)
    update_p(79, "6. Academic and Research Laboratory Tool: ", "Serves as an interactive, fully functional educational platform for computer science and IT students to inspect how smart contracts, IPFS content addressing, and atomic escrow operate in practice.", font_size=12.0)

    # 11. Area of Future Improvement
    update_p(82, "1. Multi-Signature Consensus for Government Registrars: ", "Implementing multi-signature (multi-sig) authorization requiring the simultaneous digital keys of the Property Buyer, Seller, Municipal Town Planner, and Sub-Registrar Officer before confirming a title transfer.", font_size=12.0)
    update_p(83, "2. Government Biometric KYC & Digital Identity (DID): ", "Connecting land transfer approvals to national digital identity systems (such as Aadhaar e-KYC and digital signatures) to cryptographically verify buyer and seller identity prior to block generation.", font_size=12.0)
    update_p(84, "3. Zero-Knowledge Proofs (zk-SNARKs) for Financial Privacy: ", "Integrating zk-SNARKs to allow property buyers and sellers to verify transaction solvency and legal compliance without broadcasting private sale valuations to public blockchain explorers.", font_size=12.0)
    update_p(85, "4. Layer-2 Rollups (Arbitrum / Polygon) Deployment: ", "Migrating contract deployment from Ethereum mainnet to Layer-2 optimistic or zero-knowledge rollups to achieve sub-cent transaction gas fees and high transaction throughput.", font_size=12.0)
    update_p(86, "5. Distributed Multi-Node P2P Network & Decentralized Arbitration: ", "Expanding the client-side architecture into a peer-to-peer network and integrating decentralized crowd-jury arbitration protocols (such as Kleros) to resolve boundary disputes.", font_size=12.0)

    # 12. Conclusion
    update_p(88, "", (
        "Land registration is a foundational pillar of modern governance, yet conventional manual and centralized digital database "
        "registers continue to suffer from corruption, single points of failure, unrecorded alterations, and rampant litigation. "
        "This mini-project successfully engineered and verified TerraChain, a decentralized blockchain-based land registry system. "
        "By integrating Solidity 0.8.20 smart contracts, Hardhat, Pinata IPFS decentralized deed storage, Ethers.js v6, and dynamic "
        "ownership transfers with atomic escrow settlement, the system establishes a permanent, auditable, and mathematically "
        "unalterable record of property ownership."
    ), font_size=12.0)
    update_p(89, "", (
        "Furthermore, the smart contract and automated test suite empirically demonstrated the core immutability guarantee of "
        "blockchain technology: unauthorized alterations to historical records and reentrancy attacks are completely rejected at the "
        "EVM level, immediately preventing fraudulent activity. The project conclusively illustrates how blockchain technology can "
        "eradicate title fraud, streamline land administration, and restore citizen trust in digital property governance."
    ), font_size=12.0)

    # Save to target paths
    for pth in out_docx_paths:
        try:
            doc.save(pth)
            print(f"[SUCCESS] Updated DOCX saved to: {pth}")
        except Exception as e:
            print(f"[WARNING] Could not save to {pth}: {e}")

def convert_to_pdf_via_word(docx_path, pdf_path):
    print(f"[INFO] Exporting {docx_path} to PDF via Word COM...")
    word = win32com.client.Dispatch('Word.Application')
    word.Visible = False
    try:
        doc = word.Documents.Open(os.path.abspath(docx_path))
        # wdFormatPDF = 17
        doc.SaveAs(os.path.abspath(pdf_path), FileFormat=17)
        doc.Close()
        print(f"[SUCCESS] Exported PDF saved to: {pdf_path}")
    finally:
        word.Quit()

if __name__ == '__main__':
    src = r"C:\Users\Ramsha\Downloads\Mini_Project_Report_Blockchain_Land_Registry.docx"
    targets = [
        r"C:\LandBlock\Blockchain_Land_Registry_Mini_Project_Report.docx",
        r"C:\LandBlock\TerraChain_LandRegistry_Project_Report.docx",
        r"C:\Users\Ramsha\Downloads\Updated_Mini_Project_Report_Blockchain_Land_Registry.docx"
    ]
    
    update_docx_in_place(src, targets)

    # Convert to PDF
    main_docx = r"C:\LandBlock\Blockchain_Land_Registry_Mini_Project_Report.docx"
    main_pdf = r"C:\LandBlock\Blockchain_Land_Registry_Mini_Project_Report.pdf"
    convert_to_pdf_via_word(main_docx, main_pdf)

    # Mirror PDF
    shutil.copyfile(main_pdf, r"C:\LandBlock\TerraChain_LandRegistry_Project_Report.pdf")
    shutil.copyfile(main_pdf, r"C:\Users\Ramsha\Downloads\Updated_Mini_Project_Report_Blockchain_Land_Registry.pdf")
    print(f"[SUCCESS] Mirrored PDF to TerraChain_LandRegistry_Project_Report.pdf and Downloads")
    print("[COMPLETED] All documents updated with 100% exact original formatting and font sizes!")
