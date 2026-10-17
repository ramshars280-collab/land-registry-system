const fs = require("fs");
const path = require("path");

const UPLOADS_DIR = path.resolve(__dirname, "../data/uploads");
if (!fs.existsSync(UPLOADS_DIR)) {
  fs.mkdirSync(UPLOADS_DIR, { recursive: true });
}

// Minimal valid single-page PDF generator
function createMinimalPdf(title, parcelId, location, area) {
  const content = `%PDF-1.4
1 0 obj
<< /Type /Catalog /Pages 2 0 R >>
endobj
2 0 obj
<< /Type /Pages /Kids [3 0 R] /Count 1 >>
endobj
3 0 obj
<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Contents 4 0 R /Resources << /Font << /F1 5 0 R >> >> >>
endobj
4 0 obj
<< /Length 260 >>
stream
BT
/F1 20 Tf
50 720 Td
(GOVERNMENT OF MAHARASHTRA) Tj
/F1 14 Tf
0 -30 Td
(DIRECTORATE GENERAL OF LAND RECORDS) Tj
0 -25 Td
(Cadastral Title Deed: ${title}) Tj
/F1 12 Tf
0 -30 Td
(Parcel Identifier : #${parcelId}) Tj
0 -20 Td
(Location           : ${location}) Tj
0 -20 Td
(Registered Area    : ${area} sq ft) Tj
0 -20 Td
(Blockchain Status  : Cryptographically Registered on TerraChain) Tj
ET
endstream
endobj
5 0 obj
<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>
endobj
xref
0 6
0000000000 65535 f 
0000000010 00000 n 
0000000060 00000 n 
0000000117 00000 n 
0000000227 00000 n 
0000000540 00000 n 
trailer
<< /Size 6 /Root 1 0 R >>
startxref
610
%%EOF`;
  return Buffer.from(content, "utf-8");
}

const sampleDeeds = [
  {
    cid: "bafk-sample-deed-cidco-sector19-cadastral-record",
    filename: "Deed_Plot42_CIDCO_Sector19.pdf",
    title: "CIDCO Commercial Sector 19 Cadastral Survey Deed",
    parcelId: 1,
    location: "Plot #42, CIDCO Commercial Sector 19, Chh. Sambhajinagar",
    area: "4,500",
  },
  {
    cid: "bafk-sample-deed-jalna-expressway-industrial-title",
    filename: "Deed_Plot108_Jalna_Industrial.pdf",
    title: "Jalna Industrial Expressway Title Certificate",
    parcelId: 2,
    location: "Plot #108, Jalna Industrial Expressway Corridor, Aurangabad",
    area: "12,000",
  },
  {
    cid: "bafk-sample-deed-royal-palm-residency-villa7b-notary",
    filename: "Deed_RoyalPalm_Villa7B.pdf",
    title: "Royal Palm Residency Notarized Title Deed",
    parcelId: 3,
    location: "Royal Palm Residency Villa Plot 7B, Beed Bypass Highway",
    area: "3,200",
  },
];

console.log("Seeding sample PDF deed documents into backend document store...");
for (const deed of sampleDeeds) {
  const filePath = path.join(UPLOADS_DIR, deed.cid);
  const metaPath = path.join(UPLOADS_DIR, `${deed.cid}.meta.json`);

  const pdfBuffer = createMinimalPdf(deed.title, deed.parcelId, deed.location, deed.area);
  fs.writeFileSync(filePath, pdfBuffer);
  fs.writeFileSync(
    metaPath,
    JSON.stringify(
      {
        cid: deed.cid,
        filename: deed.filename,
        mimeType: "application/pdf",
        size: pdfBuffer.length,
        uploadedAt: new Date().toISOString(),
        uploader: "seller@terrachain.io",
      },
      null,
      2
    )
  );
  console.log(`✓ Seeded PDF deed: ${deed.filename} (CID: ${deed.cid})`);
}

console.log("All sample deed documents seeded successfully!");
