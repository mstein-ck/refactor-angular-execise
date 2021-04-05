import { Account, Options, ThreeDS, ComponentProperties, DataStore, SubmitData } from "../typings";
import { AMOUNT, CARD_TYPE, CVV_TYPE, ERROR, MONTH, YEAR } from "./constants";
import { transformAccountData } from "./functions";
import MessagePoster from "./message-poster";

export default class MessageHandler {

  constructor(private messagePoster: MessagePoster, private props: ComponentProperties, private store: DataStore, private log: (message: string) => void) { }

  onLoad() {
    this.store.iFrameLoaded = true;
    if (this.props.account) {
      const newAccount = transformAccountData(this.props.account);
      this.messagePoster?.setAccount(newAccount);
    }
    if (this.props.type === CARD_TYPE && this.props.threeDS && this.props.threeDS.enable3DS) {
      this.messagePoster?.enable3DS(this.props.threeDS.waitForResponse, this.props.threeDS.waitForResponseTimeout);
      this.messagePoster?.update3DS(AMOUNT, this.props.threeDS.amount);
      this.messagePoster?.update3DS(MONTH, this.props.threeDS.month);
      this.messagePoster?.update3DS(YEAR, this.props.threeDS.year);
    }
    this.messagePoster?.init();
    if (this.props.type === CVV_TYPE && this.props.issuer)
      this.messagePoster?.updateIssuer(this.props.issuer);
    if (this.props.options.placeholder)
      this.messagePoster?.setPlaceholder(this.props.options.placeholder);
    if (this.props.options.enableLogging)
      this.messagePoster?.enableLogging();
    if (this.props.type === CARD_TYPE && this.props.options.autoFormat)
      this.messagePoster?.enableAutoFormat(this.props.options.autoFormatSeparator);
    if (this.props.options.autoSubmit)
      this.messagePoster?.enableAutoSubmit(this.props.options.autoSubmitFormId);
    if (this.props.options.iFieldstyle)
      this.messagePoster?.setStyle(this.props.options.iFieldstyle);
  }

  onToken({ data }: any) {
    this.store.tokenLoading = false;
    if (data.result === ERROR) {
      this.log("Token Error: " + data.errorMessage);
      this.store.tokenValid = false;
      return false;
    } else {
      this.store.tokenData = data;
      this.store.tokenValid = true;
      return true;
    }
  }

  onUpdate({ data }: any) {
    this.store.ifieldDataCache = {
      length: this.props.type === CARD_TYPE ? data.cardNumberLength : data.length,
      isEmpty: data.isEmpty,
      isValid: data.isValid
    };
    //TODO: handle tokenValid getter
    if (data.isValid && !this.store.tokenValid && !this.store.tokenLoading) {
      this.store.tokenLoading = true;
      this.messagePoster?.getToken();
    }
    if (!data.isValid) {
      this.store.tokenValid = false;
    }
  }

  onSubmit({ data }: { data: SubmitData }) {
    if (data && data.formId) {
      document?.getElementById(data.formId)?.dispatchEvent(
        new Event("submit", {
          bubbles: true,
          cancelable: true
        })
      );
    }
  }
}