import { NextFunction, Request, Response } from 'express';
import { BaseRouter } from '../../../utils/base-router';
import swaggerUiExpress from 'swagger-ui-express';
import swaggerJSDoc = require('swagger-jsdoc');
import config from '../../../config';

const options = {
  explorer: true,
  swaggerDefinition: {
    info: {
      title: config.appName,
      version: '1.0.0',
      description: 'Api Docs for Jira Report App',
    },
    basePath: '/',
    schemes: ['http', 'https'],
    tags: [
      {
        name: 'projects',
        description: "Everything about all projects of the jira instance"
      },
      {
        name: 'epics',
        description: "Everything about a project's epics"
      },
      {
        name: 'issuetypes',
        description: "Everything about a project's issue types"
      },
      {
        name: 'status-graph',
        description: 'Requests to display the status count graph',
      },
      {
        name: 'load',
        description: 'All the requests to the Jira API to update the database',
      },
    ],
  },
  /*swaggerOptions: {
    authAction: {
      Bearer: {
        name: 'Bearer',
        schema: {
          type: 'apiKey',
          in: 'header',
          name: 'Authorization',
          description: '',
        },
        value: 'Bearer <JWT>',
      },
    },
  },*/
  apis: [
    './src/apps/**/routes/*.ts',
    './src/apps/docs/docs/*.yaml',
  ],
};

const swaggerSpec = swaggerJSDoc(options);

export class SwaggerRoutes extends BaseRouter {

  public static path = '/docs';

  configRoute() {
    // tslint:disable-next-line:max-line-length
    this._router.use('/', swaggerUiExpress.serve, (req: Request, res: Response, next: NextFunction) => {
      // options.swaggerOptions.authAction.Bearer.value = `Bearer ${req.token}`;
      return swaggerUiExpress.setup(swaggerSpec)(req, res, next);
    });

    this._router.get('/swagger.json', (req, res) => {
      res.setHeader('Content-Type', 'application/json');
      res.send(swaggerSpec);
    });
  }
}
