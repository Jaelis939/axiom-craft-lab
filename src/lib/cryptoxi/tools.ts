/**
 * The CryptoXI tool system — real, side-effecting access to the project.
 * No simulated responses: every call mutates or reads the actual VFS/build.
 */

import { build, ENTRY } from "./bundler";
import { project, normalize } from "./project";
import type { ToolSchema } from "./provider";

export type ToolResult = {
  ok: boolean;
  output: string;
  /** Set when the build output changed and the preview should reload. */
  previewHtml?: string;
};

export type ToolContext = {
  /** Runs the current build inside the live preview and collects runtime errors. */
  runPreview: (html: string) => Promise<string[]>;
};

const str = (d: string) => ({ type: "string", description: d });

export const TOOL_SCHEMAS: ToolSchema[] = [
  {
    name: "list_files",
    description: "List every file in the current game project with its size.",
    parameters: { type: "object", properties: {}, required: [] },
  },
  {
    name: "read_file",
    description: "Read the full contents of one project file before modifying it.",
    parameters: {
      type: "object",
      properties: { path: str("Project-relative path, e.g. src/systems/player.js") },
      required: ["path"],
    },
  },
  {
    name: "write_file",
    description:
      "Create or fully overwrite a file. Use for new systems/scenes/assets or a full rewrite of a small file.",
    parameters: {
      type: "object",
      properties: { path: str("Project-relative path"), content: str("Complete file contents") },
      required: ["path", "content"],
    },
  },
  {
    name: "patch_file",
    description:
      "Surgically replace an exact snippet inside an existing file. Preferred over write_file for edits to large files.",
    parameters: {
      type: "object",
      properties: {
        path: str("Project-relative path"),
        find: str("Exact existing snippet to replace (must appear exactly once)"),
        replace: str("Replacement snippet"),
      },
      required: ["path", "find", "replace"],
    },
  },
  {
    name: "delete_file",
    description: "Delete a file that is no longer part of the game.",
    parameters: { type: "object", properties: { path: str("Project-relative path") }, required: ["path"] },
  },
  {
    name: "create_scene",
    description:
      "Create or replace a scene module under src/scenes/. The scene must export a default class or factory with init(ctx), update(dt) and dispose().",
    parameters: {
      type: "object",
      properties: { name: str("Scene name, e.g. world"), content: str("Complete scene module source") },
      required: ["name", "content"],
    },
  },
  {
    name: "generate_asset",
    description:
      "Generate a procedural asset module under src/assets/ (canvas textures, geometry builders, audio buffers). Assets are code, never binary downloads.",
    parameters: {
      type: "object",
      properties: { name: str("Asset name, e.g. zombie-texture"), content: str("Complete asset module source") },
      required: ["name", "content"],
    },
  },
  {
    name: "set_design",
    description: "Record or update the game design decisions and system architecture in project memory.",
    parameters: {
      type: "object",
      properties: { name: str("Game title"), design: str("Architecture and design decisions, markdown") },
      required: ["design"],
    },
  },
  {
    name: "build_project",
    description: "Bundle the project and report build/resolution errors without running it.",
    parameters: { type: "object", properties: {}, required: [] },
  },
  {
    name: "run_project",
    description: "Build and actually run the game in the live preview, then report captured runtime errors.",
    parameters: { type: "object", properties: {}, required: [] },
  },
  {
    name: "inspect_errors",
    description: "Return the most recent build and runtime errors captured from the preview.",
    parameters: { type: "object", properties: {}, required: [] },
  },
  {
    name: "run_tests",
    description:
      "Run CryptoXI's static QA checks: entry point, module resolution, update loop, input handling, disposal, forbidden network calls.",
    parameters: { type: "object", properties: {}, required: [] },
  },
  {
    name: "snapshot",
    description: "Save a rollback point before a risky change.",
    parameters: { type: "object", properties: { label: str("Short label") }, required: ["label"] },
  },
  {
    name: "rollback",
    description: "Restore the most recent snapshot when a change made things worse.",
    parameters: { type: "object", properties: {}, required: [] },
  },
  {
    name: "finish",
    description:
      "Call only when the game builds, runs with no runtime errors and the request is fully implemented. Summarise what changed for the player.",
    parameters: {
      type: "object",
      properties: { summary: str("Player-facing summary of what was built or fixed") },
      required: ["summary"],
    },
  },
];

function fileList() {
  const files = project.list();
  if (!files.length) return "(empty project)";
  return files.map((p) => `${p} — ${(project.read(p) ?? "").split("\n").length} lines`).join("\n");
}

export function qaChecks(): string[] {
  const issues: string[] = [];
  const files = project.list();
  const entry = project.read(ENTRY);
  if (!entry) issues.push(`No entry point at ${ENTRY}.`);
  const all = files.map((p) => project.read(p) ?? "").join("\n");
  if (!/requestAnimationFrame/.test(all)) issues.push("No requestAnimationFrame loop found.");
  if (!/(addEventListener\(\s*["'](keydown|pointerdown|touchstart))/.test(all))
    issues.push("No keyboard or pointer input handling found.");
  if (/\bfetch\(|XMLHttpRequest/.test(all)) issues.push("Game code performs network requests — it must run offline.");
  if (/TODO|FIXME|not implemented/i.test(all)) issues.push("Code contains TODO/FIXME placeholders.");
  if (!/dt|delta/.test(all)) issues.push("Update loop may not be delta-time based.");
  const built = build(Object.fromEntries(files.map((p) => [p, project.read(p) ?? ""])));
  issues.push(...built.errors);
  return issues;
}

export async function executeTool(name: string, rawArgs: string, ctx: ToolContext): Promise<ToolResult> {
  let args: Record<string, string> = {};
  try {
    args = rawArgs ? (JSON.parse(rawArgs) as Record<string, string>) : {};
  } catch {
    return { ok: false, output: "Invalid JSON arguments. Re-issue the tool call with valid JSON." };
  }

  const snapshotFiles = () =>
    Object.fromEntries(project.list().map((p) => [p, project.read(p) ?? ""])) as Record<string, string>;

  switch (name) {
    case "list_files":
      return { ok: true, output: fileList() };

    case "read_file": {
      const content = project.read(args.path ?? "");
      if (content === null) return { ok: false, output: `No such file: ${args.path}. Files:\n${fileList()}` };
      return { ok: true, output: content };
    }

    case "write_file": {
      if (!args.path || typeof args.content !== "string")
        return { ok: false, output: "write_file needs path and content." };
      project.write(args.path, args.content);
      return { ok: true, output: `Wrote ${normalize(args.path)} (${args.content.split("\n").length} lines).` };
    }

    case "patch_file": {
      const path = normalize(args.path ?? "");
      const current = project.read(path);
      if (current === null) return { ok: false, output: `No such file: ${path}` };
      const occurrences = args.find ? current.split(args.find).length - 1 : 0;
      if (occurrences === 0)
        return { ok: false, output: `Snippet not found in ${path}. Read the file again and patch with exact text.` };
      if (occurrences > 1)
        return { ok: false, output: `Snippet appears ${occurrences} times in ${path}. Include more context.` };
      project.write(path, current.replace(args.find, args.replace ?? ""));
      return { ok: true, output: `Patched ${path}.` };
    }

    case "delete_file":
      return project.remove(args.path ?? "")
        ? { ok: true, output: `Deleted ${args.path}.` }
        : { ok: false, output: `No such file: ${args.path}` };

    case "create_scene": {
      const path = `src/scenes/${(args.name ?? "scene").replace(/[^a-z0-9-]/gi, "-").toLowerCase()}.js`;
      project.write(path, args.content ?? "");
      return { ok: true, output: `Scene written to ${path}.` };
    }

    case "generate_asset": {
      const path = `src/assets/${(args.name ?? "asset").replace(/[^a-z0-9-]/gi, "-").toLowerCase()}.js`;
      project.write(path, args.content ?? "");
      return { ok: true, output: `Asset module written to ${path}.` };
    }

    case "set_design": {
      project.setMeta({ design: args.design ?? "", ...(args.name ? { name: args.name } : {}) });
      return { ok: true, output: "Design decisions saved to project memory." };
    }

    case "build_project": {
      const result = build(snapshotFiles());
      project.setBuildErrors(result.errors);
      return result.ok
        ? { ok: true, output: "Build succeeded — no resolution errors." }
        : { ok: false, output: `Build failed:\n${result.errors.join("\n")}` };
    }

    case "run_project": {
      const result = build(snapshotFiles());
      project.setBuildErrors(result.errors);
      if (!result.ok) return { ok: false, output: `Build failed before running:\n${result.errors.join("\n")}` };
      const runtime = await ctx.runPreview(result.html);
      project.setRuntimeErrors(runtime);
      return {
        ok: runtime.length === 0,
        previewHtml: result.html,
        output: runtime.length
          ? `Game ran but reported errors:\n${runtime.join("\n")}`
          : "Game built and ran cleanly in the preview.",
      };
    }

    case "inspect_errors": {
      const s = project.get();
      const lines = [...s.buildErrors, ...s.runtimeErrors];
      return { ok: true, output: lines.length ? lines.join("\n") : "No build or runtime errors recorded." };
    }

    case "run_tests": {
      const issues = qaChecks();
      return issues.length
        ? { ok: false, output: `QA found ${issues.length} issue(s):\n${issues.join("\n")}` }
        : { ok: true, output: "All QA checks passed." };
    }

    case "snapshot": {
      const id = project.snapshot(args.label ?? "checkpoint");
      return { ok: true, output: `Snapshot ${id} saved.` };
    }

    case "rollback":
      return project.rollback()
        ? { ok: true, output: "Rolled back to the last snapshot." }
        : { ok: false, output: "No snapshot available." };

    case "finish":
      return { ok: true, output: args.summary ?? "Done." };

    default:
      return { ok: false, output: `Unknown tool "${name}". Use one of: ${TOOL_SCHEMAS.map((t) => t.name).join(", ")}` };
  }
}
