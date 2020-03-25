import bodyParser from 'body-parser';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { logger } from '@reignmodule/utils';
import "reflect-metadata";
import config from './config';
import { errors } from './utils/errors';
// Controllers (route handlers)
import { HealthRoutes } from './apps/health/routes';
import { UserRoutes } from './apps/core/routes/user-routes';
import { SwaggerRoutes } from './apps/docs/routes';
import { JiraRoutes } from './apps/core/routes/jira-routes';
import {buildPrefix} from "@reignmodule/utils/utils/logger";
import * as path from "path";
import {createConnection} from "typeorm";

const logParentPrefix = path.basename(__dirname, '.ts');
// Create Express server
class Server {
  public app: express.Application;

  constructor() {
    this.app = express();

    this.config();
    this.databaseSetup();
    this.swaggerSetup();
    this.routes();
    this.errorSetup();
  }

  public static bootstrap(): Server {
    return new Server();
  }

  config() {
    // Express configuration
    this.app.use(bodyParser.urlencoded(
      {
        extended: true,
      },
    ));
    this.app.use(bodyParser.json(
      {
        inflate: true,
      },
    ));

    // Allow Cross-Origin Resource Sharing and basic security
    this.app.use(cors());
    this.app.use(helmet());
  }

  private databaseSetup(): void {
    createConnection()
        .then(() => {
          return logger.info(`Successfully connected to database`);
        })
        .catch((err: any) => {
          logger.error(`Fatal Postgres connection: ${err}:${err.stack}`);
          return process.exit(1);
        });
  }

  private swaggerSetup() {

  }

  private static handleFatalError(err: any): void {
    logger.error(`'[fatal error]' ${err && err.message}`);
    logger.error(`'[fatal error]' ${err && err.stack}`);
    process.exit(1);
  }

  private errorSetup(): void {
    process.on('uncaughtException', Server.handleFatalError);
    process.on('unhandledRejection', Server.handleFatalError);

    this.app.use((err: any, req: express.Request, res: express.Response,
                  next: express.NextFunction) => {
      if (err.name === 'UnauthorizedError') {
        logger.error(err);
        next(new errors.UNAUTHORIZED({}));
      } else {
        next(err);
      }
    });

    this.app.use((err: any, req: express.Request, res: express.Response,
                  next: express.NextFunction) => {
      let responseError = err;

      if (!(responseError instanceof errors.BaseError)) {
        logger.error(err.stack);
        responseError = new errors.UNEXPECTED_ERROR({});

        /* istanbul ignore next */
        if (['development', 'test'].indexOf(config.env) >= 0) {
          responseError = new errors.UNEXPECTED_ERROR(err.toString());
        }
      }

      const errorMsg = [`${responseError.status}`, `${responseError.description}`,
        `${req.originalUrl}`, `${req.method}`, `${req.ip}`];
      logger.error(errorMsg.join(' - '));

      return res.status(responseError.status).json(responseError);
    });
  }

  routes() {
    /**
     * Primary app routes.
     */
    this.app.use(SwaggerRoutes.path, new SwaggerRoutes().router);
    this.app.use(HealthRoutes.path, new HealthRoutes().router);
    this.app.use(UserRoutes.path, new UserRoutes().router);
    this.app.use(JiraRoutes.path, new JiraRoutes().router);

  }

}

export default new Server().app;
