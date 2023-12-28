import categoryModel from "../daos/models/category.model.js"

export const getCategories = async (req, res)=>{
    try {
        const categories = await categoryModel.find( { isVisible:true } );
        res.status(200).json(categories);

    }catch (error) {
        res.status(500).json({message: error.message});
    };
}

export const postCategory = async (req, res)=>{
    const category = new categoryModel(req.body)
    try {
        const newCategory = await category.save();
        res.status(201).json(newCategory);

    }catch (error) {
        res.status(500).json({message: error.message});
    };
}

//!Uso un put en vez de un delete porque no quiero borrar la categoria, sino que quiero hacerla no visible
export const putCategory = async (req, res)=>{
    try {
        const category = await categoryModel.findByIdAndUpdate(
          req.params.id, req.body, { new: true, }  
        );
        if(!category){
            return res.status(404).json({message: 'Category not found'});
        }
        
        res.status(201).json(category);

    }catch (error) {
        res.status(500).json({message: error.message});
    };
}