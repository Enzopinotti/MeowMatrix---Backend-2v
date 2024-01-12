import productModel from "../daos/models/product.model.js";
import categoryModel from "../daos/models/category.model.js";


export const getAllProductsInDatabase = async () => {
  try {
    return await productModel.find();
  } catch (error) {
    throw error;
  }
};

export const getProductsViewInDatabase = async (page, limit, sort, query) => {
  try {
    let queryOptions = { isVisible: true };
    let sortOptions = {};

    // Filtros basados en la query
    if (query && query.name) {
      queryOptions.name = { $regex: new RegExp(query.name, 'i') };
    }

    const totalDocs = await productModel.countDocuments(queryOptions);

    // Lógica de ordenamiento
    if (sort === 'date') {
      sortOptions = { createdAt: sort === 'asc' ? 1 : -1 };
    } else if (sort === 'price') {
      sortOptions = { price: sort === 'asc' ? 1 : -1 };
    }

    const options = {
      page: parseInt(page),
      limit: parseInt(limit),
      sort: sortOptions,
    };

    const products = await productModel.paginate(queryOptions, options);

    // Obtener información adicional, como categorías
    const categoryIds = products.docs.map(product => product.category);
    const uniqueCategoryIds = [...new Set(categoryIds)];
    const categories = await categoryModel.find({ _id: { $in: uniqueCategoryIds } }, 'nameCategory');
    const categoryMap = {};
    categories.forEach(category => {
      categoryMap[category._id.toString()] = category.nameCategory;
    });
    const productsWithCategoryNames = products.docs.map(product => {
      return {
        ...product.toObject(),
        category: categoryMap[product.category.toString()]
      };
    });

    return { products: { ...products, docs: productsWithCategoryNames }, totalDocs };
  } catch (error) {
    throw error;
  }
};

export const getProductsByIdsFromDatabase = async (productIds) => {
  try {
    return await productModel.findById(productIds).populate('category', 'nameCategory').lean();
  } catch (error) {
    throw error;
  }
};

export const updateProductInDatabase = async (productId, newData) => {
  try {
    return await productModel.findByIdAndUpdate(productId, newData, { new: true });
  } catch (error) {
    throw error;
  }
};

export const deleteProductFromDatabase = async (productId) => {
  try {
    const result = await productModel.findById(productId);
    if (!result) {
      return null; // No hay nada para eliminar
    }
    return await productModel.deleteOne(result);
  } catch (error) {
    throw error;
  }
};

export const createProductInDatabase = async (productData) => {
  try {
    const product = new productModel(productData);
    return await product.save();
  } catch (error) {
    throw error;
  }
};