import {BaseEntity, Entity, PrimaryGeneratedColumn, Column, OneToMany, ManyToOne} from "typeorm";
import {Issue} from "./Issue";
import {Project} from "./Project";

@Entity()
export class Epic extends BaseEntity {

    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    key: string;

    @Column({ nullable: true })
    projectId: number;

    @OneToMany(type => Issue, issues => issues.epic) // note: we will create author property in the Photo class below
    issues: Issue[];

    @ManyToOne(type => Project, project => project.epics, {cascade:true})
    project: Project;

}
