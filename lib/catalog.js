// LB Aminos product catalog. This file is the ONLY source of truth for prices.
// The checkout route re-reads prices from here; nothing the browser sends is trusted.
//
// >>> PRICES BELOW ARE PLACEHOLDERS. Replace priceCents with real prices before
// >>> setting CHECKOUT_ENABLED=true. Add COAs in lib/coas.js as reports arrive.

const PRICES_CONFIRMED = false; // flip to true once ant confirms real prices

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
};

const PRODUCTS = [
  {
    slug: "retatrutide-20mg",
    name: "Retatrutide",
    short: "RETA",
    color: "#3B82F6",
    cat: "metabolic",
    img: "/img/reta.jpg",
    bestSeller: true,
    variants: [{ sku: "RETA-20", size: "20 mg", priceCents: 18000, inStock: true }],
    purity: null, // filled from COA when available
    cls: "Triple receptor agonist peptide (GIPR / GLP-1R / GCGR)",
    overview:
      "Retatrutide (LY3437943) is a synthetic 39-residue peptide designed as a single-molecule agonist at three receptors: the glucose-dependent insulinotropic polypeptide receptor (GIPR), the glucagon-like peptide-1 receptor (GLP-1R) and the glucagon receptor (GCGR). A C20 fatty diacid side chain promotes albumin binding, which extends its half-life in experimental systems.",
    research: [
      "Multi-receptor agonist pharmacology and receptor-bias studies",
      "Incretin and glucagon receptor signaling in cell-based assays",
      "Comparative studies against single and dual incretin agonists in preclinical models",
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
    img: "/img/klow.jpg",
    variants: [{ sku: "KLOW-80", size: "80 mg blend", priceCents: 15000, inStock: true }],
    purity: null,
    cls: "Four-peptide research blend (GHK-Cu, BPC-157, TB-500, KPV)",
    overview:
      "KLOW is a multi-component lyophilized blend combining four peptides that are frequently studied together in tissue-remodeling, extracellular-matrix and inflammatory-signaling research models. Each component is listed below with its labeled amount per vial.",
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
    img: "/img/ss31.jpg",
    variants: [{ sku: "SS31-10", size: "10 mg", priceCents: 9000, inStock: true }],
    purity: null,
    cls: "Mitochondria-targeted tetrapeptide (elamipretide)",
    overview:
      "SS-31 is a cell-permeable aromatic-cationic tetrapeptide, D-Arg-Dmt-Lys-Phe-NH2, that concentrates in the inner mitochondrial membrane, where it associates with the phospholipid cardiolipin. It is a widely used tool compound in mitochondrial research.",
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
    img: "/img/selank.jpg",
    variants: [{ sku: "SELANK-10", size: "10 mg", priceCents: 6000, inStock: true }],
    purity: null,
    cls: "Synthetic heptapeptide, tuftsin analog",
    overview:
      "Selank is a synthetic heptapeptide, Thr-Lys-Pro-Arg-Pro-Gly-Pro, developed at the Institute of Molecular Genetics of the Russian Academy of Sciences. It extends the immunomodulatory tetrapeptide tuftsin with a Pro-Gly-Pro sequence that improves its stability against peptidases.",
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
    img: "/img/kpv.jpg",
    variants: [{ sku: "KPV-10", size: "10 mg", priceCents: 6000, inStock: true }],
    purity: null,
    cls: "α-MSH C-terminal tripeptide",
    overview:
      "KPV (Lys-Pro-Val) is the C-terminal tripeptide of alpha-melanocyte-stimulating hormone, studied for its activity in inflammatory signaling pathways.",
    research: ["NF-κB pathway signaling in cell models", "Intestinal epithelial models"],
    spec: [
      ["CAS no.", "67727-97-3"],
      ["Molecular formula", "C16H30N4O4"],
      ["Molecular weight", "342.4 g/mol"],
      ["Sequence", "Lys-Pro-Val"],
    ],
    refs: ["Dalmasso G, et al. Gastroenterology. 2008;134(1):166–178."],
  },
];

const bySlug = new Map(PRODUCTS.map((p) => [p.slug, p]));
const bySku = new Map();
for (const p of PRODUCTS) for (const v of p.variants) bySku.set(v.sku, { product: p, variant: v });

function tierFor(qty) {
  return QTY_TIERS.find((t) => qty >= t.min);
}

// Price for a line, in cents, after the quantity ladder.
function linePrice(variant, qty) {
  const t = tierFor(qty);
  const unit = Math.round((variant.priceCents * (100 - t.pct)) / 100);
  return { unitCents: unit, totalCents: unit * qty, tierPct: t.pct };
}

function mgOf(variant) {
  const m = /([\d.]+)\s*mg/i.exec(variant.size);
  return m ? parseFloat(m[1]) : null;
}

module.exports = { PRODUCTS, CATEGORIES, QTY_TIERS, PRICES_CONFIRMED, bySlug, bySku, tierFor, linePrice, mgOf };
