import {BaseEntity, Entity, PrimaryGeneratedColumn, Column, OneToMany, ManyToOne} from "typeorm";
import {Issue} from "./Issue";
import {Project} from "./Project";

@Entity()
export class Sprint extends BaseEntity {

    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    key: string;

    @OneToMany(type => Issue, issue => issue.sprint) // note: we will create author property in the Photo class below
    issues: Issue[];

    @ManyToOne(type => Project, project => project.sprints)
    project: Project;
}
