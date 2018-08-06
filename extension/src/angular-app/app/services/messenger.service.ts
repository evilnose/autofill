import {Injectable, OnInit} from "@angular/core";
import Messaging from "../../../common/messaging";

@Injectable()
export class MessengerService {
    public latestSessionInfo: SessionInfo;

    constructor() {
        this.latestSessionInfo = new SessionInfo(Messaging.SessionStatus.FETCHING, "fetching logs...", false);
        this.sendSessionMsg({
            action: "fetch_status",
        });
        chrome.runtime.onMessage.addListener(this._onMessage.bind(this));
    }

    private _onMessage(message: any): void {
        if (message._source != Messaging.Source.BACKGROUND)
            return;
        switch (message.action) {
            case "update_status":
                this.latestSessionInfo = message.sessionInfo as SessionInfo;
                break;
        }
    }

    public newSession(processObj: object, userInfoObj: object, debug: boolean, skipLogin: boolean, appAuth: object) {
        const toSend = Object.assign({
            _source: Messaging.Source.UI,
            action: "start",
            debug: debug,
            processObj: processObj,
            userInfo: userInfoObj,
        }, skipLogin || {authObj: appAuth}); // If skip login, only send skipLogin; else, send appAuth.
        chrome.runtime.sendMessage(toSend);
    }

    public sendSessionMsg(msg: object): void {
        chrome.runtime.sendMessage(Object.assign(msg, {_source: Messaging.Source.UI}))
    }

    public endSession() {
        chrome.runtime.sendMessage({
            _source: Messaging.Source.UI,
            action: "end",
        });
    }
}

class SessionInfo {
    constructor(public status: number, public logs: string, public debugging: boolean) {}
}