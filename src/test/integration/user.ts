import { assert } from "chai";
import HTTP from "http-status-codes";
import { CalorietteApi, CreateUserRequestRoleEnum } from "../../sdk/axios";
import { errorTest } from "../lib/error-test";

// tslint:disable
describe("User Integration tests", () => {

    let service: CalorietteApi;
    let serverAddress: string;
    const user = {
        email: "andrej@gmail.com",
        name: "andrej",
        password: "andrej12345",
        surname: "Saas",
        expectedCaloriesPerDay: 2400
    };

    // service should be initialized before
    before(() => {
        serverAddress = `http://localhost:${process.env.PORT}`;
        service = new CalorietteApi({}, serverAddress);
    });

    it("Should not be able to access api with no access token", async () => {
        await errorTest(
            new CalorietteApi({}, serverAddress).getRecords(),
            HTTP.UNAUTHORIZED,
            "Should not be able to access api with No Access Token"
        );
        await errorTest(
            new CalorietteApi({ accessToken: "invalidtoken132" }, serverAddress).getRecords(),
            HTTP.UNAUTHORIZED,
            "Should not be able to access api with invalid Access Token"
        );

    });

    it("Should be able to signup a user", async () => {
        const signupUserResponse = await service.signupUser(user);
        assert.exists(signupUserResponse.data);
        assert.isTrue(signupUserResponse.data.done);
        await errorTest(
            service.signupUser(user),
            HTTP.BAD_REQUEST,
            "Should not be able to sign up a user with the same email address"
        );

        await errorTest(
            service.signupUser({
                expectedCaloriesPerDay: 1230,
                name: "Pero",
                password: "Pero1230",
                surname: "PeroSoBaliracata"
            } as any),
            HTTP.BAD_REQUEST,
            "Should not be able to sign up a user with no email address"
        );
    });

    it("Should be able to login a user", async () => {
        const loginUserResponse = await service.loginUser({ email: user.email, password: user.password });
        assert.exists(loginUserResponse.data);
        assert.exists(loginUserResponse.data.accessToken);
        assert.isTrue(loginUserResponse.data.done);
        service = new CalorietteApi({ accessToken: loginUserResponse.data.accessToken }, serverAddress);
        await errorTest(
            service.loginUser({ email: "dummyEmail", password: user.password }),
            HTTP.BAD_REQUEST,
            "Should not be able to login a user with the wrong email address"
        );
        await errorTest(
            service.loginUser({ email: user.email, password: "dummyPassword" }),
            HTTP.BAD_REQUEST,
            "Should not be able to login a user with the wrong password"
        );
        await errorTest(
            service.loginUser({ email: "dummyEmail", password: "dummyPassword" }),
            HTTP.BAD_REQUEST,
            "Should not be able to login a user with the wrong email and password"
        );
    });

    it("Should not be able to create a user with user role", async () => {
        await errorTest(
            service.createUser({
                email: "testuseremail@gmail.com",
                name: "TestUserName",
                surname: "TestUsersurname",
                expectedCaloriesPerDay: 1000,
                password: "MYTestUserPAssword",
                role: CreateUserRequestRoleEnum.User,
            }),
            HTTP.FORBIDDEN,
            "Should not be able to createa a user with no permissions"
        );
    });

    it("Should be able to get all users data", async () => {
        const getAllUsersResponse = await service.getUsers();
        assert.exists(getAllUsersResponse.data);
        assert.isNotEmpty(getAllUsersResponse.data.users);
    });

    it("Should be able to update user data", async () => {
        user.expectedCaloriesPerDay = 5000;
        const updateUserResponse = await service.updateUser(user.email, {
            expectedCaloriesPerDay: user.expectedCaloriesPerDay,
        });
        assert.exists(updateUserResponse.data);
        assert.exists(updateUserResponse.data.done);

        const getUserResponse = await service.getUser(user.email);
        assert.exists(getUserResponse.data);
        assert.equal(getUserResponse.data.expectedCaloriesPerDay, user.expectedCaloriesPerDay);
        assert.equal(getUserResponse.data.email, user.email);
        assert.equal(getUserResponse.data.name, user.name);
        assert.equal(getUserResponse.data.surname, user.surname);

        await errorTest(
            service.getUser("anotherUserEmail"),
            HTTP.FORBIDDEN,
            "Should not be able to get another user"
        );
    });

    it("Should be able to get a users records", async () => {
        const getRecordsResponse = await service.getRecords();
        assert.exists(getRecordsResponse.data);
        assert.isEmpty(getRecordsResponse.data.records);
    });

    it("Should be able to create user records", async () => {
        let createRecordResponse = await service.createRecord({
            date: "2020-03-01",
            time: "13:34:30",
            userEmail: user.email,
            text: "1 chicken risotto",
            numberOfCalories: 200
        });
        assert.exists(createRecordResponse.data);
        assert.isTrue(createRecordResponse.data.done);

        createRecordResponse = await service.createRecord({
            date: "2020-03-01",
            time: "13:44:37",
            userEmail: user.email,
            text: "300ml coke",
            numberOfCalories: 350
        });
        assert.exists(createRecordResponse.data);
        assert.isTrue(createRecordResponse.data.done);

        createRecordResponse = await service.createRecord({
            date: "2020-03-01",
            time: "18:30:00",
            userEmail: user.email,
            text: "100g mashed potatoes, 100g chicken breast, 1l coke"
        });
        assert.exists(createRecordResponse.data);
        assert.isTrue(createRecordResponse.data.done);

        const getRecordsResponse = await service.getRecords();
        assert.exists(getRecordsResponse.data);
        assert.isNotEmpty(getRecordsResponse.data.records);

        await errorTest(
            service.createRecord({
                date: "2020-03-01",
                time: "13:34:30",
                userEmail: "dummyuseremail@gmail.com",
                text: "1 chicken risotto",
                numberOfCalories: 200
            }),
            HTTP.FORBIDDEN,
            "Should not be able to create a record for a different user"
        );
    });

    it("Should be able to update a user record", async () => {
        const createRecordResponse = await service.createRecord({
            date: "2020-02-29",
            time: "13:34:30",
            userEmail: user.email,
            text: "1 spaghetti quattro formaggi",
            numberOfCalories: 611
        });
        assert.exists(createRecordResponse.data);
        assert.isTrue(createRecordResponse.data.done);

        const recordId = createRecordResponse.data.id;
        const newNumberOfCalories = 400;
        const updateRecordResponse = await service.updateRecord(recordId, { numberOfCalories: newNumberOfCalories });
        assert.exists(updateRecordResponse.data);
        assert.isTrue(updateRecordResponse.data.done);

        const getRecordResponse = await service.getRecord(recordId);
        assert.exists(getRecordResponse.data);
        assert.equal(getRecordResponse.data.numberOfCalories, newNumberOfCalories);
    });

    it("Should be able to delete a user record", async () => {
        let getRecordsResponse = await service.getRecords();
        assert.exists(getRecordsResponse.data);
        assert.isNotEmpty(getRecordsResponse.data.records);


        for (const record of getRecordsResponse.data.records) {
            const deleteRecordsResponse = await service.deleteRecord(record.id);
            assert.exists(deleteRecordsResponse.data);
            assert.isTrue(deleteRecordsResponse.data.done);
            await errorTest(
                service.getRecord(record.id),
                HTTP.NOT_FOUND,
                "Should not be able to get a deleted record"
            );
        }

        getRecordsResponse = await service.getRecords();
        assert.exists(getRecordsResponse.data);
        assert.isEmpty(getRecordsResponse.data.records);
    });

    it("Should be able to delete a User", async () => {
        const deleteUserResponse = await service.deleteUser(user.email);
        assert.exists(deleteUserResponse.data);
        assert.isTrue(deleteUserResponse.data.done);
    });
});
