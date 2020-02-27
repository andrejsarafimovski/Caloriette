import HTTP from "http-status-codes";
import jwt from "jsonwebtoken";
import { getConnection, Repository } from "typeorm";
import { User } from "../entities";
import { codedError } from "../lib/coded-error";

import { DeleteUserRequest, DeleteUserResponse, GetUserRequest, GetUserResponse, LoginUserRequest, LoginUserResponse, SignupUserRequest, SignupUserResponse, UpdateUserRequest, UpdateUserResponse } from "../types/schema-generated/index";

export class UserManager {
    private readonly userTable: Repository<User>;

    constructor() {
        this.userTable = getConnection().getRepository(User);
    }

    async login(loginData: LoginUserRequest): Promise<LoginUserResponse> {
        let user: User;
        try {
            user = await this.get(loginData.email);
        } catch (err) {
            if (err.code === HTTP.NOT_FOUND) {
                throw codedError(HTTP.BAD_REQUEST, "Wrong Credentials");
            }
            throw err;
        }
        // check if password is correct
        const accessToken = jwt.sign({ email: user.email, role: user.role }, "secret");
        return { done: true, accessToken };
    }

    async signup(signupData: SignupUserRequest): Promise<SignupUserResponse> {
        try {
            await this.get(signupData.email);
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
            password: Buffer.from(signupData.password), // to encrypt
            role: "user",
            surname: signupData.surname,
        };
        await this.userTable.insert(user);
        return { done: true };
    }

    async get(email: string): Promise<GetUserResponse> {
        const user = await this.userTable
            .createQueryBuilder("user")
            .where("user.email = :email", { email })
            .getOne();
        if (!user) {
            throw codedError(HTTP.NOT_FOUND, `User ${email} does not exist`);
        }
        delete user.password;
        return user;
    }

    async update(email: string, updateData: UpdateUserRequest): Promise<UpdateUserResponse> {
        const user = await this.get(email);

        return { done: true };
    }

    async delete(email: string): Promise<DeleteUserResponse> {
        const user = await this.get(email);
        await this.userTable.delete({ email });
        return { done: true };
    }
}
