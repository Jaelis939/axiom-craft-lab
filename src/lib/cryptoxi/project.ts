/**
 * CryptoXI project memory — a real virtual file system for the game project,
 * plus design decisions, dependency notes and a change history the agent
 * reads before touching anything.
 */

import { useSyncExternalStore } from "react";

export type ProjectFile = {
  path: string;
  content: string;
  updatedAt: number;
};

export type Snapshot = {
  id: string;
  label: string;
  at: number;
  files: Record<string, string>;
};

export type ChangeEntry = {
  at: number;
  action: string;
  detail: string;
};

export type ProjectState = {
  name: string;
  brief: string;
  design: string;
  files: Record<string, ProjectFile>;
  changes: ChangeEntry[];
  snapshots: Snapshot[];
  runtimeErrors: string[];
  buildErrors: string[];
};

const KEY = "cryptoxi.project.v1";

const EMPTY: ProjectState = {
  name: "Untitled project",
  brief: "",
  design: "",
  files: {},
  changes: [],
  snapshots: [],
  runtimeErrors: [],
  buildErrors: [],
};

let state: ProjectState = EMPTY;
let hydrated = false;
const listeners = new Set<() => void>();

function emit() {
  for (const l of listeners) l();
}

function persist() {
  try {
    window.localStorage.setItem(KEY, JSON.stringify(state));
  } catch {
    /* quota or SSR */
  }
}

function hydrate() {
  if (hydrated || typeof window === "undefined") return;
  hydrated = true;
  try {
    const raw = window.localStorage.getItem(KEY);
    if (raw) state = { ...EMPTY, ...(JSON.parse(raw) as ProjectState) };
  } catch {
    /* corrupt state — start clean */
  }
}

function set(next: Partial<ProjectState>, record?: ChangeEntry) {
  state = {
    ...state,
    ...next,
    changes: record ? [...state.changes, record].slice(-200) : state.changes,
  };
  persist();
  emit();
}

export const project = {
  get(): ProjectState {
    hydrate();
    return state;
  },
  subscribe(listener: () => void) {
    hydrate();
    listeners.add(listener);
    return () => listeners.delete(listener);
  },
  reset(name: string, brief: string) {
    state = { ...EMPTY, name, brief, changes: [] };
    persist();
    emit();
  },
  setMeta(meta: Partial<Pick<ProjectState, "name" | "brief" | "design">>) {
    set(meta);
  },
  list(): string[] {
    return Object.keys(this.get().files).sort();
  },
  read(path: string): string | null {
    return this.get().files[normalize(path)]?.content ?? null;
  },
  write(path: string, content: string) {
    const p = normalize(path);
    const existed = Boolean(state.files[p]);
    set(
      { files: { ...state.files, [p]: { path: p, content, updatedAt: Date.now() } } },
      { at: Date.now(), action: existed ? "update_file" : "create_file", detail: p },
    );
  },
  remove(path: string) {
    const p = normalize(path);
    if (!state.files[p]) return false;
    const files = { ...state.files };
    delete files[p];
    set({ files }, { at: Date.now(), action: "delete_file", detail: p });
    return true;
  },
  snapshot(label: string) {
    const files: Record<string, string> = {};
    for (const [p, f] of Object.entries(state.files)) files[p] = f.content;
    const snap: Snapshot = { id: `${Date.now()}`, label, at: Date.now(), files };
    set({ snapshots: [...state.snapshots, snap].slice(-15) });
    return snap.id;
  },
  rollback(id?: string) {
    const snaps = state.snapshots;
    const snap = id ? snaps.find((s) => s.id === id) : snaps[snaps.length - 1];
    if (!snap) return false;
    const files: Record<string, ProjectFile> = {};
    for (const [p, content] of Object.entries(snap.files)) {
      files[p] = { path: p, content, updatedAt: Date.now() };
    }
    set({ files }, { at: Date.now(), action: "rollback", detail: snap.label });
    return true;
  },
  setBuildErrors(errors: string[]) {
    set({ buildErrors: errors });
  },
  setRuntimeErrors(errors: string[]) {
    set({ runtimeErrors: errors.slice(-40) });
  },
  pushRuntimeError(message: string) {
    if (state.runtimeErrors[state.runtimeErrors.length - 1] === message) return;
    set({ runtimeErrors: [...state.runtimeErrors, message].slice(-40) });
  },
  log(action: string, detail: string) {
    set({}, { at: Date.now(), action, detail });
  },
};

export function normalize(path: string) {
  return path.replace(/^\.?\//, "").replace(/\/+/g, "/").trim();
}

export function useProject(): ProjectState {
  return useSyncExternalStore(project.subscribe, project.get, () => EMPTY);
}

/** Compact project map the agent sees in every turn. */
export function projectContext(): string {
  const s = project.get();
  const files = Object.values(s.files);
  if (!files.length) return "PROJECT: empty — no files yet.";
  const tree = files
    .sort((a, b) => a.path.localeCompare(b.path))
    .map((f) => `- ${f.path} (${f.content.split("\n").length} lines)`)
    .join("\n");
  const recent = s.changes
    .slice(-12)
    .map((c) => `- ${c.action}: ${c.detail}`)
    .join("\n");
  return [
    `PROJECT: ${s.name}`,
    s.brief ? `BRIEF: ${s.brief}` : "",
    s.design ? `DESIGN DECISIONS:\n${s.design}` : "",
    `FILES:\n${tree}`,
    recent ? `RECENT CHANGES:\n${recent}` : "",
    s.runtimeErrors.length ? `LAST RUNTIME ERRORS:\n${s.runtimeErrors.slice(-8).join("\n")}` : "",
  ]
    .filter(Boolean)
    .join("\n\n");
}
