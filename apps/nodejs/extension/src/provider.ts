import Provider from "./controllers/communication/Provider";
import PocketNetworkProvider from "./controllers/providers/PocketNetwork";
import EthereumProvider from "./controllers/providers/Ethereum";

window.soothe = new Provider();
setTimeout(() => {
  window.pocketNetwork = new PocketNetworkProvider();
}, 1000);
setTimeout(() => {
  // @ts-ignore
  window.ethereum = new EthereumProvider();
}, 1000);
