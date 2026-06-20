import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  Sparkles,
  Table2,
  Search,
  Layers,
  Wand2,
  ArrowRight,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

/**
 * Solid, source-aligned demo for blog embedding.
 * Contract of this widget:
 * - It visualizes WHAT INFO is available to the orchestrator for each method.
 * - It focuses on retrieval shape + maker agency + retrieval note.
 * - It does NOT show “example answers”.
 *
 * Semantics aligned to Karima’s structured-data webinar framing:
 * - Table Knowledge: NL→Filter using glossary/synonyms; service selects a subset for the goal (not exhaustive). 
 * - searchQuery: ranked relevance discovery over indexed columns; deterministic post-filter runs over top‑N (still not exhaustive); IDs enable follow-up retrieval of non-indexed columns. 
 * - Dataverse MCP: same pattern as searchQuery+fetch, but with less control; may pick different candidates due to ranking/context. 
 */

function ScrollbarCSS() {
  return (
    <style>{`
      .scroll { overflow: auto; scrollbar-gutter: stable; }
      .scroll { scrollbar-width: thin; scrollbar-color: rgba(100,116,139,.55) transparent; }
      .scroll::-webkit-scrollbar { width: 10px; height: 10px; }
      .scroll::-webkit-scrollbar-thumb { background: rgba(100,116,139,.45); border-radius: 999px; }
      .scroll::-webkit-scrollbar-track { background: transparent; }

      /* Subtle mask to hint horizontal overflow */
      .fade-right {
        position: absolute; top: 0; right: 0; width: 44px; height: 100%;
        pointer-events: none;
        background: linear-gradient(to right, rgba(255,255,255,0), rgba(255,255,255,0.92));
      }
      .dark .fade-right {
        background: linear-gradient(to right, rgba(2,6,23,0), rgba(2,6,23,0.94));
      }
      @keyframes fadeIn {
        from { opacity: 0; transform: translateY(8px); }
        to { opacity: 1; transform: translateY(0); }
      }
      .animate-fadeIn {
        animation: fadeIn 0.18s ease-out;
      }    `}</style>
  );
}

// Keep one Description column (there is no “snippet column” in the table).
// We’ll color it as INDEXED when the method relies on indexed text search, and explain in the note.
const columns = [
  { key: "id", label: "ID", w: 50 },
  { key: "name", label: "Facility", w: 125 },
  { key: "description", label: "Description", w: 250 },
  { key: "city", label: "City", w: 80 },
  { key: "district", label: "District", w: 65 },
  { key: "phone", label: "Phone", w: 95 },
  { key: "hours", label: "Hours", w: 95 },
  { key: "type", label: "Type", w: 90 },  
];

const facilities = [
  {
    id: "F001",
    name: "Darryl Civic Centre",
    city: "Hillcrest",
    district: "North",
    type: "Civic Centre",
    phone: "+1 (555) 0701",
    hours: "Mon–Fri 9–5",
    description:
      "Walk-in civic services and information desk. Multi-service counter with referrals.",
  },
  {
    id: "F002",
    name: "Darrel Community Centre",
    city: "Hillcrest",
    district: "North",
    type: "Recreation Centre",
    phone: "+1 (555) 0702",
    hours: "Daily 7–10",
    description:
      "Drop-in open gym nights with a full-size indoor court and evening youth programs.",
  },
  {
    id: "F003",
    name: "Daryl Services Point",
    city: "Elmwood",
    district: "West",
    type: "Services Hub",
    phone: "+1 (555) 2502",
    hours: "Mon–Fri 8–6",
    description:
      "Benefits intake and municipal services triage. Often confused with Darryl Civic Centre.",
  },
  {
    id: "F004",
    name: "Westside Pool",
    city: "Brookside",
    district: "West",
    type: "Sports Complex",
    phone: "+1 (555) 2109",
    hours: "Mon–Sun 6–9",
    description: "Indoor aquatics facility with lessons and seasonal clinics.",
  },
  {
    id: "F005",
    name: "Westside Pool Annex",
    city: "Brookside",
    district: "West",
    type: "Sports Complex",
    phone: "+1 (555) 2110",
    hours: "Mon–Fri 6–8",
    description:
      "Annex building for reservations and training. Often confused with Westside Pool.",
  },
  {
    id: "F006",
    name: "Darnell Civic Office",
    city: "Brookside",
    district: "Central",
    type: "Civic Office",
    phone: "+1 (555) 0101",
    hours: "Mon–Fri 9–5",
    description: "Administrative office for records and appointments.",
  },
  {
    id: "F007",
    name: "Hillcrest Library Branch",
    city: "Hillcrest",
    district: "North",
    type: "Library",
    phone: "+1 (555) 0706",
    hours: "Mon–Sat 10–8",
    description:
      "Quiet study spaces, public computers, and after-school homework help.",
  },
  {
    id: "F008",
    name: "Canyon Community Access",
    city: "Canyon",
    district: "Central",
    type: "Access Point",
    phone: "+1 (555) 0204",
    hours: "Mon–Fri 8–4",
    description:
      "Front-door access point for residents who need help finding the right service.",
  },
  {
    id: "F009",
    name: "Crestwood Community Centre",
    city: "Crestwood",
    district: "North",
    type: "Recreation Centre",
    phone: "+1 (555) 1702",
    hours: "Daily 8–9",
    description: "Community programming and weekend activities.",
  },
  {
    id: "F010",
    name: "Bayview Access Point",
    city: "Bayview",
    district: "South",
    type: "Access Point",
    phone: "+1 (555) 2504",
    hours: "Mon–Fri 9–4",
    description:
      "Assistance desk for applications, referrals, and form completion.",
  },
];

// Clarified retrieval-step coloring:
// - indexed: comes from ranked indexed search (top‑N)
// - post: deterministic post-filter subset (still within top‑N)
// - fetched: deterministic retrieval (List Rows / Get Row) — used to bring back non-indexed columns (and optional wider selects)
// - knowledge: Knowledge service-selected subset for answering
// - reasoning: passed to a prompt tool
const tone = {
  knowledge:
    "bg-sky-100/70 border-sky-300 text-slate-900 dark:bg-sky-500/15 dark:border-sky-500/40 dark:text-slate-100",
  indexed:
    "bg-amber-100/70 border-amber-300 text-slate-900 dark:bg-amber-500/15 dark:border-amber-500/40 dark:text-slate-100",
  post:
    "bg-orange-100/70 border-orange-300 text-slate-900 dark:bg-orange-500/15 dark:border-orange-500/40 dark:text-slate-100",
  fetched:
    "bg-emerald-100/70 border-emerald-300 text-slate-900 dark:bg-emerald-500/15 dark:border-emerald-500/40 dark:text-slate-100",
  reasoning:
    "bg-purple-100/70 border-purple-300 text-slate-900 dark:bg-purple-500/15 dark:border-purple-500/40 dark:text-slate-100",
};

const legend = [
  {
    key: "indexed",
    label: "Indexed search",
    badge: "bg-amber-100 text-amber-900",
    desc: "Returned from ranked index (top‑N candidates)",
  },
  {
    key: "post",
    label: "Post-filtered",
    badge: "bg-orange-100 text-orange-900",
    desc: "Deterministic filter applied within that top‑N set",
  },
  {
    key: "fetched",
    label: "Retrieved by ID",
    badge: "bg-emerald-100 text-emerald-900",
    desc: "List Rows/Get Row fetch brings non-indexed columns (and optional wider selects)",
  },
  {
    key: "knowledge",
    label: "Knowledge",
    badge: "bg-sky-100 text-sky-900",
    desc: "Service-selected subset used for grounded answering (not exhaustive)",
  },
  {
    key: "reasoning",
    label: "Reasoning",
    badge: "bg-purple-100 text-purple-900",
    desc: "Data passed into a prompt for open-ended reasoning",
  },
];

const cellKey = (rowId, colKey) => `${rowId}::${colKey}`;

function Legend() {
  return (
    <div className="hidden sm:flex flex-wrap gap-x-3 gap-y-0.5 text-[10px] text-slate-500 dark:text-slate-400">
      {legend.map((x) => (
        <div key={x.key} className="flex items-center gap-1">
          <Badge className={`rounded-lg px-1.5 py-0 text-[9px] ${x.badge}`}>{x.label}</Badge>
          <span>{x.desc}</span>
        </div>
      ))}
    </div>
  );
}

function Trace({ items }) {
  return (
    <div className="space-y-2">
      <div className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
        Retrieval steps
      </div>
      <div className="grid gap-2">
        {items.map((t, i) => (
          <div
            key={i}
            className="flex items-start gap-2 rounded-2xl border bg-white/60 p-2.5 shadow-sm dark:bg-slate-950/40"
          >
            <ArrowRight className="mt-0.5 h-4 w-4 text-slate-400" />
            <div className="min-w-0 text-[12px] leading-snug text-slate-800 dark:text-slate-100">
              <span className="font-medium">{t.kind}</span>
              <span className="mx-2 text-slate-400">·</span>
              <span className="text-slate-600 dark:text-slate-300">{t.detail}</span>
              {t.sub ? (
                <div className="mt-1 text-[12px] text-slate-600 dark:text-slate-300">
                  <span className="text-slate-400">— </span>
                  {t.sub}
                </div>
              ) : null}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function CodeBox({ title, lines }) {
  return (
    <div className="space-y-2">
      <div className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
        {title}
      </div>
      <div className="rounded-2xl border bg-slate-50 p-2 font-mono text-[11px] leading-relaxed text-slate-800 dark:bg-slate-950/40 dark:text-slate-200">
        {lines.map((l, i) => (
          <div key={i} className="whitespace-pre-wrap break-words [overflow-wrap:anywhere]">
            {l}
          </div>
        ))}
      </div>
    </div>
  );
}

function BulletList({ title, items }) {
  return (
    <div className="space-y-2">
      <div className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
        {title}
      </div>
      <ul className="list-disc pl-5 text-[12px] text-slate-700 dark:text-slate-200">
        {items.map((x, i) => (
          <li key={i}>{x}</li>
        ))}
      </ul>
    </div>
  );
}

function NoteBox({ body }) {
  return (
    <div className="rounded-2xl border bg-white/70 p-3 text-[12px] text-slate-700 shadow-sm dark:bg-slate-950/40 dark:text-slate-200">
      <div className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
        Retrieval note
      </div>
      <div className="mt-1 leading-snug text-slate-600 dark:text-slate-300">{body}</div>
    </div>
  );
}

const methods = [
  {
    id: "knowledge",
    label: "Table Knowledge",
    icon: Sparkles,
    tagline:
      "NL→Filter with glossary + grounded answering • service-selected subset • not for exhaustive lists",
    question: "Show me all facilities in the West district.",
    trace: [
      {
        kind: "Knowledge",
        detail:
          "NL→Filter uses your glossary/synonyms; retrieval is optimized to answer the goal (not an exhaustive listing).",
      },
    ],
    retrievalShape: {
      title: "What’s retrieved (conceptual)",
      lines: [
        "• Structured filter generated from user intent + glossary",
        "• Service selects a subset of rows/columns needed to answer the goal",
      ],
    },
    controls: [
      "Which tables are included",
      "Glossary / synonyms / column descriptions (NL→Filter quality)",
    ],
    notControlled: [
      "Exact columns/rows used behind the scenes (service may omit data not needed for the goal)",
    ],
    note:
      "Even if the user says “all”, expect Knowledge to optimize for the goal and return a subset (more relevant answers than exhaustive lists).",
    highlights: () => {
      const h = new Map();
      // Service-selected subset for answering "West district" (no phone/hours).
      ["F003", "F004", "F005"].forEach((rid) => {
        ["id", "name", "district", "city", "type", "description"].forEach((ck) =>
          h.set(cellKey(rid, ck), "knowledge")
        );
      });
      return h;
    },
  },
  {
    id: "listRows",
    label: "List Rows",
    icon: Table2,
    tagline: "Deterministic & exhaustive • maker controls filter + columns + paging",
    question: "Give me ALL West district facilities, including phone numbers.",
    trace: [
      {
        kind: "Tool",
        detail:
          "List Rows executes an OData/FetchXML filter and returns ALL matching rows (no ranking).",
        sub:
          "For added intelligence: Orchestrator generates the query and alternate search terms on the fly.",
      },
    ],
    retrievalShape: {
      title: "What’s retrieved (example shape)",
      lines: [
        "$filter: district eq 'West'",
        "$select: id, name, description, city, district, type, phone, hours",
        "Returns: ALL matches (exhaustive)",
      ],
    },
    controls: [
      "Filter logic ($filter / FetchXML)",
      "Exactly which columns/rows are returned",
    ],
    notControlled: [
      "Fuzzy discovery for typos/near-matches without a prior candidate ID",
    ],
    note:
      "This is the exhaustive path: it can return all matches, with your filter criteria.",
    highlights: (rows) => {
      const h = new Map();
      const matches = rows.filter((r) => r.district === "West");
      for (const r of matches) {
        ["id", "name", "description", "city", "district", "type", "phone", "hours"].forEach(
          (ck) => h.set(cellKey(r.id, ck), "fetched")
        );
      }
      return h;
    },
  },
  {
    id: "searchQuery",
    label: "searchQuery",
    icon: Search,
    tagline:
      "Ranked indexed discovery • post-filter over top‑N • then List Rows by ID for missing (non-indexed) columns",
    // Corrected logic: first get several "Darol-like" candidates; then post-filter to Hillcrest; then fetch one by ID for phone (+ wider select).
    question:
      "I’m looking for a center with a name like “Darol” in Hillcrest. What’s the phone number?",
    trace: [
      {
        kind: "searchQuery Tool Step 1",
        detail:
          "Indexed search returns ranked ‘Darol-like’ candidates (not all matches).",
        sub:
          "Only indexed columns can be returned from this step; the record ID enables follow-up retrieval.",
      },
      {
        kind: "searchQuery Tool Step 2",
        detail:
          "Deterministic post-filter narrows the ranked set to Hillcrest candidates (still not exhaustive).",
      },
      {
        kind: "Optional List Rows Tool",
        detail:
          "Optional - List Rows/Get Row by ID retrieves non-indexed columns (phone/hours) and can optionally return more columns for the agent.",
      },
    ],
    retrievalShape: {
      title: "What’s retrieved (3-step story)",
      lines: [
        "searchQuery Step 1 — relevanve indexed search (ranked):",
        "  returns: id + indexed fields (e.g., name, description chunks, city, district, type)",
        "  candidate set: a few ‘Darol-like’ rows (not all)",
        "searchQuery Step 2 — post-filter (deterministic, within top‑N):",
        "  filter: city eq 'Hillcrest'",
        "Orcherstrator calls List Rows — fetch by ID (deterministic):",
        "  List Rows/Get Row returns: phone, hours, full description text, optionally more columns",
      ],
    },
    controls: [
      "Which columns are indexed + returned in the searchQuery tool instance",
      "top/count/facets + post-filter expression",
      "Which columns you select on the subsequent ID fetch (narrow or wide)",
    ],
    notControlled: [
      "Ranked candidate set is probabilistic and not exhaustive, even with post-filter",
    ],
    note:
      "A List Rows query for “Darol” will not reliably discover “Darryl Civic Centre”. Use indexed discovery first, then fetch by ID for phone and other non-indexed fields.",
    highlights: () => {
      const h = new Map();
      // Step 1: ranked indexed candidates (a handful)
      const rankedCandidates = ["F001", "F002", "F003"]; // ‘Darol-like’ set
      rankedCandidates.forEach((rid) => {
        ["id", "name", "description", "city", "district", "type"].forEach((ck) =>
          h.set(cellKey(rid, ck), "indexed")
        );
      });
      // Step 2: post-filter narrows that set to Hillcrest only
      const postFiltered = ["F001", "F002"]; // Hillcrest among candidates
      postFiltered.forEach((rid) => {
        ["id", "name", "description", "city", "district", "type"].forEach((ck) =>
          h.set(cellKey(rid, ck), "post")
        );
      });
      // Step 3: fetch by ID for the chosen record to get missing fields + wider select
      const chosen = "F001";
      ["phone", "hours"].forEach((ck) => h.set(cellKey(chosen, ck), "fetched"));
      // Show that you *can* fetch a wider select; mark a few additional columns as fetched (optional)
      ["name", "description", "city", "district", "type"].forEach((ck) =>
        h.set(cellKey(chosen, ck), "fetched")
      );
      return h;
    },
  },
  {
    id: "mcp",
    label: "Dataverse MCP",
    icon: Layers,
    tagline:
      "Same discovery→post-filter→fetch pattern • less control • may pick different ranked candidates",
    // Use the same question as searchQuery (per your request).
    question:
      "I’m looking for a center with a name like “Darol” in Hillcrest. What’s the phone number?",
    trace: [
      {
        kind: "MCP",
        detail:
          "MCP relevance indexed discovery tool step 1 may rank different ‘Darol-like’ candidates (contextual ranking + tool defaults).",
      },
      {
        kind: "MCP",
        detail:
          "MCP relevance indexed discovery tool step 2 applies the post-filter to narrow to Hillcrest candidates (still within ranked subset).",
      },
      {
        kind: "MCP",
        detail:
          "MCP list rows tool then fetches by ID for the missing fields (often phone), potentially selecting fewer or more columns depending on the operation.",
      },
    ],
    retrievalShape: {
      title: "What’s retrieved (same shape, less control)",
      lines: [
        "MCP Tool 1 Step 1 — indexed ranked discovery (MCP defaults): a few ‘Darol-like’ rows",
        "MCP Tool 1 Step 2 — post-filter within that subset: city='Hillcrest'",
        "MCP Tool 2 — fetch by ID for missing fields: often phone (maybe wider depending on MCP)",
        "MCP Tool ..N — possible other tool calls for fetching tables and schemas and other ways to answer)",
      ],
    },
    controls: [
      "Which MCP operations are enabled/disabled",
      "Whether you also call explicit custom tools for deterministic governance",
    ],
    notControlled: [
      "Exact ranked candidates vs a custom searchQuery instance",
      "Exact query shape/columns returned per step",
      "How many calls occur within a single turn",
    ],
    note:
      "MCP is great for quick intelligentenablement but gives away some control; move to explicit searchQuery + explicit ID fetch for granular control if effort is worthwhile for the use case.",
    highlights: () => {
      const h = new Map();
      // MCP discovery may pick a different subset than the explicit searchQuery instance.
      const rankedCandidates = ["F001", "F002"]; // fewer/different candidates
      rankedCandidates.forEach((rid) => {
        ["id", "name", "description", "city", "district", "type"].forEach((ck) =>
          h.set(cellKey(rid, ck), "indexed")
        );
      });
      // Post-filter keeps Hillcrest candidates
      const postFiltered = ["F001", "F002"]; // both Hillcrest here
      postFiltered.forEach((rid) => {
        ["id", "name", "description", "city", "district", "type"].forEach((ck) =>
          h.set(cellKey(rid, ck), "post")
        );
      });
      // Fetch by ID for missing columns
      const chosen = "F001";
      ["phone", "hours"].forEach((ck) => h.set(cellKey(chosen, ck), "fetched"));
      return h;
    },
  },
  {
    id: "prompt",
    label: "Prompt Tool",
    icon: Wand2,
    tagline:
      "Open-ended reasoning over retrieved row text • Full context window of the prompt  • Model choice",
    question: "Where can I play basketball in Hillcrest?",
    trace: [
      {
        kind: "Prompt Tool Step 1",
        detail:
          "Retrieve a bounded set of rows deterministically (e.g., city='Hillcrest') to use as prompt context.",
      },
      {
        kind: "Prompt Tool Step 2",
        detail:
          "Prompt LLM reasons over full retrieval to answer conceptual questions (great for low keyword overlap meaning-search).",
      },
    ],
    retrievalShape: {
      title: "What’s retrieved (prompt-context pattern)",
      lines: [
        "Step 1 — deterministic retrieval (bounded rows):",
        "  e.g., List Rows where city eq 'Hillcrest'",
        "Step 2 — prompt reasons over row text:",
        "  finds relevant recreation/gym facilities for ‘basketball’",
      ],
    },
    controls: [
      "Which rows/columns are passed into the prompt context",
      "Prompt instructions + output schema",
      "LLM Model choice",      
    ],
    notControlled: [
      "Latency/token pressure if you pass too many rows or very long descriptions",
    ],
    note:
      "Most efficient when you constrain what’s sent into the prompt context.",
    highlights: (rows) => {
      const h = new Map();
      const hillcrest = rows.filter((r) => r.city === "Hillcrest");
      for (const r of hillcrest) {
        ["id", "name", "city", "district", "type", "description"].forEach((ck) =>
          h.set(cellKey(r.id, ck), "fetched")
        );
        h.set(cellKey(r.id, "description"), "reasoning");
      }
      return h;
    },
  },
];

function MethodButton({ active, onClick, icon: Icon, label }) {
  return (
    <Button
      onClick={onClick}
      variant={active ? "default" : "secondary"}
      size="sm"
      className={`rounded-2xl px-3 ${active ? "shadow-sm" : ""}`}
    >
      <Icon className="mr-2 h-4 w-4" />
      <span className="hidden sm:inline">{label}</span>
      <span className="sm:hidden">{label.split(" ")[0]}</span>
    </Button>
  );
}

export default function DataverseRetrievalDemoSolid() {
  const [selected, setSelected] = useState("searchQuery");
  const [view, setView] = useState("table"); // "table" or "details"

  const tableScrollRef = useRef(null);
  const [showOverflowHint, setShowOverflowHint] = useState(false);

  const method = useMemo(
    () => methods.find((m) => m.id === selected) || methods[0],
    [selected]
  );

  const highlights = useMemo(() => {
    const h = method.highlights ? method.highlights(facilities) : new Map();
    return h;
  }, [method]);

  // Detect horizontal overflow to show hint + fade.
  useEffect(() => {
    const el = tableScrollRef.current;
    if (!el) return;
    const recompute = () => setShowOverflowHint(el.scrollWidth > el.clientWidth + 2);
    recompute();
    const ro = new ResizeObserver(recompute);
    ro.observe(el);
    window.addEventListener("resize", recompute);
    return () => {
      ro.disconnect();
      window.removeEventListener("resize", recompute);
    };
  }, [selected, view]);

  const Icon = method.icon;
  const embedHeight = 520;

  return (
    <div className="w-full">
      <ScrollbarCSS />
      <div className="mx-auto max-w-6xl">
        <div
          className="overflow-hidden rounded-xl border bg-white shadow-sm dark:bg-slate-950"
          style={{ height: embedHeight }}
        >
          <div className="flex h-full flex-col">
            {/* Top bar */}
            <div className="shrink-0 border-b bg-white/70 px-3 py-2 backdrop-blur dark:bg-slate-950/60">
              <div className="flex items-center justify-between gap-2">
                <div className="min-w-0">
                  <div className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                    Structured Data Retrieval Methods
                  </div>
                </div>
                <div className="flex gap-1 shrink-0">
                  <Button
                    variant={view === "table" ? "default" : "secondary"}
                    size="sm"
                    className="rounded-2xl"
                    onClick={() => setView("table")}
                  >
                    <Table2 className="mr-1.5 h-4 w-4" />Table
                  </Button>
                  <Button
                    variant={view === "details" ? "default" : "secondary"}
                    size="sm"
                    className="rounded-2xl"
                    onClick={() => setView("details")}
                  >
                    <ArrowRight className="mr-1.5 h-4 w-4" />Details
                  </Button>
                </div>
              </div>
            </div>

            {/* Method chooser */}
            <div className="shrink-0 flex flex-wrap gap-1.5 border-b bg-white/60 px-3 py-1.5 dark:bg-slate-950/40">
              {methods.map((m) => (
                <MethodButton
                  key={m.id}
                  active={m.id === selected}
                  onClick={() => setSelected(m.id)}
                  icon={m.icon}
                  label={m.label}
                />
              ))}
            </div>

            {/* Body — toggle between table and details */}
            <div className="flex-1 min-h-0">
              {view === "table" ? (
                <div className="relative h-full bg-white/40 dark:bg-slate-950/20 px-3 py-2 flex flex-col gap-1">
                  <div className="text-[11px] text-slate-700 dark:text-slate-300 line-clamp-2">
                    <span className="font-semibold">User asks:</span> {method.question}
                  </div>
                  <Legend />
<div ref={tableScrollRef} className="scroll flex-1 min-h-0 border bg-white dark:bg-slate-950/40">

                      <table
                        className="w-full border-collapse text-[11px]"
                        style={{ minWidth: columns.reduce((s, c) => s + c.w, 0) }}
                      >
                        <colgroup>
                          {columns.map((c) => (
                            <col key={c.key} style={{ width: c.w }} />
                          ))}
                        </colgroup>
                        <thead className="sticky top-0 z-10 bg-slate-50 dark:bg-slate-950">
                          <tr>
                            {columns.map((c) => (
                              <th
                                key={c.key}
                                className="border-b px-2 py-2 text-left text-[10px] font-semibold uppercase tracking-wide text-slate-500"
                              >
                                {c.label}
                              </th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {facilities.map((r) => (
                            <tr key={r.id} className="hover:bg-slate-50/70 dark:hover:bg-slate-900/30">
                              {columns.map((c) => {
                                const t = highlights.get(cellKey(r.id, c.key));
                                const cls = t
                                  ? `border px-2 py-2 align-top ${tone[t]}`
                                  : "border px-2 py-2 align-top";
                                const v = r[c.key];
                                return (
                                  <td key={c.key} className={cls}>
                                    <div className={c.key === "description" ? "leading-snug" : "font-medium"}>
                                      {v}
                                    </div>
                                  </td>
                                );
                              })}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                  </div>
                </div>
              ) : null}

              {/* Details */}
              {view === "details" ? (
              <div className="h-full min-h-0 p-3">
                <div className="scroll h-full">
                  <div
                    key={method.id}
                    className="animate-fadeIn"
                  >
                      <Card className="rounded-xl shadow-sm">
                        <CardHeader className="space-y-1">
                          <div className="flex items-center gap-2">
                            <Icon className="h-5 w-5 text-slate-700 dark:text-slate-200" />
                            <CardTitle className="text-base">{method.label}</CardTitle>
                          </div>
                          <div className="text-[12px] text-slate-600 dark:text-slate-300">
                            <span className="font-semibold">User asks:</span> {method.question}
                          </div>
                        </CardHeader>
                        <CardContent className="space-y-4">
                          <Trace items={method.trace} />
                          <Separator />
                          <CodeBox title={method.retrievalShape.title} lines={method.retrievalShape.lines} />
                          <Separator />
                          <BulletList title="Maker controls" items={method.controls} />
                          <BulletList title="Not controlled" items={method.notControlled} />
                          {method.note ? (
                            <>
                              <Separator />
                              <NoteBox body={method.note} />
                            </>
                          ) : null}
                        </CardContent>
                      </Card>
                  </div>
                </div>
              </div>
              ) : null}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
