import Appcore from "appcore";
let app = global.App = Appcore();
export default app;

import browserChannel from "./browser-channel";
app.use(browserChannel);
