import HTTP from "http-status-codes";
import jwt from "jsonwebtoken";
import { getConnection, Repository } from "typeorm";

import { config } from "../config";
import { User } from "../entities";
import { codedError } from "../lib/coded-error";
import { hashPassword } from "../lib/password-hash";
import { DeleteUserResponse, GetUserResponse, LoginUserRequest, LoginUserResponse, SignupUserRequest, SignupUserResponse, UpdateUserRequest, UpdateUserResponse } from "../types/schema-generated/index";


export class UserManager {
    private readonly userTable: Repository<User>;

    constructor() {
        this.userTable = getConnection().getRepository(User);
    }

    async login({ email, password }: LoginUserRequest): Promise<LoginUserResponse> {
        let user: User;
        try {
            user = await this.getRaw(email);
        } catch (err) {
            if (err.code === HTTP.NOT_FOUND) {
                throw codedError(HTTP.BAD_REQUEST, "Wrong Credentials");
            }
            throw err;
        }
        if (user.password !== hashPassword(password)) {
            throw codedError(HTTP.BAD_REQUEST, "Wrong Credentials");
        }
        // check if password is correct
        const accessToken = jwt.sign({ email: user.email, role: user.role }, config.secrets.jwt);
        return { done: true, accessToken };
    }

    async signup(signupData: SignupUserRequest): Promise<SignupUserResponse> {
        try {
            await this.getRaw(signupData.email);
            throw codedError(HTTP.BAD_REQUEST, `User with email ${signupData.email} already exists`);
        } catch (err) {
            if (err.code !== HTTP.NOT_FOUND) {
                throw err;
            }
        }
        const user: User = {
            email: signupData.email,
            expectedCaloriesPerDay: signupData.expectedCaloriesPerDay,
            name: signupData.name,
            password: hashPassword(signupData.password),
            role: "user",
            surname: signupData.surname,
        };
        await this.userTable.insert(user);
        return { done: true };
    }

    private async getRaw(email: string): Promise<User> {
        const user = await this.userTable.findOne({ email });
        if (!user) {
            throw codedError(HTTP.NOT_FOUND, `User ${email} does not exist`);
        }
        return user;
    }

    async get(email: string): Promise<GetUserResponse> {
        const user = await this.getRaw(email);
        if (!user) {
            throw codedError(HTTP.NOT_FOUND, `User ${email} does not exist`);
        }
        delete user.password;
        delete user.role;
        return user;
    }

    async update(email: string, updateData: UpdateUserRequest): Promise<UpdateUserResponse> {
        const user = await this.getRaw(email);
        const updateUser: Partial<User> = {
            expectedCaloriesPerDay: updateData.expectedCaloriesPerDay || user.expectedCaloriesPerDay,
            name: updateData.name || user.name,
            password: updateData.password ?
                hashPassword(updateData.password) :
                user.password,
            surname: updateData.surname || user.surname
        };
        await this.userTable.update({ email }, updateUser);
        return { done: true };
    }

    async delete(email: string): Promise<DeleteUserResponse> {
        await this.getRaw(email);
        await this.userTable.delete({ email });
        return { done: true };
    }
}
