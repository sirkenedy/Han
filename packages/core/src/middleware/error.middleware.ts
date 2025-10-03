import { Request, Response, NextFunction } from "express";
import { Logger } from "../utils";
import { HTTP_STATUS } from "../shared";

export const errorHandler = (
  error: Error,
  req: Request,
  res: Response,
  next: NextFunction,
): void => {
  Logger.error(`Error in ${req.method} ${req.path}`, error);

  // TODO: Add specific error handling for different error types
  // - ValidationError
  // - AuthenticationError
  // - DeploymentError
  // - GitHubAPIError

  const isDevelopment = process.env.NODE_ENV === "development";

  res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
    success: false,
    error: "Internal server error",
    message: isDevelopment ? error.message : "Something went wrong",
    ...(isDevelopment && { stack: error.stack }),
  });
};
