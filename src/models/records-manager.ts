import HTTP from "http-status-codes";
import { getConnection, Repository } from "typeorm";
import uuid from "uuid";

import { NutritionX } from "../actions/nutritionx";
import { Record } from "../entities";
import { codedError } from "../lib/coded-error";
import { UserRole } from "../types";
import { CreateRecordRequest, CreateRecordResponse, DeleteRecordRequest, DeleteRecordResponse, GetAllRecordsRequest, GetAllRecordsResponse, GetAllUsersResponse, GetRecordRequest, GetRecordResponse, GetUserRequest, UpdateRecordRequest, UpdateRecordResponse } from "../types/schema-generated";
import { UserManager } from "./user-manager";


export class RecordManager {

    private readonly recordTable: Repository<Record>;
    private readonly nutritionX: NutritionX;

    constructor(
        private readonly authUserEmail: string,
        private readonly authUserRole: UserRole
    ) {
        this.recordTable = getConnection().getRepository(Record);
        this.nutritionX = new NutritionX();
    }

    async get({ id }: GetRecordRequest): Promise<GetRecordResponse> {
        const record = await this.recordTable.findOne(id);
        if (!record) {
            throw codedError(HTTP.NOT_FOUND, `Record with id ${id} not found`);
        }
        return record;
    }

    async getAll({ filter, limit, skip, userEmail }: GetAllRecordsRequest): Promise<GetAllRecordsResponse> {
        let query = this.recordTable
            .createQueryBuilder("record");
        if (this.authUserRole === "admin") {
            if (userEmail) {
                query = query.where(`userEmail = "${userEmail}"`);
            }
        } else {
            query = query.where(`userEmail = "${this.authUserEmail}"`);
        }
        if (limit && parseInt(limit)) {
            query = query.take(parseInt(limit));
            // must include limit to use skip in MYSQL
            if (skip && parseInt(skip)) {
                query = query.skip(parseInt(skip));
            }
        }
        if (filter) {
            const parsedFilter = filter
                .replace(/ [oO][rR] /g, " OR ") // OR
                .replace(/ [aA][nN][dD] /g, " AND ") // AND
                .replace(/ [eE][qQ] /g, " = ") // equals
                .replace(/ [nN][eE] /g, " != ") // ne
                .replace(/ [gG][tT] /g, " > ") // gt
                .replace(/ [lL][tT] /g, " < "); // lt
            query = query.andWhere(parsedFilter);
        }

        return { records: await query.getMany() };
    }

    async create(createRecord: CreateRecordRequest): Promise<CreateRecordResponse> {
        if (
            this.authUserRole !== "admin" &&
            createRecord.userEmail !== this.authUserEmail
        ) {
            throw codedError(HTTP.FORBIDDEN, "User is not authorized to perform this action");
        }

        const id = uuid.v4();
        const user = await new UserManager(this.authUserEmail, this.authUserRole).get({ email: createRecord.userEmail });
        const caloriesForTheDate = await this.getUserCaloriesForTheDate(createRecord.userEmail, createRecord.date);
        const record: Record = {
            date: createRecord.date,
            id,
            lessThanExpectedCalories: user.expectedCaloriesPerDay > caloriesForTheDate,
            numberOfCalories: createRecord.numberOfCalories || await this.nutritionX.getCalories(createRecord.text),
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

    async update(updateBody: UpdateRecordRequest): Promise<UpdateRecordResponse> {
        const record = await this.get({ id: updateBody.id });
        const toUpdate: Partial<Record> = {
            date: updateBody.date || record.date,
            time: updateBody.time || record.time,
            numberOfCalories: updateBody.numberOfCalories || record.numberOfCalories
        };

        if (updateBody.text) {
            toUpdate.text = updateBody.text;
            toUpdate.numberOfCalories = updateBody.numberOfCalories || await this.nutritionX.getCalories(updateBody.text);
        }
        await this.recordTable.update(record.id, toUpdate);

        // const user = await new UserManager(this.authUserEmail, this.authUserRole).get(record.userEmail);
        // await this.updateRecordsCaloriesForUser(record.userEmail, user.expectedCaloriesPerDay);

        return { done: true };
    }

    async delete({ id }: DeleteRecordRequest): Promise<DeleteRecordResponse> {
        await this.get({ id });
        await this.recordTable.delete(id);
        return { done: true };
    }

    async updateRecordsCaloriesForUser(userEmail: string, expectedCaloriesPerDay: number) {
        const { records: userRecords } = await this.getAll({ userEmail });
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

    private async getUserCaloriesForTheDate(userEmail: string, date: string): Promise<number> {
        const todayRecords = await this.recordTable.find({ userEmail, date });
        return todayRecords.reduce((total, record) => total + record.numberOfCalories, 0);
    }
}
