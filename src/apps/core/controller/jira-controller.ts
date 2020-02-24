import { Request, Response } from 'express';
import config from '../../../config/default';
import { JiraExporter } from '../../../utils/jira-exporter';

export class JiraController {
  jira: JiraExporter;

  constructor() {
    this.jira = new JiraExporter({
      jiraAuthorizationToken: config.jira.basicAuth,
      jiraEndpoint: config.jira.endpoint,
    });
    this.handleGetIssueRequest  = this.handleGetIssueRequest.bind(this);
    this.handleAllIssuesRequest  = this.handleAllIssuesRequest.bind(this);
  }

  async handleGetIssueRequest (req: Request, res: Response) {
    const issueId = req.params.issueId;
    const issue = await this.jira.getIssue(issueId);
    return res.status(200).json(issue);
  }

  async handleAllIssuesRequest (req: Request, res: Response) {
    const projectKey = req.params.projectId;
    const issues = await this.jira.getAllIssues(projectKey);
    res.status(200).send(issues);
  }

}
