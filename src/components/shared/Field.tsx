import { Label } from "@/components/ui/label";

interface FieldProps {
  label: string;
  full?: boolean;
  children: React.ReactNode;
}

export function Field({ label, full, children }: FieldProps) {
  return (
    <div className={`space-y-1.5 ${full ? "sm:col-span-2" : ""}`}>
      <Label className="text-xs">{label}</Label>
      {children}
    </div>
  );
}
