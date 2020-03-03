import { assert } from "chai";
import HTTP from "http-status-codes";
import { RecordManager } from "../../models/records-manager";
import { UserManager } from "../../models/user-manager";

// tslint:disable
describe("Unit tests", () => {

    let adminRecordManager: RecordManager;
    let adminUserManager: UserManager;

    const adminUser = {
        email: "admin@gmail.com",
        name: "admin",
        password: "admin12345",
        surname: "AdminSur",
        expectedCaloriesPerDay: 1800
    };

    const user = {
        email: "userUnit@gmail.com",
        name: "userUnit",
        password: "userUnit12345",
        surname: "UserUnitSur",
        expectedCaloriesPerDay: 1100
    };
    const moderatorsArray = [
        {
            email: "modUnit1@gmail.com",
            name: "modUnit1",
            password: "modUnit112345",
            surname: "modUnit1Sur",
            expectedCaloriesPerDay: 2000
        },
        {
            email: "modUnit2@gmail.com",
            name: "modUnit2",
            password: "modUnit212345",
            surname: "modUnit2Sur",
            expectedCaloriesPerDay: 1200
        },
        {
            email: "modUnit3@gmail.com",
            name: "modUnit3",
            password: "modUnit312345",
            surname: "modUnit3Sur",
            expectedCaloriesPerDay: 3400
        }
    ];

    before(() => {
        adminRecordManager = new RecordManager(adminUser.email, "admin");
        adminUserManager = new UserManager(adminUser.email, "admin");
    })

    it("Should be able to signup a user", async () => {
        const signupUser = await UserManager.signup(adminUser);
        assert.isTrue(signupUser.done);

    });

    it("Should be able to login a user", async () => {
        const loginAdminResponse = await UserManager.login({ email: adminUser.email, password: adminUser.password });
        assert.exists(loginAdminResponse.accessToken);
        assert.isTrue(loginAdminResponse.done);

    });

    it("Should be able to get all users data", async () => {
        const getAllUsersResponse = await adminUserManager.getAll({});
        assert.isNotEmpty(getAllUsersResponse.users);
    });

    it("Should be able to update his user data", async () => {
        adminUser.expectedCaloriesPerDay = 5000;
        const updateAdminResponse = await adminUserManager.update({
            email: adminUser.email,
            expectedCaloriesPerDay: adminUser.expectedCaloriesPerDay,
        });
        assert.exists(updateAdminResponse.done);

        const getAdminResponse = await adminUserManager.get({ email: adminUser.email });
        assert.equal(getAdminResponse.expectedCaloriesPerDay, adminUser.expectedCaloriesPerDay);
        assert.equal(getAdminResponse.email, adminUser.email);
        assert.equal(getAdminResponse.name, adminUser.name);
        assert.equal(getAdminResponse.surname, adminUser.surname);

    });

    it("Should be able to get his records", async () => {
        const getRecordsResponse = await adminRecordManager.getAll({ userEmail: adminUser.email });
        assert.isEmpty(getRecordsResponse.records);
    });

    it("Should be able to create his records", async () => {
        let createRecordResponse = await adminRecordManager.create({
            date: "2020-03-01",
            time: "13:34:30",
            userEmail: adminUser.email,
            text: "1 chicken risotto",
            numberOfCalories: 200
        });
        assert.isTrue(createRecordResponse.done);

        createRecordResponse = await adminRecordManager.create({
            date: "2020-03-01",
            time: "13:44:37",
            userEmail: adminUser.email,
            text: "300ml coke",
            numberOfCalories: 350
        });
        assert.isTrue(createRecordResponse.done);

        createRecordResponse = await adminRecordManager.create({
            date: "2020-03-01",
            time: "18:30:00",
            userEmail: adminUser.email,
            text: "100g mashed potatoes, 100g chicken breast, 1l coke"
        });
        assert.isTrue(createRecordResponse.done);

        const getRecordsResponse = await adminRecordManager.getAll({});
        assert.isNotEmpty(getRecordsResponse.records);
    });

    it("Should be able to update his records", async () => {
        const createRecordResponse = await adminRecordManager.create({
            date: "2020-02-29",
            time: "13:34:30",
            userEmail: adminUser.email,
            text: "1 spaghetti quattro formaggi",
            numberOfCalories: 611
        });
        assert.isTrue(createRecordResponse.done);
        assert.exists(createRecordResponse.id);

        const recordId = createRecordResponse.id;
        const newNumberOfCalories = 400;
        const updateRecordResponse = await adminRecordManager.update({ id: recordId, numberOfCalories: newNumberOfCalories });
        assert.isTrue(updateRecordResponse.done);

        const getRecordResponse = await adminRecordManager.get({ id: recordId });
        assert.equal(getRecordResponse.numberOfCalories, newNumberOfCalories);
    });

    it("Should be able to delete his records", async () => {
        let getRecordsResponse = await adminRecordManager.getAll({});
        assert.isNotEmpty(getRecordsResponse.records);


        for (const record of getRecordsResponse.records) {
            const deleteRecordsResponse = await adminRecordManager.delete({ id: record.id });
            assert.isTrue(deleteRecordsResponse.done);

        }

        getRecordsResponse = await adminRecordManager.getAll({});
        assert.isEmpty(getRecordsResponse.records);
    });

    it("Should be able to create a new User", async () => {
        const createUserResponse = await adminUserManager.create({ ...user, role: "user" });
        assert.isTrue(createUserResponse.done);

        let loginUserResponse = await UserManager.login({ email: user.email, password: user.password });
        assert.isTrue(createUserResponse.done);
        assert.exists(loginUserResponse.accessToken);


        user.surname = "newUserSurname";
        user.password = "newUsrrPassword";
        await adminUserManager.update({ email: user.email, surname: user.surname, password: user.password });

        loginUserResponse = await UserManager.login({ email: user.email, password: user.password });
        assert.isTrue(createUserResponse.done);
        assert.exists(loginUserResponse.accessToken);

        const userUserManager = new RecordManager(user.email, "user");

        const getUserResponse = await adminUserManager.get({ email: user.email });
        assert.exists(getUserResponse);
        assert.equal(getUserResponse.expectedCaloriesPerDay, user.expectedCaloriesPerDay);
        assert.equal(getUserResponse.email, user.email);
        assert.equal(getUserResponse.name, user.name);
        assert.equal(getUserResponse.surname, user.surname);

        const userRecord = {
            date: "2020-01-20",
            time: "10:34:02",
            text: "1 tbsp sugar",
            userEmail: user.email,
            numberOfCalories: 100
        };
        const createUserRecord = await adminRecordManager.create(userRecord);
        assert.exists(createUserRecord);
        assert.isTrue(createUserRecord.done);
        const recordId = createUserRecord.id;

        let userRecords = await userUserManager.getAll({});
        assert.exists(userRecords);
        assert.lengthOf(userRecords.records, 1);
        assert.deepEqual(
            userRecords.records[0],
            { ...userRecord, id: recordId, lessThanExpectedCalories: userRecords.records[0].lessThanExpectedCalories }
        );

        let updateUserRecord = await adminRecordManager.update({ id: recordId, numberOfCalories: 72 });
        assert.exists(updateUserRecord);
        assert.isTrue(updateUserRecord.done);
        userRecord.numberOfCalories = 72;

        updateUserRecord = await adminRecordManager.update({ id: recordId, text: "1 chicken risotto", numberOfCalories: 420 });
        assert.exists(updateUserRecord);
        assert.isTrue(updateUserRecord.done);
        userRecord.numberOfCalories = 420;
        userRecord.text = "1 chicken risotto";

        userRecords = await userUserManager.getAll({});
        assert.lengthOf(userRecords.records, 1);
        assert.deepEqual(
            userRecords.records[0],
            { ...userRecord, id: recordId, lessThanExpectedCalories: userRecords.records[0].lessThanExpectedCalories }
        );

        updateUserRecord = await adminRecordManager.update({ id: recordId, text: "1 chicken risotto and 1l coke" });
        assert.exists(updateUserRecord);
        assert.isTrue(updateUserRecord.done);

        const deleteUserRecord = await adminRecordManager.delete({ id: recordId });
        assert.exists(deleteUserRecord);
        assert.isTrue(deleteUserRecord.done);

        userRecords = await adminRecordManager.getAll({});
        assert.exists(userRecords);
        assert.lengthOf(userRecords.records, 0);

        const deleteUserResponse = await adminUserManager.delete({ email: user.email });
        assert.exists(deleteUserResponse);
        assert.isTrue(deleteUserResponse.done);
    });

    it("Should not be able to get a non existing record", async () => {
        try {
            await adminRecordManager.get({ id: "invlaidrecordid" });
            assert.fail();
        } catch (err) {
            if (!err || err.code !== HTTP.NOT_FOUND) {
                throw err;
            }
        }
    });

    it("Should be able to create multiple users", async () => {


        for (const mod of moderatorsArray) {
            const cUser = await adminUserManager.create({ ...mod, role: "moderator" });
            assert.exists(cUser);
            assert.isTrue(cUser.done);
        }
        const createUser = await adminUserManager.create({ ...user, role: "user" });
        assert.exists(createUser);
        assert.isTrue(createUser.done);

        const getModLessThan2000Cal = await adminUserManager.getAll({
            skip: "3",
            limit: "10",
            filter: `role eq "moderator" and expectedCaloriesPerDay lt 2000`
        });
        assert.exists(getModLessThan2000Cal);
        assert.lengthOf(getModLessThan2000Cal.users, 1);
        assert.deepEqual(getModLessThan2000Cal.users[0], {
            expectedCaloriesPerDay: moderatorsArray[1].expectedCaloriesPerDay,
            email: moderatorsArray[1].email,
            name: moderatorsArray[1].name,
            surname: moderatorsArray[1].surname,
        });

        const getAllUsersWithUserRole = await adminUserManager.getAll({
            filter: `role eq "user"`
        });
        assert.exists(getAllUsersWithUserRole);
        assert.lengthOf(getAllUsersWithUserRole.users, 4);


        const getAllUsersUnder2000Cal = await adminUserManager.getAll({
            filter: "expectedCaloriesPerDay lt 2000",
            limit: "5"
        });
        assert.exists(getAllUsersUnder2000Cal);
        assert.lengthOf(getAllUsersUnder2000Cal.users, 5);
    });

    it("Should be able to create multiple records and filter them", async () => {
        await adminRecordManager.create({
            date: "2020-01-01",
            time: "14:00:00",
            text: "100g rice and 100g beef",
            userEmail: moderatorsArray[0].email,
            numberOfCalories: 630
        });
        await adminRecordManager.create({
            date: "2020-01-02",
            time: "13:00:00",
            text: "200ml chicken soup and 200g spinach",
            userEmail: moderatorsArray[0].email,
            numberOfCalories: 342
        });
        await adminRecordManager.create({
            date: "2020-01-03",
            time: "02:02:13",
            text: "200ml sprite and 300g oatmeal",
            userEmail: moderatorsArray[1].email,
            numberOfCalories: 300
        });
        await adminRecordManager.create({
            date: "2020-02-03",
            time: "23:23:32",
            text: "100g chips",
            userEmail: moderatorsArray[2].email,
            numberOfCalories: 40
        });
        await adminRecordManager.create({
            date: "2020-02-04",
            time: "00:00:12",
            text: "100g chocolate",
            userEmail: moderatorsArray[2].email,
            numberOfCalories: 600
        });
        await adminRecordManager.create({
            date: "2020-02-04",
            time: "13:00:00",
            text: "100g mashed potatoes",
            userEmail: moderatorsArray[2].email,
            numberOfCalories: 242
        });

        const last30DaysRecords = await adminRecordManager.getAll({
            filter: '(JulianDay("2020-03-03") - JulianDay(date)) gt 30' // julianday is sqlite specific
        });
        assert.exists(last30DaysRecords);
        assert.lengthOf(last30DaysRecords.records, 3);

        const moreThan300CalRecords = await adminRecordManager.getAll({
            limit: "2",
            filter: "numberOfCalories gt 300"
        });
        assert.exists(moreThan300CalRecords);
        assert.lengthOf(moreThan300CalRecords.records, 2);

        const complexFilterRecords = await adminRecordManager.getAll({
            filter: '(date ne "2020-02-04" or time eq "13:00:00") and numberOfCalories lt 270',
        });
        assert.exists(complexFilterRecords);
        assert.lengthOf(complexFilterRecords.records, 2);

        const second2Records = await adminRecordManager.getAll({
            limit: "2",
            skip: "2"
        });
        assert.exists(second2Records);
        assert.lengthOf(second2Records.records, 2);


    });

    it("Should be able to edit a Users daily calories and records should reflect that", async () => {
        const mod = moderatorsArray[0];
        const updateMod = await adminUserManager.update({ email: mod.email, expectedCaloriesPerDay: 300 });
        assert.exists(updateMod);
        assert.isTrue(updateMod.done);

        const getModRecords = await adminRecordManager.getAll({ userEmail: mod.email });
        assert.exists(getModRecords);
        getModRecords.records.forEach(r => {
            assert.isFalse(r.lessThanExpectedCalories);
        });

        const updateModAgain = await adminUserManager.update({ email: mod.email, expectedCaloriesPerDay: 1400 });
        assert.exists(updateModAgain);
        assert.isTrue(updateModAgain.done);

        const getModRecordsAgain = await adminRecordManager.getAll({ userEmail: mod.email });
        assert.exists(getModRecordsAgain);
        getModRecordsAgain.records.forEach(r => {
            assert.isTrue(r.lessThanExpectedCalories);
        });
    });

    it("Should be able to delete his User", async () => {
        const deleteAdminResponse = await adminUserManager.delete({ email: adminUser.email });
        assert.exists(deleteAdminResponse);
        assert.isTrue(deleteAdminResponse.done);
    });
});
