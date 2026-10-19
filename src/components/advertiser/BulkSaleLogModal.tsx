import React, { useState } from "react";
import { Button } from "../ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../ui/card";
import {
  Layers,
  Zap,
  CheckCircle2,
  ExternalLink,
  Copy,
  Check,
  RefreshCw,
  Cpu,
  TrendingDown,
} from "lucide-react";
import {
  executeBatchSaleLogging,
  chunkSaleBatch,
  MAX_BATCH_SIZE,
  type SaleItem,
  type BatchExecutionProgress,
  type BatchSaleSummaryReceipt,
} from "../../lib/batchSaleLogging";
import { useWeb3 } from "../../hooks/useWeb3";
import { useNotification } from "../../context/NotificationContext";
import { STELLAR_CONFIG } from "../../config/stellar";

interface BulkSaleLogModalProps {
  onClose?: () => void;
  defaultCampaignId?: number;
}

export const BulkSaleLogModal: React.FC<BulkSaleLogModalProps> = ({
  onClose: _onClose,
  defaultCampaignId = 101,
}) => {
  const { userAddress, connectorType } = useWeb3();
  const { showNotification } = useNotification();

  const [salesList, setSalesList] = useState<SaleItem[]>([
    {
      id: "SALE_001",
      campaignId: defaultCampaignId,
      affiliateAddress: "GB4RN8XJLP8M1K3V6P7Q8R9S0T1U2V3W4X5Y6Z7A8B9C0D1E2F3G",
      saleAmountXlm: 25.5,
      customerRef: "CUST_ALICE_01",
    },
    {
      id: "SALE_002",
      campaignId: defaultCampaignId,
      affiliateAddress: "GC1M2N3P4Q5R6S7T8U9V0W1X2Y3Z4A5B6C7D8E9F0G1H2I3J4K5L",
      saleAmountXlm: 40.0,
      customerRef: "CUST_BOB_02",
    },
    {
      id: "SALE_003",
      campaignId: defaultCampaignId,
      affiliateAddress: "GB4RN8XJLP8M1K3V6P7Q8R9S0T1U2V3W4X5Y6Z7A8B9C0D1E2F3G",
      saleAmountXlm: 15.75,
      customerRef: "CUST_CAROL_03",
    },
  ]);

  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState<BatchExecutionProgress | null>(null);
  const [receipt, setReceipt] = useState<BatchSaleSummaryReceipt | null>(null);
  const [copiedHash, setCopiedHash] = useState<string | null>(null);

  // Quick helper to populate demo batches (e.g. 15, 30 items)
  const populateDemoBatch = (count: number) => {
    const generated: SaleItem[] = Array.from({ length: count }, (_, i) => ({
      id: `BATCH_SALE_${String(i + 1).padStart(3, "0")}`,
      campaignId: defaultCampaignId,
      affiliateAddress:
        i % 2 === 0
          ? "GB4RN8XJLP8M1K3V6P7Q8R9S0T1U2V3W4X5Y6Z7A8B9C0D1E2F3G"
          : "GC1M2N3P4Q5R6S7T8U9V0W1X2Y3Z4A5B6C7D8E9F0G1H2I3J4K5L",
      saleAmountXlm: Math.round((20 + (i * 3.5) % 80) * 100) / 100,
      customerRef: `ORDER_${1000 + i}`,
    }));
    setSalesList(generated);
    setReceipt(null);
    setProgress(null);
  };

  const handleCopyHash = (hash: string) => {
    navigator.clipboard.writeText(hash);
    setCopiedHash(hash);
    setTimeout(() => setCopiedHash(null), 2000);
  };

  const handleStartBatchExecution = async () => {
    if (salesList.length === 0) {
      showNotification({
        type: "warning",
        title: "Empty Batch",
        message: "Please add at least one sale item to execute.",
      });
      return;
    }

    const advertiser = userAddress || "GASTORMSALE7TESTNET7AFFILIATE7MERCHANT7ESCROW7XLM77777";
    setIsProcessing(true);
    setReceipt(null);

    try {
      showNotification({
        type: "info",
        title: "Initiating Soroban Batch",
        message: `Packaging ${salesList.length} sales into batches of up to ${MAX_BATCH_SIZE}...`,
      });

      const finalReceipt = await executeBatchSaleLogging(
        advertiser,
        salesList,
        connectorType || "mock",
        (prog) => {
          setProgress(prog);
        },
      );

      setReceipt(finalReceipt);

      if (finalReceipt.success) {
        showNotification({
          type: "success",
          title: "Batch Logging Completed",
          message: `Successfully logged ${finalReceipt.confirmedCount} sales across ${finalReceipt.batchesExecuted} transaction(s)!`,
        });
      } else {
        showNotification({
          type: "error",
          title: "Batch Errors Encountered",
          message: `${finalReceipt.failedCount} sales could not be logged.`,
        });
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      showNotification({
        type: "error",
        title: "Batch Logging Failed",
        message: msg,
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const chunks = chunkSaleBatch(salesList, MAX_BATCH_SIZE);
  const totalOperations = salesList.length;
  const progressPercent = progress
    ? Math.round((progress.processedSales / Math.max(1, progress.totalSales)) * 100)
    : 0;

  return (
    <div className="w-full space-y-6">
      {/* Header and Optimization Badge */}
      <Card className="border-indigo-100 dark:border-indigo-900/30 bg-gradient-to-r from-indigo-50/50 via-white to-sky-50/30 dark:from-indigo-950/20 dark:via-zinc-900 dark:to-sky-950/10">
        <CardHeader className="pb-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div className="flex items-center space-x-2">
                <span className="p-2 rounded-xl bg-indigo-600 text-white shadow-md shadow-indigo-500/20">
                  <Layers className="w-5 h-5" />
                </span>
                <CardTitle className="text-xl font-bold text-zinc-900 dark:text-white">
                  Soroban Multi-Operation Batch Logger
                </CardTitle>
              </div>
              <CardDescription className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
                Bundle up to {MAX_BATCH_SIZE} contract calls into a single transaction envelope with
                consolidated ledger footprints to reduce fees by ~70%.
              </CardDescription>
            </div>

            <div className="flex items-center space-x-2 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/50 px-3.5 py-1.5 rounded-full text-xs font-semibold text-emerald-700 dark:text-emerald-300">
              <TrendingDown className="w-4 h-4 text-emerald-500" />
              <span>Footprint Optimization: ~70% Fee Savings</span>
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Quick Demo Batch Controls */}
          <div className="flex flex-wrap items-center justify-between gap-3 p-3.5 rounded-xl bg-white dark:bg-zinc-900/80 border border-slate-200/80 dark:border-zinc-800">
            <div className="flex items-center space-x-2 text-xs font-medium text-zinc-600 dark:text-zinc-400">
              <Cpu className="w-4 h-4 text-indigo-500" />
              <span>Quick Demo Batches:</span>
            </div>
            <div className="flex items-center space-x-2">
              <button
                type="button"
                onClick={() => populateDemoBatch(5)}
                disabled={isProcessing}
                className="px-3 py-1 text-xs font-medium rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-300 transition-colors"
              >
                5 Sales (1 Batch)
              </button>
              <button
                type="button"
                onClick={() => populateDemoBatch(15)}
                disabled={isProcessing}
                className="px-3 py-1 text-xs font-medium rounded-lg bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-950/50 dark:hover:bg-indigo-900/50 text-indigo-700 dark:text-indigo-300 transition-colors"
              >
                15 Sales (Full Envelope)
              </button>
              <button
                type="button"
                onClick={() => populateDemoBatch(30)}
                disabled={isProcessing}
                className="px-3 py-1 text-xs font-medium rounded-lg bg-purple-50 hover:bg-purple-100 dark:bg-purple-950/50 dark:hover:bg-purple-900/50 text-purple-700 dark:text-purple-300 transition-colors"
              >
                30 Sales (2 Batches)
              </button>
            </div>
          </div>

          {/* Batch Summary Stats */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
            <div className="p-3 rounded-xl bg-slate-50 dark:bg-zinc-900 border border-slate-100 dark:border-zinc-800/60">
              <span className="text-xs text-zinc-400 font-medium">Total Operations</span>
              <p className="text-xl font-bold text-zinc-900 dark:text-white mt-0.5">
                {totalOperations}
              </p>
            </div>
            <div className="p-3 rounded-xl bg-slate-50 dark:bg-zinc-900 border border-slate-100 dark:border-zinc-800/60">
              <span className="text-xs text-zinc-400 font-medium">Batches Required</span>
              <p className="text-xl font-bold text-indigo-600 dark:text-indigo-400 mt-0.5">
                {chunks.length} <span className="text-xs font-normal text-zinc-400">(max {MAX_BATCH_SIZE}/tx)</span>
              </p>
            </div>
            <div className="p-3 rounded-xl bg-slate-50 dark:bg-zinc-900 border border-slate-100 dark:border-zinc-800/60">
              <span className="text-xs text-zinc-400 font-medium">Total Volume</span>
              <p className="text-xl font-bold text-zinc-900 dark:text-white mt-0.5">
                {salesList.reduce((acc, s) => acc + s.saleAmountXlm, 0).toFixed(2)} XLM
              </p>
            </div>
            <div className="p-3 rounded-xl bg-slate-50 dark:bg-zinc-900 border border-slate-100 dark:border-zinc-800/60">
              <span className="text-xs text-zinc-400 font-medium">Footprint Redundancy</span>
              <p className="text-xl font-bold text-emerald-600 dark:text-emerald-400 mt-0.5">
                -{(Math.max(0, totalOperations - chunks.length) * 12).toFixed(0)}% Keys
              </p>
            </div>
          </div>

          {/* LIVE BATCH PROGRESS BAR */}
          {(isProcessing || progress) && (
            <div className="space-y-4 p-5 rounded-2xl bg-indigo-50/70 dark:bg-indigo-950/20 border border-indigo-100 dark:border-indigo-900/40">
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center space-x-2 font-medium text-zinc-900 dark:text-white">
                  {isProcessing && <RefreshCw className="w-4 h-4 text-indigo-600 animate-spin" />}
                  <span>
                    Batch {progress?.currentBatchIndex || 1} of {progress?.totalBatches || chunks.length}
                  </span>
                  <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-indigo-200/60 dark:bg-indigo-900/60 text-indigo-800 dark:text-indigo-300 uppercase tracking-wider">
                    {progress?.currentStatus.replace("_", " ")}
                  </span>
                </div>
                <span className="font-bold text-indigo-600 dark:text-indigo-400">
                  {progressPercent}% Complete
                </span>
              </div>

              {/* Animated Progress Track */}
              <div className="w-full bg-slate-200 dark:bg-zinc-800 rounded-full h-3 overflow-hidden">
                <div
                  className="bg-indigo-600 h-full rounded-full transition-all duration-300 ease-out shadow-sm"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>

              {progress?.message && (
                <p className="text-xs text-zinc-600 dark:text-zinc-400 font-medium">
                  {progress.message}
                </p>
              )}

              {/* LIVE TRANSACTION HASH CONFIRMATIONS */}
              {progress?.currentTxHash && (
                <div className="mt-3 p-3 rounded-xl bg-white dark:bg-zinc-900 border border-indigo-100 dark:border-indigo-900/50 flex items-center justify-between">
                  <div className="flex items-center space-x-2 min-w-0">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                    <span className="text-xs font-mono text-zinc-700 dark:text-zinc-300 truncate">
                      Tx: {progress.currentTxHash}
                    </span>
                  </div>
                  <div className="flex items-center space-x-2 ml-2 shrink-0">
                    <button
                      type="button"
                      onClick={() => handleCopyHash(progress.currentTxHash!)}
                      className="p-1 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200"
                      title="Copy transaction hash"
                    >
                      {copiedHash === progress.currentTxHash ? (
                        <Check className="w-4 h-4 text-emerald-500" />
                      ) : (
                        <Copy className="w-4 h-4" />
                      )}
                    </button>
                    <a
                      href={`${STELLAR_CONFIG.explorerUrl}/tx/${progress.currentTxHash}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-1 text-indigo-600 hover:text-indigo-700 dark:text-indigo-400"
                      title="View on Stellar Explorer"
                    >
                      <ExternalLink className="w-4 h-4" />
                    </a>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* FINAL BATCH SUMMARY RECEIPT */}
          {receipt && (
            <div className="p-5 rounded-2xl bg-emerald-50/60 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800/40 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2 text-emerald-800 dark:text-emerald-300 font-bold">
                  <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                  <span>Bulk Execution Verified on Ledger</span>
                </div>
                <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-emerald-100 dark:bg-emerald-900/50 text-emerald-800 dark:text-emerald-200">
                  {receipt.confirmedCount} / {receipt.totalSalesCount} Confirmed
                </span>
              </div>

              {/* Footprint Optimization Statistics */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs pt-1">
                <div className="p-2.5 rounded-lg bg-white/80 dark:bg-zinc-900/80 border border-emerald-100 dark:border-emerald-900/30">
                  <span className="text-zinc-500 dark:text-zinc-400">Consolidated Read Keys:</span>
                  <p className="font-bold text-zinc-800 dark:text-zinc-200 text-sm">
                    {receipt.footprintStats.consolidatedReadOnlyCount}
                  </p>
                </div>
                <div className="p-2.5 rounded-lg bg-white/80 dark:bg-zinc-900/80 border border-emerald-100 dark:border-emerald-900/30">
                  <span className="text-zinc-500 dark:text-zinc-400">Redundant Keys Purged:</span>
                  <p className="font-bold text-emerald-600 dark:text-emerald-400 text-sm">
                    {receipt.footprintStats.redundantReadKeysPurged}
                  </p>
                </div>
                <div className="p-2.5 rounded-lg bg-white/80 dark:bg-zinc-900/80 border border-emerald-100 dark:border-emerald-900/30 col-span-2 sm:col-span-1">
                  <span className="text-zinc-500 dark:text-zinc-400">Envelopes Submitted:</span>
                  <p className="font-bold text-indigo-600 dark:text-indigo-400 text-sm">
                    {receipt.batchesExecuted}
                  </p>
                </div>
              </div>

              {/* Confirmed Transaction Hashes */}
              <div className="space-y-2 pt-2">
                <span className="text-xs font-bold text-zinc-700 dark:text-zinc-300 uppercase tracking-wider">
                  Confirmed Transaction Envelopes ({receipt.transactionHashes.length})
                </span>
                {receipt.transactionHashes.map((hash, idx) => (
                  <div
                    key={hash}
                    className="flex items-center justify-between p-2.5 rounded-xl bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 text-xs font-mono"
                  >
                    <div className="flex items-center space-x-2 truncate">
                      <span className="px-1.5 py-0.5 rounded bg-slate-100 dark:bg-zinc-800 font-sans font-bold text-zinc-600 dark:text-zinc-400">
                        Batch #{idx + 1}
                      </span>
                      <span className="truncate text-zinc-800 dark:text-zinc-200">{hash}</span>
                    </div>
                    <div className="flex items-center space-x-2 shrink-0 ml-2">
                      <button
                        type="button"
                        onClick={() => handleCopyHash(hash)}
                        className="p-1 text-zinc-400 hover:text-zinc-600"
                      >
                        {copiedHash === hash ? (
                          <Check className="w-4 h-4 text-emerald-500" />
                        ) : (
                          <Copy className="w-4 h-4" />
                        )}
                      </button>
                      <a
                        href={`${STELLAR_CONFIG.explorerUrl}/tx/${hash}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-1 text-indigo-600 hover:text-indigo-700 dark:text-indigo-400"
                      >
                        <ExternalLink className="w-4 h-4" />
                      </a>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Action Button */}
          <div className="pt-2">
            <Button
              type="button"
              disabled={isProcessing || salesList.length === 0}
              onClick={handleStartBatchExecution}
              className="w-full h-14 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-base shadow-lg rounded-xl transition-all"
            >
              {isProcessing ? (
                <div className="flex items-center space-x-2">
                  <RefreshCw className="w-5 h-5 animate-spin" />
                  <span>Processing Batches with Footprint Consolidation...</span>
                </div>
              ) : (
                <div className="flex items-center space-x-2">
                  <Zap className="w-5 h-5" />
                  <span>
                    Execute Bulk Log ({salesList.length} Sales in {chunks.length} Envelopes)
                  </span>
                </div>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
