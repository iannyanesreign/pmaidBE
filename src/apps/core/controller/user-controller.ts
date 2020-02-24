import { Request, Response } from 'express';
import rp from 'request-promise';

export class UserController {

  async getUsers(req: Request, res: Response) {
    res.send([{
      name: 'foo',
    }, {
      name: 'bar',
    }]);
  }

  async makeJiraRequest (uri:any, method:any) {
    console.info(`making request: ${uri}`);
    const options = {
      uri,
      headers: {
        Authorization: `Basic UqvVge688ULPthYL2Qf7343C`
      },
      json: true,
      method
    };
    return rp(options);
  }

  async getIssue (req: Request, res: Response) {
    const endpoint = `https://jira.tigo.com.hn/rest/api/2/issue/ZL-256`;
    const options = {
      uri: endpoint,
      headers: {
        Authorization: `Basic c3ZpbGxhcnJvZWw6OTE4OTc1NWc=`
      },
      json: true,
      method: 'GET'
    };
    const result = await rp(options);
    console.log(result);
    res.status(200).send(result);
  }

}
