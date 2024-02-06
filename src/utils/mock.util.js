import { faker } from '@faker-js/faker';

faker.location = 'es';


const generateMockProduct = () => {
    return {
        id: faker.database.mongodbObjectId(),
        name: faker.commerce.productName(),
        description: faker.lorem.sentence(),
        price: faker.number.float({ min: 1, max: 1000, multipleOf: 0.01 }),
        code: faker.string.uuid(),
        stock: faker.number.int({ min: 1, max: 500 }),
        category: faker.commerce.department(),
        thumbnails: [faker.image.url()],
        status: true,
        isVisible: true,
        tags: [faker.lorem.word(), faker.lorem.word(), faker.lorem.word()],
        createdAt: faker.date.past(),
        updatedAt: faker.date.recent(),
    };
};

export default generateMockProduct;