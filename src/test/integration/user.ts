import { assert } from "chai";
import { CalorietteApi } from "../../sdk/axios";

// tslint:disable:no-console
describe("Integration tests", () => {

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

    it("Should be able to signup a user", async () => {
        const signupUserResponse = await service.signupUser(user);
        assert.exists(signupUserResponse.data);
        assert.isTrue(signupUserResponse.data.done);
    });

    it("Should be able to login a user", async () => {
        const loginUserResponse = await service.loginUser({ email: user.email, password: user.password });
        assert.exists(loginUserResponse.data);
        assert.exists(loginUserResponse.data.accessToken);
        assert.isTrue(loginUserResponse.data.done);
        service = new CalorietteApi({ accessToken: loginUserResponse.data.accessToken }, serverAddress);
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
