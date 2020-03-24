import {BaseEntity, Entity, PrimaryGeneratedColumn, Column, ManyToOne, OneToMany} from "typeorm";
import {Project} from "./Project";
import {Changelog} from "./Changelog";
import {Sprint} from "./Sprint";
import {Epic} from "./Epic";
import {IssueType} from "./IssueType";

@Entity()
export class Issue extends BaseEntity {

    @PrimaryGeneratedColumn()
    id: number;

    @Column({nullable:true})
    key: string;

    @Column({ nullable: true })
    epicId: number;

    @Column({ nullable: true })
    projectId: number;

    @ManyToOne(type => Project, project => project.issues)
    project: Project;

    @OneToMany(type => Changelog, changelog => changelog.issue, {cascade:true}) // note: we will create author property in the Photo class below
    changelogs: Changelog[];

    @ManyToOne(type => Sprint, sprint => sprint.issues, {
        cascade: true,
    })
    sprint: Sprint;

    @ManyToOne(type => Epic, epic => epic.issues, {cascade:true})
    epic: Epic;

    @ManyToOne(type => IssueType, issuetype => issuetype.issues)
    issuetype: IssueType;

    
}
