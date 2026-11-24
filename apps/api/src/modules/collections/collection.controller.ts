import type { Request, Response, NextFunction } from "express";
import {
  collectionService,
  CollectionService,
} from "./collection.service.js";
import {
  CreateCollectionSchema,
  UpdateCollectionSchema,
  AddCollectionItemSchema,
  CollectionIdParamSchema,
  CollectionItemParamSchema,
} from "./collection.schemas.js";
import { sendSuccess } from "../../core/responses/index.js";
import {
  UnauthorizedError,
  ValidationError,
} from "../../core/errors/AppError.js";

export class CollectionController {
  constructor(private service: CollectionService = collectionService) {}

  public create = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const userId = req.user?.userId;
      if (!userId) throw new UnauthorizedError("Authentication required");

      const parsed = CreateCollectionSchema.safeParse(req.body);
      if (!parsed.success) {
        const details = parsed.error.issues.map((i) => ({
          field: i.path.join("."),
          message: i.message,
        }));
        throw new ValidationError(
          parsed.error.issues[0]?.message || "Validation failed",
          details
        );
      }

      const collection = await this.service.createCollection(
        userId,
        parsed.data
      );
      sendSuccess(res, { collection }, 201);
    } catch (err) {
      next(err);
    }
  };

  public list = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const userId = req.user?.userId;
      if (!userId) throw new UnauthorizedError("Authentication required");

      const collections = await this.service.listCollections(userId);
      sendSuccess(res, { collections }, 200);
    } catch (err) {
      next(err);
    }
  };

  public getById = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const userId = req.user?.userId;
      if (!userId) throw new UnauthorizedError("Authentication required");

      const parsed = CollectionIdParamSchema.safeParse(req.params);
      if (!parsed.success) {
        throw new ValidationError("Invalid collection ID", parsed.error.issues);
      }

      const collection = await this.service.getCollectionById(
        userId,
        parsed.data.id
      );
      sendSuccess(res, { collection }, 200);
    } catch (err) {
      next(err);
    }
  };

  public update = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const userId = req.user?.userId;
      if (!userId) throw new UnauthorizedError("Authentication required");

      const paramParsed = CollectionIdParamSchema.safeParse(req.params);
      if (!paramParsed.success) {
        throw new ValidationError(
          "Invalid collection ID",
          paramParsed.error.issues
        );
      }

      const bodyParsed = UpdateCollectionSchema.safeParse(req.body);
      if (!bodyParsed.success) {
        const details = bodyParsed.error.issues.map((i) => ({
          field: i.path.join("."),
          message: i.message,
        }));
        throw new ValidationError(
          bodyParsed.error.issues[0]?.message || "Validation failed",
          details
        );
      }

      const collection = await this.service.updateCollection(
        userId,
        paramParsed.data.id,
        bodyParsed.data
      );
      sendSuccess(res, { collection }, 200);
    } catch (err) {
      next(err);
    }
  };

  public delete = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const userId = req.user?.userId;
      if (!userId) throw new UnauthorizedError("Authentication required");

      const parsed = CollectionIdParamSchema.safeParse(req.params);
      if (!parsed.success) {
        throw new ValidationError("Invalid collection ID", parsed.error.issues);
      }

      const result = await this.service.deleteCollection(
        userId,
        parsed.data.id
      );
      sendSuccess(res, result, 200);
    } catch (err) {
      next(err);
    }
  };

  public addItem = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const userId = req.user?.userId;
      if (!userId) throw new UnauthorizedError("Authentication required");

      const paramParsed = CollectionIdParamSchema.safeParse(req.params);
      if (!paramParsed.success) {
        throw new ValidationError(
          "Invalid collection ID",
          paramParsed.error.issues
        );
      }

      const bodyParsed = AddCollectionItemSchema.safeParse(req.body);
      if (!bodyParsed.success) {
        throw new ValidationError(
          bodyParsed.error.issues[0]?.message || "Invalid request body",
          bodyParsed.error.issues
        );
      }

      const item = await this.service.addQuestionToCollection(
        userId,
        paramParsed.data.id,
        bodyParsed.data.questionId
      );
      sendSuccess(res, { item }, 201);
    } catch (err) {
      next(err);
    }
  };

  public removeItem = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const userId = req.user?.userId;
      if (!userId) throw new UnauthorizedError("Authentication required");

      const parsed = CollectionItemParamSchema.safeParse(req.params);
      if (!parsed.success) {
        throw new ValidationError(
          "Invalid parameter format",
          parsed.error.issues
        );
      }

      const result = await this.service.removeQuestionFromCollection(
        userId,
        parsed.data.id,
        parsed.data.questionId
      );
      sendSuccess(res, result, 200);
    } catch (err) {
      next(err);
    }
  };

  public exportPdf = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const userId = req.user?.userId;
      if (!userId) throw new UnauthorizedError("Authentication required");

      const parsed = CollectionIdParamSchema.safeParse(req.params);
      if (!parsed.success) {
        throw new ValidationError("Invalid collection ID", parsed.error.issues);
      }

      await this.service.exportCollectionPdf(userId, parsed.data.id, res);
    } catch (err) {
      next(err);
    }
  };
}

export const collectionController = new CollectionController();
