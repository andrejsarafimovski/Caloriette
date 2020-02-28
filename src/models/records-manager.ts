import HTTP from "http-status-codes";
import { Repository } from "typeorm";
import uuid from "uuid";

import { Record } from "../entities";
import { codedError } from "../lib/coded-error";
import { CreateRecordRequest, CreateRecordResponse, DeleteRecordRequest, DeleteRecordResponse, GetRecordResponse } from "../types/schema-generated";
import { UserManager } from "./user-manager";


export class RecordManager {

    private readonly userManager: UserManager;
    private readonly recordTable: Repository<Record>;

    constructor() {
        this.userManager = new UserManager();
    }

    async get(id: string): Promise<GetRecordResponse> {
        const record = await this.recordTable.findOne({ id });
        if (!record) {
            throw codedError(HTTP.NOT_FOUND, `Record with id ${id} not found`);
        }
        return record;
    }

    async create(createRecord: CreateRecordRequest): Promise<CreateRecordResponse> {
        const id = uuid.v4();
        const user = await this.userManager.get(createRecord.userEmail);

        const record: Record = {
            date: createRecord.date,
            id,
            lessThanExpectedCalories: user.expectedCaloriesPerDay > await this.getUserCaloriesForTheDay(createRecord.userEmail), // tbd
            numberOfCalories: createRecord.numberOfCalories || await this.getCalories(createRecord.text), // tbd
            text: createRecord.text,
            time: createRecord.time,
            userEmail: createRecord.userEmail
        };
        await this.recordTable.insert(record);
        return {
            done: true,
            id
        };
    }

    async delete(id: string): Promise<DeleteRecordResponse> {
        await this.get(id);
        await this.recordTable.delete({ id });
        return { done: true };
    }

    private async getCalories(text: string) { // TODO
        return 0;
    }

    private async getUserCaloriesForTheDay(userEmail: string): Promise<number> {
        const todayRecords = await this.recordTable.find({ userEmail });
        return todayRecords.reduce((total, record) => total + record.numberOfCalories, 0);
    }
}
