import { describe, expect, it } from "vitest";
import {
  addBusinessDays,
  addCalendarDays,
  addYears,
  assertISODate,
  easterSunday,
  isBusinessDay,
  isOntarioHoliday,
  ontarioStatutoryHolidays,
  rollForwardToBusinessDay,
} from "@/lib/rules/calendar";

describe("Ontario statutory holidays", () => {
  it("lists 2026 holidays with observed substitutes", () => {
    expect(ontarioStatutoryHolidays(2026).map((h) => h.date)).toEqual([
      "2026-01-01",
      "2026-02-16",
      "2026-04-03",
      "2026-05-18",
      "2026-07-01",
      "2026-09-07",
      "2026-10-12",
      "2026-12-25",
      "2026-12-26",
      "2026-12-28",
    ]);
  });

  it("lists 2027 holidays with Christmas and Boxing Day substitutes", () => {
    const list = ontarioStatutoryHolidays(2027);
    expect(list.map((h) => h.date)).toEqual([
      "2027-01-01",
      "2027-02-15",
      "2027-03-26",
      "2027-05-24",
      "2027-07-01",
      "2027-09-06",
      "2027-10-11",
      "2027-12-25",
      "2027-12-26",
      "2027-12-27",
      "2027-12-28",
    ]);
    expect(list.find((h) => h.date === "2027-12-27")?.name).toBe("Christmas Day (observed)");
    expect(list.find((h) => h.date === "2027-12-28")?.name).toBe("Boxing Day (observed)");
  });

  it("computes Easter correctly", () => {
    expect(easterSunday(2026)).toBe("2026-04-05");
    expect(easterSunday(2027)).toBe("2027-03-28");
    expect(easterSunday(2024)).toBe("2024-03-31");
  });

  it("does not treat Civic Holiday, Easter Monday or Remembrance Day as statutory", () => {
    expect(isOntarioHoliday("2026-08-03")).toBe(false);
    expect(isOntarioHoliday("2026-04-06")).toBe(false);
    expect(isOntarioHoliday("2026-11-11")).toBe(false);
  });
});

describe("business days", () => {
  it("skips weekends", () => {
    expect(isBusinessDay("2026-10-24")).toBe(false);
    expect(isBusinessDay("2026-10-25")).toBe(false);
    expect(addBusinessDays("2026-10-23", 1)).toBe("2026-10-26");
    expect(addBusinessDays("2026-10-19", 10)).toBe("2026-11-02");
  });

  it("skips holidays across the 2026 Christmas break", () => {
    expect(addBusinessDays("2026-12-24", 1)).toBe("2026-12-29");
  });

  it("skips Good Friday 2027", () => {
    expect(addBusinessDays("2027-03-25", 1)).toBe("2027-03-29");
  });

  it("counts backward", () => {
    expect(addBusinessDays("2026-04-06", -1)).toBe("2026-04-02");
    expect(addBusinessDays("2026-10-26", 0)).toBe("2026-10-26");
  });

  it("rolls forward to the next business day", () => {
    expect(rollForwardToBusinessDay("2027-12-25")).toBe("2027-12-29");
    expect(rollForwardToBusinessDay("2026-10-21")).toBe("2026-10-21");
  });
});

describe("calendar helpers", () => {
  it("adds calendar days across month and year ends", () => {
    expect(addCalendarDays("2026-12-20", 15)).toBe("2027-01-04");
    expect(addCalendarDays("2028-02-28", 1)).toBe("2028-02-29");
  });

  it("clamps Feb 29 anniversaries", () => {
    expect(addYears("2028-02-29", 1)).toBe("2029-02-28");
    expect(addYears("2026-06-15", 2)).toBe("2028-06-15");
  });

  it("rejects invalid dates", () => {
    expect(() => assertISODate("2026-02-30")).toThrow();
    expect(() => assertISODate("26-1-1")).toThrow();
    expect(assertISODate("2026-02-28")).toBe("2026-02-28");
  });
});
