import { assert } from "chai";
import HTTP from "http-status-codes";
import { getConnection } from "typeorm";

import { User } from "../../entities";
import { CalorietteApi, CreateUserRequestRoleEnum } from "../../sdk/axios";
import { errorTest } from "../lib/error-test";

// tslint:disable
describe("Admin Integration tests", () => {

    let adminService: CalorietteApi;
    let serverAddress: string;
    const adminUser = {
        email: "admin@gmail.com",
        name: "admin",
        password: "admin12345",
        surname: "AdminSur",
        expectedCaloriesPerDay: 1800
    };

    const user = {
        email: "user@gmail.com",
        name: "user",
        password: "user12345",
        surname: "UserSur",
        expectedCaloriesPerDay: 1100
    };
    const moderatorsArray = [
        {
            email: "mod1@gmail.com",
            name: "mod1",
            password: "mod112345",
            surname: "mod1Sur",
            expectedCaloriesPerDay: 2000
        },
        {
            email: "mod2@gmail.com",
            name: "mod2",
            password: "mod212345",
            surname: "mod2Sur",
            expectedCaloriesPerDay: 1200
        },
        {
            email: "mod3@gmail.com",
            name: "mod3",
            password: "mod312345",
            surname: "mod3Sur",
            expectedCaloriesPerDay: 3400
        }
    ];

    // service should be initialized before
    before(() => {
        serverAddress = `http://localhost:${process.env.PORT}`;
        adminService = new CalorietteApi({}, serverAddress);
    });

    it("Should be able to signup a user", async () => {
        const signupUserResponse = await adminService.signupUser(adminUser);
        assert.exists(signupUserResponse.data);
        assert.isTrue(signupUserResponse.data.done);

        // make the user an admin
        await getConnection().getRepository(User).update(adminUser.email, {
            role: "admin"
        });

        await errorTest(
            adminService.signupUser(adminUser),
            HTTP.BAD_REQUEST,
            "Should not be able to sign up a user with the same email address"
        );
    });

    it("Should be able to login a user", async () => {
        const loginAdminResponse = await adminService.loginUser({ email: adminUser.email, password: adminUser.password });
        assert.exists(loginAdminResponse.data);
        assert.exists(loginAdminResponse.data.accessToken);
        assert.isTrue(loginAdminResponse.data.done);
        adminService = new CalorietteApi({ accessToken: loginAdminResponse.data.accessToken }, serverAddress);
        await errorTest(
            adminService.loginUser({ email: "dummyEmail", password: adminUser.password }),
            HTTP.BAD_REQUEST,
            "Should not be able to login a user with the wrong email address"
        );
        await errorTest(
            adminService.loginUser({ email: adminUser.email, password: "dummyPassword" }),
            HTTP.BAD_REQUEST,
            "Should not be able to login a user with the wrong password"
        );
        await errorTest(
            adminService.loginUser({ email: "dummyEmail", password: "dummyPassword" }),
            HTTP.BAD_REQUEST,
            "Should not be able to login a user with the wrong email and password"
        );
    });

    it("Should be able to get all users data", async () => {
        const getAllUsersResponse = await adminService.getUsers();
        assert.exists(getAllUsersResponse.data);
        assert.isNotEmpty(getAllUsersResponse.data.users);
    });

    it("Should be able to update his user data", async () => {
        adminUser.expectedCaloriesPerDay = 5000;
        const updateAdminResponse = await adminService.updateUser(adminUser.email, {
            expectedCaloriesPerDay: adminUser.expectedCaloriesPerDay,
        });
        assert.exists(updateAdminResponse.data);
        assert.exists(updateAdminResponse.data.done);

        const getAdminResponse = await adminService.getUser(adminUser.email);
        assert.exists(getAdminResponse.data);
        assert.equal(getAdminResponse.data.expectedCaloriesPerDay, adminUser.expectedCaloriesPerDay);
        assert.equal(getAdminResponse.data.email, adminUser.email);
        assert.equal(getAdminResponse.data.name, adminUser.name);
        assert.equal(getAdminResponse.data.surname, adminUser.surname);

        await errorTest(
            adminService.getUser("anotherUserEmail"),
            HTTP.NOT_FOUND,
            "Should not be able to get another user"
        );
    });

    it("Should be able to get his records", async () => {
        const getRecordsResponse = await adminService.getRecords(undefined, undefined, undefined, adminUser.email);
        assert.exists(getRecordsResponse.data);
        assert.isEmpty(getRecordsResponse.data.records);
    });

    it("Should be able to create his records", async () => {
        let createRecordResponse = await adminService.createRecord({
            date: "2020-03-01",
            time: "13:34:30",
            userEmail: adminUser.email,
            text: "1 chicken risotto",
            numberOfCalories: 200
        });
        assert.exists(createRecordResponse.data);
        assert.isTrue(createRecordResponse.data.done);

        createRecordResponse = await adminService.createRecord({
            date: "2020-03-01",
            time: "13:44:37",
            userEmail: adminUser.email,
            text: "300ml coke",
            numberOfCalories: 350
        });
        assert.exists(createRecordResponse.data);
        assert.isTrue(createRecordResponse.data.done);

        createRecordResponse = await adminService.createRecord({
            date: "2020-03-01",
            time: "18:30:00",
            userEmail: adminUser.email,
            text: "100g mashed potatoes, 100g chicken breast, 1l coke"
        });
        assert.exists(createRecordResponse.data);
        assert.isTrue(createRecordResponse.data.done);

        const getRecordsResponse = await adminService.getRecords();
        assert.exists(getRecordsResponse.data);
        assert.isNotEmpty(getRecordsResponse.data.records);
    });

    it("Should be able to update his records", async () => {
        const createRecordResponse = await adminService.createRecord({
            date: "2020-02-29",
            time: "13:34:30",
            userEmail: adminUser.email,
            text: "1 spaghetti quattro formaggi",
            numberOfCalories: 611
        });
        assert.exists(createRecordResponse.data);
        assert.isTrue(createRecordResponse.data.done);

        const recordId = createRecordResponse.data.id;
        const newNumberOfCalories = 400;
        const updateRecordResponse = await adminService.updateRecord(recordId, { numberOfCalories: newNumberOfCalories });
        assert.exists(updateRecordResponse.data);
        assert.isTrue(updateRecordResponse.data.done);

        const getRecordResponse = await adminService.getRecord(recordId);
        assert.exists(getRecordResponse.data);
        assert.equal(getRecordResponse.data.numberOfCalories, newNumberOfCalories);
    });

    it("Should be able to delete his records", async () => {
        let getRecordsResponse = await adminService.getRecords();
        assert.exists(getRecordsResponse.data);
        assert.isNotEmpty(getRecordsResponse.data.records);


        for (const record of getRecordsResponse.data.records) {
            const deleteRecordsResponse = await adminService.deleteRecord(record.id);
            assert.exists(deleteRecordsResponse.data);
            assert.isTrue(deleteRecordsResponse.data.done);
            await errorTest(
                adminService.getRecord(record.id),
                HTTP.NOT_FOUND,
                "Should not be able to get a deleted record"
            );
        }

        getRecordsResponse = await adminService.getRecords();
        assert.exists(getRecordsResponse.data);
        assert.isEmpty(getRecordsResponse.data.records);
    });

    it("Should be able to create a new User", async () => {
        const createUserResponse = await adminService.createUser({ ...user, role: CreateUserRequestRoleEnum.User });
        assert.exists(createUserResponse.data);
        assert.isTrue(createUserResponse.data.done);

        await errorTest(
            adminService.createUser({ ...user, role: CreateUserRequestRoleEnum.User }),
            HTTP.BAD_REQUEST,
            "Should not be able to create teh same user twice"
        );

        let loginUserResponse = await new CalorietteApi({}, serverAddress).loginUser({ email: user.email, password: user.password });
        assert.exists(createUserResponse.data);
        assert.isTrue(createUserResponse.data.done);
        assert.exists(loginUserResponse.data.accessToken);


        user.surname = "newUserSurname";
        user.password = "newUsrrPassword";
        await adminService.updateUser(user.email, { surname: user.surname, password: user.password });

        loginUserResponse = await new CalorietteApi({}, serverAddress).loginUser({ email: user.email, password: user.password });
        assert.exists(createUserResponse.data);
        assert.isTrue(createUserResponse.data.done);
        assert.exists(loginUserResponse.data.accessToken);

        const userService = new CalorietteApi({ accessToken: loginUserResponse.data.accessToken }, serverAddress);

        const getUserResponse = await adminService.getUser(user.email);
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
        const createUserRecord = await adminService.createRecord(userRecord);
        assert.exists(createUserRecord.data);
        assert.isTrue(createUserRecord.data.done);
        const recordId = createUserRecord.data.id;

        let userRecords = await userService.getRecords();
        assert.exists(userRecords.data);
        assert.lengthOf(userRecords.data.records, 1);
        assert.deepEqual(
            userRecords.data.records[0],
            { ...userRecord, id: recordId, lessThanExpectedCalories: userRecords.data.records[0].lessThanExpectedCalories }
        );

        let updateUserRecord = await adminService.updateRecord(recordId, { numberOfCalories: 72 });
        assert.exists(updateUserRecord.data);
        assert.isTrue(updateUserRecord.data.done);
        userRecord.numberOfCalories = 72;

        updateUserRecord = await adminService.updateRecord(recordId, { text: "1 chicken risotto", numberOfCalories: 420 });
        assert.exists(updateUserRecord.data);
        assert.isTrue(updateUserRecord.data.done);
        userRecord.numberOfCalories = 420;
        userRecord.text = "1 chicken risotto";

        userRecords = await userService.getRecords();
        assert.exists(userRecords.data);
        assert.lengthOf(userRecords.data.records, 1);
        assert.deepEqual(
            userRecords.data.records[0],
            { ...userRecord, id: recordId, lessThanExpectedCalories: userRecords.data.records[0].lessThanExpectedCalories }
        );

        updateUserRecord = await adminService.updateRecord(recordId, { text: "1 chicken risotto and 1l coke" });
        assert.exists(updateUserRecord.data);
        assert.isTrue(updateUserRecord.data.done);

        const deleteUserRecord = await adminService.deleteRecord(recordId);
        assert.exists(deleteUserRecord.data);
        assert.isTrue(deleteUserRecord.data.done);

        userRecords = await userService.getRecords();
        assert.exists(userRecords.data);
        assert.lengthOf(userRecords.data.records, 0);

        const deleteUserResponse = await adminService.deleteUser(user.email);
        assert.exists(deleteUserResponse.data);
        assert.isTrue(deleteUserResponse.data.done);
        await errorTest(
            adminService.getUser(user.email),
            HTTP.NOT_FOUND,
            "The user should be deleted"
        );
    });

    it("Should be able to create multiple users", async () => {


        for (const mod of moderatorsArray) {
            const createUser = await adminService.createUser({ ...mod, role: CreateUserRequestRoleEnum.Moderator });
            assert.exists(createUser.data);
            assert.isTrue(createUser.data.done);
        }
        const createUser = await adminService.createUser({ ...user, role: CreateUserRequestRoleEnum.User });
        assert.exists(createUser.data);
        assert.isTrue(createUser.data.done);

        const getModLessThan2000Cal = await adminService.getUsers(
            `role eq "${CreateUserRequestRoleEnum.Moderator}" and expectedCaloriesPerDay lt 2000`
        );
        assert.exists(getModLessThan2000Cal.data);
        assert.lengthOf(getModLessThan2000Cal.data.users, 1);
        assert.deepEqual(getModLessThan2000Cal.data.users[0], {
            expectedCaloriesPerDay: moderatorsArray[1].expectedCaloriesPerDay,
            email: moderatorsArray[1].email,
            name: moderatorsArray[1].name,
            surname: moderatorsArray[1].surname,
        });

        const getAllUsersWithUserRole = await adminService.getUsers(
            `role eq "${CreateUserRequestRoleEnum.User}"`
        );
        assert.exists(getAllUsersWithUserRole.data);
        assert.lengthOf(getAllUsersWithUserRole.data.users, 1);


        const getAllUsersUnder2000Cal = await adminService.getUsers(
            `expectedCaloriesPerDay lt 2000`
        );
        assert.exists(getAllUsersUnder2000Cal.data);
        assert.lengthOf(getAllUsersUnder2000Cal.data.users, 2);
    });

    it("Should be able to create multiple records and filter them", async () => {
        await errorTest(
            adminService.createRecord({
                date: "2020-02-01",
                time: "14:14:20",
                text: "125g rice and 100g pasta",
                userEmail: "invaliduseremailrecord@gmail.com",
                numberOfCalories: 1231
            }),
            HTTP.NOT_FOUND,
            "Should not be able to create a record for an invalid user"
        );
        await adminService.createRecord({
            date: "2020-01-01",
            time: "14:00:00",
            text: "100g rice and 100g beef",
            userEmail: moderatorsArray[0].email,
            numberOfCalories: 630
        });
        await adminService.createRecord({
            date: "2020-01-02",
            time: "13:00:00",
            text: "200ml chicken soup and 200g spinach",
            userEmail: moderatorsArray[0].email,
            numberOfCalories: 342
        });
        await adminService.createRecord({
            date: "2020-01-03",
            time: "02:02:13",
            text: "200ml sprite and 300g oatmeal",
            userEmail: moderatorsArray[1].email,
            numberOfCalories: 300
        });
        await adminService.createRecord({
            date: "2020-02-03",
            time: "23:23:32",
            text: "100g chips",
            userEmail: moderatorsArray[2].email,
            numberOfCalories: 40
        });
        await adminService.createRecord({
            date: "2020-02-04",
            time: "00:00:12",
            text: "100g chocolate",
            userEmail: moderatorsArray[2].email,
            numberOfCalories: 600
        });
        await adminService.createRecord({
            date: "2020-02-04",
            time: "13:00:00",
            text: "100g mashed potatoes",
            userEmail: moderatorsArray[2].email,
            numberOfCalories: 242
        });

        const last30DaysRecords = await adminService.getRecords(
            `(JulianDay("2020-03-03") - JulianDay(date)) gt 30` // julianday is sqlite specific
        );
        assert.exists(last30DaysRecords.data);
        assert.lengthOf(last30DaysRecords.data.records, 3);

        const moreThan300CalRecords = await adminService.getRecords(
            `numberOfCalories gt 300`,
            "2",
        );
        assert.exists(moreThan300CalRecords.data);
        assert.lengthOf(moreThan300CalRecords.data.records, 2);

        const complexFilterRecords = await adminService.getRecords(
            `(date ne "2020-02-04" or time eq "13:00:00") and numberOfCalories lt 270`
        );
        assert.exists(complexFilterRecords.data);
        assert.lengthOf(complexFilterRecords.data.records, 2);

        const second2Records = await adminService.getRecords(
            undefined,
            "2",
            "2"
        );
        assert.exists(second2Records.data);
        assert.lengthOf(second2Records.data.records, 2);


    });

    it("Should be able to edit a Users daily calories and records should reflect that", async () => {
        const mod = moderatorsArray[0];
        const updateMod = await adminService.updateUser(mod.email, { expectedCaloriesPerDay: 300 });
        assert.exists(updateMod.data);
        assert.isTrue(updateMod.data.done);

        const getModRecords = await adminService.getRecords(undefined, undefined, undefined, mod.email);
        assert.exists(getModRecords.data);
        getModRecords.data.records.forEach(r => {
            assert.isFalse(r.lessThanExpectedCalories);
        });

        const updateModAgain = await adminService.updateUser(mod.email, { expectedCaloriesPerDay: 1400 });
        assert.exists(updateModAgain.data);
        assert.isTrue(updateModAgain.data.done);

        const getModRecordsAgain = await adminService.getRecords(undefined, undefined, undefined, mod.email);
        assert.exists(getModRecordsAgain.data);
        getModRecordsAgain.data.records.forEach(r => {
            assert.isTrue(r.lessThanExpectedCalories);
        });
    });

    it("Should be able to delete his User", async () => {
        const deleteAdminResponse = await adminService.deleteUser(adminUser.email);
        assert.exists(deleteAdminResponse.data);
        assert.isTrue(deleteAdminResponse.data.done);
    });
});
