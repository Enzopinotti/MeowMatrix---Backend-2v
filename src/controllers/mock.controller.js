

export const getMockProducts = async (req, res) => {
    try {
        const products = await Product.find();
        
      } catch (error) {
        console.log(error);
        res.sendServerError(error);
    }
}