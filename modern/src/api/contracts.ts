export type ApiErrorDetail = {
  field: string;
  message: string;
};

export type ErrorEnvelope = {
  error: {
    code: string;
    message: string;
    details?: readonly ApiErrorDetail[];
  };
};

export type SuccessEnvelope<T> = {
  data: T;
};

export type CategoryDto = {
  id: string;
  name: string;
  description: string;
  isVisible: boolean;
  createdAt: string;
};

export type ProductDto = {
  id: string;
  name: string;
  description: string | null;
  price: number;
  code: string;
  stock: number;
  categoryId: string | null;
  thumbnailUrls: readonly string[];
  status: boolean;
  isVisible: boolean;
  tags: readonly string[];
  createdAt: string;
  updatedAt: string;
};

export type CartLineDto = {
  productId: string;
  quantity: number;
  updatedAt: string;
};

export type CartDto = {
  id: string;
  userId: string;
  lines: readonly CartLineDto[];
};

export type UserDto = {
  id: string;
  name: string;
  lastName: string;
  email: string;
  role: "user" | "admin";
  avatarUrl: string | null;
};

export type TicketDto = {
  id: string;
  code: string;
  purchasedAt: string;
  amount: number;
  purchaserId: string;
};

export type OrderLineDto = {
  productId: string;
  name: string;
  unitPrice: number;
  quantity: number;
  lineTotal: number;
};

export type OrderDto = {
  id: string;
  code: string;
  purchaserId: string;
  status: "draft" | "confirmed" | "partially_fulfilled" | "cancelled";
  lines: readonly OrderLineDto[];
  total: number;
  createdAt: string;
};

export type ProductListQuery = {
  limit: number;
  offset: number;
  q: string | null;
  categoryId: string | null;
  sort: "newest" | "price_asc" | "price_desc";
};

export type ProductListDto = {
  items: readonly ProductDto[];
  total: number;
  limit: number;
  offset: number;
};

export class ContractValidationError extends Error {
  readonly details: readonly ApiErrorDetail[];

  constructor(details: readonly ApiErrorDetail[]) {
    super("Request validation failed");
    this.name = "ContractValidationError";
    this.details = details;
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function readString(
  record: Record<string, unknown>,
  key: string,
  options: { nullable?: boolean } = {},
): string | null {
  const value = record[key];
  if (options.nullable && value === null) {
    return null;
  }
  if (typeof value !== "string" || value.length === 0) {
    throw new ContractValidationError([
      { field: key, message: "Expected a non-empty string" },
    ]);
  }
  return value;
}

function readNumber(record: Record<string, unknown>, key: string): number {
  const value = record[key];
  if (typeof value !== "number" || !Number.isFinite(value)) {
    throw new ContractValidationError([
      { field: key, message: "Expected a finite number" },
    ]);
  }
  return value;
}

function readBoolean(record: Record<string, unknown>, key: string): boolean {
  const value = record[key];
  if (typeof value !== "boolean") {
    throw new ContractValidationError([
      { field: key, message: "Expected a boolean" },
    ]);
  }
  return value;
}

function readStringArray(
  record: Record<string, unknown>,
  key: string,
): readonly string[] {
  const value = record[key];
  if (!Array.isArray(value) || value.some((item) => typeof item !== "string")) {
    throw new ContractValidationError([
      { field: key, message: "Expected an array of strings" },
    ]);
  }
  return value;
}

export function parseEntityId(value: unknown, field = "id"): string {
  if (
    typeof value !== "string" ||
    value.length === 0 ||
    value.length > 128 ||
    !/^[A-Za-z0-9_-]+$/.test(value)
  ) {
    throw new ContractValidationError([
      { field, message: "Expected a valid entity identifier" },
    ]);
  }
  return value;
}

function parseIntegerQuery(
  value: unknown,
  field: string,
  fallback: number,
  maximum: number,
): number {
  if (value === undefined) {
    return fallback;
  }
  const candidate = Array.isArray(value) ? value[0] : value;
  if (typeof candidate !== "string" || !/^\d+$/.test(candidate)) {
    throw new ContractValidationError([
      { field, message: "Expected a non-negative integer" },
    ]);
  }
  const parsed = Number(candidate);
  if (!Number.isSafeInteger(parsed) || parsed < 0 || parsed > maximum) {
    throw new ContractValidationError([
      { field, message: `Expected a value between 0 and ${maximum}` },
    ]);
  }
  return parsed;
}

function parseOptionalQueryString(
  value: unknown,
  field: string,
  maximumLength: number,
): string | null {
  if (value === undefined) {
    return null;
  }
  const candidate = Array.isArray(value) ? value[0] : value;
  if (typeof candidate !== "string") {
    throw new ContractValidationError([
      { field, message: "Expected a string" },
    ]);
  }
  const trimmed = candidate.trim();
  if (trimmed.length === 0) {
    return null;
  }
  if (trimmed.length > maximumLength) {
    throw new ContractValidationError([
      { field, message: `Must be at most ${maximumLength} characters` },
    ]);
  }
  return trimmed;
}

export function parseProductListQuery(
  query: Record<string, unknown>,
): ProductListQuery {
  const limit = parseIntegerQuery(query.limit, "limit", 20, 100);
  if (limit === 0) {
    throw new ContractValidationError([
      { field: "limit", message: "Expected a value between 1 and 100" },
    ]);
  }

  const offset = parseIntegerQuery(query.offset, "offset", 0, 1_000_000);
  const q = parseOptionalQueryString(query.q, "q", 120);
  const categoryIdRaw = parseOptionalQueryString(
    query.categoryId,
    "categoryId",
    128,
  );
  const categoryId =
    categoryIdRaw === null
      ? null
      : parseEntityId(categoryIdRaw, "categoryId");

  const sortRaw = parseOptionalQueryString(query.sort, "sort", 32) ?? "newest";
  if (!(["newest", "price_asc", "price_desc"] as const).includes(
    sortRaw as "newest" | "price_asc" | "price_desc",
  )) {
    throw new ContractValidationError([
      {
        field: "sort",
        message: "Expected newest, price_asc, or price_desc",
      },
    ]);
  }

  return {
    limit,
    offset,
    q,
    categoryId,
    sort: sortRaw as ProductListQuery["sort"],
  };
}

export function decodeCategoryDto(value: unknown): CategoryDto {
  if (!isRecord(value)) {
    throw new ContractValidationError([
      { field: "category", message: "Expected an object" },
    ]);
  }
  return {
    id: parseEntityId(value.id),
    name: readString(value, "name") as string,
    description: readString(value, "description") as string,
    isVisible: readBoolean(value, "isVisible"),
    createdAt: readString(value, "createdAt") as string,
  };
}

export function decodeProductDto(value: unknown): ProductDto {
  if (!isRecord(value)) {
    throw new ContractValidationError([
      { field: "product", message: "Expected an object" },
    ]);
  }
  const categoryIdRaw = value.categoryId;
  const categoryId =
    categoryIdRaw === null ? null : parseEntityId(categoryIdRaw, "categoryId");
  return {
    id: parseEntityId(value.id),
    name: readString(value, "name") as string,
    description: readString(value, "description", { nullable: true }),
    price: readNumber(value, "price"),
    code: readString(value, "code") as string,
    stock: readNumber(value, "stock"),
    categoryId,
    thumbnailUrls: readStringArray(value, "thumbnailUrls"),
    status: readBoolean(value, "status"),
    isVisible: readBoolean(value, "isVisible"),
    tags: readStringArray(value, "tags"),
    createdAt: readString(value, "createdAt") as string,
    updatedAt: readString(value, "updatedAt") as string,
  };
}

export function decodeProductListDto(value: unknown): ProductListDto {
  if (!isRecord(value) || !Array.isArray(value.items)) {
    throw new ContractValidationError([
      { field: "productList", message: "Expected a product list object" },
    ]);
  }
  const total = readNumber(value, "total");
  const limit = readNumber(value, "limit");
  const offset = readNumber(value, "offset");
  if (
    !Number.isInteger(total) ||
    total < 0 ||
    !Number.isInteger(limit) ||
    limit < 1 ||
    !Number.isInteger(offset) ||
    offset < 0
  ) {
    throw new ContractValidationError([
      { field: "pagination", message: "Invalid pagination metadata" },
    ]);
  }
  return {
    items: value.items.map(decodeProductDto),
    total,
    limit,
    offset,
  };
}
