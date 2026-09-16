import { ApiError } from "../api/errors.js";
import type {
  CategoryDto,
  ProductDto,
  ProductListDto,
  ProductListQuery,
} from "../api/contracts.js";

export interface CatalogService {
  listProducts(query: ProductListQuery): Promise<ProductListDto>;
  getProductById(id: string): Promise<ProductDto | null>;
  listCategories(): Promise<readonly CategoryDto[]>;
  getCategoryById(id: string): Promise<CategoryDto | null>;
}

class UnavailableCatalogService implements CatalogService {
  private unavailable(): never {
    throw ApiError.unavailable(
      "CATALOG_UNAVAILABLE",
      "Catalog persistence is not connected to the 2026 API authority yet",
    );
  }

  async listProducts(_query: ProductListQuery): Promise<ProductListDto> {
    return this.unavailable();
  }

  async getProductById(_id: string): Promise<ProductDto | null> {
    return this.unavailable();
  }

  async listCategories(): Promise<readonly CategoryDto[]> {
    return this.unavailable();
  }

  async getCategoryById(_id: string): Promise<CategoryDto | null> {
    return this.unavailable();
  }
}

export const unavailableCatalogService: CatalogService =
  new UnavailableCatalogService();
