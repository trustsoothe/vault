import { wrapStore } from "webext-redux";
import store from "./redux/store";
import BackgroundController from "./controllers/background";

wrapStore(store);

const backgroundController = new BackgroundController();
