import { useState } from "react";
import { FileCode2 } from "lucide-react";

import { useProject } from "@/lib/cryptoxi/project";

export function FileExplorer() {
  const state = useProject();
  const paths = Object.keys(state.files).sort();
  const [active, setActive] = useState<string | null>(null);
  const selected = active && state.files[active] ? state.files[active] : null;

  if (!paths.length) {
    return (
      <p className="p-4 text-xs text-muted-foreground">
        No files yet. CryptoXI writes the project here as it works.
      </p>
    );
  }

  return (
    <div className="grid h-full grid-cols-[minmax(9rem,14rem)_1fr] overflow-hidden">
      <ul className="overflow-auto border-r border-border p-2 text-xs">
        {paths.map((p) => (
          <li key={p}>
            <button
              type="button"
              onClick={() => setActive(p)}
              className={`flex w-full items-center gap-1.5 truncate rounded px-2 py-1 text-left transition-colors ${
                active === p ? "bg-primary/15 text-foreground" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <FileCode2 className="size-3 shrink-0" />
              <span className="truncate">{p}</span>
            </button>
          </li>
        ))}
      </ul>
      <pre className="overflow-auto p-3 text-[11px] leading-relaxed text-muted-foreground">
        <code>{selected ? selected.content : "Select a file."}</code>
      </pre>
    </div>
  );
}
