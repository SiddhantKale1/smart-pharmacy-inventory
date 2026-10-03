import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Mail, RefreshCw, FileText, CheckCircle2, ArrowRight, FileCheck2 } from 'lucide-react';
import { api } from '../services/api';
import Badge from '../components/Badge';

export default function EmailImport() {
  const [imports, setImports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [fetching, setFetching] = useState(false);
  const [fetchResult, setFetchResult] = useState(null);

  const loadImports = async () => {
    try {
      setLoading(true);
      const data = await api.getEmailImports();
      setImports(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadImports();
  }, []);

  const handleFetchEmails = async () => {
    try {
      setFetching(true);
      setFetchResult(null);
      const res = await api.triggerEmailImport();
      setFetchResult(res);
      loadImports();
    } catch (err) {
      setFetchResult({ success: false, message: err.message });
    } finally {
      setFetching(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-black text-black uppercase tracking-tight">Supplier Email Ingestion</h2>
          <p className="text-xs font-bold text-black/70 mt-0.5">Automated IMAP inbox monitoring for supplier invoice notifications and delivery notes.</p>
        </div>
        <div className="flex items-center gap-2">
          <Link
            to="/invoices"
            className="flex items-center gap-1.5 px-3.5 py-2 border-2 border-black bg-white hover:bg-[#fef08a] text-black text-xs font-black uppercase rounded-xl shadow-[2px_2px_0px_0px_#000] hover:translate-x-0.5 hover:translate-y-0.5 transition"
          >
            <FileCheck2 className="h-4 w-4 stroke-[2.5]" />
            Verification Queue
          </Link>
          <button
            onClick={handleFetchEmails}
            disabled={fetching}
            className="flex items-center gap-1.5 px-4 py-2 bg-[#86efac] text-black text-xs font-black uppercase rounded-xl border-2 border-black shadow-[3px_3px_0px_0px_#000] hover:translate-x-0.5 hover:translate-y-0.5 transition disabled:opacity-50"
          >
            <RefreshCw className={`h-4 w-4 stroke-[2.5] ${fetching ? 'animate-spin' : ''}`} />
            {fetching ? "Scanning Inbox..." : "Fetch Supplier Emails"}
          </button>
        </div>
      </div>

      {/* Info Card / Configuration Summary */}
      <div className="bg-[#fef08a] p-5 rounded-2xl border-2 border-black shadow-[4px_4px_0px_0px_#000] flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-start gap-3">
          <div className="p-3 rounded-xl bg-black text-white border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,0.5)]">
            <Mail className="h-6 w-6 stroke-[2.5]" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-black text-black text-sm uppercase">IMAP Supplier Listener</h3>
              <Badge status="ACTIVE" text="Configured in .env" size="sm" />
            </div>
            <p className="text-xs font-bold text-black/80 mt-1 max-w-xl">
              Listens for emails containing "Invoice", extracts delivery attachments or plain-text items, and stages records into the <b>Pharmacist Review Queue</b>. Never auto-commits without verification.
            </p>
          </div>
        </div>

        <Link
          to="/invoices"
          className="self-start md:self-center flex items-center gap-1.5 text-xs font-black uppercase bg-white px-3.5 py-2 rounded-xl border-2 border-black shadow-[2px_2px_0px_0px_#000] hover:translate-x-0.5 hover:translate-y-0.5 transition"
        >
          Review Staged Invoices <ArrowRight className="h-4 w-4 stroke-[2.5]" />
        </Link>
      </div>

      {fetchResult && (
        <div className={`p-4 rounded-xl text-xs font-mono font-bold border-2 border-black shadow-[3px_3px_0px_0px_#000] ${
          fetchResult.success ? "bg-[#86efac] text-black" : "bg-[#fca5a5] text-black"
        }`}>
          <b>{fetchResult.message}</b>
          {fetchResult.staged_invoices?.length > 0 && (
            <div className="mt-1">Invoices staged: {fetchResult.staged_invoices.join(', ')}</div>
          )}
        </div>
      )}

      {/* Received Emails List */}
      <div className="bg-white rounded-2xl border-2 border-black shadow-[4px_4px_0px_0px_#000] overflow-hidden">
        <div className="p-4 border-b-2 border-black bg-[#fed7aa] flex items-center justify-between">
          <h3 className="font-black text-black text-xs uppercase">Ingested Email Stream</h3>
          <span className="text-xs text-black font-mono font-bold">{imports.length} Messages Received</span>
        </div>

        <div className="divide-y-2 divide-black/10">
          {loading && imports.length === 0 ? (
            <div className="py-12 text-center text-black font-black text-xs">
              <RefreshCw className="h-5 w-5 animate-spin mx-auto mb-2" />
              Scanning for supplier emails...
            </div>
          ) : imports.length === 0 ? (
            <div className="py-12 text-center text-black font-bold text-xs">
              No supplier emails ingested yet. Click "Fetch Supplier Emails" to test.
            </div>
          ) : (
            imports.map((imp) => (
              <div key={imp.id} className="p-4 hover:bg-[#fffdf5] transition flex items-start justify-between gap-4">
                <div className="flex items-start gap-3 min-w-0">
                  <div className="p-2 rounded-lg bg-[#fef08a] border-2 border-black text-black mt-0.5 shadow-[1px_1px_0px_0px_#000]">
                    <FileText className="h-4 w-4 stroke-[2.5]" />
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-black text-black text-xs truncate">{imp.subject}</span>
                      <Badge status={imp.status} size="sm" />
                    </div>
                    <p className="text-[11px] text-black/70 mt-0.5 font-mono font-bold">From: {imp.sender}</p>
                    {imp.raw_reference && (
                      <p className="text-[11px] text-black mt-2 bg-slate-50 p-2 rounded-lg border-2 border-black font-mono line-clamp-2 max-w-2xl">
                        {imp.raw_reference}
                      </p>
                    )}
                  </div>
                </div>

                <div className="text-right shrink-0">
                  <span className="text-[10px] text-black font-mono font-bold block">
                    {imp.received_at?.replace('T', ' ').slice(0, 19)}
                  </span>
                  <Link
                    to="/invoices"
                    className="inline-flex items-center gap-1 text-[11px] font-black uppercase text-black hover:underline mt-2"
                  >
                    View in Queue <ArrowRight className="h-3.5 w-3.5" />
                  </Link>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
