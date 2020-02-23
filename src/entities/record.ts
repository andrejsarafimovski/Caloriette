import {
    Check,
    Column,
    Entity,
    JoinColumn,
    ManyToOne,
    OneToOne,
    PrimaryColumn,
    PrimaryGeneratedColumn,
    ViewColumn,
    ViewEntity
} from "typeorm";
import { User } from "./index";

@Entity()
export class Record {
    @PrimaryColumn()
    @ManyToOne(type => User, { cascade: true, nullable: false })
    @JoinColumn()
    userId: string;

    @Column({
        nullable: false,
        type: "varchar",
        length: 100
    })
    date: string;

    @Column({
        nullable: false,
        type: "varchar",
        length: 100
    })
    time: string;

    @Column({
        nullable: false,
        type: "varchar",
        length: 255
    })
    text: string;

    @Column({
        nullable: false,
        type: "int"
    })
    numberOfCalories: number;
}

