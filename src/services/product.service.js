import { CategoryDao } from "../daos/factory.js";
import { ProductDao } from "../daos/factory.js";

<<<<<<< HEAD
export const getAllProducts = async (reqLogger) => {
    try {
        const products = await ProductDao.get(reqLogger);
        reqLogger.debug("En product.service.js: getAllProducts - Productos obtenidos.");
        return products;
    } catch (error) {
        reqLogger.error("En product.service.js: getAllProducts - Error al obtener todos los productos:", error);
        throw error;
    }
};

export const getProductsView = async (page, limit, sort, query, reqLogger) => {
    try {
        let queryOptions = { isVisible: true };
        let sortOptions = {};

        // Filtros basados en la query
        if (query && query.name) {
            queryOptions.name = { $regex: new RegExp(query.name, 'i') };
        }

        const totalDocs = await ProductDao.getCount(queryOptions, reqLogger);

        // Lógica de ordenamiento
        if (sort === 'date') {
            sortOptions = { createdAt: sort === 'asc' ? 1 : -1 };
        } else if (sort === 'price') {
            sortOptions = { price: sort === 'asc' ? 1 : -1 };
        }

        const productsResult = await ProductDao.getView(page, limit, sortOptions, queryOptions, reqLogger);

        const categoriesResponse = await CategoryDao.get(reqLogger);

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

        reqLogger.debug("En product.service.js: getProductsView - Vista de productos obtenida");

        return { products: { ...productsResult, docs: productsWithCategoryNames }, totalDocs };
    } catch (error) {
        reqLogger.error("En product.service.js: getProductsView - Error en getProductsView:", error);
        throw error;
    }
};

export const getProductsByIds = async (productIds, reqLogger) => {
    try {
        const products = await ProductDao.getById(productIds, reqLogger);
        reqLogger.debug("En product.service.js: getProductsByIds - Productos obtenidos por IDs");
        return products;
    } catch (error) {
        reqLogger.error("En product.service.js: getProductsByIds - Error al obtener productos por IDs:", error);
        throw error;
    }
};

export const createProduct = async (productData, reqLogger) => {
    try {
        const addedProduct = await ProductDao.add(productData, reqLogger);
        reqLogger.debug("En product.service.js: createProduct - Producto creado.");
        return addedProduct;
    } catch (error) {
        reqLogger.error("En product.service.js: createProduct - Error al crear producto:", error);
        throw error;
    }
};

export const updateProduct = async (productId, newData, reqLogger) => {
    try {
        const updatedProduct = await ProductDao.update(productId, newData, reqLogger);

        if (!updatedProduct) {
            reqLogger.error("En product.service.js: updateProduct - Producto no encontrado al intentar actualizar");
            return { status: "error", error: "Producto no encontrado" };
        }

        reqLogger.debug("En product.service.js: updateProduct - Producto actualizado.");
        return updatedProduct;
    } catch (error) {
        reqLogger.error("En product.service.js: updateProduct - Error al actualizar producto:", error);
        throw error;
    }
};



export const updateProductStock = async (productId, quantity, reqLogger) => {
    try {
        await ProductDao.updateProductStock(productId, quantity, reqLogger);
        reqLogger.debug(`En product.service.js: updateProductStock - Stock del producto con ID ${productId} actualizado a ${quantity}`);
    } catch (error) {
        reqLogger.error(`En product.service.js: updateProductStock - Error al actualizar stock del producto con ID ${productId}: ${error.message}`);
        throw new Error('Error updating product stock');
    }
};

export const checkProductStock = async (productId, quantity, reqLogger) => {
    try {
        const availableStock = await ProductDao.checkProductStock(productId, quantity, reqLogger);
        reqLogger.debug(`En product.service.js: checkProductStock - Stock disponible para el producto con ID ${productId}: ${availableStock}`);
        return availableStock;
    } catch (error) {
        reqLogger.error(`En product.service.js: checkProductStock - Error al verificar stock del producto con ID ${productId}: ${error.message}`);
        throw new Error('Error checking product stock');
    }
};

export const deleteProduct = async (productId, reqLogger) => {
    try {
        const existingProduct = await ProductDao.findById(productId, reqLogger);
        if (!existingProduct) {
            reqLogger.error("En product.service.js: deleteProduct - Producto no encontrado al intentar eliminar");
            return { status: "error", error: "Producto no encontrado" };
        }
        const deletedProduct = await ProductDao.delete(productId, reqLogger);
        reqLogger.debug("En product.service.js: deleteProduct - Producto eliminado:", deletedProduct);
        return deletedProduct;
    } catch (error) {
        reqLogger.error("En product.service.js: deleteProduct - Error al eliminar producto:", error);
        throw error;
    }
};
=======
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
>>>>>>> 0e70a0dcbc4ff2beb7a4acbb420353de4b8805bd
