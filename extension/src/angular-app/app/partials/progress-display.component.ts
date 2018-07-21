import {Component, Input} from "@angular/core";
import Messaging from "../../../messaging";

@Component({
    selector: "progress-display",
    styleUrls: ["./progress-combined.scss", "../../assets/scss/app.scss"],
    template: `
        <div class="progress-container">
            <div class="row mb-2">
                <div class="col-md-2">
                    <div *ngIf="!testing">
                        <button class="btn btn-success prog-action-btn" (click)="startTest()"
                                [disabled]="!readyToStart()">
                            GO
                        </button>
                    </div>
                    <div *ngIf="testing">
                        <button class="btn btn-danger prog-action-btn" (click)="endTest()">STOP</button>
                    </div>
                </div>
                <div class="col-md-4">
                    <h4 class="test-status">{{getStatus()}}</h4>
                </div>
            </div>
            <textarea class="log-area" readonly>
                {{testDetails}}
            </textarea>
        </div>
    `,
})
export class ProgressDisplayComponent {
    @Input() private process: object;
    @Input() private userInfo: object;
    @Input() private appAuth: object;
    @Input() private forAdmin: boolean;
    @Input() private skipLogin: boolean;

    private testStatus: string;
    private testDetails: string;

    private testing: boolean;

    constructor() {
        this.testStatus = "Ready to go.";
    }

    public startTest() {
        this.testStatus = "Starting...";
        this.testDetails = "";
        const toSend = Object.assign({
            _source: Messaging.Source.UI,
            action: "start",
            debug: this.forAdmin,
            processObj: this.process,
            userInfo: this.userInfo,
        }, this.skipLogin || {authObj: this.appAuth}); // If skip login, only send skipLogin; else, send appAuth.
        chrome.runtime.sendMessage(toSend);
        this.testing = true;
    }

    public endTest() {
        this.testStatus = "Ended.";
        chrome.runtime.sendMessage({
            _source: Messaging.Source.UI,
            action: "end",
        });
        this.testing = false;
    }

    private readyToStart(): boolean {
        return !!(this.process && this.userInfo && (this.appAuth || this.skipLogin));
    }

    private getStatus() {
        // TODO if this has already started.
        if (!this.readyToStart()) {
            return "Not ready to start.";
        }
        return this.testStatus;
    }
}
