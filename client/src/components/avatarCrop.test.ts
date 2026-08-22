import { describe, expect, it } from "vitest";
import { clampCropOffset } from "@/lib/avatarCrop";

describe("avatar crop controls", () => {
  it("keeps the image offset inside the crop viewport bounds", () => {
    expect(clampCropOffset(500, 1)).toBe(140);
    expect(clampCropOffset(-500, 1)).toBe(-140);
    expect(clampCropOffset(500, 2.5)).toBe(350);
  });

  it("allows a centered image without changing its offset", () => {
    expect(clampCropOffset(0, 1.5)).toBe(0);
  });
});
