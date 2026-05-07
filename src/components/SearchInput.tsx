import { Search, X } from "lucide-react";

export function SearchInput({ value, onChange, placeholder }: { value: string; onChange: (v: string) => void; placeholder?: string }) {
  return (
    <div className="relative">
      <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        inputMode="search"
        className="h-12 w-full rounded-2xl border border-border bg-card pl-10 pr-10 text-base outline-none focus:ring-2 focus:ring-primary/30"
      />
      {value && (
        <button type="button" aria-label="Clear" onClick={() => onChange("")}
          className="absolute right-2 top-1/2 grid h-8 w-8 -translate-y-1/2 place-items-center rounded-full text-muted-foreground hover:bg-secondary">
          <X className="h-4 w-4" />
        </button>
      )}
    </div>
  );
}
