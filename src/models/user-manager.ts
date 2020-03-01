import HTTP from "http-status-codes";
import { FindManyOptions, getConnection, Repository } from "typeorm";

import { config } from "../config";
import { User } from "../entities";
import { codedError } from "../lib/coded-error";
import { createAccessToken } from "../lib/jwt-authorization";
import { hashPassword } from "../lib/password-hash";
import { UserRole } from "../types";
import { DeleteUserResponse, GetAllUsersResponse, GetUserResponse, LoginUserRequest, LoginUserResponse, SignupUserRequest, SignupUserResponse, UpdateUserRequest, UpdateUserResponse } from "../types/schema-generated/index";
import { RecordManager } from "./records-manager";


export class UserManager {
    private readonly userTable: Repository<User>;
    private readonly recordManager: RecordManager;

    constructor(
        authUserEmail: string,
        authUserRole: UserRole
    ) {
        this.userTable = getConnection().getRepository(User);
        this.recordManager = new RecordManager(authUserEmail, authUserRole);
    }

    static async login({ email, password }: LoginUserRequest): Promise<LoginUserResponse> {
        const userTable = getConnection().getRepository(User);

        const user = await userTable.findOne(email);
        if (!user || user.password !== hashPassword(password)) {
            throw codedError(HTTP.BAD_REQUEST, "Wrong Credentials");
        }

        const accessToken = createAccessToken({ authUserEmail: user.email, authUserRole: user.role });
        return { done: true, accessToken };
    }

    static async signup(signupData: SignupUserRequest): Promise<SignupUserResponse> {
        const userTable = getConnection().getRepository(User);

        const user = await userTable.findOne(signupData.email);
        if (user) {
            throw codedError(HTTP.BAD_REQUEST, `User with email ${signupData.email} already exists`);
        }

        const newUser: User = {
            email: signupData.email,
            expectedCaloriesPerDay: signupData.expectedCaloriesPerDay,
            name: signupData.name,
            password: hashPassword(signupData.password),
            role: "user",
            surname: signupData.surname,
        };
        await userTable.insert(newUser);
        return { done: true };
    }

    private async getRaw(email: string): Promise<User> {
        const user = await this.userTable.findOne(email);
        if (!user) {
            throw codedError(HTTP.NOT_FOUND, `User ${email} does not exist`);
        }
        return user;
    }

    async get(email: string): Promise<GetUserResponse> {
        const user = await this.userTable.findOne(email, { select: ["email", "expectedCaloriesPerDay", "name", "surname"] });
        if (!user) {
            throw codedError(HTTP.NOT_FOUND, `User ${email} does not exist`);
        }
        return user;
    }

    async getAll(limit?: number, skip?: number, filter?: string): Promise<GetAllUsersResponse> {
        const where: string[] = ["1 = 1"];
        if (filter) {
            const parsedFilter = filter
                .replace(/[oO][rR]/g, "OR") // OR
                .replace(/[aA][nN][dD]/g, "AND") // AND
                .replace(/[eE][qQ]/g, "=") // equals
                .replace(/[nN][eE]/g, "!=") // ne
                .replace(/[gG][tT]/g, ">") // gt
                .replace(/[lL][tT]/g, "<"); // lt
            where.push(parsedFilter);
        }
        const users = await this.userTable
            .createQueryBuilder("user")
            .select(["user.email", "user.expectedCaloriesPerDay", "user.name", "user.surname"])
            .where(where.join(" AND "))
            .take(limit)
            .skip(skip)
            .getMany();
        return { users };
    }

    async update(updateData: UpdateUserRequest): Promise<UpdateUserResponse> {
        const user = await this.getRaw(updateData.email);
        const updateUser: Partial<User> = {
            expectedCaloriesPerDay: updateData.expectedCaloriesPerDay || user.expectedCaloriesPerDay,
            name: updateData.name || user.name,
            password: updateData.password ?
                hashPassword(updateData.password) :
                user.password,
            surname: updateData.surname || user.surname
        };
        await this.userTable.update({ email: updateData.email }, updateUser);
        if (updateData.expectedCaloriesPerDay) {
            await this.recordManager.updateRecordsCaloriesForUser(user.email, updateData.expectedCaloriesPerDay);
        }
        return { done: true };
    }

    async delete(email: string): Promise<DeleteUserResponse> {
        await this.getRaw(email);
        await this.userTable.delete(email);
        return { done: true };
    }
}
