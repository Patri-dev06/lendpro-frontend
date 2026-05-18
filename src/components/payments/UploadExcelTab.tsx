import { useRef, useState } from "react";
import { Upload, FileSpreadsheet } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

export function UploadExcelTab() {
  const [file, setFile] = useState<File | null>(null);
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
    toast.success(`"${f.name}" ready to import.`);
  }

  function handleRemove() {
    setFile(null);
    if (inputRef.current) inputRef.current.value = "";
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
              Upload the Excel file encoded by the accounting clerk to bulk-import the day's collections into the system.
            </p>
          </div>
          <input ref={inputRef} type="file" accept=".xlsx,.xls,.csv" className="hidden" onChange={handleFile} />
          <Button
            className="bg-primary text-primary-foreground hover:bg-primary-glow"
            onClick={() => inputRef.current?.click()}
          >
            <Upload className="mr-2 h-4 w-4" />Choose file
          </Button>
          {file && (
            <div className="w-full max-w-sm rounded-xl border border-success/30 bg-success/5 px-4 py-3 text-left">
              <p className="font-medium text-success">{file.name}</p>
              <p className="mt-0.5 text-xs text-muted-foreground">{(file.size / 1024).toFixed(1)} KB</p>
            </div>
          )}
        </div>
      </div>

      {file && (
        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={handleRemove}>Remove file</Button>
          <Button
            className="bg-primary text-primary-foreground hover:bg-primary-glow"
            onClick={() => toast.success("Collection data imported successfully!")}
          >
            <Upload className="mr-2 h-4 w-4" />Import collections
          </Button>
        </div>
      )}

      <div className="rounded-2xl border bg-muted/40 p-5 text-sm">
        <p className="font-semibold text-foreground">Expected file format</p>
        <p className="mt-1 text-muted-foreground">
          Use the Excel template provided by the accounting department. Accepted formats: <span className="font-medium text-foreground">.xlsx, .xls, .csv</span>
        </p>
      </div>
    </div>
  );
}
