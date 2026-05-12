import { describe, it, expect } from "vitest";
import { generateInvoicePdf, type InvoiceData } from "./invoice-pdf";

describe("generateInvoicePdf", () => {
  const sampleData: InvoiceData = {
    invoiceNumber: "BM-0001-202605",
    issueDate: "12/05/2026",
    billingPeriodStart: "mayo 2026",
    billingPeriodEnd: "junio 2026",
    company: {
      name: "Acme Corp S.L.",
      taxId: "B-12345678",
      contactEmail: "rrhh@acme.com",
      contactName: "María García",
      plan: "business",
    },
    activeLicenses: 150,
    pricePerLicense: 3.40,
    totalAmount: 510.0,
    status: "paid",
  };

  it("should generate a valid PDF buffer", async () => {
    const result = await generateInvoicePdf(sampleData);
    expect(result).toBeInstanceOf(Buffer);
    expect(result.length).toBeGreaterThan(100);
    // PDF files start with %PDF
    const header = result.subarray(0, 5).toString("ascii");
    expect(header).toBe("%PDF-");
  });

  it("should work without optional fields (taxId, contactName)", async () => {
    const minimalData: InvoiceData = {
      ...sampleData,
      company: {
        name: "Startup SL",
        taxId: null,
        contactEmail: "info@startup.com",
        contactName: null,
        plan: "starter",
      },
    };
    const result = await generateInvoicePdf(minimalData);
    expect(result).toBeInstanceOf(Buffer);
    const header = result.subarray(0, 5).toString("ascii");
    expect(header).toBe("%PDF-");
  });

  it("should produce different PDFs for different data", async () => {
    const data2: InvoiceData = {
      ...sampleData,
      invoiceNumber: "BM-0002-202606",
      activeLicenses: 300,
      totalAmount: 1020.0,
    };
    const pdf1 = await generateInvoicePdf(sampleData);
    const pdf2 = await generateInvoicePdf(data2);
    expect(pdf1.length).not.toBe(pdf2.length);
  });

  it("should handle all plan types", async () => {
    const plans = ["starter", "growth", "business", "enterprise", "corporate", "global"];
    for (const plan of plans) {
      const data: InvoiceData = {
        ...sampleData,
        company: { ...sampleData.company, plan },
      };
      const result = await generateInvoicePdf(data);
      expect(result).toBeInstanceOf(Buffer);
      expect(result.length).toBeGreaterThan(100);
    }
  });
});
