/**
 * In-browser build step for the virtual game project.
 *
 * Every .js/.mjs file is treated as an ES module. Relative imports are
 * resolved against the VFS and rewritten to placeholders that the iframe
 * bootstrap swaps for Blob URLs in dependency order. Bare specifiers
 * (e.g. "three") resolve through an import map to a pinned ESM CDN.
 */

import { normalize } from "./project";

export const IMPORT_MAP: Record<string, string> = {
  three: "https://esm.sh/three@0.169.0",
  "three/": "https://esm.sh/three@0.169.0/",
  "three/examples/jsm/": "https://esm.sh/three@0.169.0/examples/jsm/",
  "cannon-es": "https://esm.sh/cannon-es@0.20.0",
};

export const ENTRY = "src/main.js";

export type BuildResult = {
  ok: boolean;
  errors: string[];
  html: string;
};

const IMPORT_RE = /(\bfrom\s*|\bimport\s*|\bexport\s+\*\s+from\s*)(["'])([^"']+)\2/g;
const DYNAMIC_RE = /\bimport\(\s*(["'])([^"']+)\1\s*\)/g;

function resolveRelative(fromPath: string, spec: string): string {
  const base = fromPath.split("/").slice(0, -1);
  const parts = spec.split("/");
  for (const part of parts) {
    if (part === "." || part === "") continue;
    if (part === "..") base.pop();
    else base.push(part);
  }
  return base.join("/");
}

function candidates(path: string) {
  return [path, `${path}.js`, `${path}/index.js`];
}

export function build(files: Record<string, string>): BuildResult {
  const errors: string[] = [];
  const source: Record<string, string> = {};
  for (const [path, content] of Object.entries(files)) source[normalize(path)] = content;

  if (!source[ENTRY]) {
    errors.push(`Missing entry point ${ENTRY}. Create it and re-run the build.`);
  }

  const modules: Record<string, string> = {};
  const deps: Record<string, string[]> = {};

  for (const [path, content] of Object.entries(source)) {
    if (!/\.(js|mjs)$/.test(path)) continue;
    const local: string[] = [];

    const rewrite = (spec: string): string => {
      if (!spec.startsWith(".")) return spec;
      const resolved = resolveRelative(path, spec);
      const hit = candidates(resolved).find((c) => source[c]);
      if (!hit) {
        errors.push(`${path}: cannot resolve import "${spec}"`);
        return spec;
      }
      local.push(hit);
      return `__CRYPTOXI_MODULE__${hit}__`;
    };

    let out = content.replace(IMPORT_RE, (_m, head: string, q: string, spec: string) => {
      return `${head}${q}${rewrite(spec)}${q}`;
    });
    out = out.replace(DYNAMIC_RE, (_m, q: string, spec: string) => `import(${q}${rewrite(spec)}${q})`);

    modules[path] = out;
    deps[path] = local;
  }

  // Topological order so a module's dependencies have Blob URLs first.
  const order: string[] = [];
  const seen = new Set<string>();
  const stack = new Set<string>();
  const visit = (path: string) => {
    if (seen.has(path)) return;
    if (stack.has(path)) return; // cycle — ES modules tolerate it via late binding
    stack.add(path);
    for (const dep of deps[path] ?? []) visit(dep);
    stack.delete(path);
    seen.add(path);
    order.push(path);
  };
  for (const path of Object.keys(modules)) visit(path);

  const css = Object.entries(source)
    .filter(([p]) => p.endsWith(".css"))
    .map(([, c]) => c)
    .join("\n");

  const html = shell({ modules, order, css, importMap: IMPORT_MAP });
  return { ok: errors.length === 0, errors, html };
}

function shell(args: {
  modules: Record<string, string>;
  order: string[];
  css: string;
  importMap: Record<string, string>;
}) {
  const payload = JSON.stringify({ modules: args.modules, order: args.order, entry: ENTRY });
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1, user-scalable=no" />
<title>CryptoXI build</title>
<script type="importmap">${JSON.stringify({ imports: args.importMap })}</script>
<style>
  html,body{margin:0;height:100%;background:#07070c;color:#e8e8f0;font-family:system-ui,sans-serif;overflow:hidden}
  canvas{display:block}
  #cryptoxi-crash{position:fixed;inset:0;display:none;padding:24px;background:#12060c;color:#ffb4c8;font:13px/1.5 ui-monospace,monospace;white-space:pre-wrap;overflow:auto;z-index:99999}
${args.css}
</style>
</head>
<body>
<div id="app"></div>
<div id="cryptoxi-crash"></div>
<script>
(function () {
  var post = function (level, message, stack) {
    try { parent.postMessage({ source: "cryptoxi-runtime", level: level, message: String(message), stack: stack || "" }, "*"); } catch (e) {}
  };
  var crash = document.getElementById("cryptoxi-crash");
  var show = function (text) { crash.style.display = "block"; crash.textContent += text + "\\n"; };
  window.addEventListener("error", function (e) {
    post("error", e.message + " (" + (e.filename || "") + ":" + e.lineno + ")", e.error && e.error.stack);
    show("Error: " + e.message);
  });
  window.addEventListener("unhandledrejection", function (e) {
    var r = e.reason;
    post("error", "Unhandled rejection: " + (r && r.message ? r.message : r), r && r.stack);
    show("Unhandled rejection: " + (r && r.message ? r.message : r));
  });
  var nativeError = console.error.bind(console);
  console.error = function () {
    post("error", Array.prototype.map.call(arguments, String).join(" "));
    nativeError.apply(null, arguments);
  };
  var nativeWarn = console.warn.bind(console);
  console.warn = function () {
    post("warn", Array.prototype.map.call(arguments, String).join(" "));
    nativeWarn.apply(null, arguments);
  };
  var nativeLog = console.log.bind(console);
  console.log = function () {
    post("log", Array.prototype.map.call(arguments, String).join(" "));
    nativeLog.apply(null, arguments);
  };

  var bundle = ${payload};
  var urls = {};
  try {
    bundle.order.forEach(function (path) {
      var code = bundle.modules[path];
      code = code.replace(/__CRYPTOXI_MODULE__(.+?)__/g, function (m, dep) {
        return urls[dep] || m;
      });
      urls[path] = URL.createObjectURL(new Blob([code], { type: "text/javascript" }));
    });
  } catch (e) {
    post("error", "Bundle link failed: " + e.message, e.stack);
    show("Bundle link failed: " + e.message);
  }

  var entry = urls[bundle.entry];
  if (!entry) {
    post("error", "Entry module " + bundle.entry + " was not built.");
    show("Missing entry " + bundle.entry);
  } else {
    import(entry)
      .then(function () { post("ready", "Game booted"); })
      .catch(function (e) {
        post("error", "Boot failed: " + (e && e.message ? e.message : e), e && e.stack);
        show("Boot failed: " + (e && e.message ? e.message : e));
      });
  }
})();
</script>
</body>
</html>`;
}
