import type { Request, Response, NextFunction } from "express";
import { resumeService, ResumeService } from "./resume.service.js";
import { sendSuccess } from "../../core/responses/index.js";
import { BadRequestError, UnauthorizedError } from "../../core/errors/AppError.js";

export class ResumeController {
  constructor(private service: ResumeService = resumeService) {}

  public upload = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = req.user?.userId;
      if (!userId) throw new UnauthorizedError("Authentication required");

      if (!req.file || !req.file.buffer) {
        throw new BadRequestError("No resume file uploaded. Field 'file' is required.", "MISSING_FILE");
      }

      const result = await this.service.uploadResume(userId, req.file.buffer, req.file.originalname);
      sendSuccess(res, { resume: result }, 201);
    } catch (err) {
      next(err);
    }
  };

  public list = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = req.user?.userId;
      if (!userId) throw new UnauthorizedError("Authentication required");

      const resumes = await this.service.listResumes(userId);
      sendSuccess(res, { resumes }, 200);
    } catch (err) {
      next(err);
    }
  };

  public getById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = req.user?.userId;
      if (!userId) throw new UnauthorizedError("Authentication required");

      const resumeId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
      const resume = await this.service.getResume(resumeId, userId);
      sendSuccess(res, { resume }, 200);
    } catch (err) {
      next(err);
    }
  };

  public download = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = req.user?.userId;
      if (!userId) throw new UnauthorizedError("Authentication required");

      const resumeId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
      const { buffer, mimeType, originalFileName } = await this.service.getResumeForDownload(resumeId, userId);

      res.setHeader("Content-Type", mimeType);
      res.setHeader("Content-Disposition", `attachment; filename="${encodeURIComponent(originalFileName)}"`);
      res.setHeader("Content-Length", buffer.length);
      res.status(200).send(buffer);
    } catch (err) {
      next(err);
    }
  };

  public setPrimary = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = req.user?.userId;
      if (!userId) throw new UnauthorizedError("Authentication required");

      const resumeId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
      const resume = await this.service.setPrimaryResume(resumeId, userId);
      sendSuccess(res, { resume }, 200);
    } catch (err) {
      next(err);
    }
  };

  public delete = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = req.user?.userId;
      if (!userId) throw new UnauthorizedError("Authentication required");

      const resumeId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
      await this.service.deleteResume(resumeId, userId);
      sendSuccess(res, { message: "Resume deleted successfully" }, 200);
    } catch (err) {
      next(err);
    }
  };

  public analyze = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = req.user?.userId;
      if (!userId) throw new UnauthorizedError("Authentication required");

      const resumeId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
      const result = await this.service.analyzeResume(userId, resumeId);
      sendSuccess(res, result, 200);
    } catch (err) {
      next(err);
    }
  };

  public getAnalysis = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = req.user?.userId;
      if (!userId) throw new UnauthorizedError("Authentication required");

      const resumeId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
      const analysis = await this.service.getResumeAnalysis(userId, resumeId);
      sendSuccess(res, { analysis }, 200);
    } catch (err) {
      next(err);
    }
  };

  public getParsedData = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = req.user?.userId;
      if (!userId) throw new UnauthorizedError("Authentication required");

      const resumeId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
      const parsedData = await this.service.getParsedResumeData(userId, resumeId);
      sendSuccess(res, { parsedData }, 200);
    } catch (err) {
      next(err);
    }
  };
}

export const resumeController = new ResumeController();

