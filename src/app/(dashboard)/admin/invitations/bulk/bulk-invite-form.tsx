"use client";

import { useState, useRef, useTransition } from "react";
import Papa from "papaparse";
import { toast } from "sonner";
import { Upload, Download, CheckCircle2, XCircle, Loader2, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { bulkInviteRowSchema } from "@/schemas/invitation.schema";

interface ParsedRow {
  rowIndex: number;
  email: string;
  role: string;
  valid: boolean;
  error?: string;
}

interface BulkResult {
  processed: number;
  errors: Array<{ row: number; email: string; error: string }>;
}

export function BulkInviteForm() {
  const fileRef = useRef<HTMLInputElement>(null);
  const [rows, setRows] = useState<ParsedRow[]>([]);
  const [result, setResult] = useState<BulkResult | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setResult(null);

    Papa.parse<{ email: string; role: string }>(file, {
      header: true,
      skipEmptyLines: true,
      complete: (parsed) => {
        const mapped: ParsedRow[] = parsed.data.slice(0, 200).map((row, i) => {
          const validation = bulkInviteRowSchema.safeParse({
            email: row.email?.trim(),
            role: row.role?.trim().toUpperCase(),
          });
          if (!validation.success) {
            return {
              rowIndex: i + 2,
              email: row.email ?? "(missing)",
              role: row.role ?? "(missing)",
              valid: false,
              error: validation.error.errors[0]?.message ?? "Invalid row",
            };
          }
          return {
            rowIndex: i + 2,
            email: validation.data.email,
            role: validation.data.role,
            valid: true,
          };
        });
        setRows(mapped);
      },
      error: () => toast.error("Failed to parse CSV file"),
    });
  }

  function handleSend() {
    const validRows = rows.filter((r) => r.valid);
    if (validRows.length === 0) {
      toast.error("No valid rows to send");
      return;
    }

    startTransition(async () => {
      const response = await fetch("/api/v1/invitations/bulk", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rows: validRows.map((r) => ({ email: r.email, role: r.role })) }),
      });
      const data: BulkResult = await response.json();
      setResult(data);
      if (data.processed > 0) {
        toast.success(`${data.processed} invitation${data.processed !== 1 ? "s" : ""} sent`);
      }
      if (data.errors.length > 0) {
        toast.error(`${data.errors.length} row${data.errors.length !== 1 ? "s" : ""} failed`);
      }
    });
  }

  const validCount = rows.filter((r) => r.valid).length;
  const errorCount = rows.filter((r) => !r.valid).length;

  return (
    <div className="space-y-4">
      {/* Template download */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">CSV Format</CardTitle>
          <CardDescription>
            Required columns: <code className="text-xs bg-surface-1 px-1.5 py-0.5 rounded">email</code>,{" "}
            <code className="text-xs bg-surface-1 px-1.5 py-0.5 rounded">role</code>{" "}
            (STUDENT or INSTRUCTOR). Maximum 200 rows.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <a
            href="data:text/csv;charset=utf-8,email%2Crole%0Ajane%40example.com%2CSTUDENT%0Ajohn%40example.com%2CINSTRUCTOR"
            download="aklas-invite-template.csv"
            className="inline-flex items-center gap-2 text-sm text-primary hover:underline"
          >
            <Download className="h-4 w-4" />
            Download template
          </a>
        </CardContent>
      </Card>

      {/* Upload */}
      <Card>
        <CardContent className="pt-6">
          <div
            className="flex flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed border-border bg-surface-1 px-6 py-10 cursor-pointer hover:border-primary/50 transition-colors"
            onClick={() => fileRef.current?.click()}
          >
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
              <Upload className="h-5 w-5 text-primary" />
            </div>
            <div className="text-center">
              <p className="text-sm font-medium">Click to upload CSV</p>
              <p className="text-xs text-muted-foreground mt-1">or drag and drop</p>
            </div>
          </div>
          <input
            ref={fileRef}
            type="file"
            accept=".csv"
            className="hidden"
            onChange={handleFileChange}
          />
        </CardContent>
      </Card>

      {/* Preview */}
      {rows.length > 0 && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">Preview ({rows.length} rows)</CardTitle>
              <div className="flex gap-2">
                {validCount > 0 && (
                  <Badge variant="outline" className="bg-success/10 text-success border-success/20 gap-1">
                    <CheckCircle2 className="h-3 w-3" />
                    {validCount} valid
                  </Badge>
                )}
                {errorCount > 0 && (
                  <Badge variant="outline" className="bg-destructive/10 text-destructive border-destructive/20 gap-1">
                    <XCircle className="h-3 w-3" />
                    {errorCount} error{errorCount !== 1 ? "s" : ""}
                  </Badge>
                )}
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="rounded-lg border border-border overflow-hidden max-h-72 overflow-y-auto">
              <table className="w-full text-sm">
                <thead className="sticky top-0 bg-surface-1 border-b border-border">
                  <tr>
                    <th className="px-3 py-2 text-left text-xs font-medium text-muted-foreground">Row</th>
                    <th className="px-3 py-2 text-left text-xs font-medium text-muted-foreground">Email</th>
                    <th className="px-3 py-2 text-left text-xs font-medium text-muted-foreground">Role</th>
                    <th className="px-3 py-2 text-left text-xs font-medium text-muted-foreground">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((row) => (
                    <tr
                      key={row.rowIndex}
                      className={`border-b border-border last:border-0 ${
                        !row.valid ? "bg-destructive/5" : ""
                      }`}
                    >
                      <td className="px-3 py-2 text-muted-foreground text-xs">{row.rowIndex}</td>
                      <td className="px-3 py-2 font-medium">{row.email}</td>
                      <td className="px-3 py-2 text-muted-foreground">{row.role}</td>
                      <td className="px-3 py-2">
                        {row.valid ? (
                          <CheckCircle2 className="h-4 w-4 text-success" />
                        ) : (
                          <span className="flex items-center gap-1 text-xs text-destructive">
                            <XCircle className="h-3.5 w-3.5" />
                            {row.error}
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {errorCount > 0 && (
              <Alert variant="warning" className="mt-3">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription className="text-sm">
                  {errorCount} invalid row{errorCount !== 1 ? "s" : ""} will be skipped.
                  Only {validCount} valid row{validCount !== 1 ? "s" : ""} will be sent.
                </AlertDescription>
              </Alert>
            )}

            <Button
              onClick={handleSend}
              disabled={isPending || validCount === 0}
              className="mt-4 gradient-primary shadow-primary"
            >
              {isPending ? (
                <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Sending…</>
              ) : (
                <>Send {validCount} invitation{validCount !== 1 ? "s" : ""}</>
              )}
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Results */}
      {result && (
        <Alert variant={result.errors.length === 0 ? "success" : "warning"}>
          <CheckCircle2 className="h-4 w-4" />
          <AlertDescription>
            <strong>{result.processed}</strong> invitation{result.processed !== 1 ? "s" : ""} sent successfully.
            {result.errors.length > 0 && (
              <> <strong>{result.errors.length}</strong> failed — check the rows above.</>
            )}
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
}
