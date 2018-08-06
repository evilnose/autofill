import {Component, Input, OnInit} from "@angular/core";
import Messaging from "../../../common/messaging";
import {AppCredential, IProcess, IUserData} from "../models/Info";
import {MessengerService} from "../services/messenger.service";
import {interval} from "rxjs";

@Component({
    selector: "progress-display",
    styleUrls: ["./progress-combined.scss", "../../assets/scss/app.scss"],
    template: `
        <div class="progress-container">
            <div class="row mb-2">
                <div class="col-md-4">
                    <div *ngIf="!inSession">
                        <button class="btn btn-success btn-lg prog-action-btn" (click)="startTest()" type="button"
                                [disabled]="!readyToStart">
                            Send Now
                        </button>
                    </div>
                    <div *ngIf="inSession">
                        <button class="btn btn-danger btn-lg prog-action-btn" (click)="endTest()" type="button">Stop</button>
                    </div>
                </div>
                <div class="col-md-8">
                    <h4 class="test-status mb-2">{{sessionStatus}}</h4>
                </div>
            </div>
            <textarea class="log-area" readonly>{{logs}}</textarea>
        </div>
    `,
})
export class ProgressDisplayComponent implements OnInit {
    @Input() private process: IProcess;
    @Input() private userInfo: IUserData;
    @Input() private appAuth: AppCredential;
    @Input() private forAdmin: boolean;
    @Input() private skipLogin: boolean;

    private readyToStart: boolean;
    private inSession: boolean;
    private sessionStatus: string;
    private logs: string;

    constructor(public messenger: MessengerService) {
        this.readyToStart = false;
        this.inSession = false;
    }

    ngOnInit(): void {
        interval(200).subscribe(() => {
            const info = this.messenger.latestSessionInfo;
            if (!info) {
                return;
            }
            switch (info.status) {
                case Messaging.SessionStatus.FETCHING:
                    this.readyToStart = false;
                    this.inSession = false;
                    this.sessionStatus = "Fetching Status...";
                    this.logs = "Please wait while the current testing status is fetched.";
                    break;
                case Messaging.SessionStatus.IN_PROGRESS:
                    this.readyToStart = false;
                    if (this.forAdmin === info.debugging) {
                        this.inSession = true;
                        this.sessionStatus = "Session in Progress...";
                        this.logs = info.logs;
                    } else {
                        this.inSession = false;
                        this.sessionStatus = "Cannot start.";
                        this.logs = "You have another in session in progress. Please check " +
                            (info.debugging ? "Contrib" : "your personal form") + " page to confirm.";
                    }
                    break;
                case Messaging.SessionStatus.IDLE:
                    this.inSession = false;
                    // If data is ready, or
                    if (this.dataReady()) {
                        this.sessionStatus = "Ready to Start.";
                        this.readyToStart = true;
                        this.logs = info.logs;
                    } else {
                        this.readyToStart = false;
                        this.sessionStatus = "Not ready.";
                        this.logs = "You have missing data. Please review the page for details.";
                    }
                    break;
                default:
                    this.inSession = false;
                    this.readyToStart = true;
                    if (this.forAdmin === info.debugging) {
                        this.sessionStatus = (info.status === Messaging.SessionStatus.SUCCEEDED) ? "Success" : "Session Failed";
                        this.logs = info.logs;
                    } else {
                        this.sessionStatus = "Ready to start.";
                        this.logs = "Press 'Send Now' to begin.";
                    }
            }
        });
    }

    public startTest() {
        this.messenger.newSession(this.process, this.userInfo, this.forAdmin, this.skipLogin, this.appAuth);
    }

    public endTest() {
        this.messenger.endSession();
    }

    private dataReady(): boolean {
        return !!(this.process && this.userInfo && (this.appAuth || this.skipLogin));
    }
}
