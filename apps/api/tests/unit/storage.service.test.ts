import { describe, it, expect, beforeEach, afterEach } from "vitest";
import fs from "node:fs/promises";
import path from "node:path";
import { LocalStorageService } from "../../src/core/storage/storage.service.js";
import { FileValidator } from "../../src/core/storage/file-validator.js";
import { DocumentExtractor } from "../../src/core/storage/document-extractor.js";
import { AppError, BadRequestError } from "../../src/core/errors/AppError.js";

describe("Storage, Validation & Document Extraction Unit Tests", () => {
  const testStorageDir = path.resolve("./temp-test-storage");
  const storage = new LocalStorageService(testStorageDir);

  beforeEach(async () => {
    await fs.rm(testStorageDir, { recursive: true, force: true }).catch(() => {});
  });

  afterEach(async () => {
    await fs.rm(testStorageDir, { recursive: true, force: true }).catch(() => {});
  });

  // --- STORAGE SERVICE TESTS ---

  it("1. saves and reads file from local storage", async () => {
    const buffer = Buffer.from("Test resume content");
    const filename = "test-resume.txt";

    const saved = await storage.save(filename, buffer);
    expect(saved.storagePath).toBe(filename);
    expect(saved.fileSize).toBe(buffer.length);

    const exists = await storage.exists(filename);
    expect(exists).toBe(true);

    const readBuffer = await storage.read(filename);
    expect(readBuffer.toString()).toBe("Test resume content");
  });

  it("2. deletes stored file idempotently", async () => {
    const buffer = Buffer.from("Delete test content");
    const filename = "delete-me.txt";

    await storage.save(filename, buffer);
    expect(await storage.exists(filename)).toBe(true);

    await storage.delete(filename);
    expect(await storage.exists(filename)).toBe(false);

    // Deleting again should be safe (no throw)
    await expect(storage.delete(filename)).resolves.not.toThrow();
  });

  it("3. rejects path traversal attempts in storage service", () => {
    expect(() => storage.getPhysicalPath("../secret.txt")).toThrow();
    expect(() => storage.getPhysicalPath("..\\secret.txt")).toThrow();
    expect(() => storage.getPhysicalPath("subdir/file.txt")).toThrow();
  });

  // --- MAGIC BYTE FILE VALIDATOR TESTS ---

  it("4. validates legitimate PDF file signature (%PDF)", () => {
    const pdfBuffer = Buffer.from("%PDF-1.4 simulated pdf document content");
    const res = FileValidator.validateBuffer(pdfBuffer, "my-resume.pdf");

    expect(res.isValid).toBe(true);
    expect(res.extension).toBe("pdf");
    expect(res.mimeType).toBe("application/pdf");
  });

  it("5. validates legitimate DOCX file signature (PK.. ZIP header)", () => {
    const docxBuffer = Buffer.from([0x50, 0x4b, 0x03, 0x04, 0x00, 0x00, 0x00]);
    const res = FileValidator.validateBuffer(docxBuffer, "my-resume.docx");

    expect(res.isValid).toBe(true);
    expect(res.extension).toBe("docx");
    expect(res.mimeType).toBe("application/vnd.openxmlformats-officedocument.wordprocessingml.document");
  });

  it("6. rejects executable disguised with .pdf extension", () => {
    // Windows PE executable signature MZ
    const exeBuffer = Buffer.from("MZ\x90\x00\x03\x00\x00\x00");
    expect(() => FileValidator.validateBuffer(exeBuffer, "malicious.pdf")).toThrow(BadRequestError);
  });

  it("7. rejects empty or zero-byte file", () => {
    expect(() => FileValidator.validateBuffer(Buffer.alloc(0), "empty.pdf")).toThrow(BadRequestError);
  });

  it("8. rejects unsupported extensions", () => {
    const buffer = Buffer.from("Hello world");
    expect(() => FileValidator.validateBuffer(buffer, "script.sh")).toThrow(BadRequestError);
    expect(() => FileValidator.validateBuffer(buffer, "image.png")).toThrow(BadRequestError);
  });

  // --- DOCUMENT EXTRACTOR TESTS ---

  it("9. extracts text from sample PDF buffer", async () => {
    const validPdfPath = path.resolve("./node_modules/pdf-parse/test/data/01-valid.pdf");
    const pdfBuffer = await fs.readFile(validPdfPath);

    const text = await DocumentExtractor.extractText(pdfBuffer, "pdf");
    expect(text.length).toBeGreaterThan(100);
    expect(text).toContain("Trace-based");
  });

  it("10. rejects corrupted PDF buffer with clear error", async () => {
    const corruptedBuffer = Buffer.from("%PDF-corrupted-binary-garbage");
    await expect(DocumentExtractor.extractText(corruptedBuffer, "pdf")).rejects.toThrow(BadRequestError);
  });
});
