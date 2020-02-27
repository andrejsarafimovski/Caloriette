import HTTP from "http-status-codes";
import { getConnection } from "typeorm";
import { Record } from "../entities";
import { codedError } from "../lib/coded-error";
import { UserManager } from "./user-manager";


export class RecordManager {

    private readonly userManager: UserManager;

    constructor() {
        this.userManager = new UserManager();
    }

    async get(id: string): Promise<Record> {
        const recordTable = getConnection().getRepository(Record);
        const record = await recordTable
            .createQueryBuilder("record")
            .where("record.id = :id", { id })
            .getOne();
        if (!record) {
            throw codedError(HTTP.NOT_FOUND, `Record with id ${id} not found`);
        }
        return record;
    }
}
