import  * as MockProductsService from '../services/mock.service.js';

export const getMockProducts = async (req, res) => {
    try {
        const mockProducts = await MockProductsService.getMockProductsService();
        res.sendSuccess(mockProducts);
    } catch (error) {
        console.log(error);
        res.sendServerError(error);
    }
};

export const getMockProductsView = async (req, res) => {
    try {
      const products = await MockProductsService.getMockProductsView();
      // Resto del código para manejar la respuesta y renderizar la vista
      const user = req.user;
      res.render('productsMock', {
        products: products,
        style: 'products.css',
        title: 'Productos Mockeados',
        user: user
      });
    } catch (error) {
        console.log(error);
        res.sendServerError(error);
    }
}
