import rp from 'request-promise';

export class JiraExporter {
  private readonly jiraAuthorizationToken: string;
  private readonly jiraEndpoint: string;

  constructor (params: any) {
    if (!params) throw new Error('missing params object');
    if (!params.jiraAuthorizationToken) throw new Error('missing Jira Authorization Token');
    if (!params.jiraEndpoint) throw new Error('missing Jira Endpoint');
    this.jiraAuthorizationToken = params.jiraAuthorizationToken;
    this.jiraEndpoint = params.jiraEndpoint;
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

  async getIssue (issueId:string) {
    const endpoint = `${this.jiraEndpoint}/rest/api/2/issue/${issueId}?&expand=changelog`;
    return await this.makeJiraRequest(endpoint, 'GET');
  }

  async getAllIssues (projectKey: string) {
    const issueTypes = ['Task'];
    let issueTypeParam = ''; //issuetype= Task OR issuetype= Sub-Task OR issuetype = Incident OR issuetype = Story
    for (let i = 0; i < issueTypes.length; i++) {
      issueTypeParam += `issueType= ${issueTypes[i]}`;
      if (i < issueTypes.length - 1) {
        issueTypeParam += ' OR ';
      }
    }
    const endpoint = `${this.jiraEndpoint}/rest/api/2/search?maxResults=100&fields=summary,priority,labels,status,customfield_10804&expand=changelog&jql=project = ${projectKey} AND (${issueTypeParam}) ORDER BY created DESC`;
    return await this.makeJiraRequest(endpoint, 'GET');
  }

}
