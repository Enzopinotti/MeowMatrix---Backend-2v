import categoryModel from "../daos/models/category.model.js";
import productModel from "../daos/models/product.model.js";

export const getProducts = async (req, res) => {

    const { page = 1, limit = 4, sort, query } = req.query;

    try {
        let queryOptions = { isVisible: true }; // Acá guardo las Queries que haga 
        let sortOptions = { }; // Acá guardo el tipo de ordenamiento que haga

        // Filtros basados en la query

        if (query && query.name) {
            queryOptions.name = { $regex: new RegExp(query.name, 'i') };
        }

        // Obtener el número total de documentos
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
        const categoryIds = products.docs.map(product => product.category);

        // Elimina IDs duplicados
        const uniqueCategoryIds = [ ...new Set( categoryIds  ) ];
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

        const user = req.session.user;

        res.render('products', {
            products: productsWithCategoryNames,
            totalPages: products.totalPages,
            currentPage: products.page,
            hasNextPage: products.hasNextPage,
            hasPrevPage: products.hasPrevPage,
            prevLink: products.prevPage ? `/products?page=${products.prevPage}&limit=${limit}` : null,
            nextLink: products.nextPage ? `/products?page=${products.nextPage}&limit=${limit}` : null,
            totalDocs: totalDocs,
            style: 'products.css',
            title: 'Productos',
            user: user
        });

    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

export const getProductById  = async (req, res) => {
    try {
        const productId = req.params.productId;
       
        const product = await productModel.findById(productId).populate('category', 'nameCategory').lean(); // Asumiendo que 'category' es una referencia al modelo de categorías     
        if (!product) {
            return res.status(404).json({ error: 'Producto no encontrado' });
        }

        // Renderizar la vista de detalles del producto y pasar la información
        res.render('details', {
            product: product,
            style: 'details.css',
            title: 'Detalles del producto',
            // Otros datos que quieras enviar a la vista
        });
        
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

export const updateProduct = async (req, res) => {
    try {
        const updatedProduct = await productModel.findByIdAndUpdate(
          req.params.pid, req.body, { new: true, }  
        );
        if(!updatedProduct){
          return res.status(404).json({message: 'Product not found'});
        }
          res.status(200).json(updatedProduct);
    } catch (error) {
          res.status(500).json({ error: error.message });
    }
};

export const deleteProduct = async (req, res) => {
    const productId = req.params.pid;
  
    try {
        const result = await productModel.findById(productId);
        const productEliminated = await productModel.deleteOne(result);
        res.status(200).json(productEliminated);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

export const createProduct = async (req, res) => {
    const product = new productModel(req.body)

  try {
    const addedProduct = await product.save();
    res.status(201).json(addedProduct);
  }
  catch (error) {
    res.status(500).json({ error: error.message });
  }
}