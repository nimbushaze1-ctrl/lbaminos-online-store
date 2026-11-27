// LB Aminos product catalog. This file is the ONLY source of truth for prices.
// The checkout route re-reads prices from here; nothing the browser sends is trusted.
//
// Add COAs in lib/coas.js as reports arrive.

const PRICES_CONFIRMED = true;

// Multi-vial pricing ladder (per-vial discount by quantity in a single line item).
const QTY_TIERS = [
  { min: 10, pct: 15, label: "10-vial research box" },
  { min: 5, pct: 10, label: "5 vials" },
  { min: 3, pct: 5, label: "3 vials" },
  { min: 1, pct: 0, label: "1 vial" },
];

const CATEGORIES = {
  metabolic: { name: "Metabolic signaling", blurb: "Incretin and glucagon receptor research compounds." },
  tissue: { name: "Tissue & matrix", blurb: "Peptides studied in extracellular-matrix, migration and inflammatory-signaling models." },
  mito: { name: "Mitochondrial", blurb: "Tool compounds for mitochondrial membrane and bioenergetics research." },
  neuro: { name: "Neuropeptides", blurb: "Synthetic neuropeptide analogs studied in signaling models." },
  gh: { name: "Somatotropic axis", blurb: "GHRH analogs studied in growth-hormone axis signaling models." },
};

const PRODUCTS = [
  {
    slug: "retatrutide-20mg",
    name: "Retatrutide",
    short: "RETA",
    color: "#3B82F6",
    cat: "metabolic",
    bestSeller: true,
    variants: [
      { sku: "RETA-10", size: "10 mg", priceCents: 4000, inStock: true },
      { sku: "RETA-20", size: "20 mg", priceCents: 6000, inStock: true },
      { sku: "RETA-30", size: "30 mg", priceCents: 8000, inStock: true },
    ],
    purity: null, // filled from COA when available
    cls: "Triple receptor agonist peptide (GIPR / GLP-1R / GCGR)",
    overview:
      "Retatrutide (LY3437943) is an investigational 39-amino-acid peptide designed to activate three hormone receptors: GIP, GLP-1, and glucagon. In preclinical experiments, GIP and GLP-1 receptor activity contributed to lower food intake, while glucagon receptor activity contributed to higher energy expenditure.",
    research: [
      "Multi-receptor agonist pharmacology and receptor-bias studies",
      "Incretin and glucagon receptor signaling in cell-based assays",
      "Comparative studies against single and dual incretin agonists in preclinical models",
    ],
    researchFindings: [
      {
        topic: "Body-weight regulation",
        finding: "A 48-week Phase 2 obesity trial reported a 24.2% mean reduction in baseline body weight in its highest-dose group. A subsequent Phase 3 trial also reported reductions in body weight.",
        sources: [["Phase 2 trial", "https://www.nejm.org/doi/10.1056/NEJMoa2301972"], ["Phase 3 trial", "https://www.nejm.org/doi/10.1056/NEJMoa2604169"]],
      },
      {
        topic: "Glycemic control",
        finding: "In a 36-week Phase 2 trial in adults with type 2 diabetes, higher-dose groups had reductions in HbA1c of roughly two percentage points.",
        sources: [["Phase 2 diabetes trial", "https://pubmed.ncbi.nlm.nih.gov/37385280/"]],
      },
      {
        topic: "Hepatic fat metabolism",
        finding: "A Phase 2a substudy reported mean relative liver-fat reductions from baseline of 81.4% and 82.4% in its two highest-dose groups at week 24, versus a 0.3% increase with placebo.",
        sources: [["Phase 2a liver-fat substudy", "https://www.nature.com/articles/s41591-024-03018-2"]],
      },
      {
        topic: "Energy expenditure",
        finding: "In preclinical models, researchers linked part of the increase in energy expenditure to glucagon receptor activation.",
        sources: [["Preclinical discovery paper", "https://doi.org/10.1016/j.cmet.2022.07.013"]],
      },
    ],
    spec: [
      ["Synonyms", "LY3437943"],
      ["CAS no.", "2381089-83-2"],
      ["Molecular formula", "C221H342N46O68"],
      ["Molecular weight", "4731.3 g/mol"],
      ["Sequence length", "39 amino acids, lipidated"],
      ["Form", "Lyophilized powder, sealed vial"],
    ],
    refs: ["Coskun T, et al. Cell Metabolism. 2022;34(9):1234–1247."],
  },
  {
    slug: "klow-80",
    name: "KLOW 80",
    short: "KLOW",
    color: "#A855F7",
    cat: "tissue",
    variants: [{ sku: "KLOW-80", size: "80 mg blend", priceCents: 7000, inStock: true }],
    purity: null,
    cls: "Four-peptide research blend (GHK-Cu, BPC-157, TB-500, KPV)",
    overview:
      "KLOW combines GHK-Cu, BPC-157, TB-500, and KPV in a single lyophilized blend. The four constituents appear in research on extracellular matrix, cell migration, and inflammatory signaling. The table below shows the amount of each constituent per vial.",
    comp: [["GHK-Cu", "50 mg"], ["BPC-157", "10 mg"], ["TB-500 (Thymosin β4)", "10 mg"], ["KPV", "10 mg"]],
    research: [
      "GHK-Cu: copper-binding tripeptide studied in extracellular-matrix and gene-expression models",
      "BPC-157: 15-residue peptide fragment studied in angiogenesis and cell-migration assays",
      "TB-500: thymosin β4, studied for actin-sequestering activity and cell migration",
      "KPV: C-terminal tripeptide of α-MSH, studied in inflammatory-signaling models",
    ],
    spec: [
      ["Format", "Blend, 80 mg total per vial"],
      ["GHK-Cu", "C14H22CuN6O4 · 401.9 g/mol"],
      ["BPC-157", "C62H98N16O22 · 1419.5 g/mol"],
      ["Thymosin β4", "C212H350N56O78S · 4963.4 g/mol"],
      ["KPV", "C16H30N4O4 · 342.4 g/mol"],
    ],
    refs: ["Pickart L, Margolina A. Int J Mol Sci. 2018;19(7):1987.", "Goldstein AL, et al. Expert Opin Biol Ther. 2012;12(1):37–51."],
  },
  {
    slug: "ss-31-10mg",
    name: "SS-31",
    short: "SS-31",
    color: "#EF4444",
    cat: "mito",
    variants: [{ sku: "SS31-10", size: "10 mg", priceCents: 4000, inStock: true }],
    purity: null,
    cls: "Mitochondria-targeted tetrapeptide (elamipretide)",
    overview:
      "SS-31, also called elamipretide, is a four-amino-acid peptide studied in the inner mitochondrial membrane. Its association with cardiolipin, a membrane lipid, is of interest in research on membrane organization and mitochondrial energy production.",
    research: [
      "Cardiolipin interaction and inner-membrane structure",
      "Mitochondrial bioenergetics and electron-transport-chain function",
      "Reactive oxygen species in cell and tissue models",
    ],
    spec: [
      ["Synonyms", "Elamipretide, MTP-131"],
      ["CAS no.", "736992-21-5"],
      ["Molecular formula", "C32H49N9O5"],
      ["Molecular weight", "639.8 g/mol"],
      ["Sequence", "D-Arg-Dmt-Lys-Phe-NH2"],
    ],
    refs: ["Szeto HH. Br J Pharmacol. 2014;171(8):2029–2050."],
  },
  {
    slug: "selank-10mg",
    name: "Selank",
    short: "SELANK",
    color: "#22C55E",
    cat: "neuro",
    variants: [{ sku: "SELANK-10", size: "10 mg", priceCents: 4000, inStock: true }],
    purity: null,
    cls: "Synthetic heptapeptide, tuftsin analog",
    overview:
      "Selank is a seven-amino-acid analog of tuftsin. Three added residues change how readily peptide-degrading enzymes break it down. Published research examines neuropeptide signaling, GABA-related pathways, and changes in gene expression.",
    research: ["Neuropeptide signaling in rodent models", "GABAergic system modulation", "Gene-expression profiling studies"],
    spec: [
      ["Synonyms", "TP-7"],
      ["CAS no.", "129954-34-3"],
      ["Molecular formula", "C33H57N11O9"],
      ["Molecular weight", "751.9 g/mol"],
      ["Sequence", "Thr-Lys-Pro-Arg-Pro-Gly-Pro"],
    ],
    refs: ["Volkova A, et al. Front Pharmacol. 2016;7:31."],
  },
  {
    slug: "kpv-10mg",
    name: "KPV",
    short: "KPV",
    color: "#F59E0B",
    cat: "tissue",
    variants: [{ sku: "KPV-10", size: "10 mg", priceCents: 5000, inStock: true }],
    purity: null,
    cls: "α-MSH C-terminal tripeptide",
    overview:
      "KPV takes its name from its three amino acids: lysine, proline, and valine. It is the tail fragment of alpha-melanocyte-stimulating hormone and is studied in inflammatory signaling, including NF-κB activity in cell models.",
    research: ["NF-κB pathway signaling in cell models", "Intestinal epithelial models"],
    spec: [
      ["CAS no.", "67727-97-3"],
      ["Molecular formula", "C16H30N4O4"],
      ["Molecular weight", "342.4 g/mol"],
      ["Sequence", "Lys-Pro-Val"],
    ],
    refs: ["Dalmasso G, et al. Gastroenterology. 2008;134(1):166–178."],
  },

  {
    slug: "tirzepatide-30mg", name: "Tirzepatide", short: "TIRZ", color: "#0EA5E9", cat: "metabolic", variants: [{ sku: "TIRZ-30", size: "30 mg", priceCents: 7000, inStock: true }], purity: null,
    cls: "Dual receptor agonist peptide (GIPR / GLP-1R)",
    overview: "Tirzepatide is a 39-amino-acid peptide that activates both GIP and GLP-1 receptors. The two targets make it relevant to comparisons of incretin signaling. Its lipid modification also supports studies of how albumin binding influences peptide behavior.",
    research: ["Dual incretin receptor pharmacology", "Biased signaling at GLP-1R in cell-based assays", "Comparative incretin studies in preclinical models"],
    spec: [["Synonyms", "LY3298176"], ["CAS no.", "2023788-19-2"], ["Molecular formula", "C225H348N48O68"], ["Molecular weight", "4813.5 g/mol"], ["Sequence length", "39 amino acids, lipidated"]],
    refs: ["Coskun T, et al. Mol Metab. 2018;18:3–14."],
  },
  {
    slug: "cagrilintide-10mg", name: "Cagrilintide", short: "CAGRI", color: "#6366F1", cat: "metabolic", variants: [{ sku: "CAGRI-10", size: "10 mg", priceCents: 5000, inStock: true }], purity: null,
    cls: "Long-acting acylated amylin analog",
    overview: "Cagrilintide is a lipid-modified analog of amylin with activity at amylin and calcitonin receptors. Researchers examine its receptor activity and compare amylin and incretin signaling in preclinical studies.",
    research: ["Amylin (AMY) and calcitonin receptor pharmacology", "Combination studies with incretin agonists in preclinical models"],
    spec: [["Synonyms", "AM833"], ["CAS no.", "1415456-99-3"], ["Molecular formula", "C194H312N54O59S2"], ["Molecular weight", "4409.0 g/mol"]],
    refs: ["Kruse T, et al. J Med Chem. 2021;64(15):11183–11194."],
  },
  {
    slug: "tesamorelin-10mg", name: "Tesamorelin", short: "TESA", color: "#14B8A6", cat: "gh", variants: [{ sku: "TESA-10", size: "10 mg", priceCents: 5000, inStock: true }], purity: null,
    cls: "Synthetic GHRH(1–44) analog",
    overview: "Tesamorelin is a 44-amino-acid analog of growth hormone-releasing hormone (GHRH). A modification at one end makes it more resistant to enzymatic cleavage than native GHRH. The analog is studied in receptor activation and peptide stability research.",
    research: ["GHRH receptor binding and activation", "Somatotropic-axis signaling in preclinical models", "Structure–stability studies of modified GHRH analogs"],
    spec: [["Synonyms", "TH9507"], ["CAS no.", "218949-48-5"], ["Molecular formula", "C221H366N72O67S"], ["Molecular weight", "5135.9 g/mol"], ["Sequence length", "44 amino acids, N-acylated"]],
    refs: ["Ferdinandi ES, et al. Basic Clin Pharmacol Toxicol. 2007;100(1):49–58."],
  },
  {
    slug: "bpc-157-10mg", name: "BPC-157", short: "BPC", color: "#10B981", cat: "tissue", variants: [{ sku: "BPC-10", size: "10 mg", priceCents: 6000, inStock: true }], purity: null,
    cls: "Synthetic 15-residue peptide fragment",
    overview: "BPC-157 is a synthetic, 15-amino-acid peptide based on a sequence found in a gastric protein. It appears in laboratory studies of endothelial cells, cell migration, and signaling involving nitric oxide.",
    research: ["Angiogenesis and endothelial cell assays", "Cell migration and wound-closure models", "Nitric oxide pathway signaling studies"],
    spec: [["CAS no.", "137525-51-0"], ["Molecular formula", "C62H98N16O22"], ["Molecular weight", "1419.5 g/mol"], ["Sequence length", "15 amino acids"]],
    refs: [],
  },
  {
    slug: "wolverine-blend", name: "Wolverine", short: "WOLV", color: "#B45309", cat: "tissue", variants: [
      { sku: "WOLV-10", size: "10 mg", priceCents: 4000, inStock: true },
      { sku: "WOLV-20", size: "20 mg", priceCents: 6000, inStock: true },
    ], purity: null,
    cls: "Two-peptide research blend (BPC-157 + TB-500)",
    overview: "Wolverine combines BPC-157 and TB-500 in a lyophilized blend. Research on the individual constituents includes endothelial and cell-migration assays for BPC-157 and actin-related studies for TB-500. Consult the composition table for the blend breakdown.",
    comp: [["BPC-157", "50% of labeled mass"], ["TB-500 (Thymosin β4)", "50% of labeled mass"]],
    research: ["BPC-157: angiogenesis and cell-migration assays", "TB-500: actin sequestration and cell-migration models"],
    spec: [["Format", "Blend, 10 mg or 20 mg total per vial"], ["BPC-157", "C62H98N16O22 · 1419.5 g/mol"], ["Thymosin β4", "C212H350N56O78S · 4963.4 g/mol"]],
    refs: ["Goldstein AL, et al. Expert Opin Biol Ther. 2012;12(1):37–51."],
  },
  {
    slug: "ghk-cu-100mg", name: "GHK-Cu", short: "GHK-CU", color: "#2563EB", cat: "tissue", variants: [{ sku: "GHK-100", size: "100 mg", priceCents: 4000, inStock: true }], purity: null,
    cls: "Copper-binding tripeptide (Gly-His-Lys:Cu²⁺)",
    overview: "GHK-Cu is a complex of copper(II) with the three-amino-acid peptide glycyl-histidyl-lysine. Laboratory studies examine copper binding and transport as well as extracellular-matrix activity and gene expression.",
    research: ["Extracellular-matrix and collagen synthesis assays", "Gene-expression profiling", "Copper transport and binding studies"],
    spec: [["CAS no.", "89030-95-5"], ["Molecular formula", "C14H22CuN6O4"], ["Molecular weight", "401.9 g/mol"], ["Sequence", "Gly-His-Lys (Cu²⁺ complex)"]],
    refs: ["Pickart L, Margolina A. Int J Mol Sci. 2018;19(7):1987."],
  },
  {
    slug: "ara-290-10mg", name: "ARA-290", short: "ARA", color: "#E11D48", cat: "tissue", variants: [{ sku: "ARA-10", size: "10 mg", priceCents: 3499, inStock: true }], purity: null,
    cls: "Erythropoietin-derived 11-residue peptide (cibinetide)",
    overview: "ARA-290, also known as cibinetide, is an 11-amino-acid peptide modeled on one region of erythropoietin. Researchers study it in connection with innate repair receptor signaling and use it to examine how the structure of an erythropoietin-derived fragment relates to its activity.",
    research: ["Innate repair receptor signaling", "Inflammatory and tissue-protection models", "Structure–activity studies of EPO-derived peptides"],
    spec: [["Synonyms", "Cibinetide"], ["Sequence", "pGlu-Glu-Gln-Leu-Glu-Arg-Ala-Leu-Asn-Ser-Ser"], ["Sequence length", "11 amino acids"]],
    refs: [],
  },
  {
    slug: "mots-c-40mg", name: "MOTS-c", short: "MOTS-C", color: "#F97316", cat: "mito", variants: [{ sku: "MOTS-40", size: "40 mg", priceCents: 8000, inStock: true }], purity: null,
    cls: "Mitochondrial-derived 16-residue peptide",
    overview: "MOTS-c is a 16-amino-acid signaling peptide encoded in a region of mitochondrial DNA. Research examines how it participates in communication between mitochondria and the rest of the cell, including studies of AMPK and responses to cellular stress.",
    research: ["Mitochondrial–nuclear signaling", "AMPK pathway activity in cell models", "Cellular stress response studies"],
    spec: [["Sequence", "MRWQEMGYIFYPRKLR"], ["Sequence length", "16 amino acids"], ["CAS no.", "1627580-64-6"]],
    refs: ["Lee C, et al. Cell Metab. 2015;21(3):443–454."],
  },
  {
    slug: "nad-plus-1000mg", name: "NAD+", short: "NAD+", color: "#0F766E", cat: "mito", variants: [{ sku: "NAD-1000", size: "1000 mg", priceCents: 5500, inStock: true }], purity: null,
    cls: "Nicotinamide adenine dinucleotide (coenzyme, not a peptide)",
    overview: "NAD+ is the oxidized form of the coenzyme nicotinamide adenine dinucleotide. It carries electrons in cellular redox reactions and serves as a substrate for enzymes such as sirtuins and PARPs. LB Aminos supplies it in lyophilized form.",
    research: ["Cellular redox and energy metabolism assays", "Sirtuin and PARP enzyme activity studies"],
    spec: [["CAS no.", "53-84-9"], ["Molecular formula", "C21H27N7O14P2"], ["Molecular weight", "663.4 g/mol"]],
    refs: [],
  },
  {
    slug: "pt-141-10mg", name: "PT-141", short: "PT-141", color: "#EC4899", cat: "neuro", variants: [{ sku: "PT141-10", size: "10 mg", priceCents: 5000, inStock: true }], purity: null,
    cls: "Cyclic melanocortin receptor agonist (bremelanotide)",
    overview: "PT-141, also called bremelanotide, is a cyclic seven-amino-acid analog of alpha-melanocyte-stimulating hormone. Researchers use it to investigate melanocortin receptor activity, particularly signaling involving MC3R and MC4R.",
    research: ["Melanocortin receptor (MC3R / MC4R) pharmacology", "Central melanocortin pathway signaling in preclinical models"],
    spec: [["Synonyms", "Bremelanotide"], ["CAS no.", "189691-06-3"], ["Molecular formula", "C50H68N14O10"], ["Molecular weight", "1025.2 g/mol"]],
    refs: [],
  },
];

// Store-wide sale: buy one, get the next unit of the same item 50% off.
// Each cart line gets whichever is cheaper: this sale or the quantity ladder (never both).
// Turn off by setting SALE_BOGO=false in Railway variables.
const SALE = { bogo: process.env.SALE_BOGO !== "false", pct: 50, label: "Buy one, get one 50% off" };

// Lab Box: pick BOX.slots vials, BOX.pct off list, shipped monthly, BOX.months minimum, invoiced each month.
const BOX = { slots: 4, pct: 20, months: 3 };

// Bundled free in every Lab Box shipment (not sold on its own).
const BOX_BUNDLE = { sku: "BACW-10", name: "Bacteriostatic water 10 mL", listCents: 1499 };

const bySlug = new Map(PRODUCTS.map((p) => [p.slug, p]));
// Product photos: one branded vial image per SKU.
for (const p of PRODUCTS) {
  for (const v of p.variants) v.img = `/img/v-photo/${v.sku}.jpg?v=2`;
  p.img = (p.variants.find((v) => v.inStock) || p.variants[0]).img;
}
const bySku = new Map();
for (const p of PRODUCTS) for (const v of p.variants) bySku.set(v.sku, { product: p, variant: v });

function tierFor(qty) {
  return QTY_TIERS.find((t) => qty >= t.min);
}

// Price for a line, in cents, after the quantity ladder.
function linePrice(variant, qty) {
  const t = tierFor(qty);
  const unit = Math.round((variant.priceCents * (100 - t.pct)) / 100);
  const tierTotal = unit * qty;
  if (SALE.bogo && qty >= 2) {
    const half = Math.round((variant.priceCents * (100 - SALE.pct)) / 100);
    const bogoTotal = variant.priceCents * (qty - Math.floor(qty / 2)) + half * Math.floor(qty / 2);
    if (bogoTotal < tierTotal) return { unitCents: Math.round(bogoTotal / qty), totalCents: bogoTotal, tierPct: 0, promo: "bogo", label: "BOGO 50%" };
  }
  return { unitCents: unit, totalCents: tierTotal, tierPct: t.pct, promo: t.pct ? "tier" : null, label: t.pct ? `−${t.pct}% bulk` : null };
}

function mgOf(variant) {
  const m = /([\d.]+)\s*mg/i.exec(variant.size);
  return m ? parseFloat(m[1]) : null;
}

module.exports = { SALE, BOX_BUNDLE, BOX, PRODUCTS, CATEGORIES, QTY_TIERS, PRICES_CONFIRMED, bySlug, bySku, tierFor, linePrice, mgOf };
