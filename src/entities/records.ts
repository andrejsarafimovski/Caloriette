import {
    Check,
    Column,
    Entity,
    JoinColumn,
    ManyToOne,
    PrimaryColumn,
} from "typeorm";
import { User } from "./index";

// tslint:disable:quotemark
@Entity()
@Check(`"numberOfCalories" > 0`)
export class Record {

    @PrimaryColumn({
        type: "varchar",
        length: 36,
        nullable: false
    })
    id: string;

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

    @Column({
        type: "boolean",
        nullable: false
    })
    lessThanExpectedCalories: boolean;
}
