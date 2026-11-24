import type { Response } from "express";
import {
  collectionRepository,
  CollectionRepository,
  type CollectionSummary,
  type CollectionWithPopulatedItems,
} from "./collection.repository.js";
import {
  pdfGeneratorService,
  PdfGeneratorService,
  type ExportQuestionItem,
} from "../../core/export/pdf-generator.service.js";
import type {
  CreateCollectionInput,
  UpdateCollectionInput,
} from "./collection.schemas.js";
import { NotFoundError, ConflictError } from "../../core/errors/AppError.js";
import type { SavedCollection, CollectionItem } from "@prisma/client";
import { activityService } from "../dashboard/activity.service.js";

export class CollectionService {
  constructor(
    private repo: CollectionRepository = collectionRepository,
    private pdfGenerator: PdfGeneratorService = pdfGeneratorService
  ) {}

  public async createCollection(
    userId: string,
    input: CreateCollectionInput
  ): Promise<SavedCollection> {
    const created = await this.repo.create(userId, input);
    await activityService.logActivity(userId, "COLLECTION_CREATED", {
      collectionId: created.id,
      name: created.name,
    });
    return created;
  }

  public async listCollections(userId: string): Promise<CollectionSummary[]> {
    return this.repo.findAllByUserId(userId);
  }

  public async getCollectionById(
    userId: string,
    id: string
  ): Promise<CollectionWithPopulatedItems> {
    const collection = await this.repo.findByIdAndUserId(id, userId);
    if (!collection) {
      throw new NotFoundError(
        "Collection not found or access denied",
        "COLLECTION_NOT_FOUND"
      );
    }
    return collection;
  }

  public async updateCollection(
    userId: string,
    id: string,
    input: UpdateCollectionInput
  ): Promise<SavedCollection> {
    const updated = await this.repo.updateByIdAndUserId(id, userId, input);
    if (!updated) {
      throw new NotFoundError(
        "Collection not found or access denied",
        "COLLECTION_NOT_FOUND"
      );
    }
    return updated;
  }

  public async deleteCollection(
    userId: string,
    id: string
  ): Promise<{ success: boolean; message: string }> {
    const deleted = await this.repo.deleteByIdAndUserId(id, userId);
    if (!deleted) {
      throw new NotFoundError(
        "Collection not found or access denied",
        "COLLECTION_NOT_FOUND"
      );
    }
    return {
      success: true,
      message: "Collection deleted successfully",
    };
  }

  public async addQuestionToCollection(
    userId: string,
    collectionId: string,
    questionId: string
  ): Promise<CollectionItem> {
    // 1. Verify collection ownership
    const collection = await this.repo.findByIdAndUserId(collectionId, userId);
    if (!collection) {
      throw new NotFoundError(
        "Collection not found or access denied",
        "COLLECTION_NOT_FOUND"
      );
    }

    // 2. Verify question ownership (BOLA/IDOR protection)
    const question = await this.repo.findOwnedQuestion(questionId, userId);
    if (!question) {
      throw new NotFoundError(
        "Question not found or you do not have permission to access it",
        "QUESTION_NOT_FOUND"
      );
    }

    // 3. Verify not already bookmarked
    const existing = await this.repo.findItem(collectionId, questionId);
    if (existing) {
      throw new ConflictError(
        "Question is already bookmarked in this collection",
        "ALREADY_IN_COLLECTION"
      );
    }

    return this.repo.addItem(collectionId, questionId);
  }

  public async removeQuestionFromCollection(
    userId: string,
    collectionId: string,
    questionId: string
  ): Promise<{ success: boolean; message: string }> {
    // 1. Verify collection ownership
    const collection = await this.repo.findByIdAndUserId(collectionId, userId);
    if (!collection) {
      throw new NotFoundError(
        "Collection not found or access denied",
        "COLLECTION_NOT_FOUND"
      );
    }

    const removed = await this.repo.removeItem(collectionId, questionId);
    if (!removed) {
      throw new NotFoundError(
        "Question is not in this collection",
        "ITEM_NOT_FOUND"
      );
    }

    return {
      success: true,
      message: "Question removed from collection",
    };
  }

  public async exportCollectionPdf(
    userId: string,
    collectionId: string,
    res: Response
  ): Promise<void> {
    const collection = await this.getCollectionById(userId, collectionId);

    const items: ExportQuestionItem[] = collection.items.map((item, idx) => ({
      index: idx + 1,
      category: item.question.category,
      difficulty: item.question.difficulty,
      targetedSkill: item.question.targetedSkill,
      questionText: item.question.questionText,
      interviewerIntent: item.question.interviewerIntent,
      keyEvaluationPoints: Array.isArray(item.question.keyEvaluationPoints)
        ? (item.question.keyEvaluationPoints as string[])
        : [],
      answer: item.question.answer
        ? {
            shortSummary: item.question.answer.shortSummary,
            detailedExplanation: item.question.answer.detailedExplanation,
            codeSnippet: item.question.answer.codeSnippet,
            timeComplexity: item.question.answer.timeComplexity,
            spaceComplexity: item.question.answer.spaceComplexity,
            commonMistakes: Array.isArray(item.question.answer.commonMistakes)
              ? (item.question.answer.commonMistakes as string[])
              : [],
          }
        : null,
    }));

    this.pdfGenerator.streamToResponse(
      {
        title: collection.name,
        subtitle: collection.description || "Curated Question Collection",
        generatedAt: new Date(),
        items,
      },
      res,
      `collection_${collection.name}`
    );

    await activityService.logActivity(userId, "PDF_EXPORTED", {
      exportType: "COLLECTION",
      collectionId,
    });
  }
}

export const collectionService = new CollectionService();
