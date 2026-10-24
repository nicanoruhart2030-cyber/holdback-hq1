import { describe, expect, it } from "vitest";
import { formatCAD, formatCADShort, formatDate, todayInToronto } from "@/lib/format";

describe("formatting", () => {
  it("formats CAD in en-CA", () => {
    expect(formatCAD(1234.5)).toBe("$1,234.50");
    expect(formatCAD(1234.5, { whole: true })).toBe("$1,235");
    expect(formatCAD(null)).toBe("—");
  });

  it("formats date-only values without timezone drift", () => {
    expect(formatDate("2026-01-01")).toContain("2026");
    expect(formatDate("2026-01-01")).toContain("1");
    expect(formatDate(null)).toBe("—");
  });

  it("derives today in Toronto, not UTC", () => {
    expect(todayInToronto(new Date("2026-10-23T02:30:00Z"))).toBe("2026-10-22");
    expect(todayInToronto(new Date("2026-10-23T05:30:00Z"))).toBe("2026-10-23");
  });
});

describe("formatCADShort", () => {
  it("uses compact notation without trailing zeros", () => {
    expect(formatCADShort(950)).toBe("$950");
    expect(formatCADShort(45000)).toBe("$45K");
    expect(formatCADShort(12345)).toBe("$12.3K");
    expect(formatCADShort(1234567)).toBe("$1.2M");
    expect(formatCADShort(null)).toBe("—");
  });
});
