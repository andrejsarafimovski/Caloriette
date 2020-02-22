import express from "express";

// tslint:disable:no-console
const PORT = 8000;
const app = express();

app.listen(PORT, () => {
    console.log(`Server listening on port ${PORT}`);
});
