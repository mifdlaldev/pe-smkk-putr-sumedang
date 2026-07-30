import { describe, expect, it } from "vitest";
import {
  isAllowedMime,
  maxBytesForPurpose,
  safeFileName,
  FILE_LIMITS,
} from "@pe-smkk/shared";

describe("files helpers", () => {
  it("allows only listed MIME", () => {
    expect(isAllowedMime("application/pdf")).toBe(true);
    expect(isAllowedMime("image/jpeg")).toBe(true);
    expect(isAllowedMime("application/zip")).toBe(false);
    expect(isAllowedMime("text/html")).toBe(false);
  });

  it("size caps by purpose", () => {
    expect(maxBytesForPurpose("avatar")).toBe(FILE_LIMITS.avatar);
    expect(maxBytesForPurpose("report_document")).toBe(
      FILE_LIMITS.report_document,
    );
  });

  it("sanitizes file names", () => {
    expect(safeFileName("../../etc/passwd")).toBe("passwd");
    expect(safeFileName("laporan (final).PDF")).toMatch(/laporan/);
    expect(safeFileName("")).toBe("file");
  });
});
