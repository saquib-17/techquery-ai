import { prisma } from "../../core/database/index.js";
import type {
  SavedCollection,
  CollectionItem,
  Question,
  Answer,
} from "@prisma/client";

export type CollectionSummary = SavedCollection & {
  itemCount: number;
};

export type CollectionWithPopulatedItems = SavedCollection & {
  items: Array<
    CollectionItem & {
      question: Question & {
        answer: Answer | null;
      };
    }
  >;
};

export class CollectionRepository {
  /**
   * Creates a new saved collection for a user.
   */
  public async create(
    userId: string,
    data: { name: string; description?: string }
  ): Promise<SavedCollection> {
    return prisma.savedCollection.create({
      data: {
        userId,
        name: data.name,
        description: data.description || null,
      },
    });
  }

  /**
   * Retrieves all collections for a user with total items count.
   */
  public async findAllByUserId(userId: string): Promise<CollectionSummary[]> {
    const collections = await prisma.savedCollection.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      include: {
        _count: {
          select: { items: true },
        },
      },
    });

    return collections.map((c) => ({
      id: c.id,
      userId: c.userId,
      name: c.name,
      description: c.description,
      createdAt: c.createdAt,
      updatedAt: c.updatedAt,
      itemCount: c._count.items,
    }));
  }

  /**
   * Retrieves a single collection by ID ensuring ownership, populated with questions and model answers.
   */
  public async findByIdAndUserId(
    id: string,
    userId: string
  ): Promise<CollectionWithPopulatedItems | null> {
    const collection = await prisma.savedCollection.findFirst({
      where: { id, userId },
      include: {
        items: {
          orderBy: { addedAt: "asc" },
          include: {
            question: {
              include: {
                answer: true,
              },
            },
          },
        },
      },
    });

    return collection as CollectionWithPopulatedItems | null;
  }

  /**
   * Updates collection metadata ensuring ownership.
   */
  public async updateByIdAndUserId(
    id: string,
    userId: string,
    data: { name?: string; description?: string | null }
  ): Promise<SavedCollection | null> {
    const existing = await prisma.savedCollection.findFirst({
      where: { id, userId },
      select: { id: true },
    });

    if (!existing) {
      return null;
    }

    return prisma.savedCollection.update({
      where: { id },
      data: {
        name: data.name,
        description: data.description !== undefined ? data.description : undefined,
      },
    });
  }

  /**
   * Deletes a collection ensuring ownership. Cascades deletion to collection_items.
   */
  public async deleteByIdAndUserId(
    id: string,
    userId: string
  ): Promise<boolean> {
    const existing = await prisma.savedCollection.findFirst({
      where: { id, userId },
      select: { id: true },
    });

    if (!existing) {
      return false;
    }

    await prisma.savedCollection.delete({
      where: { id },
    });

    return true;
  }

  /**
   * Verifies that a question exists and belongs to a question set owned by the user (BOLA/IDOR protection).
   */
  public async findOwnedQuestion(
    questionId: string,
    userId: string
  ): Promise<Question | null> {
    const question = await prisma.question.findUnique({
      where: { id: questionId },
      include: {
        questionSet: {
          select: { userId: true },
        },
      },
    });

    if (!question || question.questionSet.userId !== userId) {
      return null;
    }

    return question;
  }

  /**
   * Checks if a question is already bookmarked in a collection.
   */
  public async findItem(
    collectionId: string,
    questionId: string
  ): Promise<CollectionItem | null> {
    return prisma.collectionItem.findUnique({
      where: {
        collectionId_questionId: {
          collectionId,
          questionId,
        },
      },
    });
  }

  /**
   * Adds a question to a collection.
   */
  public async addItem(
    collectionId: string,
    questionId: string
  ): Promise<CollectionItem> {
    return prisma.collectionItem.create({
      data: {
        collectionId,
        questionId,
      },
    });
  }

  /**
   * Removes a question from a collection.
   */
  public async removeItem(
    collectionId: string,
    questionId: string
  ): Promise<boolean> {
    const existing = await this.findItem(collectionId, questionId);
    if (!existing) {
      return false;
    }

    await prisma.collectionItem.delete({
      where: { id: existing.id },
    });

    return true;
  }
}

export const collectionRepository = new CollectionRepository();
