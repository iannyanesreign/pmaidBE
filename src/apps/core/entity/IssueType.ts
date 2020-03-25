import {BaseEntity, Entity, PrimaryGeneratedColumn, Column, ManyToOne, OneToMany} from "typeorm";
import {Project} from "./Project";
import {Issue} from "./Issue";

@Entity()
export class IssueType extends BaseEntity {

    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    name: string;

    @Column()
    workflowIndex: number;

    @Column({nullable:true})
    defaultStatus: string;

    @Column({ nullable: true })
    projectId: number;

    @ManyToOne(type => Project, project => project.issuetypes)
    project: Project;

    @OneToMany(type => Issue, issue => issue.issuetype) // note: we will create author property in the Photo class below
    issues: Issue[];

}
