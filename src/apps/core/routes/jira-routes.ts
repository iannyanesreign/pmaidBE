import { BaseRouter } from '../../../utils/base-router';
import {JiraController} from "../controller/jira-controller";

export class JiraRoutes extends BaseRouter {

  public static path = '/jira';

  configRoute() {
    const controller: JiraController = new JiraController();

    // Requests
    /**
     * @swagger
     * /jira/projects:
     *   get:
     *     tags:
     *       - projects
     *     summary: Get all projects
     *     description: Produces an array of objects containing the id, key and last update of every project in the database
     *     produces:
     *       - application/json
     *     consumes:
     *       - application/json
     *     parameters:
     *     responses:
     *       200:
     *         description: successful operation
     *         schema:
     *           $ref: '#/definitions/Project'
     *       403:
     *         description: unauthorized
     *         schema:
     *           $ref: '#/definitions/Error'
     *     security:
     *       - Bearer: []
     */
    this._router.get('/projects', controller.getProjects);

    /**
     * @swagger
     * /jira/epics/{projectKey}:
     *   get:
     *     tags:
     *       - epics
     *     summary: Get all epic issues from a project
     *     description: Produces an array of objects containing the id, key and project id of all the epic issues from the given project
     *     produces:
     *       - application/json
     *     consumes:
     *       - application/json
     *     parameters:
     *       - name: "projectKey"
     *         in: "path"
     *         description: "Key of the project to fetch the epic issues from"
     *         required: true
     *         type: "string"
     *     responses:
     *       200:
     *         description: successful operation
     *         schema:
     *           $ref: '#/definitions/Epic'
     *       403:
     *         description: unauthorized
     *         schema:
     *           $ref: '#/definitions/Error'
     *     security:
     *       - Bearer: []
     */
    this._router.get('/epics/:projectKey', controller.getEpics);

    /**
     * @swagger
     * /jira/issuetypes/{projectKey}:
     *   get:
     *     tags:
     *       - issuetypes
     *     summary: Get all issue types from a project
     *     description: Produces an array of objects containing the id, name, workflow index, default status, and project id of all the issue types from the given project
     *     produces:
     *       - application/json
     *     consumes:
     *       - application/json
     *     parameters:
     *       - name: "projectKey"
     *         in: "path"
     *         description: "Key of the project to fetch the issue types from"
     *         required: true
     *         type: "string"
     *     responses:
     *       200:
     *         description: successful operation
     *         schema:
     *           $ref: '#/definitions/Issuetype'
     *       403:
     *         description: unauthorized
     *         schema:
     *           $ref: '#/definitions/Error'
     *     security:
     *       - Bearer: []
     */
    this._router.get('/issuetypes/:projectKey', controller.getIssuetypes);

    /**
     * @swagger
     * /jira/status-graph:
     *   get:
     *     tags:
     *       - status-graph
     *     summary: create values to graph status count evolution
     *     description: Produces an array of objects containing the name of an issue status and an array of values that represent the amount of issues with
     *                  said status on a determined date, the date interval consists of the last 20 days, counting from the
     *                  date of the project's last update.
     *
     *                  All the issues from the given project are counted but the issues can also be filtered by epic issue and by issue type.
     *     produces:
     *       - application/json
     *     consumes:
     *       - application/json
     *     parameters:
     *       - name: "projectkey"
     *         in: "query"
     *         description: "Key of the project to fetch the status counts from"
     *         required: true
     *         type: string
     *       - name: "epickey"
     *         in: "query"
     *         description: "Key of the epic issue to fetch the status counts from"
     *         type: string
     *       - name: "issuetype"
     *         in: "query"
     *         description: "Names of the issue types to fetch the status counts from"
     *         type: array
     *         items:
     *            type: string
     *         collectionFormat: "multi"
     *     responses:
     *       200:
     *         description: successful operation
     *         schema:
     *           type: array
     *           items:
     *             type: object
     *             properties:
     *               name:
     *                 type: string
     *               values:
     *                 type: array
     *                 items:
     *                   type: object
     *                   properties:
     *                     x:
     *                       type: string
     *                     y:
     *                       type: number
     *           example:
     *             - name: "Done"
     *               values: [{x: "2020-03-05", y: 10},{x: "2020-03-06", y: 11},{x: "2020-03-07", y: 15}]
     *             - name: "To Do"
     *               values: [{x: "2020-03-05", y: 5},{x: "2020-03-06", y: 4},{x: "2020-03-07", y: 0}]
     *       403:
     *         description: unauthorized
     *         schema:
     *           $ref: '#/definitions/Error'
     *     security:
     *       - Bearer: []
     */
    this._router.get('/status-graph', controller.getStatusGraph);

    /**
     * @swagger
     * /jira/load/projects:
     *   post:
     *     tags:
     *       - load
     *     summary: "Load all the projects into database"
     *     description: "Loads all the projects of the Jira Instance into the database by calling the Jira REST API"
     *     produces:
     *       - application/json
     *     consumes:
     *       - application/json
     *     parameters:
     *     responses:
     *       200:
     *         description: successful operation
     *       403:
     *         description: unauthorized
     *         schema:
     *           $ref: '#/definitions/Error'
     *     security:
     *       - Bearer: []
     */
    this._router.post('/load/projects', controller.loadProjects);

    /**
     * @swagger
     * /jira/load/project/{projectKey}:
     *   post:
     *     tags:
     *       - load
     *     summary: "Load all the project's data into database"
     *     description: "Loads all the projects of the Jira Instance into the database by calling the Jira REST API"
     *     produces:
     *       - application/json
     *     consumes:
     *       - application/json
     *     parameters:
     *       - name: "projectkey"
     *         in: "path"
     *         description: "Key of the project to load the data to"
     *         required: true
     *         type: string
     *     responses:
     *       200:
     *         description: successful operation
     *       403:
     *         description: unauthorized
     *         schema:
     *           $ref: '#/definitions/Error'
     *     security:
     *       - Bearer: []
     */
    this._router.post('/load/project/:projectKey', controller.loadProjectData);

  }


}
