import {Request, Response} from 'express';
import config from '../../../config/default';
import {JiraExporter} from '../../../utils/jira-exporter';
import {Issue} from "../entity/Issue";
import {Project} from "../entity/Project";
import {IssueType} from "../entity/IssueType";
import {isUndefined} from "util";
import {Epic} from "../entity/Epic";
import {Changelog} from "../entity/Changelog";
import {Status} from "../entity/Status";
import {getManager} from "typeorm";
import {SqlFunctionStatus} from "../sql/status/sql-function-status";
import moment, {Moment} from "moment";

export class JiraController {
    jira: JiraExporter;
    private epicField: string;

    constructor() {
        const params = {
            jiraAuthorizationToken: config.jira.basicAuth,
            jiraEndpoint: config.jira.endpoint,
            jiraProduct: config.jira.product,
        };
        this.jira = new JiraExporter(params);
        this.setEpicField = this.setEpicField.bind(this);
        this.setEpicField();
        this.getStatusGraph = this.getStatusGraph.bind(this);
        this.loadProjects = this.loadProjects.bind(this);
        this.loadProjectData = this.loadProjectData.bind(this);
        this.loadIssuetypes = this.loadIssuetypes.bind(this);
        this.loadIssues = this.loadIssues.bind(this);

    }

    async setEpicField () {
        const fields = await this.jira.getFields();
        for (const field of fields){
            if (field.name == "Epic Link"){
                this.epicField = field.id;
                this.jira.setEpicField(field.id);
            }
        }
    }

    async getProjects(req: Request, res:Response) {
        const projects = await Project.find({order: {key:"ASC"}});
        return res.status(200).json(projects);
    }

    async getEpics(req: Request, res:Response){
        const projectKey = req.params.projectKey;
        if(isUndefined(projectKey)) return res.status(400);
        const project = await Project.findOne({key: projectKey});
        if(isUndefined(project)) return res.status(400).send('No existe projecto con la Key entregada');
        const epics = await Epic.find({projectId: project.id});
        return res.status(200).json(epics);
    }

    async getIssuetypes(req: Request, res:Response){
        const projectKey = req.params.projectKey;
        if(isUndefined(projectKey)) return res.status(400);
        const project = await Project.findOne({key: projectKey});
        if(isUndefined(project)) return res.status(400).send('No existe projecto con la Key entregada');
        const workflowCount = await getManager().query(SqlFunctionStatus.getUniqueWorkflows(projectKey));
        let issuetypeReturnArray = [];
        for(const workflow of workflowCount){
            issuetypeReturnArray.push(await IssueType.find({projectId: project.id, workflowIndex:workflow.workflowIndex}));
        }
        return res.status(200).json(issuetypeReturnArray);
    }

    async getStatusGraph (req: Request, res: Response){
        const projectKey = req.query.projectkey;
        const project = await Project.findOne({key:projectKey});
        if(isUndefined(project)) return res.status(400).send('No existe projecto con la Key entregada');
        const epicKey = req.query.epickey;
        const issuetypes = req.query.issuetype;
        const lastUpdate = moment(project.lastLoad).set({h:0,m:0,s:0,ms:0});
        const lastUpdateText = lastUpdate.format("YYYY-MM-DD");
        const entityManager = getManager();
        const statusList = await entityManager.query(SqlFunctionStatus.getStatusList(projectKey,epicKey,issuetypes));
        await entityManager.query(SqlFunctionStatus.createDailyStatusCount(lastUpdateText,projectKey,epicKey,issuetypes));
        const dailyStatusData = await this.getDailyStatusData(statusList,lastUpdate);
        return res.status(200).json(dailyStatusData);
    }

    async getDailyStatusData(statusList: any[], lastUpdate: Moment){
        const daysCounted = 19;
        const queryResults = await getManager().query(SqlFunctionStatus.getDailyStatusCount());
        const lastUpdateZero = moment(lastUpdate).set({h:0,m:0,s:0,ms:0});
        let dailyStatusData = [];
        let currIndex = 0;
        for (const status of statusList) {
            let statusResults = [];
            while(currIndex < queryResults.length && queryResults[currIndex].status == status.status){
                statusResults.push(queryResults[currIndex]);
                currIndex++;
            }
            let statusData = [];
            let iterDay = moment(moment(lastUpdateZero).subtract(daysCounted,'d'));
            if (statusResults.length != 0) {
                let currIndex = 0;
                while (currIndex < statusResults.length) {
                    while (iterDay < statusResults[currIndex].day) {
                        statusData.push({x: iterDay.format("YYYY-MM-DD"), y: 0});
                        iterDay.add(1,'d');
                    }
                    statusData.push({x: iterDay.format("YYYY-MM-DD"), y: statusResults[currIndex].total});
                    iterDay.add(1,'d');
                    currIndex += 1;
                }
                let prevDay = moment(iterDay);
                prevDay.subtract(1,'day');
                while (prevDay < lastUpdateZero) {
                    statusData.push({x: iterDay.format("YYYY-MM-DD"), y: 0});
                    iterDay.add(1,'d');
                    prevDay.add(1,'d');
                }
            }else{
                while (iterDay <= lastUpdateZero) {
                    statusData.push({x: iterDay.format("YYYY-MM-DD"), y: 0});
                    iterDay.add(1,'d');
                }
            }
            dailyStatusData.push({name: status.status, values: statusData});
        }
        return dailyStatusData;
    }

    async loadProjects (req: Request, res: Response){
        let projects = await this.jira.getProjects();
        if(!Array.isArray(projects)){
           projects = projects.values;
        }
        for(const project of projects){
            await this.createProject(project.key);
        }
        return res.status(200).json(projects);
    }

    async createProject (projectKey: string) {
        let project = await Project.findOne({key: projectKey});
        if( isUndefined(project) ){
            project = new Project();
            project.key = projectKey;
            project.lastLoad = moment('1995-12-25').toDate();
            await project.save();
        }
    }

    async loadProjectData (req: Request, res: Response){
        const projectKey = req.params.projectKey;
        if(isUndefined(projectKey)) return res.status(400);
        const project = await Project.findOne({key: projectKey});
        if(isUndefined(project)) return res.status(400).send('No existe projecto con la Key entregada');
        await this.loadIssuetypes(projectKey);
        await this.loadIssues(projectKey);
        return res.status(200).send('Data loaded Successfully');
    }

    async loadIssuetypes (projectKey: string){
        const issuetypes = await this.jira.getIssuetypes(projectKey);
        await this.createIssueTypes(issuetypes,projectKey);
    }

    async createIssueTypes(issuetypes: any[], projectKey: string) {
        const project = await Project.findOne({key: projectKey});
        let workflows: any[] = [];
        for(const issuetype of issuetypes){

            const existingIssue = await IssueType.findOne({projectId:project.id, name:issuetype.name});
            if ( !isUndefined(existingIssue)) continue;

            let issueStatusList = [];
            const defaultStatus = issuetype.statuses[0].name;
            for(const status of issuetype.statuses){
                issueStatusList.push(status.name);
            }
            let workflowIndex = this.searchForArrayInArray(workflows,issueStatusList);
            if(workflowIndex == -1){
                workflowIndex = workflows.length;
                workflows.push(issueStatusList);
            }
            await this.createIssueType(issuetype.name,project.id,workflowIndex,defaultStatus);
        }
    }

    searchForArrayInArray(arrayToSearch: any[], arrayToFind: any[]){
        let i: number, j: number, current: any;
        for(i = 0; i < arrayToSearch.length; ++i){
            if(arrayToFind.length === arrayToSearch[i].length){
                current = arrayToSearch[i];
                for(j = 0; j < arrayToFind.length && arrayToFind[j] === current[j]; ++j){}
                if(j === arrayToFind.length)
                    return i;
            }
        }
        return -1;
    }

    async createIssueType(name: string, projectId: number, workflowIndex: number, defaultStatus: string){
        const issuetype = new IssueType();
        issuetype.name = name;
        issuetype.workflowIndex = workflowIndex;
        issuetype.defaultStatus = defaultStatus;
        issuetype.project = await Project.findOne({id: projectId});
        await issuetype.save();
    }

    async loadIssues (projectKey: string ){
        const project = await Project.findOne({key:projectKey});
        const timestamp = moment(project.lastLoad).format('YYYY-MM-DD HH:mm');
        const issues = await this.jira.getAllIssues(projectKey,timestamp);
        for (const issue of issues){
            await this.createIssue(issue,project);
        }
        project.lastLoad = new Date();
        await project.save();
    }

    async createIssue(issue: any, project: Project) {
        let currentIssue = await Issue.findOne({key:issue.key});
        const issuetype = await IssueType.findOne({project: project, name: issue.fields.issuetype.name});
        if ( isUndefined(currentIssue)){
            currentIssue = new Issue();
            currentIssue.issuetype = issuetype;
            currentIssue.key = issue.key;
            currentIssue.project = project;
        }

        // Epic Link
        if (issue.fields[this.epicField] != null) {
            let epic = await Epic.findOne({key: issue.fields[this.epicField]});
            if (isUndefined(epic)) {
                epic = new Epic();
                epic.project = project;
                epic.key = issue.fields[this.epicField];
                await epic.save();
            }
            currentIssue.epic = epic;
        }

        await currentIssue.save();
        const lastLoad = moment(project.lastLoad);

        const initialChangelog = new Changelog();
        let defaultStatus = await Status.findOne({name:issuetype.defaultStatus});
        if ( isUndefined(defaultStatus)) {
            defaultStatus = new Status();
            defaultStatus.name = issuetype.defaultStatus;
            await defaultStatus.save();
        }
        initialChangelog.timestamp = issue.created;
        initialChangelog.from = defaultStatus;
        initialChangelog.to = defaultStatus;
        initialChangelog.issue = currentIssue;
        initialChangelog.timestamp = moment(issue.fields.created).toDate();
        await initialChangelog.save();

        for (const history of issue.changelog.histories){
            for (const item of history.items){
                if (item.field == 'status'){
                    const timestamp = moment(history.created);
                    if (timestamp.isAfter(lastLoad)){
                        const changelog = new Changelog();
                        let fromStatus = await Status.findOne({name: item.fromString});
                        if ( isUndefined(fromStatus)) {
                            fromStatus = new Status();
                            fromStatus.name = item.fromString;
                            await fromStatus.save();
                        }
                        changelog.from = fromStatus;
                        let toStatus = await Status.findOne({name: item.toString});
                        if ( isUndefined(toStatus)) {
                            toStatus = new Status();
                            toStatus.name = item.toString;
                            await toStatus.save();
                        }
                        changelog.to = toStatus;
                        changelog.issue = currentIssue;
                        changelog.timestamp = timestamp.toDate();
                        await changelog.save();
                    }
                }
            }
        }
    }

}
