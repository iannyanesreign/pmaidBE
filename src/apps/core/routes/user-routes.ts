import { UserController } from '../controller/user-controller';
import { BaseRouter } from '../../../utils/base-router';

export class UserRoutes extends BaseRouter {

  public static path = '/api/user';

  configRoute() {
    const controller: UserController = new UserController();
  }
}
