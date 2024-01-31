import { faker } from '@faker-js/faker'

faker.location = 'es';

const generateProduct = () => {
    return {
        id: '',
        price: '',
        title: '',
        thumbnail: '',
        description: '',
        stock: '',
        code: '',
        category: '',
    }
}