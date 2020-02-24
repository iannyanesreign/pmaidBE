import { BaseRouter } from '../../../utils/base-router';
import {JiraController} from "../controller/jira-controller";

export class JiraRoutes extends BaseRouter {

  public static path = '/jira';

  configRoute() {
    const controller: JiraController = new JiraController();

    /**
     * @swagger
     * /api/user:
     *   get:
     *     tags:
     *       - user
     *       - core
     *     summary: get all users
     *     produces:
     *       - application/json
     *     consumes:
     *       - application/json
     *     parameters:
     *     responses:
     *       200:
     *         description: return access token
     *         schema:
     *           $ref: '#/definitions/User'
     *       403:
     *         description: unauthorized
     *         schema:
     *           $ref: '#/definitions/Error'
     *     security:
     *       - Bearer: []
     */
    this._router.get('/project/:projectId/issues', controller.handleAllIssuesRequest);
    this._router.get('/issues/:issueId', controller.handleGetIssueRequest);
  }
}
