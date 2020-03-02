import { assert } from "chai";
import HTTP from "http-status-codes";
import { getConnection } from "typeorm";
import { User } from "../../entities";
import { CalorietteApi, CreateUserRequestRoleEnum } from "../../sdk/axios";
import { errorTest } from "../lib/error-test";

// tslint:disable
describe("Moderator Integration tests", () => {

    let modService: CalorietteApi;
    let serverAddress: string;
    const modUser = {
        email: "mod@gmail.com",
        name: "mod",
        password: "mod12345",
        surname: "modSur",
        expectedCaloriesPerDay: 1920
    };

    const user = {
        email: "user112@gmail.com",
        name: "user112",
        password: "user12345",
        surname: "UserSur",
        expectedCaloriesPerDay: 1100
    };
    const moderatorsArray = [
        {
            email: "mod11@gmail.com",
            name: "mod1",
            password: "mod112345",
            surname: "mod1Sur",
            expectedCaloriesPerDay: 2000
        },
        {
            email: "mod22@gmail.com",
            name: "mod2",
            password: "mod212345",
            surname: "mod2Sur",
            expectedCaloriesPerDay: 1200
        },
        {
            email: "mod33@gmail.com",
            name: "mod3",
            password: "mod312345",
            surname: "mod3Sur",
            expectedCaloriesPerDay: 3400
        }
    ];

    // service should be initialized before
    before(() => {
        serverAddress = `http://localhost:${process.env.PORT}`;
        modService = new CalorietteApi({}, serverAddress);
    });

    it("Should be able to signup a user", async () => {
        const signupUserResponse = await modService.signupUser(modUser);
        assert.exists(signupUserResponse.data);
        assert.isTrue(signupUserResponse.data.done);

        // make the user a moderator
        await getConnection().getRepository(User).update(modUser.email, {
            role: "moderator"
        });

        await errorTest(
            modService.signupUser(modUser),
            HTTP.BAD_REQUEST,
            "Should not be able to sign up a user with the same email address"
        );
    });

    it("Should be able to login a user", async () => {
        const loginAdminResponse = await modService.loginUser({ email: modUser.email, password: modUser.password });
        assert.exists(loginAdminResponse.data);
        assert.exists(loginAdminResponse.data.accessToken);
        assert.isTrue(loginAdminResponse.data.done);
        modService = new CalorietteApi({ accessToken: loginAdminResponse.data.accessToken }, serverAddress);
        await errorTest(
            modService.loginUser({ email: "dummyEmail", password: modUser.password }),
            HTTP.BAD_REQUEST,
            "Should not be able to login a user with the wrong email address"
        );
        await errorTest(
            modService.loginUser({ email: modUser.email, password: "dummyPassword" }),
            HTTP.BAD_REQUEST,
            "Should not be able to login a user with the wrong password"
        );
        await errorTest(
            modService.loginUser({ email: "dummyEmail", password: "dummyPassword" }),
            HTTP.BAD_REQUEST,
            "Should not be able to login a user with the wrong email and password"
        );
    });

    it("Should be able to get all users data", async () => {
        const getAllUsersResponse = await modService.getUsers();
        assert.exists(getAllUsersResponse.data);
        assert.isNotEmpty(getAllUsersResponse.data.users);
    });

    it("Should be able to update his user data", async () => {
        modUser.expectedCaloriesPerDay = 5000;
        const updateAdminResponse = await modService.updateUser(modUser.email, {
            expectedCaloriesPerDay: modUser.expectedCaloriesPerDay,
        });
        assert.exists(updateAdminResponse.data);
        assert.exists(updateAdminResponse.data.done);

        const getAdminResponse = await modService.getUser(modUser.email);
        assert.exists(getAdminResponse.data);
        assert.equal(getAdminResponse.data.expectedCaloriesPerDay, modUser.expectedCaloriesPerDay);
        assert.equal(getAdminResponse.data.email, modUser.email);
        assert.equal(getAdminResponse.data.name, modUser.name);
        assert.equal(getAdminResponse.data.surname, modUser.surname);

        await errorTest(
            modService.getUser("anotherUserEmail"),
            HTTP.NOT_FOUND,
            "Should not be able to get another user"
        );
    });

    it("Should be able to get his records", async () => {
        const getRecordsResponse = await modService.getRecords();
        assert.exists(getRecordsResponse.data);
        assert.isEmpty(getRecordsResponse.data.records);
    });

    it("Should be able to create his records", async () => {
        let createRecordResponse = await modService.createRecord({
            date: "2020-03-01",
            time: "13:34:30",
            userEmail: modUser.email,
            text: "1 chicken risotto",
            numberOfCalories: 200
        });
        assert.exists(createRecordResponse.data);
        assert.isTrue(createRecordResponse.data.done);

        createRecordResponse = await modService.createRecord({
            date: "2020-03-01",
            time: "13:44:37",
            userEmail: modUser.email,
            text: "300ml coke",
            numberOfCalories: 350
        });
        assert.exists(createRecordResponse.data);
        assert.isTrue(createRecordResponse.data.done);

        createRecordResponse = await modService.createRecord({
            date: "2020-03-01",
            time: "18:30:00",
            userEmail: modUser.email,
            text: "100g mashed potatoes, 100g chicken breast, 1l coke"
        });
        assert.exists(createRecordResponse.data);
        assert.isTrue(createRecordResponse.data.done);

        const getRecordsResponse = await modService.getRecords();
        assert.exists(getRecordsResponse.data);
        assert.isNotEmpty(getRecordsResponse.data.records);
    });

    it("Should be able to update his records", async () => {
        const createRecordResponse = await modService.createRecord({
            date: "2020-02-29",
            time: "13:34:30",
            userEmail: modUser.email,
            text: "1 spaghetti quattro formaggi",
            numberOfCalories: 611
        });
        assert.exists(createRecordResponse.data);
        assert.isTrue(createRecordResponse.data.done);

        const recordId = createRecordResponse.data.id;
        const newNumberOfCalories = 400;
        const updateRecordResponse = await modService.updateRecord(recordId, { numberOfCalories: newNumberOfCalories });
        assert.exists(updateRecordResponse.data);
        assert.isTrue(updateRecordResponse.data.done);

        const getRecordResponse = await modService.getRecord(recordId);
        assert.exists(getRecordResponse.data);
        assert.equal(getRecordResponse.data.numberOfCalories, newNumberOfCalories);
    });

    it("Should be able to delete his records", async () => {
        let getRecordsResponse = await modService.getRecords();
        assert.exists(getRecordsResponse.data);
        assert.isNotEmpty(getRecordsResponse.data.records);


        for (const record of getRecordsResponse.data.records) {
            const deleteRecordsResponse = await modService.deleteRecord(record.id);
            assert.exists(deleteRecordsResponse.data);
            assert.isTrue(deleteRecordsResponse.data.done);
            await errorTest(
                modService.getRecord(record.id),
                HTTP.NOT_FOUND,
                "Should not be able to get a deleted record"
            );
        }

        getRecordsResponse = await modService.getRecords();
        assert.exists(getRecordsResponse.data);
        assert.isEmpty(getRecordsResponse.data.records);
    });

    it("Should be able to create a new User", async () => {
        const createUserResponse = await modService.createUser({ ...user, role: CreateUserRequestRoleEnum.User });
        assert.exists(createUserResponse.data);
        assert.isTrue(createUserResponse.data.done);

        await errorTest(
            modService.createUser({ ...user, role: CreateUserRequestRoleEnum.User }),
            HTTP.BAD_REQUEST,
            "Should not be able to create teh same user twice"
        );

        let loginUserResponse = await new CalorietteApi({}, serverAddress).loginUser({ email: user.email, password: user.password });
        assert.exists(createUserResponse.data);
        assert.isTrue(createUserResponse.data.done);
        assert.exists(loginUserResponse.data.accessToken);


        user.surname = "newUserSurname";
        user.password = "newUsrrPassword";
        await modService.updateUser(user.email, { surname: user.surname, password: user.password });

        loginUserResponse = await new CalorietteApi({}, serverAddress).loginUser({ email: user.email, password: user.password });
        assert.exists(createUserResponse.data);
        assert.isTrue(createUserResponse.data.done);
        assert.exists(loginUserResponse.data.accessToken);

        const userService = new CalorietteApi({ accessToken: loginUserResponse.data.accessToken }, serverAddress);

        const getUserResponse = await modService.getUser(user.email);
        assert.exists(getUserResponse.data);
        assert.equal(getUserResponse.data.expectedCaloriesPerDay, user.expectedCaloriesPerDay);
        assert.equal(getUserResponse.data.email, user.email);
        assert.equal(getUserResponse.data.name, user.name);
        assert.equal(getUserResponse.data.surname, user.surname);

        const userRecord = {
            date: "2020-01-20",
            time: "10:34:02",
            text: "1 tbsp sugar",
            userEmail: user.email,
            numberOfCalories: 100
        };
        await errorTest(
            modService.createRecord(userRecord),
            HTTP.FORBIDDEN,
            "Should not have access to modify records"
        );

        const deleteUserResponse = await modService.deleteUser(user.email);
        assert.exists(deleteUserResponse.data);
        assert.isTrue(deleteUserResponse.data.done);
        await errorTest(
            modService.getUser(user.email),
            HTTP.NOT_FOUND,
            "The user should be deleted"
        );
    });

    it("Should be able to create multiple users", async () => {

        for (const mod of moderatorsArray) {
            const createUser = await modService.createUser({ ...mod, role: CreateUserRequestRoleEnum.Moderator });
            assert.exists(createUser.data);
            assert.isTrue(createUser.data.done);
        }
        const createUser = await modService.createUser({ ...user, role: CreateUserRequestRoleEnum.User });
        assert.exists(createUser.data);
        assert.isTrue(createUser.data.done);

        const getModLessThan2000Cal = await modService.getUsers(
            undefined,
            `role eq "${CreateUserRequestRoleEnum.Moderator}" and expectedCaloriesPerDay lt 2000`
        );
        assert.exists(getModLessThan2000Cal.data);
        assert.lengthOf(getModLessThan2000Cal.data.users, 3);
        assert.deepEqual(getModLessThan2000Cal.data.users[2], {
            expectedCaloriesPerDay: moderatorsArray[1].expectedCaloriesPerDay,
            email: moderatorsArray[1].email,
            name: moderatorsArray[1].name,
            surname: moderatorsArray[1].surname,
        });

        const getAllUsersWithUserRole = await modService.getUsers(
            undefined,
            `role eq "${CreateUserRequestRoleEnum.User}"`
        );
        assert.exists(getAllUsersWithUserRole.data);
        assert.lengthOf(getAllUsersWithUserRole.data.users, 2);


        const getAllUsersUnder2000Cal = await modService.getUsers(
            undefined,
            `expectedCaloriesPerDay lt 2000`
        );
        assert.exists(getAllUsersUnder2000Cal.data);
        assert.lengthOf(getAllUsersUnder2000Cal.data.users, 5);
    });

    it("Should be able to delete his User", async () => {
        const deleteAdminResponse = await modService.deleteUser(modUser.email);
        assert.exists(deleteAdminResponse.data);
        assert.isTrue(deleteAdminResponse.data.done);
    });
});
