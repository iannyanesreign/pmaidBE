import { HealthController } from '../controller';
import { BaseRouter } from '../../../utils/base-router';

export class HealthRoutes extends BaseRouter {

  public static path = '/health';

  configRoute() {
    const controller: HealthController = new HealthController();


    this._router.get('/', controller.health);
  }
}
