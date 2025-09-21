import { describe, it, expect } from "bun:test";
import { readQrCodeFromUrl } from "../router/tools/qr2text";

describe("readQrCodeFromUrl", () => {
  it("should throw a specific error for an invalid image URL", async () => {
    const invalidUrl = "https://example.com/nonexistent.png";
    await expect(readQrCodeFromUrl(invalidUrl)).rejects.toThrow(
      "Failed to fetch image. Status: 404 Not Found"
    );
  });

  it("should correctly decode a valid QR code", async () => {
    const validUrl = "https://files.catbox.moe/uegf8m.png"; // from the original file
    const text = await readQrCodeFromUrl(validUrl);
    expect(text).toBe("Hello World");
  });
});
