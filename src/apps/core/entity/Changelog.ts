import {BaseEntity, Entity, PrimaryGeneratedColumn, Column, ManyToOne} from "typeorm";
import {Issue} from "./Issue";
import {Status} from "./Status";

@Entity()
export class Changelog extends BaseEntity {

    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    timestamp: Date;

    @Column({ nullable: true })
    issueId: number;

    @ManyToOne(type => Issue, issue => issue.changelogs)
    issue: Issue;

    @ManyToOne(type => Status, status => status.froms, {cascade:true})
    from: Status;

    @ManyToOne(type => Status, status => status.tos, {cascade:true})
    to: Status;

}
