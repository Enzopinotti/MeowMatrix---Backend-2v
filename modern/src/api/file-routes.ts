import multer from "multer";
import { Router, type RequestHandler } from "express";
import {
  parseOptionalOwnerId,
  parsePrivateFileId,
  parsePrivateFilePurpose,
  type PrivateFileDto,
} from "./file-contracts.js";
import type { SuccessEnvelope, UserDto } from "./contracts.js";
import { ApiError } from "./errors.js";
import type { AuthService } from "../domain/auth.js";
import type { PrivateFileService } from "../domain/private-files.js";
import {
  createCorsMiddleware,
  createOriginGuard,
  readSessionCookie,
  type BrowserSecurityOptions,
} from "../security/http.js";

const declaredMediaTypes = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "application/pdf",
]);

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024,
    files: 1,
    fields: 0,
    parts: 1,
    fieldNameSize: 32,
    headerPairs: 50,
  },
  fileFilter(_request, file, callback) {
    if (file.fieldname !== "file") {
      callback(new Error("Unexpected multipart file field"));
      return;
    }
    if (!declaredMediaTypes.has(file.mimetype.toLowerCase())) {
      callback(
        new ApiError(
          415,
          "FILE_TYPE_NOT_ALLOWED",
          "Declared file type is not allowed",
        ),
      );
      return;
    }
    callback(null, true);
  },
});

function multipartSingleFile(): RequestHandler {
  const middleware = upload.single("file");
  return (request, response, next) => {
    middleware(request, response, (error: unknown) => {
      if (error === undefined || error === null) {
        next();
        return;
      }
      if (error instanceof ApiError) {
        next(error);
        return;
      }
      if (error instanceof multer.MulterError) {
        if (error.code === "LIMIT_FILE_SIZE") {
          next(
            new ApiError(
              413,
              "FILE_TOO_LARGE",
              "Uploaded file exceeds the maximum multipart size",
            ),
          );
          return;
        }
        next(
          new ApiError(400, "MULTIPART_INVALID", "Multipart upload is invalid"),
        );
        return;
      }
      next(
        new ApiError(400, "MULTIPART_INVALID", "Multipart upload is invalid"),
      );
    });
  };
}

function asyncHandler(
  handler: (
    request: Parameters<RequestHandler>[0],
    response: Parameters<RequestHandler>[1],
  ) => Promise<void>,
): RequestHandler {
  return (request, response, next) => {
    void handler(request, response).catch(next);
  };
}

async function currentUser(
  request: Parameters<RequestHandler>[0],
  authService: AuthService,
): Promise<UserDto> {
  const token = readSessionCookie(request.get("cookie"));
  if (token === null) {
    throw new ApiError(401, "SESSION_INVALID", "Authentication required");
  }
  return authService.currentUser(token);
}

function encodedFilename(name: string): string {
  return encodeURIComponent(name).replace(/[!'()*]/g, (character) =>
    `%${character.charCodeAt(0).toString(16).toUpperCase()}`,
  );
}

export type PrivateFileRouterOptions = BrowserSecurityOptions & {
  authService: AuthService;
  privateFileService: PrivateFileService;
};

export function createPrivateFileRouter(options: PrivateFileRouterOptions) {
  const router = Router();
  const originGuard = createOriginGuard(options);

  router.use(createCorsMiddleware(options));
  router.use((_request, response, next) => {
    response.setHeader("Cache-Control", "private, no-store");
    response.setHeader("X-Content-Type-Options", "nosniff");
    next();
  });

  router.get(
    "/files",
    asyncHandler(async (request, response) => {
      const user = await currentUser(request, options.authService);
      const ownerId = parseOptionalOwnerId(request.query.ownerId);
      const items = await options.privateFileService.list(user, ownerId);
      const envelope: SuccessEnvelope<{ items: readonly PrivateFileDto[] }> = {
        data: { items },
      };
      response.status(200).json(envelope);
    }),
  );

  router.post(
    "/files/purposes/:purpose",
    originGuard,
    multipartSingleFile(),
    asyncHandler(async (request, response) => {
      const user = await currentUser(request, options.authService);
      const purpose = parsePrivateFilePurpose(request.params.purpose);
      if (!request.file) {
        throw new ApiError(
          400,
          "FILE_REQUIRED",
          "Exactly one multipart file field named 'file' is required",
        );
      }
      const created = await options.privateFileService.upload(user, purpose, {
        originalName: request.file.originalname,
        declaredMediaType: request.file.mimetype,
        buffer: request.file.buffer,
      });
      const envelope: SuccessEnvelope<typeof created> = { data: created };
      response.status(201).json(envelope);
    }),
  );

  router.get(
    "/files/:fileId",
    asyncHandler(async (request, response) => {
      const user = await currentUser(request, options.authService);
      const fileId = parsePrivateFileId(request.params.fileId);
      const metadata = await options.privateFileService.getMetadata(user, fileId);
      if (metadata === null) {
        throw ApiError.notFound("FILE_NOT_FOUND", "Private file was not found");
      }
      const envelope: SuccessEnvelope<typeof metadata> = { data: metadata };
      response.status(200).json(envelope);
    }),
  );

  router.get(
    "/files/:fileId/content",
    asyncHandler(async (request, response) => {
      const user = await currentUser(request, options.authService);
      const fileId = parsePrivateFileId(request.params.fileId);
      const download = await options.privateFileService.download(user, fileId);
      if (download === null) {
        throw ApiError.notFound("FILE_NOT_FOUND", "Private file was not found");
      }
      response.setHeader("Content-Type", download.metadata.mediaType);
      response.setHeader("Content-Length", String(download.content.length));
      response.setHeader(
        "Content-Disposition",
        `attachment; filename="private-file"; filename*=UTF-8''${encodedFilename(download.metadata.originalName)}`,
      );
      response.status(200).send(download.content);
    }),
  );

  router.delete(
    "/files/:fileId",
    originGuard,
    asyncHandler(async (request, response) => {
      const user = await currentUser(request, options.authService);
      const fileId = parsePrivateFileId(request.params.fileId);
      const deleted = await options.privateFileService.delete(user, fileId);
      if (!deleted) {
        throw ApiError.notFound("FILE_NOT_FOUND", "Private file was not found");
      }
      response.status(204).end();
    }),
  );

  return router;
}
