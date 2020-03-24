import rp from 'request-promise';

export class JiraExporter {
  private readonly jiraAuthorizationToken: string;
  private readonly jiraEndpoint: string;
  private readonly jiraRoutes: any;
  private jiraEpicField: string;

  constructor (params: any) {
    if (!params) throw new Error('missing params object');
    if (!params.jiraAuthorizationToken) throw new Error('missing Jira Authorization Token');
    if (!params.jiraEndpoint) throw new Error('missing Jira Endpoint');
    if (!params.jiraProduct) throw new Error('missing Jira Product Type');
    this.jiraAuthorizationToken = params.jiraAuthorizationToken;
    this.jiraEndpoint = params.jiraEndpoint;
    switch(params.jiraProduct) {
      case "Jira Server": {
        this.jiraRoutes =  this.defineJiraServerRoutes();
        break;
      }
      case "Jira Software":{
        this.jiraRoutes = this.defineJiraSoftwareRoutes();
        break;
      }
    default: {
        throw new Error('Invalid Jira Product Type');
      }
    }

  }

  setEpicField (epicField: string){
    this.jiraEpicField = epicField;
  }

  /**
   * Based on Jira Server REST API Reference 7.2.6
   */
  defineJiraServerRoutes(){
    let routes:any  = {};
    routes.getProjects = '/rest/api/2/project';
    routes.project = '/rest/api/2/project/';
    routes.search = '/rest/api/2/search';
    routes.fields = '/rest/api/2/field';
    return routes;
  }

  /**
   * Based on Jira Cloud REST API Version 3
   */
  defineJiraSoftwareRoutes(){
    let routes:any  = {};
    routes.getProjects = '/rest/api/3/project/search';
    routes.project = '/rest/api/3/project/';
    routes.search = '/rest/api/3/search';
    routes.fields = '/rest/api/3/field';
    return routes;
  }

  async makeJiraRequest (uri:any, method:any) {
    console.info(`making request: ${uri}`);
    const options = {
      uri: uri,
      headers: {
        Authorization: this.jiraAuthorizationToken
      },
      json: true,
      method: method
    };
    return rp(options);
  }

  async getProjects () {
    const endpoint = `${this.jiraEndpoint}${this.jiraRoutes.getProjects}`;
    return await this.makeJiraRequest(endpoint, 'GET');
  }

  async getFields () {
    const endpoint = `${this.jiraEndpoint}${this.jiraRoutes.fields}`;
    return await this.makeJiraRequest(endpoint, 'GET');
  }

  async getIssuetypes(projectKey: string) {
    const endpoint = `${this.jiraEndpoint}${this.jiraRoutes.project}${projectKey}/statuses`;
    return await this.makeJiraRequest(endpoint, 'GET');
  }

  async getAllIssues (projectKey: string, timestamp: string) {
    let endpoint = `${this.jiraEndpoint}${this.jiraRoutes.search}?maxResults=1&fields=created,project,issuetype,summary,priority,labels,
    status,${this.jiraEpicField}&expand=changelog&jql=project = '${projectKey}' AND updatedDate > "${timestamp}"
     ORDER BY created DESC`;
    let issues = [];
    const data = await this.makeJiraRequest(endpoint, 'GET');
    const total = data.total;
    for (let i = 0; i < total; i= i+100) {
      endpoint = `${this.jiraEndpoint}${this.jiraRoutes.search}?maxResults=100&startAt=${i}&fields=created,project,issuetype,summary,priority,labels,
      status,${this.jiraEpicField}&expand=changelog&jql=project = '${projectKey}' AND updatedDate > "${timestamp}"
      ORDER BY created DESC`;
      let result = await this.makeJiraRequest(endpoint, 'GET');
      for (let j = 0; j < result.issues.length; j++){
        issues.push(result.issues[j]);
      }
    }
    return issues;
  }


}
