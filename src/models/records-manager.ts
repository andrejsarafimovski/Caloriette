import HTTP from "http-status-codes";
import { FindManyOptions, getConnection, Repository } from "typeorm";
import uuid from "uuid";

import { config } from "../config";
import { Record } from "../entities";
import { codedError } from "../lib/coded-error";
import { UserRole } from "../types";
import { CreateRecordRequest, CreateRecordResponse, DeleteRecordRequest, DeleteRecordResponse, GetAllRecordsResponse, GetAllUsersResponse, GetRecordResponse } from "../types/schema-generated";
import { UserManager } from "./user-manager";


export class RecordManager {

    private readonly userManager: UserManager;
    private readonly recordTable: Repository<Record>;

    constructor(
        private readonly authUserEmail: string,
        private readonly authUserRole: UserRole
    ) {
        this.recordTable = getConnection().getRepository(Record);
        this.userManager = new UserManager(authUserEmail, authUserRole);
    }

    async get(id: string): Promise<GetRecordResponse> {
        const record = await this.recordTable.findOne(id);
        if (!record) {
            throw codedError(HTTP.NOT_FOUND, `Record with id ${id} not found`);
        }
        return record;
    }

    async getAll(userEmail?: string, page?: number): Promise<GetAllRecordsResponse> {
        const findOptions: FindManyOptions<Record> = {};
        if (page) {
            findOptions.take = config.pagination.resultsPerPage;
            findOptions.skip = (page - 1) * config.pagination.resultsPerPage;
        }
        if (userEmail) {
            findOptions.where = { userEmail };
        }
        if (this.authUserRole !== "admin") {
            findOptions.where = { userEmail: this.authUserEmail };
        }
        return this.recordTable.find(findOptions);
    }

    async create(createRecord: CreateRecordRequest): Promise<CreateRecordResponse> {
        if (
            this.authUserRole !== "admin" &&
            createRecord.userEmail !== this.authUserEmail
        ) {
            throw codedError(HTTP.FORBIDDEN, "User is not authorized to perform this action");
        }

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
        await this.recordTable.delete(id);
        return { done: true };
    }

    async updateRecordsCaloriesForUser(userEmail: string, expectedCaloriesPerDay: number) {
        const userRecords = await this.getAll(userEmail);
        const userRecordsByDate = userRecords.reduce((acc, ur) => {
            if (!acc[ur.date]) {
                acc[ur.date] = [];
            }
            acc[ur.date].push(ur);
            return {
                ...acc
            };
        }, {} as { [key: string]: Record[] });
        const updatedUserRecords = Object.values(userRecordsByDate).reduce((acc, ur) => {
            let totalCalories = 0;
            const upur = ur.map(r => {
                totalCalories += r.numberOfCalories;
                return {
                    ...r,
                    lessThanExpectedCalories: expectedCaloriesPerDay > totalCalories,
                };
            });
            return [...acc, ...upur];
        }, [] as Record[]);
        await Promise.all(
            updatedUserRecords.map(uur => this.recordTable.update(uur.id, uur))
        );
    }

    private async getCalories(text: string) { // TODO
        return 0;
    }

    private async getUserCaloriesForTheDay(userEmail: string): Promise<number> {
        const todayRecords = await this.recordTable.find({ userEmail });
        return todayRecords.reduce((total, record) => total + record.numberOfCalories, 0);
    }
}
