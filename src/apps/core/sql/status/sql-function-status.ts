import {isUndefined} from "util";

export class SqlFunctionStatus {

    static createDailyStatusCount(lastUpdate: string, projectKey: string, epicKey?: string, issueTypes?: string[] | string) {
        let issueTypesWhereString = '';
        if(!isUndefined(issueTypes)){
            if(Array.isArray(issueTypes)){
                for(let i = 0; i<issueTypes.length;i++){
                    if(i>0) issueTypesWhereString += 'OR ';
                    issueTypesWhereString += `ISSUE_TYPE.name = '${issueTypes[i]}' `;
                }
            }else{
                issueTypesWhereString = `ISSUE_TYPE.name = '${issueTypes}'`;
            }
            issueTypesWhereString = `AND (${issueTypesWhereString})`;
        }
        return `
        DROP FUNCTION daily_status;

        CREATE OR REPLACE FUNCTION daily_status()
        RETURNS TABLE (
            day DATE,
            status VARCHAR,
            total BIGINT
        ) AS $$
        DECLARE
            row RECORD;
        BEGIN
            -- create temporary table
            DROP TABLE IF EXISTS temp_change_logs;
            CREATE TEMPORARY TABLE temp_change_logs (
                t_issue_id INTEGER,
                t_date DATE,
                t_status VARCHAR
            );
        
            -- insert into temporary table
            FOR row IN
                SELECT
                    date_trunc('day', dd) :: DATE AS date
                FROM
                    generate_series('${lastUpdate}' :: DATE - 19, '${lastUpdate}' :: DATE, interval '1 day') AS dd
            LOOP
                INSERT INTO temp_change_logs (
                    t_issue_id,
                    t_date,
                    t_status
                )
                SELECT
                    DISTINCT ON (ISSUE.id)
                    ISSUE.id,
                    row.date,
                    CASE
                        WHEN LOG.timestamp IS NULL THEN 'To Do'
                        ELSE STATUS_TO.name
                    END
                FROM
                    project AS PROJECT
                INNER JOIN
                    issue AS ISSUE ON PROJECT.id = ISSUE."projectId"
                LEFT JOIN
                    changelog AS LOG ON ISSUE.id = LOG."issueId"
                LEFT JOIN
                    status AS STATUS_TO ON LOG."toId" = STATUS_TO.id
                ${issueTypes ? `
                INNER JOIN
                    issue_type AS ISSUE_TYPE ON ISSUE."issuetypeId" = ISSUE_TYPE.id` : ``}
                ${epicKey ? `
                INNER JOIN
                    epic AS EPIC ON ISSUE."epicId" = EPIC.id` : ``}
                WHERE
                    PROJECT.key = '${projectKey}'
                    ${epicKey ? `AND EPIC.key = '${epicKey}'` : ``}
                    ${issueTypesWhereString}
                    AND (LOG.timestamp <= row.date OR LOG.timestamp IS NULL)
                ORDER BY
                    ISSUE.id ASC,
                    LOG.timestamp DESC;
            END LOOP;
        
            RETURN QUERY SELECT
                t_date,
                t_status,
                count(t_status) AS total
            FROM
                temp_change_logs
            GROUP BY
                t_date,
                t_status
            ORDER BY
                t_status,
                t_date;
        END; $$
        LANGUAGE PLPGSQL;
     
        `;
    }

    static getDailyStatusCount(){
        return `SELECT * FROM daily_status()`
    }

    static getUniqueWorkflows(projectKey: string){
        return `
        SELECT
            DISTINCT ISSUE_TYPE."workflowIndex"
        FROM
            project AS PROJECT
        INNER JOIN
            issue_type as ISSUE_TYPE ON PROJECT.id = ISSUE_TYPE."projectId"
        WHERE
            PROJECT."key" = '${projectKey}'
    `
    }

    static getStatusList( projectKey: string, epicKey?: string, issueTypes?: string[] | string){
        let issueTypesWhereString = '';
        if(!isUndefined(issueTypes)){
            if(Array.isArray(issueTypes)){
                for(let i = 0; i<issueTypes.length;i++){
                    if(i>0) issueTypesWhereString += 'OR ';
                    issueTypesWhereString += `ISSUE_TYPE.name = '${issueTypes[i]}' `;
                }
            }else{
                issueTypesWhereString = `ISSUE_TYPE.name = '${issueTypes}'`;
            }
            issueTypesWhereString = `AND (${issueTypesWhereString})`;
        }
        return `
        SELECT
            DISTINCT CASE
                WHEN STATUS_TO.name IS NULL THEN ISSUE_TYPE."defaultStatus"
            ELSE STATUS_TO.name
        END AS STATUS
        FROM
            project AS PROJECT
        INNER JOIN
            issue AS ISSUE ON PROJECT.id = ISSUE."projectId"
        INNER JOIN
            issue_type AS ISSUE_TYPE ON ISSUE."issuetypeId" = ISSUE_TYPE.id
        ${epicKey ? `
        INNER JOIN
            epic AS EPIC ON ISSUE."epicId" = EPIC.id` : ``}
        LEFT JOIN
            changelog AS LOG ON ISSUE.id = LOG."issueId"
        LEFT JOIN
            status AS STATUS_TO ON LOG."toId" = STATUS_TO.id
        WHERE
            PROJECT.key = '${projectKey}'
            ${epicKey ? `AND EPIC.key = '${epicKey}'` : ``}
            ${issueTypesWhereString}
        ORDER BY
            STATUS
        `;
    }
}
