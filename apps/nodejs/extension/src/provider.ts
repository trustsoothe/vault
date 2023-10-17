import Provider from "./controllers/communication/Provider";
import PocketNetworkProvider from "./controllers/providers/PocketNetwork";

window.soothe = new Provider();
setTimeout(() => {
  window.pocketNetwork = new PocketNetworkProvider();
}, 1000);
