import {BaseEntity, Entity, PrimaryGeneratedColumn, Column, OneToMany} from "typeorm";
import {Changelog} from "./Changelog";

@Entity()
export class Status extends BaseEntity {

    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    name: string;

    @OneToMany(type => Changelog, changelog => changelog.from) // note: we will create author property in the Photo class below
    froms: Changelog[];

    @OneToMany(type => Changelog, changelog => changelog.to) // note: we will create author property in the Photo class below
    tos: Changelog[];

}
