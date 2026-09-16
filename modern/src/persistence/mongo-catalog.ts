import { ObjectId, type Collection, type Db, type Document } from "mongodb";
import type {
  CategoryDto,
  ProductDto,
  ProductListDto,
  ProductListQuery,
} from "../api/contracts.js";
import type { CatalogService } from "../domain/catalog.js";

function optionalString(value: unknown): string | null {
  return typeof value === "string" && value.length > 0 ? value : null;
}

function dateIso(value: unknown): string {
  if (value instanceof Date) return value.toISOString();
  if (typeof value === "string" && !Number.isNaN(Date.parse(value))) {
    return new Date(value).toISOString();
  }
  return new Date(0).toISOString();
}

function objectIdString(value: unknown): string | null {
  if (value instanceof ObjectId) return value.toHexString();
  if (typeof value === "string" && ObjectId.isValid(value)) {
    return new ObjectId(value).toHexString();
  }
  if (
    typeof value === "object" &&
    value !== null &&
    "_id" in value &&
    (value as { _id?: unknown })._id instanceof ObjectId
  ) {
    return (value as { _id: ObjectId })._id.toHexString();
  }
  return null;
}

export function mapMongoProduct(document: Document): ProductDto {
  const id = objectIdString(document._id);
  if (id === null) throw new Error("Mongo product is missing a valid _id");
  if (typeof document.name !== "string" || document.name.length === 0) {
    throw new Error("Mongo product is missing name");
  }
  if (typeof document.price !== "number" || !Number.isFinite(document.price)) {
    throw new Error("Mongo product is missing a finite price");
  }
  if (typeof document.stock !== "number" || !Number.isFinite(document.stock)) {
    throw new Error("Mongo product is missing finite stock");
  }
  if (typeof document.code !== "string" || document.code.length === 0) {
    throw new Error("Mongo product is missing code");
  }
  return {
    id,
    name: document.name,
    description: optionalString(document.description),
    price: document.price,
    code: document.code,
    stock: document.stock,
    categoryId: objectIdString(document.category),
    thumbnailUrls: Array.isArray(document.thumbnails)
      ? document.thumbnails.filter(
          (item: unknown): item is string => typeof item === "string",
        )
      : [],
    status: document.status !== false,
    isVisible: document.isVisible !== false,
    tags: Array.isArray(document.tags)
      ? document.tags.filter(
          (item: unknown): item is string => typeof item === "string",
        )
      : [],
    createdAt: dateIso(document.createdAt),
    updatedAt: dateIso(document.updatedAt ?? document.createdAt),
  };
}

function mapMongoCategory(document: Document): CategoryDto {
  const id = objectIdString(document._id);
  if (id === null) throw new Error("Mongo category is missing a valid _id");
  const name =
    typeof document.nameCategory === "string"
      ? document.nameCategory
      : document.name;
  if (typeof name !== "string" || name.length === 0) {
    throw new Error("Mongo category is missing name");
  }
  return {
    id,
    name,
    description:
      typeof document.description === "string" ? document.description : "",
    isVisible: document.isVisible !== false,
    createdAt: dateIso(document.createdAt),
  };
}

function escapeRegex(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

export class MongoCatalogService implements CatalogService {
  private readonly products: Collection<Document>;
  private readonly categories: Collection<Document>;

  constructor(db: Db) {
    this.products = db.collection("products");
    this.categories = db.collection("categories");
  }

  async listProducts(query: ProductListQuery): Promise<ProductListDto> {
    const filter: Document = { status: { $ne: false }, isVisible: { $ne: false } };
    if (query.q !== null) {
      filter.$or = [
        { name: { $regex: escapeRegex(query.q), $options: "i" } },
        { code: { $regex: escapeRegex(query.q), $options: "i" } },
        { tags: { $elemMatch: { $regex: escapeRegex(query.q), $options: "i" } } },
      ];
    }
    if (query.categoryId !== null && ObjectId.isValid(query.categoryId)) {
      filter.category = new ObjectId(query.categoryId);
    } else if (query.categoryId !== null) {
      return { items: [], total: 0, limit: query.limit, offset: query.offset };
    }

    const sort: Document =
      query.sort === "price_asc"
        ? { price: 1, _id: 1 }
        : query.sort === "price_desc"
          ? { price: -1, _id: 1 }
          : { createdAt: -1, _id: -1 };

    const [documents, total] = await Promise.all([
      this.products
        .find(filter)
        .sort(sort)
        .skip(query.offset)
        .limit(query.limit)
        .toArray(),
      this.products.countDocuments(filter),
    ]);

    return {
      items: documents.map(mapMongoProduct),
      total,
      limit: query.limit,
      offset: query.offset,
    };
  }

  async getProductById(id: string): Promise<ProductDto | null> {
    if (!ObjectId.isValid(id)) return null;
    const document = await this.products.findOne({
      _id: new ObjectId(id),
      status: { $ne: false },
      isVisible: { $ne: false },
    });
    return document === null ? null : mapMongoProduct(document);
  }

  async listCategories(): Promise<readonly CategoryDto[]> {
    const documents = await this.categories
      .find({ isVisible: { $ne: false } })
      .sort({ nameCategory: 1, _id: 1 })
      .toArray();
    return documents.map(mapMongoCategory);
  }

  async getCategoryById(id: string): Promise<CategoryDto | null> {
    if (!ObjectId.isValid(id)) return null;
    const document = await this.categories.findOne({
      _id: new ObjectId(id),
      isVisible: { $ne: false },
    });
    return document === null ? null : mapMongoCategory(document);
  }
}
