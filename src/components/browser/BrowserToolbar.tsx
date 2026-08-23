import { ArrowLeft, ArrowRight, RotateCw, Home, Search, X } from "lucide-react";
import type { FormEvent } from "react";

type BrowserToolbarProps = {
  value: string;
  onValueChange: (value: string) => void;
  onSubmit: () => void;
  onBack: () => void;
  onForward: () => void;
  onReload: () => void;
  onHome: () => void;
  canGoBack: boolean;
  canGoForward: boolean;
  isLoading: boolean;
};

export function BrowserToolbar({
  value,
  onValueChange,
  onSubmit,
  onBack,
  onForward,
  onReload,
  onHome,
  canGoBack,
  canGoForward,
  isLoading,
}: BrowserToolbarProps) {
  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    onSubmit();
  }

  return (
    <div className="flex items-center gap-2 border-b border-chrome-border bg-chrome-elevated/60 px-3 py-2.5 backdrop-blur">
      <nav aria-label="Browser navigation" className="flex items-center gap-1">
        <NavButton label="Back" onClick={onBack} disabled={!canGoBack}>
          <ArrowLeft className="size-4" />
        </NavButton>
        <NavButton label="Forward" onClick={onForward} disabled={!canGoForward}>
          <ArrowRight className="size-4" />
        </NavButton>
        <NavButton label="Reload" onClick={onReload}>
          <RotateCw className={`size-4 ${isLoading ? "animate-spin" : ""}`} />
        </NavButton>
        <NavButton label="Home" onClick={onHome}>
          <Home className="size-4" />
        </NavButton>
      </nav>

      <form onSubmit={handleSubmit} className="group relative flex-1" role="search">
        <Search className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-chrome-muted" />
        <input
          type="text"
          value={value}
          onChange={(event) => onValueChange(event.target.value)}
          placeholder="Search the index or type a URL"
          aria-label="Search or enter address"
          className="h-10 w-full rounded-full border border-chrome-border bg-chrome px-11 text-sm text-chrome-foreground outline-none transition placeholder:text-chrome-muted focus:border-chrome-accent focus:shadow-glow"
        />
        {value ? (
          <button
            type="button"
            aria-label="Clear search"
            onClick={() => onValueChange("")}
            className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full p-1 text-chrome-muted transition hover:bg-chrome-elevated hover:text-chrome-foreground"
          >
            <X className="size-4" />
          </button>
        ) : null}
      </form>
    </div>
  );
}

function NavButton({
  label,
  onClick,
  disabled,
  children,
}: {
  label: string;
  onClick: () => void;
  disabled?: boolean;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      onClick={onClick}
      disabled={disabled}
      className="rounded-full p-2 text-chrome-foreground transition hover:bg-chrome-elevated disabled:cursor-not-allowed disabled:opacity-35"
    >
      {children}
    </button>
  );
}
