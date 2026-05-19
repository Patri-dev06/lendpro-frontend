import { useRef } from "react";
import { Calendar } from "lucide-react";
import { cn } from "@/lib/utils";

interface Props extends React.InputHTMLAttributes<HTMLInputElement> {
  error?: boolean;
}

export function DateInput({ className, error, ...props }: Props) {
  const ref = useRef<HTMLInputElement>(null);

  function openPicker() {
    if (!ref.current) return;
    try {
      (ref.current as HTMLInputElement & { showPicker?: () => void }).showPicker?.();
    } catch {
      ref.current.focus();
    }
  }

  return (
    <div className="flex items-center gap-1.5">
      <input
        ref={ref}
        type="date"
        className={cn(
          "hide-date-icon flex h-9 flex-1 rounded-md border border-input bg-background px-3 py-2 text-sm",
          "ring-offset-background placeholder:text-muted-foreground",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
          "disabled:cursor-not-allowed disabled:opacity-50",
          error && "border-destructive",
          className,
        )}
        {...props}
      />
      <button
        type="button"
        tabIndex={-1}
        onClick={openPicker}
        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md border border-input bg-background text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
      >
        <Calendar className="h-4 w-4" />
      </button>
    </div>
  );
}
