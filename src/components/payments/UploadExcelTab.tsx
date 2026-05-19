import { useRef, useState } from "react";
import { CheckCircle, Loader2, Upload, FileSpreadsheet, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useRole } from "@/lib/role-context";
import { toast } from "sonner";

const API_URL = (import.meta.env.VITE_API_URL as string | undefined) ?? "http://localhost:8000/api";

export function UploadExcelTab() {
  const { token } = useRole();
  const [file, setFile]       = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [result, setResult]   = useState<{ imported: number; errors: string[] } | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (!f) return;
    const valid = f.name.endsWith(".xlsx") || f.name.endsWith(".xls") || f.name.endsWith(".csv");
    if (!valid) {
      toast.error("Please upload an Excel (.xlsx, .xls) or CSV file.");
      return;
    }
    setFile(f);
    setResult(null);
  }

  function handleRemove() {
    setFile(null);
    setResult(null);
    if (inputRef.current) inputRef.current.value = "";
  }

  async function handleImport() {
    if (!file || !token) return;
    setUploading(true);
    try {
      const form = new FormData();
      form.append("file", file);

      const res = await fetch(`${API_URL}/payments/upload`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}`, Accept: "application/json" },
        body: form,
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        const msg = data?.message ?? (data?.errors ? Object.values(data.errors as Record<string, string[]>)[0]?.[0] : null) ?? "Upload failed.";
        toast.error(msg);
        return;
      }

      setResult(data);
      toast.success(`${data.imported} payment${data.imported !== 1 ? "s" : ""} imported successfully.`);
      handleRemove();
    } catch {
      toast.error("Network error. Please try again.");
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="space-y-5">
      <div className="rounded-2xl border bg-card p-10 shadow-sm">
        <div className="flex flex-col items-center gap-5 text-center">
          <div className="rounded-full bg-primary/10 p-5">
            <FileSpreadsheet className="h-10 w-10 text-primary" />
          </div>
          <div>
            <h3 className="font-display text-lg font-semibold">Upload Collection File</h3>
            <p className="mt-1 max-w-md text-sm text-muted-foreground">
              Upload the CSV file with collected payments to bulk-import them into the system.
            </p>
          </div>
          <input ref={inputRef} type="file" accept=".xlsx,.xls,.csv" className="hidden" onChange={handleFile} />
          <Button
            className="bg-primary text-primary-foreground hover:bg-primary-glow"
            onClick={() => inputRef.current?.click()}
            disabled={uploading}
          >
            <Upload className="mr-2 h-4 w-4" />Choose file
          </Button>
          {file && (
            <div className="w-full max-w-sm rounded-xl border border-success/30 bg-success/5 px-4 py-3 text-left">
              <p className="font-medium text-success">{file.name}</p>
              <p className="mt-0.5 text-xs text-muted-foreground">{(file.size / 1024).toFixed(1)} KB · ready to import</p>
            </div>
          )}
        </div>
      </div>

      {file && (
        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={handleRemove} disabled={uploading}>Remove file</Button>
          <Button
            className="bg-primary text-primary-foreground hover:bg-primary-glow"
            onClick={handleImport}
            disabled={uploading}
          >
            {uploading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Upload className="mr-2 h-4 w-4" />}
            {uploading ? "Importing…" : "Import collections"}
          </Button>
        </div>
      )}

      {/* Import result */}
      {result && (
        <div className="space-y-3">
          {result.imported > 0 && (
            <div className="flex items-center gap-3 rounded-xl border border-success/30 bg-success/5 px-4 py-3">
              <CheckCircle className="h-5 w-5 text-success shrink-0" />
              <p className="text-sm font-medium text-success">{result.imported} payment{result.imported !== 1 ? "s" : ""} imported successfully.</p>
            </div>
          )}
          {result.errors.length > 0 && (
            <div className="rounded-xl border border-destructive/30 bg-destructive/5 px-4 py-3">
              <div className="flex items-center gap-2 mb-2">
                <XCircle className="h-4 w-4 text-destructive shrink-0" />
                <p className="text-sm font-medium text-destructive">{result.errors.length} row{result.errors.length !== 1 ? "s" : ""} had errors:</p>
              </div>
              <ul className="space-y-1">
                {result.errors.map((e, i) => (
                  <li key={i} className="text-xs text-destructive">{e}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      <div className="rounded-2xl border bg-muted/40 p-5 text-sm">
        <p className="font-semibold text-foreground">Expected CSV format</p>
        <p className="mt-1 text-muted-foreground">
          Columns: <span className="font-mono font-medium text-foreground">loan_number, payment_date, amount, remarks (optional)</span>
        </p>
        <p className="mt-1 text-muted-foreground">
          Dates must be in <span className="font-medium text-foreground">YYYY-MM-DD</span> format. First row is treated as a header and skipped.
        </p>
      </div>
    </div>
  );
}
