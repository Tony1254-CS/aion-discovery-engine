import { useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Table, ChevronDown, ChevronUp } from "lucide-react";

interface Props {
  dataset: { name: string; size: number; data: string; type: string };
}

function parseCSV(text: string, delimiter = ","): { headers: string[]; rows: string[][] } {
  const lines = text.split("\n").filter(l => l.trim());
  if (lines.length === 0) return { headers: [], rows: [] };
  const headers = lines[0].split(delimiter).map(h => h.trim().replace(/^"|"$/g, ""));
  const rows = lines.slice(1, 11).map(line =>
    line.split(delimiter).map(c => c.trim().replace(/^"|"$/g, ""))
  );
  return { headers, rows };
}

function parseJSON(text: string): { headers: string[]; rows: string[][] } {
  try {
    let data = JSON.parse(text);
    if (!Array.isArray(data)) {
      const key = Object.keys(data).find(k => Array.isArray(data[k]));
      data = key ? data[key] : [data];
    }
    if (!Array.isArray(data) || data.length === 0) return { headers: [], rows: [] };
    const headers = Object.keys(data[0]);
    const rows = data.slice(0, 10).map((row: any) =>
      headers.map(h => String(row[h] ?? ""))
    );
    return { headers, rows };
  } catch {
    return { headers: [], rows: [] };
  }
}

export default function DatasetPreview({ dataset }: Props) {
  const [expanded, setExpanded] = useState(false);

  const { headers, rows } = useMemo(() => {
    if (dataset.type === "json") return parseJSON(dataset.data);
    if (dataset.type === "tsv") return parseCSV(dataset.data, "\t");
    return parseCSV(dataset.data);
  }, [dataset]);

  if (headers.length === 0) return null;

  return (
    <div className="glass-panel rounded-xl overflow-hidden">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between px-3 py-2.5 hover:bg-muted/30 transition-colors"
      >
        <div className="flex items-center gap-2">
          <Table className="h-3.5 w-3.5 text-primary" />
          <span className="text-xs font-medium text-foreground">Data Preview</span>
          <span className="text-[10px] text-muted-foreground">
            {headers.length} cols · {rows.length} rows shown
          </span>
        </div>
        {expanded ? (
          <ChevronUp className="h-3 w-3 text-muted-foreground" />
        ) : (
          <ChevronDown className="h-3 w-3 text-muted-foreground" />
        )}
      </button>

      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
            className="overflow-hidden"
          >
            <div className="overflow-x-auto scrollbar-thin">
              <table className="w-full text-[10px] border-collapse">
                <thead>
                  <tr className="border-t border-white/[0.04]">
                    {headers.map((h, i) => (
                      <th
                        key={i}
                        className="px-2.5 py-2 text-left font-semibold text-primary/80 whitespace-nowrap bg-primary/[0.04] border-b border-white/[0.04]"
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {rows.map((row, ri) => (
                    <tr
                      key={ri}
                      className={`border-b border-white/[0.03] ${
                        ri % 2 === 0 ? "bg-white/[0.01]" : ""
                      } hover:bg-white/[0.03] transition-colors`}
                    >
                      {row.map((cell, ci) => (
                        <td
                          key={ci}
                          className="px-2.5 py-1.5 text-muted-foreground whitespace-nowrap max-w-[120px] truncate"
                          title={cell}
                        >
                          {cell || "—"}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
