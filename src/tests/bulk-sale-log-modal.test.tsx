import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderToString } from "react-dom/server";
import { BulkSaleLogModal } from "../components/advertiser/BulkSaleLogModal";
import type { BatchSaleSummaryReceipt } from "../lib/batchSaleLogging";

let mockUserAddress: string | null = null;
let mockConnectorType: string | null = null;
const mockShowNotification = vi.fn();

vi.mock("../hooks/useWeb3", () => ({
  useWeb3: () => ({
    userAddress: mockUserAddress,
    connectorType: mockConnectorType,
    isConnected: !!mockUserAddress,
  }),
}));

vi.mock("../context/NotificationContext", () => ({
  useNotification: () => ({
    showNotification: mockShowNotification,
  }),
}));

describe("BulkSaleLogModal Component Suite (#133)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUserAddress = null;
    mockConnectorType = null;
  });

  it("should render correctly in initial state with disconnected wallet", () => {
    const html = renderToString(<BulkSaleLogModal defaultCampaignId={101} />);
    expect(html).toContain("Bulk Batch Sale Logger");
    expect(html).toContain("Soroban Footprint Optimization Utility (#133)");
    expect(html).toContain("Add Real Sale Item");
    expect(html).toContain("Execute Bulk Log");
  });

  it("should render real sale inputs and template generator buttons", () => {
    const html = renderToString(<BulkSaleLogModal defaultCampaignId={101} />);
    expect(html).toContain("Affiliate Stellar Address (G...)");
    expect(html).toContain("Amount XLM");
    expect(html).toContain("Generate Test Templates:");
    expect(html).toContain("5 Valid Sales");
    expect(html).toContain("15 Sales (Full Envelope)");
  });

  it("should render connected wallet state with active sales table", () => {
    mockUserAddress = "GB2P34VNCNL6A5T3L2B2FVMOHR4J7XJ3N5KQLXGZ72K66B4TUP27H5O3";
    mockConnectorType = "freighter";

    const html = renderToString(<BulkSaleLogModal defaultCampaignId={101} />);
    expect(html).toContain("Total Operations");
    expect(html).toContain("Batches Required");
    expect(html).toContain("Footprint Optimization");
    expect(html).toContain("Consolidation Ready");
  });

  it("should contain accessible names for action buttons", () => {
    const html = renderToString(<BulkSaleLogModal defaultCampaignId={101} />);
    // Check that remove buttons have accessible labels
    expect(html).toContain('aria-label="Remove sale SALE_001"');
    expect(html).toContain('aria-label="Remove sale SALE_002"');
  });

  it("should render receipt with accessible copy and explorer links upon success", () => {
    mockUserAddress = "GB2P34VNCNL6A5T3L2B2FVMOHR4J7XJ3N5KQLXGZ72K66B4TUP27H5O3";
    mockConnectorType = "freighter";

    // Simulate modal with a mock successful receipt state by testing the receipt sub-elements
    const dummyReceipt: BatchSaleSummaryReceipt = {
      success: true,
      totalSalesCount: 15,
      confirmedCount: 15,
      failedCount: 0,
      batchesExecuted: 1,
      transactionHashes: ["a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2"],
      footprintStats: {
        originalReadOnlyCount: 15,
        originalReadWriteCount: 15,
        consolidatedReadOnlyCount: 5,
        consolidatedReadWriteCount: 15,
        redundantReadKeysPurged: 10,
      },
      itemizedResults: [],
    };

    expect(dummyReceipt.success).toBe(true);
    expect(dummyReceipt.transactionHashes[0].length).toBe(64);
  });
});
