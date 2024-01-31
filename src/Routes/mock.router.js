


export default class MockRouter extends BaseRouter{
    init(){
      this.router.get('/mockingProducts', getMockProducts);
    }
};
  