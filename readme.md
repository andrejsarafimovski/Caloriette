Requirements:

* API Users must be able to create an account and log in.
* All API calls must be authenticated.
* Implement at least three roles with different permission levels: a regular user would only be able to CRUD on their owned records, a user manager would be able to CRUD only users, and an admin would be able to CRUD all records and users.
* Each entry has a date, time, text, and number of calories.
* If the number of calories is not provided, the API should connect to a Calories API provider (for example https://www.nutritionix.com) and try to get the number of calories for the entered meal.
* User setting – Expected number of calories per day.
* Each entry should have an extra boolean field set to true if the total for that day is less than expected number of calories per day, otherwise should be false.
* The API must be able to return data in the JSON format.
* The API should provide filter capabilities for all endpoints that return a list of elements, as well should be able to support pagination.
* The API filtering should allow using parenthesis for defining operations precedence and use any combination of the available fields. The supported operations should at least include or, and, eq (equals), ne (not equals), gt (greater than), lt (lower than).
* Example -> (date eq '2016-05-01') AND ((number_of_calories gt 20) OR (number_of_calories lt 10)).
* Write unit and e2e tests.

Helpful take-home project guidelines:

* This project will be used to evaluate your skills, and should be fully functional without any obvious missing pieces. We will evaluate the project as if you were delivering it to a customer.
* The deadline to submit your completed project is 2 weeks from the date you received the project requirements.
* If you schedule your final interview after the 2-week deadline, make sure to submit your completed project and all code to the private repository before the deadline. Everything that is submitted after the deadline will not be taken into consideration.
* Please do not commit any code at least 12 hours before the meeting time so that it can be reviewed. Anything that is submitted after this time will not be taken into consideration.
* Please join the meeting room for this final interview on time. If you miss your interview without providing any prior notice, your application may be paused for six months.
