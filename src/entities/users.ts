// tslint:disable:max-classes-per-file
import {
    Check,
    Column,
    Entity,
    PrimaryColumn,
} from "typeorm";
import { UserRole } from "../types";

// tslint:disable:quotemark
@Entity()
@Check(`"role" in ("user","admin","moderator")`)
@Check(`"expectedCaloriesPerDay" > 0`)
export class User {
    @PrimaryColumn({
        type: "varchar",
        length: 100,
        nullable: false
    })
    email: string;

    @Column({
        nullable: false,
        type: "varchar",
        length: 30
    })
    name: string;

    @Column({
        nullable: false,
        type: "varchar",
        length: 100
    })
    surname: string;

    @Column({
        nullable: false,
        type: "varchar",
        length: 255
    })
    password: string;

    @Column({
        nullable: false,
        type: "varchar",
        length: 100
    })
    role: UserRole;

    @Column({
        nullable: false,
        type: "int"
    })
    expectedCaloriesPerDay: number;
}
