
import { Account, Options, OutMessage, PostDelegate } from "../typings";
import { CLEAR_DATA, ENABLE3DS, ENABLE_AUTO_SUBMIT, ENABLE_LOGGING, FOCUS, FORMAT, GET_TOKEN, INIT, PING, SET_ACCOUNT_DATA, SET_PLACEHOLDER, STYLE, UPDATE3DS, UPDATE_ISSUER } from "./constants";

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

  setAccount(data: Account) {
    var message = {
      action: SET_ACCOUNT_DATA,
      data
    };
    this.logAction(SET_ACCOUNT_DATA);
    this.postMessage(message);
  }

  init() {
    var message = {
      action: INIT,
      tokenType: this.type,
      referrer: window.location.toString()
    };
    this.logAction(INIT);
    this.postMessage(message);
  }
  
  getToken() {
    var message = {
      action: GET_TOKEN
    };
    this.logAction(GET_TOKEN);
    this.postMessage(message);
  }

  enable3DS(waitForResponse?: boolean, waitForResponseTimeout?: number) {
    var message = {
      action: ENABLE3DS,
      data: {
        waitForResponse,
        waitForResponseTimeout
      }
    };
    this.logAction(ENABLE3DS);
    this.postMessage(message);
  }

  update3DS(fieldName: string, value?: string | number) {
    var message = {
      action: UPDATE3DS,
      data: {
        fieldName,
        value
      }
    };
    this.logAction(UPDATE3DS);
    this.postMessage(message);
  }

  updateIssuer(issuer: string) {
    var message = {
      action: UPDATE_ISSUER,
      issuer
    };
    this.logAction(UPDATE_ISSUER);
    this.postMessage(message);
  }

  setPlaceholder(data: string) {
    var message = {
      action: SET_PLACEHOLDER,
      data
    };
    this.logAction(SET_PLACEHOLDER);
    this.postMessage(message);
  }

  enableAutoFormat(formatChar?: string) {
    var message = {
      action: FORMAT,
      data: {
        formatChar
      }
    };
    this.logAction(FORMAT);
    this.postMessage(message);
  }
  
  enableLogging() {
    var message = {
      action: ENABLE_LOGGING
      //TODO: should this have a bool param
    };
    this.logAction(ENABLE_LOGGING);
    this.postMessage(message);
  }

  enableAutoSubmit(formId?: string) {
    var message = {
      action: ENABLE_AUTO_SUBMIT,
      data: {
        formId
      }
    };
    this.logAction(ENABLE_AUTO_SUBMIT);
    this.postMessage(message);
  }

  setStyle(data: any) {
    var message = {
      action: STYLE,
      data
    };
    this.logAction(STYLE);
    this.postMessage(message);
  }

  //TODO: implement
  focusIfield() {
    var message = {
      action: FOCUS
    };
    this.logAction(FOCUS);
    this.postMessage(message);
  }

  //TODO: implement
  clearIfield() {
    var message = {
      action: CLEAR_DATA
    };
    this.logAction(CLEAR_DATA);
    this.postMessage(message);
  }
}