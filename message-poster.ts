
import { Options, OutMessage, PostDelegate } from "../typings";
import { PING } from "./constants";

export default class MessagePoster{
  constructor(private post: PostDelegate, private options: Options, private type: string, private iFrameLoaded: () => boolean) { }
  
  

  postMessage(data: OutMessage) {
    if (!this.iFrameLoaded() && data.action !== PING) {
      this.log("Iframe not loaded");
      this.ping();
      return;
    }
    this.post(data, "*");
  }

  log(message: string) {
    if (this.options.enableLogging) {
      console.log(`IField ${this.type}: ${message}`);
    }
  }

  logAction(action: string) {
    this.log(`Sending message ${action}`);
  }

  ping() {
    var message = {
      action: PING
    };
    this.logAction(PING);
    this.postMessage(message);
  }
}