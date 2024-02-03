import { CategoryDao } from "../daos/factory.js";
import { ProductDao } from "../daos/factory.js";

export const getAllProducts = async () => {
  try {
    return await ProductDao.get();
  } catch (error) {
    throw error;
  }
};

export const getProductsView = async (page, limit, sort, query) => {
  try {
    let queryOptions = { isVisible: true };
    let sortOptions = {};

    // Filtros basados en la query
    if (query && query.name) {
      queryOptions.name = { $regex: new RegExp(query.name, 'i') };
    }

    const totalDocs = await ProductDao.getCount(queryOptions);

    // Lógica de ordenamiento
    if (sort === 'date') {
      sortOptions = { createdAt: sort === 'asc' ? 1 : -1 };
    } else if (sort === 'price') {
      sortOptions = { price: sort === 'asc' ? 1 : -1 };
    }

    const productsResult = await ProductDao.getView(page, limit, sortOptions, queryOptions);
    

    // Obtener información adicional, como categorías
    const categoryIds = productsResult.docs.map(product => product.category);
    const uniqueCategoryIds = [...new Set(categoryIds)];
    const categoriesResponse = await CategoryDao.get(uniqueCategoryIds);
    
    const categories = categoriesResponse.payload;
    const categoryMap = {};
    categories.forEach(category => {
      categoryMap[category._id.toString()] = category.nameCategory;
    });

    const productsWithCategoryNames = productsResult.docs.map(product => {
      return {
        ...product.toObject(),
        category: categoryMap[product.category.toString()]
      };
    });

    return { products: { ...productsResult, docs: productsWithCategoryNames }, totalDocs };
  } catch (error) {
    console.error("Error in getProductsView:", error);
    throw error;
  }
};

export const getProductsByIds = async (productIds) => {
  try {
    return await ProductDao.getById(productIds);
  } catch (error) {
    throw error;
  }
};
export const createProduct = async (productData) => {
  try {
    return await ProductDao.add(productData);
  } catch (error) {
    throw error;
  }
};
export const updateProduct = async (productId, newData) => {
  try {
    return await ProductDao.update(productId, newData);
  } catch (error) {
    throw error;
  }
};

export const deleteProduct = async (productId) => {
  try {
    return await ProductDao.delete(productId);
  } catch (error) {
    throw error;
  }
};

export const updateProductStock = async (productId, quantity) => {
  try {
    // Llama a ProductDAO para actualizar el stock del producto
    await ProductDao.updateProductStock(productId, quantity);
  } catch (error) {
    // Manejar errores según sea necesario
    console.error(`Error updating product stock: ${error.message}`);
    throw new Error('Error updating product stock');
  }
};

export const checkProductStock = async (productId, quantity) => {
  try {
    // Llama a ProductDAO para verificar el stock del producto
    const availableStock = await ProductDao.checkProductStock(productId, quantity);
    return availableStock;
  } catch (error) {
    // Manejar errores según sea necesario
    console.error(`Error checking product stock: ${error.message}`);
    throw new Error('Error checking product stock');
  }
};
