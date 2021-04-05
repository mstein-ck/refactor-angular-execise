import { Account, Options, ThreeDS } from "../typings";
import { AMOUNT, CARD_TYPE, CVV_TYPE, MONTH, YEAR } from "./constants";
import { transformAccountData } from "./functions";
import MessagePoster from "./message-poster";

export default class MessageHandler {

  constructor(private messagePoster: MessagePoster, private account: Account | null, private options: Options, private type: string, private issuer: string, private threeDS: ThreeDS, private setIframeLoaded: (x: boolean) => void) { }

  onLoad() {
    this.setIframeLoaded(true);
    if (this.account) {
      const newAccount = transformAccountData(this.account);
      this.messagePoster?.setAccount(newAccount);
    }
    if (this.type === CARD_TYPE && this.threeDS && this.threeDS.enable3DS) {
      this.messagePoster?.enable3DS(this.threeDS.waitForResponse, this.threeDS.waitForResponseTimeout);
      this.messagePoster?.update3DS(AMOUNT, this.threeDS.amount);
      this.messagePoster?.update3DS(MONTH, this.threeDS.month);
      this.messagePoster?.update3DS(YEAR, this.threeDS.year);
    }
    this.messagePoster?.init();
    if (this.type === CVV_TYPE && this.issuer)
      this.messagePoster?.updateIssuer(this.issuer);
    if (this.options.placeholder)
      this.messagePoster?.setPlaceholder(this.options.placeholder);
    if (this.options.enableLogging)
      this.messagePoster?.enableLogging();
    if (this.type === CARD_TYPE && this.options.autoFormat)
      this.messagePoster?.enableAutoFormat(this.options.autoFormatSeparator);
    if (this.options.autoSubmit)
      this.messagePoster?.enableAutoSubmit(this.options.autoSubmitFormId);
    if (this.options.iFieldstyle)
      this.messagePoster?.setStyle(this.options.iFieldstyle);
  }
}