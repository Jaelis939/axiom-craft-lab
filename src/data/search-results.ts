export type SearchResult = {
  id: string;
  title: string;
  url: string;
  snippet: string;
  tags: string[];
};

/**
 * Local searchable index. Everything the results list shows comes from here,
 * so search works offline and deterministically.
 */
export const SEARCH_INDEX: SearchResult[] = [
  {
    id: "mdn-fetch",
    title: "Using the Fetch API",
    url: "https://developer.mozilla.org/en-US/docs/Web/API/Fetch_API/Using_Fetch",
    snippet:
      "The Fetch API provides a JavaScript interface for making HTTP requests and processing the responses, including streaming bodies.",
    tags: ["javascript", "http", "web", "api", "fetch"],
  },
  {
    id: "mdn-grid",
    title: "CSS Grid Layout — a complete guide",
    url: "https://developer.mozilla.org/en-US/docs/Web/CSS/CSS_grid_layout",
    snippet:
      "CSS Grid Layout is a two-dimensional layout system for the web, letting you lay content out in rows and columns at the same time.",
    tags: ["css", "layout", "grid", "web", "design"],
  },
  {
    id: "react-hooks",
    title: "React Hooks reference",
    url: "https://react.dev/reference/react/hooks",
    snippet:
      "Hooks let you use state and other React features without writing a class. Built-in hooks cover state, context, refs and effects.",
    tags: ["react", "hooks", "javascript", "frontend"],
  },
  {
    id: "ts-handbook",
    title: "TypeScript Handbook: Everyday Types",
    url: "https://www.typescriptlang.org/docs/handbook/2/everyday-types.html",
    snippet:
      "An overview of the most common kinds of types you will find in TypeScript code: primitives, arrays, unions, literals and interfaces.",
    tags: ["typescript", "types", "javascript", "language"],
  },
  {
    id: "tanstack-router",
    title: "TanStack Router — file-based routing",
    url: "https://tanstack.com/router/latest/docs/framework/react/routing/file-based-routing",
    snippet:
      "File-based routing generates a fully typed route tree from your routes directory, with loaders, search params and nested layouts.",
    tags: ["router", "react", "routing", "tanstack", "frontend"],
  },
  {
    id: "tailwind-theme",
    title: "Tailwind CSS theme variables",
    url: "https://tailwindcss.com/docs/theme",
    snippet:
      "Theme variables define your project's design tokens — colors, fonts, spacing and radii — and expose them as utility classes.",
    tags: ["tailwind", "css", "design", "tokens", "styling"],
  },
  {
    id: "postgres-index",
    title: "PostgreSQL: indexes and query planning",
    url: "https://www.postgresql.org/docs/current/indexes.html",
    snippet:
      "Indexes are a common way to enhance database performance. Learn when the planner uses them and which index type fits each query.",
    tags: ["postgres", "database", "sql", "performance", "backend"],
  },
  {
    id: "http-caching",
    title: "HTTP caching explained",
    url: "https://developer.mozilla.org/en-US/docs/Web/HTTP/Caching",
    snippet:
      "Cache-Control, ETag and revalidation determine how browsers and CDNs reuse responses instead of hitting the origin server again.",
    tags: ["http", "caching", "performance", "web", "network"],
  },
  {
    id: "a11y-aria",
    title: "ARIA authoring practices for widgets",
    url: "https://www.w3.org/WAI/ARIA/apg/patterns/",
    snippet:
      "Design patterns and reference implementations for accessible widgets: tabs, dialogs, comboboxes, menus and keyboard interaction.",
    tags: ["accessibility", "aria", "a11y", "html", "design"],
  },
  {
    id: "vite-config",
    title: "Vite configuration reference",
    url: "https://vite.dev/config/",
    snippet:
      "Configure the dev server, build output, plugins, aliases and environment variable handling for a Vite-powered application.",
    tags: ["vite", "build", "tooling", "frontend", "config"],
  },
  {
    id: "git-rebase",
    title: "Git rebase versus merge",
    url: "https://git-scm.com/book/en/v2/Git-Branching-Rebasing",
    snippet:
      "Rebasing replays commits onto a new base for a linear history, while merging preserves the original branch topology.",
    tags: ["git", "version control", "workflow", "tooling"],
  },
  {
    id: "docker-compose",
    title: "Docker Compose file reference",
    url: "https://docs.docker.com/compose/compose-file/",
    snippet:
      "Define multi-container applications declaratively: services, networks, volumes, healthchecks and environment configuration.",
    tags: ["docker", "devops", "containers", "infrastructure"],
  },
];

export function searchIndex(query: string): SearchResult[] {
  const q = query.trim().toLowerCase();
  if (!q) return [];
  const terms = q.split(/\s+/);

  return SEARCH_INDEX.map((result) => {
    const haystack = `${result.title} ${result.snippet} ${result.url} ${result.tags.join(" ")}`.toLowerCase();
    let score = 0;
    for (const term of terms) {
      if (result.title.toLowerCase().includes(term)) score += 3;
      if (result.tags.some((t) => t.includes(term))) score += 2;
      if (haystack.includes(term)) score += 1;
    }
    return { result, score };
  })
    .filter((entry) => entry.score > 0)
    .sort((a, b) => b.score - a.score)
    .map((entry) => entry.result);
}
