import { SubmitData, TokenData } from "../typings";
import { CARD_TYPE, ERROR } from "./constants";
import MessagePoster from "./message-poster";

export default class MessageHandler {

  ifieldDataCache = {};
  latestErrorTime?: Date;
  tokenData?: TokenData;
  _tokenValid = false;
  tokenLoading = false;


  get tokenValid(): boolean {       //TODO: refactor
    return this._tokenValid && !!this.tokenData && !!this.tokenData?.xToken;

  }
  set tokenValid(value: boolean) {
    this._tokenValid = value;
  }

  constructor(private messagePoster: MessagePoster, private type: string, private log: (message: string) => void) { }

  onToken({ data }: any) {
    this.tokenLoading = false;
    if (data.result === ERROR) {
      this.log("Token Error: " + data.errorMessage);
      this.tokenValid = false;
    } else {
      this.tokenData = data;
      this.tokenValid = true;
    }
  }

  onUpdate({ data }: { data: UpdateData }) {
    const length = this.type === CARD_TYPE ? data.cardNumberLength : data.length;
    if (length !== this.ifieldDataCache?.length)
      this.tokenValid = false;
    this.ifieldDataCache = {
      length,
      isEmpty: data.isEmpty,
      isValid: data.isValid
    };
    if (this.shouldRefreshToken(data)) {
      this.tokenLoading = true;
      this.messagePoster?.getToken();
    }
    if (!data.isValid) {
      this.tokenValid = false;
    }
  }
  shouldRefreshToken(data: any) {
    return data.isValid && !this.tokenValid && !this.tokenLoading;
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
