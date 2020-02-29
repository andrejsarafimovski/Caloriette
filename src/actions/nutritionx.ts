import HTTP from "http-status-codes";
import nf from "node-fetch";

import { config } from "../config";
import { codedError } from "../lib/coded-error";

export class NutritionX {

    private readonly endpoint: string;
    constructor() {
        this.endpoint = "https://trackapi.nutritionix.com/v2";
    }
    async getCalories(text: string): Promise<number> {
        const response = await nf(`${this.endpoint}/natural/nutrients`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "x-app-id": config.nutritionx.appId,
                "x-app-key": config.nutritionx.appKey
            },
            body: JSON.stringify({
                query: text
            })
        });
        if (response.status !== HTTP.OK) {
            const jsonErrorData: { message: string } = await response.json();
            throw codedError(response.status, jsonErrorData.message);
        }
        const jsonData: NutrientsResponse = await response.json();
        return jsonData.foods.reduce((totalCal, food) => totalCal + food.nf_calories, 0);
    }
}


interface NutrientsResponse {
    foods: {
        food_name: string;
        nf_calories: number;
    }[];
}
