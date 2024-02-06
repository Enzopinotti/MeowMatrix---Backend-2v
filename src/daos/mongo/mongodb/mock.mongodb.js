import generateMockProduct from '../../../utils/mock.util.js';



export default class MockProductManagerMongo {
    constructor() {}

        // Mock de la base de datos
    

    getMockProducts = async () => {
        try {
            // Genera 100 productos ficticios
            console.log('se entra en la funcion get')
            const mockProducts = mockDatabase.generateMockProducts(100);
            return mockProducts;
        } catch (error) {
            throw error;
        }
    }

    getView = async () => {
        try {
            const result = await this.getMockProducts();
            return result;
        } catch (error) {
            console.log(error);
            return { status: "error", error: error.message }
        }
    }
}


const mockDatabase = {
    generateMockProducts: (count) => {
        console.log('se entra en la funcion estatica')
        const mockProducts = [];
        for (let i = 0; i < count; i++) {
            mockProducts.push(generateMockProduct());
        }
        return mockProducts;
    },
};

