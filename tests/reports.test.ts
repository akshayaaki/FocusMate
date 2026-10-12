import { describe, it, expect } from "vitest";
import { generateCsvExport } from "@/lib/reports/export";

describe("Report Export Service", () => {
  it("escapes special characters with RFC 4180 quotes", () => {
    const data = [
      {
        Title: "Discrete Math, Part 1",
        Notes: 'Includes "Proof by Induction"',
        Status: "Pending\nRequires Review",
      },
    ];

    const csv = generateCsvExport(data);
    expect(csv).toContain('"Discrete Math, Part 1"');
    expect(csv).toContain('"Includes ""Proof by Induction"""');
    expect(csv).toContain('"Pending\nRequires Review"');
  });

  it("returns empty string when data is empty", () => {
    expect(generateCsvExport([])).toBe("");
  });
});
