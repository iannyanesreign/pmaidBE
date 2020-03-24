import {BaseEntity, Entity, PrimaryGeneratedColumn, Column, OneToMany} from "typeorm";
import {Issue} from "./Issue";
import {Epic} from "./Epic";
import {Sprint} from "./Sprint";
import {IssueType} from "./IssueType";

@Entity()
export class Project extends BaseEntity {

    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    key: string;

    @Column()
    lastLoad: Date;

    @OneToMany(type => Issue, issue => issue.project) // note: we will create author property in the Photo class below
    issues: Issue[];

    @OneToMany(type => Epic, epic => epic.project) // note: we will create author property in the Photo class below
    epics: Epic[];

    @OneToMany(type => Sprint, sprint => sprint.project) // note: we will create author property in the Photo class below
    sprints: Sprint[];

    @OneToMany(type => IssueType, issuetype => issuetype.project) // note: we will create author property in the Photo class below
    issuetypes: IssueType[];

}
