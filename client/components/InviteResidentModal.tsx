'use client';

import { useRef, useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { residentsApi } from '@/lib/api';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { CheckCircle, Copy, Upload, AlertCircle, Loader2 } from 'lucide-react';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  projectId: number;
  propertyId: number;
}

type Tab = 'single' | 'bulk';

interface BulkRow {
  email: string;
  unitNumber: string;
}

interface BulkResult {
  succeeded: { email: string; unitNumber?: string }[];
  failed: { email: string; reason: string }[];
  message: string;
}

// ── CSV parser (handles quoted fields) ───────────────────────────────────────
function parseCSV(text: string): BulkRow[] {
  const lines = text.trim().split(/\r?\n/).filter(Boolean);
  if (lines.length === 0) return [];

  // Detect header row
  const firstLine = lines[0].toLowerCase();
  const hasHeader = firstLine.includes('email');
  const dataLines = hasHeader ? lines.slice(1) : lines;

  return dataLines.map((line) => {
    const cols = line.split(',').map((c) => c.trim().replace(/^"|"$/g, ''));
    return { email: cols[0] || '', unitNumber: cols[1] || '' };
  }).filter((r) => r.email);
}

// ── Excel parser via xlsx ─────────────────────────────────────────────────────
async function parseExcel(file: File): Promise<BulkRow[]> {
  const XLSX = await import('xlsx');
  const buffer = await file.arrayBuffer();
  const wb = XLSX.read(buffer, { type: 'array' });
  const ws = wb.Sheets[wb.SheetNames[0]];
  const rows: any[] = XLSX.utils.sheet_to_json(ws, { defval: '' });
  return rows.map((r) => ({
    email: String(r.email || r.Email || r.EMAIL || '').trim(),
    unitNumber: String(r.unitNumber || r.unit || r.Unit || r['Unit Number'] || '').trim(),
  })).filter((r) => r.email);
}

export function InviteResidentModal({ open, onOpenChange, projectId, propertyId }: Props) {
  // ── Single invite state ─────────────────────────────────────────────────────
  const [tab, setTab] = useState<Tab>('single');
  const [form, setForm] = useState({ email: '', unitNumber: '' });
  const [inviteUrl, setInviteUrl] = useState('');
  const [copied, setCopied] = useState(false);

  // ── Bulk invite state ───────────────────────────────────────────────────────
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [bulkRows, setBulkRows] = useState<BulkRow[]>([]);
  const [parseError, setParseError] = useState('');
  const [bulkResult, setBulkResult] = useState<BulkResult | null>(null);

  // ── Mutations ───────────────────────────────────────────────────────────────
  const inviteMutation = useMutation({
    mutationFn: () => residentsApi.invite({ ...form, projectId, propertyId }),
    onSuccess: (res) => setInviteUrl(res.data.inviteUrl),
  });

  const bulkMutation = useMutation({
    mutationFn: () =>
      residentsApi.bulkInvite({ residents: bulkRows, projectId, propertyId }),
    onSuccess: (res) => setBulkResult(res.data),
  });

  // ── Handlers ────────────────────────────────────────────────────────────────
  const handleCopy = () => {
    navigator.clipboard.writeText(inviteUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleClose = () => {
    setForm({ email: '', unitNumber: '' });
    setInviteUrl('');
    setCopied(false);
    setBulkRows([]);
    setParseError('');
    setBulkResult(null);
    setTab('single');
    onOpenChange(false);
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setParseError('');
    setBulkRows([]);
    setBulkResult(null);

    try {
      let rows: BulkRow[] = [];
      if (file.name.endsWith('.csv') || file.type === 'text/csv') {
        const text = await file.text();
        rows = parseCSV(text);
      } else if (
        file.name.endsWith('.xlsx') ||
        file.name.endsWith('.xls') ||
        file.type.includes('spreadsheet')
      ) {
        rows = await parseExcel(file);
      } else {
        setParseError('Unsupported file type. Please upload a .csv or .xlsx file.');
        return;
      }

      if (rows.length === 0) {
        setParseError('No valid rows found. Make sure the file has an "email" column.');
        return;
      }
      setBulkRows(rows);
    } catch {
      setParseError('Could not read the file. Please check the format and try again.');
    }

    // Reset the input so the same file can be re-selected
    e.target.value = '';
  };

  // ── Render ──────────────────────────────────────────────────────────────────
  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="w-full max-w-lg mx-4 sm:mx-auto">
        <DialogHeader>
          <DialogTitle>Invite Resident</DialogTitle>
        </DialogHeader>

        {/* Tab switcher */}
        <div className="flex border-b mb-2">
          <button
            className={`flex-1 py-2.5 text-sm font-medium border-b-2 transition-colors ${
              tab === 'single'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
            onClick={() => setTab('single')}
          >
            Single Invite
          </button>
          <button
            className={`flex-1 py-2.5 text-sm font-medium border-b-2 transition-colors ${
              tab === 'bulk'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
            onClick={() => setTab('bulk')}
          >
            Bulk Upload
          </button>
        </div>

        {/* ── Single invite ─────────────────────────────────────────────────── */}
        {tab === 'single' && (
          <>
            {!inviteUrl ? (
              <div className="space-y-4 py-2">
                <div className="space-y-1.5">
                  <Label htmlFor="email">Resident email</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="resident@email.com"
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="unit">
                    Unit number <span className="text-muted-foreground">(optional)</span>
                  </Label>
                  <Input
                    id="unit"
                    placeholder="e.g. 4B, 12, 3A"
                    value={form.unitNumber}
                    onChange={(e) => setForm({ ...form, unitNumber: e.target.value })}
                  />
                </div>
                <p className="text-xs text-muted-foreground">
                  An invite email will be sent. You'll also get a link to share manually in case
                  the email doesn't arrive.
                </p>
              </div>
            ) : (
              <div className="py-4 space-y-4">
                <div className="flex items-center gap-2 text-green-700">
                  <CheckCircle className="h-5 w-5" />
                  <p className="font-medium">Invite sent to {form.email}</p>
                </div>
                <div className="space-y-1.5">
                  <Label>Backup invite link</Label>
                  <div className="flex gap-2">
                    <Input value={inviteUrl} readOnly className="text-xs bg-gray-50" />
                    <Button size="icon" variant="outline" onClick={handleCopy}>
                      {copied
                        ? <CheckCircle className="h-4 w-4 text-green-600" />
                        : <Copy className="h-4 w-4" />}
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Share this link if the email doesn't arrive. Expires in 7 days.
                  </p>
                </div>
              </div>
            )}

            <DialogFooter>
              {!inviteUrl ? (
                <>
                  <Button variant="outline" onClick={handleClose}>Cancel</Button>
                  <Button
                    onClick={() => inviteMutation.mutate()}
                    disabled={!form.email || inviteMutation.isPending}
                  >
                    {inviteMutation.isPending ? 'Sending…' : 'Send Invite'}
                  </Button>
                </>
              ) : (
                <Button onClick={handleClose}>Done</Button>
              )}
            </DialogFooter>
          </>
        )}

        {/* ── Bulk invite ───────────────────────────────────────────────────── */}
        {tab === 'bulk' && (
          <>
            {/* Result screen */}
            {bulkResult ? (
              <div className="py-2 space-y-4">
                <div className="flex items-center gap-2 text-green-700">
                  <CheckCircle className="h-5 w-5" />
                  <p className="font-medium">{bulkResult.message}</p>
                </div>

                {bulkResult.succeeded.length > 0 && (
                  <div>
                    <p className="text-sm font-medium text-gray-700 mb-1">
                      Sent ({bulkResult.succeeded.length})
                    </p>
                    <div className="max-h-32 overflow-y-auto rounded border text-xs divide-y">
                      {bulkResult.succeeded.map((r) => (
                        <div key={r.email} className="px-3 py-1.5 flex items-center justify-between gap-2 min-w-0">
                          <span className="truncate min-w-0">{r.email}</span>
                          {r.unitNumber && (
                            <span className="text-gray-400 shrink-0">Unit {r.unitNumber}</span>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {bulkResult.failed.length > 0 && (
                  <div>
                    <p className="text-sm font-medium text-red-600 mb-1">
                      Skipped ({bulkResult.failed.length})
                    </p>
                    <div className="max-h-32 overflow-y-auto rounded border text-xs divide-y">
                      {bulkResult.failed.map((r) => (
                        <div key={r.email} className="px-3 py-1.5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-0.5 min-w-0">
                          <span className="truncate min-w-0 text-gray-700">{r.email}</span>
                          <span className="text-red-500 shrink-0">{r.reason}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="py-2 space-y-4">
                {/* Upload area */}
                <div
                  className="border-2 border-dashed border-gray-300 rounded-lg p-4 sm:p-6 text-center cursor-pointer hover:border-blue-400 hover:bg-blue-50 transition-colors"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <Upload className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                  <p className="text-sm font-medium text-gray-700">
                    Click to upload a CSV or Excel file
                  </p>
                  <p className="text-xs text-gray-400 mt-1">
                    Columns: <code>email</code>, <code>unitNumber</code> (optional)
                  </p>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".csv,.xlsx,.xls"
                    className="hidden"
                    onChange={handleFileChange}
                  />
                </div>

                {/* Template hint */}
                <p className="text-xs text-muted-foreground">
                  Expected format — first row can be a header or data:
                  <br />
                  <code className="bg-gray-100 px-1 rounded">
                    email,unitNumber
                    <br />
                    jane@example.com,4B
                  </code>
                </p>

                {parseError && (
                  <div className="flex items-start gap-2 text-red-600 text-sm">
                    <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
                    <span>{parseError}</span>
                  </div>
                )}

                {/* Preview table */}
                {bulkRows.length > 0 && (
                  <div>
                    <p className="text-sm font-medium text-gray-700 mb-1">
                      Preview — {bulkRows.length} resident{bulkRows.length !== 1 ? 's' : ''} found
                    </p>
                    <div className="max-h-48 overflow-y-auto rounded border text-xs">
                      <table className="w-full">
                        <thead className="bg-gray-50 sticky top-0">
                          <tr>
                            <th className="px-3 py-2 text-left font-medium text-gray-600">Email</th>
                            <th className="px-3 py-2 text-left font-medium text-gray-600">Unit</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y">
                          {bulkRows.map((r, i) => (
                            <tr key={i}>
                              <td className="px-3 py-1.5 max-w-0 truncate">{r.email}</td>
                              <td className="px-3 py-1.5 text-gray-400 shrink-0 w-20">{r.unitNumber || '—'}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>
            )}

            <DialogFooter>
              {bulkResult ? (
                <Button onClick={handleClose}>Done</Button>
              ) : (
                <>
                  <Button variant="outline" onClick={handleClose}>Cancel</Button>
                  {bulkRows.length > 0 && (
                    <Button
                      onClick={() => bulkMutation.mutate()}
                      disabled={bulkMutation.isPending}
                    >
                      {bulkMutation.isPending ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Sending…
                        </>
                      ) : (
                        `Send ${bulkRows.length} Invite${bulkRows.length !== 1 ? 's' : ''}`
                      )}
                    </Button>
                  )}
                </>
              )}
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
