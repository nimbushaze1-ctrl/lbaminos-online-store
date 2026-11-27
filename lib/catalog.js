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
  metabolic: { name: "Metabolic signaling", blurb: "Weight, appetite, and blood sugar research — the compounds people ask about most." },
  tissue: { name: "Tissue & matrix", blurb: "Healing and recovery research — skin, tendons, joints, and gut." },
  mito: { name: "Mitochondrial", blurb: "Energy and cellular health research — the mitochondria are the cell's energy centers." },
  neuro: { name: "Neuropeptides", blurb: "Brain, mood, and focus research." },
  gh: { name: "Somatotropic axis", blurb: "Growth hormone research — body composition and recovery." },
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
    cls: "The community's most talked-about weight and appetite compound",
    overview:
      "Retatrutide is the one people in the community talk about most for weight and appetite. In plain terms, it works on three different hunger and metabolism signals at once, which is why researchers are so interested in it for appetite, body weight, blood sugar, and liver fat. It is the strongest of the weight-focused compounds in this catalog, and the research behind it is the most talked-about too.",
    research: [
      "Appetite and feeling full sooner",
      "Body weight and fat loss research",
      "Blood sugar and metabolic health research",
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
    cls: "An all-in-one recovery blend — skin, joints, gut, and healing in one vial",
    overview:
      "KLOW is a blend of four peptides in one vial, made for people interested in recovery from the inside out. In the community it is talked about for injury and tendon recovery, sore joints, skin and hair, and gut and overall inflammation. Think of it as the recovery stack in a single vial, instead of buying all four separately.",
    comp: [["GHK-Cu", "50 mg"], ["BPC-157", "10 mg"], ["TB-500 (Thymosin β4)", "10 mg"], ["KPV", "10 mg"]],
    research: [
      "GHK-Cu: skin, collagen, and hair research",
      "BPC-157: healing, gut, and tissue recovery research",
      "TB-500: tendon, joint, and injury recovery research",
      "KPV: gut and whole-body inflammation research",
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
    cls: "A mitochondria compound — studied for cellular energy",
    overview:
      "SS-31, also called elamipretide, is studied for how cells make energy. It works inside the mitochondria, the part of the cell that produces energy, and researchers look at it for energy, fatigue, and recovery, especially in muscle and heart tissue. In the community it is talked about as an energy-at-the-cellular-level compound, not a stimulant.",
    research: [
      "Cellular energy and how mitochondria work",
      "Fatigue and recovery research",
      "Protecting cells from everyday stress and damage",
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
    cls: "Studied for calm, focus, and taking the edge off stress",
    overview:
      "Selank is the one people in the community talk about for feeling calmer and more focused, without feeling drowsy. Researchers study it for stress, anxiety, mood, and clear thinking. It is often described as helping you feel steady and clear-headed, which is why people look into it for focus, work, and stressful days.",
    research: ["Feeling calmer under stress", "Focus and clear thinking", "Mood and everyday stress research"],
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
    cls: "Studied for gut and skin inflammation",
    overview:
      "KPV is a small peptide people in the community talk about for inflammation, especially in the gut and skin. Researchers study it for calming inflammatory signals, gut health, and skin healing. It is also one of the four parts of the KLOW blend.",
    research: ["Gut inflammation research", "Skin healing and inflammation research", "Calming inflammatory signals in the body"],
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
    cls: "A dual weight and appetite compound — the well-known one before Reta",
    overview: "Tirzepatide is the weight and appetite compound most people know first. It works on two hunger and blood sugar signals at once, which is why researchers study it for appetite, body weight, and blood sugar. In the community it is talked about as the reliable, well-studied option in this group, and the one Retatrutide is most often compared to.",
    research: ["Appetite and feeling full sooner", "Body weight research", "Blood sugar research"],
    spec: [["Synonyms", "LY3298176"], ["CAS no.", "2023788-19-2"], ["Molecular formula", "C225H348N48O68"], ["Molecular weight", "4813.5 g/mol"], ["Sequence length", "39 amino acids, lipidated"]],
    refs: ["Coskun T, et al. Mol Metab. 2018;18:3–14."],
  },
  {
    slug: "cagrilintide-10mg", name: "Cagrilintide", short: "CAGRI", color: "#6366F1", cat: "metabolic", variants: [{ sku: "CAGRI-10", size: "10 mg", priceCents: 5000, inStock: true }], purity: null,
    cls: "Studied for appetite and feeling full — often talked about alongside Tirzepatide",
    overview: "Cagrilintide is studied for appetite and feeling full. It works through a different signal than the GLP-1 style compounds, which is why researchers are interested in it on its own and in combination with them. In the community it is talked about for weight research and for helping with hunger between meals.",
    research: ["Appetite and feeling full research", "Body weight research", "How it works alongside incretin compounds"],
    spec: [["Synonyms", "AM833"], ["CAS no.", "1415456-99-3"], ["Molecular formula", "C194H312N54O59S2"], ["Molecular weight", "4409.0 g/mol"]],
    refs: ["Kruse T, et al. J Med Chem. 2021;64(15):11183–11194."],
  },
  {
    slug: "tesamorelin-10mg", name: "Tesamorelin", short: "TESA", color: "#14B8A6", cat: "gh", variants: [{ sku: "TESA-10", size: "10 mg", priceCents: 5000, inStock: true }], purity: null,
    cls: "Studied for growth hormone, body fat, and body composition",
    overview: "Tesamorelin is studied for how the body releases its own growth hormone. Researchers look at it for body fat, especially belly fat, body composition, and recovery. In the community it is talked about for getting leaner while holding onto muscle, and for sleep and recovery too.",
    research: ["Body fat and body composition research", "Natural growth hormone release research", "Recovery and sleep research"],
    spec: [["Synonyms", "TH9507"], ["CAS no.", "218949-48-5"], ["Molecular formula", "C221H366N72O67S"], ["Molecular weight", "5135.9 g/mol"], ["Sequence length", "44 amino acids, N-acylated"]],
    refs: ["Ferdinandi ES, et al. Basic Clin Pharmacol Toxicol. 2007;100(1):49–58."],
  },
  {
    slug: "bpc-157-10mg", name: "BPC-157", short: "BPC", color: "#10B981", cat: "tissue", variants: [{ sku: "BPC-10", size: "10 mg", priceCents: 6000, inStock: true }], purity: null,
    cls: "The community's go-to healing peptide — gut, tendons, and injuries",
    overview: "BPC-157 is the healing peptide most people in the community start with. Researchers study it for gut health, tendon and joint healing, and recovery from injuries. It is talked about for helping tissue repair itself faster, which is why it shows up in so many recovery stacks.",
    research: ["Tendon, joint, and injury recovery research", "Gut health research", "Tissue healing and blood flow research"],
    spec: [["CAS no.", "137525-51-0"], ["Molecular formula", "C62H98N16O22"], ["Molecular weight", "1419.5 g/mol"], ["Sequence length", "15 amino acids"]],
    refs: [],
  },
  {
    slug: "wolverine-blend", name: "Wolverine", short: "WOLV", color: "#B45309", cat: "tissue", variants: [
      { sku: "WOLV-10", size: "10 mg", priceCents: 4000, inStock: true },
      { sku: "WOLV-20", size: "20 mg", priceCents: 6000, inStock: true },
    ], purity: null,
    cls: "BPC-157 + TB-500 together — the classic injury recovery stack",
    overview: "Wolverine is BPC-157 and TB-500 in one vial, the two healing peptides people in the community most often pair together. Researchers study the pair for injury recovery, tendons, joints, and muscle tissue. If BPC-157 is the go-to for healing, Wolverine is the go-to stack for when you want both sides of recovery covered at once.",
    comp: [["BPC-157", "50% of labeled mass"], ["TB-500 (Thymosin β4)", "50% of labeled mass"]],
    research: ["BPC-157: tendon, joint, and gut recovery research", "TB-500: muscle, tendon, and injury recovery research"],
    spec: [["Format", "Blend, 10 mg or 20 mg total per vial"], ["BPC-157", "C62H98N16O22 · 1419.5 g/mol"], ["Thymosin β4", "C212H350N56O78S · 4963.4 g/mol"]],
    refs: ["Goldstein AL, et al. Expert Opin Biol Ther. 2012;12(1):37–51."],
  },
  {
    slug: "ghk-cu-100mg", name: "GHK-Cu", short: "GHK-CU", color: "#2563EB", cat: "tissue", variants: [{ sku: "GHK-100", size: "100 mg", priceCents: 4000, inStock: true }], purity: null,
    cls: "Studied for skin, collagen, and hair",
    overview: "GHK-Cu is the skin peptide. It is a copper peptide researchers study for collagen, skin repair, and hair. In the community it is talked about for healthier-looking skin, firmer skin, wound healing, and hair thickness. It is also the biggest part of the KLOW blend.",
    research: ["Skin, collagen, and wound healing research", "Hair research", "Skin repair and healthy aging research"],
    spec: [["CAS no.", "89030-95-5"], ["Molecular formula", "C14H22CuN6O4"], ["Molecular weight", "401.9 g/mol"], ["Sequence", "Gly-His-Lys (Cu²⁺ complex)"]],
    refs: ["Pickart L, Margolina A. Int J Mol Sci. 2018;19(7):1987."],
  },
  {
    slug: "ara-290-10mg", name: "ARA-290", short: "ARA", color: "#E11D48", cat: "tissue", variants: [{ sku: "ARA-10", size: "10 mg", priceCents: 3499, inStock: true }], purity: null,
    cls: "Studied for nerve pain and tissue repair",
    overview: "ARA-290, also called cibinetide, is studied for nerve pain and tissue repair. Researchers look at it for neuropathy, chronic pain, and inflammation, especially when nerves are involved. In the community it is talked about for nerve-related pain and for helping damaged tissue recover.",
    research: ["Nerve pain and neuropathy research", "Tissue repair research", "Inflammation research"],
    spec: [["Synonyms", "Cibinetide"], ["Sequence", "pGlu-Glu-Gln-Leu-Glu-Arg-Ala-Leu-Asn-Ser-Ser"], ["Sequence length", "11 amino acids"]],
    refs: [],
  },
  {
    slug: "mots-c-40mg", name: "MOTS-c", short: "MOTS-C", color: "#F97316", cat: "mito", variants: [{ sku: "MOTS-40", size: "40 mg", priceCents: 8000, inStock: true }], purity: null,
    cls: "A mitochondrial peptide — studied for energy, metabolism, and endurance",
    overview: "MOTS-c is a peptide made in the mitochondria that researchers study for energy and metabolism. In the community it is talked about for energy, endurance, fat metabolism, and healthy aging. Think of it as a metabolism and energy compound, studied for how cells handle stress and use fuel.",
    research: ["Energy and metabolism research", "Endurance and exercise research", "Healthy aging and cellular stress research"],
    spec: [["Sequence", "MRWQEMGYIFYPRKLR"], ["Sequence length", "16 amino acids"], ["CAS no.", "1627580-64-6"]],
    refs: ["Lee C, et al. Cell Metab. 2015;21(3):443–454."],
  },
  {
    slug: "nad-plus-1000mg", name: "NAD+", short: "NAD+", color: "#0F766E", cat: "mito", variants: [{ sku: "NAD-1000", size: "1000 mg", priceCents: 5500, inStock: true }], purity: null,
    cls: "The energy and healthy aging coenzyme — not a peptide, but in the same conversation",
    overview: "NAD+ is not a peptide, it is a coenzyme every cell uses to make energy. Researchers study it for energy, recovery, brain fog, sleep, and healthy aging, because NAD+ levels naturally drop as we get older. In the community it is talked about as the go-to for feeling more energized and clear-headed, and for cellular repair.",
    research: ["Energy and cellular repair research", "Brain fog, focus, and sleep research", "Healthy aging research"],
    spec: [["CAS no.", "53-84-9"], ["Molecular formula", "C21H27N7O14P2"], ["Molecular weight", "663.4 g/mol"]],
    refs: [],
  },
  {
    slug: "pt-141-10mg", name: "PT-141", short: "PT-141", color: "#EC4899", cat: "neuro", variants: [{ sku: "PT141-10", size: "10 mg", priceCents: 5000, inStock: true }], purity: null,
    cls: "Studied for libido and arousal",
    overview: "PT-141, also called bremelanotide, is the one people in the community talk about for libido and arousal. Researchers study it for sexual desire and function, because it works through brain signals rather than blood flow. It is talked about for low desire and for getting in the mood.",
    research: ["Libido and sexual desire research", "Arousal research", "Brain and hormone signaling research"],
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
