import app from "./app/app.js";
import config from "./config/config.js";
import connectDB from "./config/database.js";
import { startPendingOrderExpiryJob } from "./jobs/expirePendingOrders.job.js";

await connectDB();

startPendingOrderExpiryJob();

const port = config.PORT || 1234;

app.listen(port, () => {
    console.log(`Server is hosted on port ${port}`);
})