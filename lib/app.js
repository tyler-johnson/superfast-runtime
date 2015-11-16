import Appcore from "appcore";
let app = global.App = Appcore();
export default app;

import phone from "./phone";
app.use(phone);
