import { AfterViewInit, Component, ElementRef, EventEmitter, Input, OnChanges, Output, SimpleChanges } from '@angular/core';
import { OutMessage, Account, Options, ThreeDS, TokenData, SubmitData } from '../typings';
import {
  PING,
  STYLE,
  GET_TOKEN,
  INIT,
  FORMAT,
  SET_PLACEHOLDER,
  FOCUS,
  CLEAR_DATA,
  SET_ACCOUNT_DATA,
  ENABLE_LOGGING,
  ENABLE_AUTO_SUBMIT,
  ENABLE3DS,
  UPDATE3DS,
  UPDATE_ISSUER,
  LOADED,
  TOKEN,
  ERROR,
  AUTO_SUBMIT,
  UPDATE,
  AMOUNT,
  MONTH,
  YEAR,
  CARD_TYPE,
  CVV_TYPE,
  AUTO_FORMAT_DEFAULT_SEPARATOR,
  IFIELDS_VERSION
} from "./constants";
import { transformAccountData } from './functions';
import MessagePoster from './message-poster';

const iframeSrc = `https://cdn.cardknox.com/ifields/${IFIELDS_VERSION}/ifield.htm`;

@Component({
  selector: 'cardknox-ifields',
  template: `
  <iframe
    src="${iframeSrc}"
    title="{{type}}"
  ></iframe>
  `,
  styles: [
  ]
})
export class AngularIfieldsComponent implements AfterViewInit, OnChanges {

  @Input() type = "";
  @Input() account?: Account;
  @Input() options: Options = {};
  @Input() threeDS: ThreeDS = {};
  @Input() issuer: string = '';

  @Output() keypress: EventEmitter<any> = new EventEmitter();
  @Output() blur: EventEmitter<any> = new EventEmitter();
  @Output() change: EventEmitter<any> = new EventEmitter();
  @Output() input: EventEmitter<any> = new EventEmitter();
  @Output() click: EventEmitter<any> = new EventEmitter();
  @Output() focus: EventEmitter<any> = new EventEmitter();
  @Output() dblclick: EventEmitter<any> = new EventEmitter();
  @Output() load: EventEmitter<any> = new EventEmitter();
  @Output() token: EventEmitter<any> = new EventEmitter();
  @Output() iFieldError: EventEmitter<any> = new EventEmitter();
  @Output() update: EventEmitter<any> = new EventEmitter();
  @Output() submit: EventEmitter<any> = new EventEmitter();

  iFrameLoaded = false;
  ifieldDataCache = {};
  latestErrorTime?: Date;
  xTokenData?: TokenData;
  _tokenValid = false;
  tokenLoading = false;

  private messagePoster?: MessagePoster;

  get tokenValid(): boolean {
    return this._tokenValid && !!this.xTokenData && !!this.xTokenData?.xToken;

  }
  set tokenValid(value: boolean) {
    this._tokenValid = value;
  }

  constructor(private elementRef: ElementRef) { }

  ngAfterViewInit(): void {
    this.messagePoster = new MessagePoster(this.elementRef.nativeElement.children[0].contentWindow.postMessage.bind(this.elementRef.nativeElement.children[0].contentWindow),
      this.options, this.type, () => this.iFrameLoaded);
    window.addEventListener("message", this.onMessage);
    this.messagePoster?.ping();
  }

  ngOnChanges(changes: SimpleChanges) {
    for (const propName in changes) {
      if (changes[propName].isFirstChange())
        continue;
      switch (propName) {
        case 'account':
          this.updateAccountChanges(changes[propName].currentValue);
          break;
        case 'threeDS':
          if (this.shouldUpdateThreeDS((changes[propName] as unknown) as ThreeDS))
            this.updateThreeDSChanges(changes[propName].currentValue, changes[propName].previousValue);
          break;
        case 'issuer':
          if (this.shouldUpdateIssuer())
            this.updateIssuerChanges(changes[propName].currentValue);
          break;
        case 'options':
          this.updateOptionsChanges(changes[propName].currentValue, changes[propName].previousValue);
          break;
      }
    }
  }

  updateOptionsChanges(val: Options, oldVal: Options) {
    if (this.type === CARD_TYPE && val.autoFormat) {
      if (
        val.autoFormat !== oldVal.autoFormat ||
        val.autoFormatSeparator !== oldVal.autoFormatSeparator
      )
        this.messagePoster?.enableAutoFormat(val.autoFormatSeparator);
    }
    if (val.autoSubmit) {
      if (
        val.autoSubmit !== oldVal.autoSubmit ||
        val.autoSubmitFormId !== oldVal.autoSubmitFormId
      )
        this.messagePoster?.enableAutoSubmit(val.autoSubmitFormId);
    }
    if (val.enableLogging && !oldVal.enableLogging)
      this.messagePoster?.enableLogging();
    if (val.placeholder && val.placeholder !== oldVal.placeholder)
      this.messagePoster?.setPlaceholder(val.placeholder);
    if (val.iFieldstyle !== oldVal.iFieldstyle)
      this.messagePoster?.setStyle(val.iFieldstyle);
  }
  updateIssuerChanges(currentValue: string) {
    this.messagePoster?.updateIssuer(currentValue);
  }
  shouldUpdateIssuer() {
    return this.type === CVV_TYPE;
  }
  updateThreeDSChanges(val: ThreeDS, oldVal: ThreeDS) {
    if (val.enable3DS)
      this.messagePoster?.enable3DS(val.waitForResponse, val.waitForResponseTimeout);
    if (val.amount !== oldVal.amount || !oldVal.enable3DS)
      this.messagePoster?.update3DS(AMOUNT, val.amount);
    if (val.month !== oldVal.month || !oldVal.enable3DS)
      this.messagePoster?.update3DS(MONTH, val.month);
    if (val.year !== oldVal.year || !oldVal.enable3DS)
      this.messagePoster?.update3DS(YEAR, val.year);
  }

  updateAccountChanges(currentValue: Account) {
    const newAccount = transformAccountData(currentValue);
    this.messagePoster?.setAccount(newAccount);
  }

  shouldUpdateThreeDS(currentValue: ThreeDS) {
    return this.type === CARD_TYPE && currentValue.enable3DS;
  }

  onMessage = (e: MessageEvent) => {
    var data = e.data;
    if (e.source !== this.elementRef.nativeElement.children[0].contentWindow) return;
    switch (data.action) {
      case LOADED:
        this.log("Message received: ifield loaded");
        this.onLoad();
        break;
      case TOKEN:
        this.log("Message received: " + TOKEN);
        this.onToken(data);
        break;
      case AUTO_SUBMIT:       //triggered when submit is fired within the iFrame
        this.log("Message received: " + AUTO_SUBMIT);
        this.onSubmit(data);
        break;
      case UPDATE:
        this.log("Message received: " + UPDATE);
        this.onUpdate(data);
        break;
      default:
        break;
    }
    if (this.threeDS && this.threeDS.enable3DS && data.eci && data.eci.length && this.type === CARD_TYPE) {
      this.log("Message received: eci");
      this.postMessage(data);
    }
  }

  onLoad() {
    this.iFrameLoaded = true;
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
    this.load.emit();
  }

  onToken({ data }: any) {
    this.tokenLoading = false;
    if (data.result === ERROR) {
      this.latestErrorTime = new Date();
      this.log("Token Error: " + data.errorMessage);
      this.tokenValid = false;
      this.iFieldError.emit({ data });
    } else {
      this.xTokenData = data;
      this.tokenValid = true;
      this.token.emit({ data });
    }
  }

  onUpdate({ data }: any) {
    this.ifieldDataCache = {
      length: this.type === CARD_TYPE ? data.cardNumberLength : data.length,
      isEmpty: data.isEmpty,
      isValid: data.isValid
    };
    if (data.isValid && !this.tokenValid && !this.tokenLoading) {
      this.tokenLoading = true;
      this.messagePoster?.getToken();
    }
    if (!data.isValid) {
      this.tokenValid = false;
    }
    switch (data.event) {
      case 'input':
        this.input.emit({ data });
        break;
      case 'click':
        this.click.emit({ data });
        break;
      case 'focus':
        this.focus.emit({ data });
        break;
      case 'dblclick':
        this.dblclick.emit({ data });
        break;
      case 'change':
        this.change.emit({ data });
        break;
      case 'blur':
        this.blur.emit({ data });
        break;
      case 'keypress':
        this.keypress.emit({ data });
        break;
      default:
        break;
    }
    this.update.emit({ data });
  }

  onSubmit({ data }: { data: SubmitData }) {
    //call first before submit is triggered
    this.submit.emit({ data });
    if (data && data.formId) {
      document?.getElementById(data.formId)?.dispatchEvent(
        new Event("submit", {
          bubbles: true,
          cancelable: true
        })
      );
    }
  }

  postMessage(data: OutMessage) {
    this.messagePoster?.postMessage(data);
  }

  validateProps() {
    var accountProps = this.account
      ? this.account.xKey
        ? this.account.xSoftwareName
          ? this.account.xSoftwareVersion
            ? false
            : "xSoftwareVersion"
          : "xSoftwareName"
        : "xKey"
      : "account";
    if (accountProps) {
      this.error("Missing " + accountProps);
    }
    if (!this.type) this.error("Missing props (type)");
  }

  log(message: string) {
    if (this.options.enableLogging) {
      console.log(`IField ${this.type}: ${message}`);
    }
  }

  error(message: string) {
    console.error(`IField ${this.type}: ${message}`);
  }
}
