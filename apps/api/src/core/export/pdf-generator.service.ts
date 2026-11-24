import PDFDocument from "pdfkit";
import type { Response } from "express";

export interface ExportQuestionItem {
  index: number;
  category: string;
  difficulty: string;
  targetedSkill: string;
  questionText: string;
  interviewerIntent: string;
  keyEvaluationPoints: string[];
  answer?: {
    shortSummary: string;
    detailedExplanation: string;
    codeSnippet: string | null;
    timeComplexity: string | null;
    spaceComplexity: string | null;
    commonMistakes: string[];
  } | null;
}

export interface ExportDocumentInput {
  title: string;
  subtitle?: string;
  generatedAt: Date;
  items: ExportQuestionItem[];
}

export class PdfGeneratorService {
  /**
   * Generates a PDF in-memory buffer from the normalized export input.
   */
  public generateBuffer(input: ExportDocumentInput): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      try {
        const doc = new PDFDocument({
          size: "A4",
          margin: 40,
          bufferPages: true,
        });

        const buffers: Buffer[] = [];
        doc.on("data", (chunk: Buffer) => buffers.push(chunk));
        doc.on("end", () => resolve(Buffer.concat(buffers)));
        doc.on("error", (err: Error) => reject(err));

        this.renderDocument(doc, input);
        doc.end();
      } catch (err) {
        reject(err);
      }
    });
  }

  /**
   * Directly pipes the generated PDF stream to an Express HTTP response.
   */
  public streamToResponse(
    input: ExportDocumentInput,
    res: Response,
    filename: string
  ): void {
    const sanitizedFilename = filename
      .replace(/[^a-zA-Z0-9_\-\.]/g, "_")
      .slice(0, 100);

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="${sanitizedFilename}.pdf"`
    );

    const doc = new PDFDocument({
      size: "A4",
      margin: 40,
      bufferPages: true,
    });

    doc.pipe(res);
    this.renderDocument(doc, input);
    doc.end();
  }

  /**
   * Internal layout and rendering engine.
   */
  private renderDocument(
    doc: InstanceType<typeof PDFDocument>,
    input: ExportDocumentInput
  ): void {
    // 1. Header Banner
    doc
      .fontSize(10)
      .fillColor("#4F46E5")
      .text("TECHQUERY AI — INTERVIEW PREPARATION GUIDE", {
        characterSpacing: 1,
      });

    doc.moveDown(0.3);
    doc
      .fontSize(20)
      .fillColor("#111827")
      .font("Helvetica-Bold")
      .text(input.title);

    if (input.subtitle) {
      doc
        .fontSize(11)
        .fillColor("#4B5563")
        .font("Helvetica")
        .text(input.subtitle);
    }

    doc
      .fontSize(9)
      .fillColor("#6B7280")
      .font("Helvetica")
      .text(
        `Generated: ${input.generatedAt.toISOString().slice(0, 10)} | Total Questions: ${input.items.length}`
      );

    doc.moveDown(0.5);
    doc
      .strokeColor("#E5E7EB")
      .lineWidth(1)
      .moveTo(40, doc.y)
      .lineTo(doc.page.width - 40, doc.y)
      .stroke();
    doc.moveDown(1);

    // 2. Question Items
    for (const item of input.items) {
      // Ensure sufficient page space for question header (avoid dangling titles)
      if (doc.y > doc.page.height - 150) {
        doc.addPage();
      }

      // Question Number & Text
      doc
        .fontSize(13)
        .font("Helvetica-Bold")
        .fillColor("#1F2937")
        .text(`Q${item.index}. ${item.questionText}`, { lineGap: 2 });

      // Badge line
      doc
        .fontSize(9)
        .font("Helvetica-Bold")
        .fillColor("#4F46E5")
        .text(
          `[ ${item.category} | ${item.difficulty} | Focus: ${item.targetedSkill} ]`
        );

      doc.moveDown(0.3);

      // Interviewer Intent
      doc
        .fontSize(9)
        .font("Helvetica-Bold")
        .fillColor("#374151")
        .text("Interviewer Intent: ", { continued: true })
        .font("Helvetica")
        .fillColor("#4B5563")
        .text(item.interviewerIntent);

      // Key Evaluation Points
      if (item.keyEvaluationPoints && item.keyEvaluationPoints.length > 0) {
        doc.moveDown(0.2);
        doc
          .fontSize(9)
          .font("Helvetica-Bold")
          .fillColor("#374151")
          .text("Evaluation Checkpoints:");
        for (const point of item.keyEvaluationPoints) {
          doc
            .fontSize(8.5)
            .font("Helvetica")
            .fillColor("#4B5563")
            .text(`  • ${point}`);
        }
      }

      doc.moveDown(0.4);

      // 3. Model Answer Section
      if (item.answer) {
        doc
          .fontSize(10)
          .font("Helvetica-Bold")
          .fillColor("#16A34A")
          .text("MODEL ANSWER:");

        // Short Summary
        doc
          .fontSize(9)
          .font("Helvetica-Bold")
          .fillColor("#1F2937")
          .text("Summary: ", { continued: true })
          .font("Helvetica")
          .fillColor("#374151")
          .text(item.answer.shortSummary);

        doc.moveDown(0.3);

        // Detailed Explanation
        doc
          .fontSize(9)
          .font("Helvetica-Bold")
          .fillColor("#1F2937")
          .text("Detailed Breakdown:");
        doc
          .fontSize(8.5)
          .font("Helvetica")
          .fillColor("#374151")
          .text(item.answer.detailedExplanation, { lineGap: 1.5 });

        // Optional Code Snippet
        if (item.answer.codeSnippet) {
          doc.moveDown(0.3);
          doc
            .fontSize(8.5)
            .font("Courier")
            .fillColor("#1E293B")
            .text(item.answer.codeSnippet, {
              lineGap: 1,
            });
        }

        // Optional Complexity
        if (item.answer.timeComplexity || item.answer.spaceComplexity) {
          doc.moveDown(0.3);
          doc
            .fontSize(8.5)
            .font("Helvetica-Bold")
            .fillColor("#1F2937")
            .text("Complexity: ", { continued: true })
            .font("Helvetica")
            .fillColor("#4B5563")
            .text(
              `Time: ${item.answer.timeComplexity || "N/A"} | Space: ${item.answer.spaceComplexity || "N/A"}`
            );
        }

        // Common Mistakes
        if (
          item.answer.commonMistakes &&
          item.answer.commonMistakes.length > 0
        ) {
          doc.moveDown(0.3);
          doc
            .fontSize(8.5)
            .font("Helvetica-Bold")
            .fillColor("#DC2626")
            .text("Traps & Common Pitfalls to Avoid:");
          for (const mistake of item.answer.commonMistakes) {
            doc
              .fontSize(8)
              .font("Helvetica")
              .fillColor("#4B5563")
              .text(`  ⚠ ${mistake}`);
          }
        }
      } else {
        doc
          .fontSize(8.5)
          .font("Helvetica-Oblique")
          .fillColor("#9CA3AF")
          .text("(Model answer not generated yet)");
      }

      doc.moveDown(0.8);
      doc
        .strokeColor("#F3F4F6")
        .lineWidth(0.5)
        .moveTo(40, doc.y)
        .lineTo(doc.page.width - 40, doc.y)
        .stroke();
      doc.moveDown(0.8);
    }

    // 3. Footer Page Numbers
    const range = doc.bufferedPageRange();
    for (let i = range.start; i < range.start + range.count; i++) {
      doc.switchToPage(i);
      doc
        .fontSize(8)
        .fillColor("#9CA3AF")
        .font("Helvetica")
        .text(
          `TechQuery AI • Page ${i + 1} of ${range.count}`,
          40,
          doc.page.height - 30,
          {
            align: "center",
            width: doc.page.width - 80,
          }
        );
    }
  }
}

export const pdfGeneratorService = new PdfGeneratorService();

