import app from "./app/app.js";
import config from "./config/config.js";
import connectDB from "./config/database.js";

await connectDB();

const port = config.PORT || 1234;

app.listen(port, () => {
    console.log(`Server is hosted ${port}`);
})