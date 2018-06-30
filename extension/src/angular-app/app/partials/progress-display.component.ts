import {Component, Input, OnInit} from "@angular/core";

@Component({
    selector: "progress-display",
    styleUrls: ["./progress-combined.scss", "../../assets/scss/app.scss"],
    template: `
        <div class="progress-container">
            <div class="row mb-2">
                <div class="col-md-2">
                    <div *ngIf="!testing">
                        <button class="btn btn-success prog-action-btn" (click)="startTest(false)"
                                [disabled]="!readyToStart()">
                            GO
                        </button>
                        <span *ngIf="readyToStart()" class="ml-2">Ready to go.</span>
                    </div>
                    <div *ngIf="testing">
                        <button class="btn btn-danger prog-action-btn" (click)="endTest()">STOP</button>
                    </div>
                </div>
                <div class="col-md-4">
                    <h4 class="test-status">{{testStatus}}</h4>
                </div>
            </div>
            <textarea class="log-area" readonly>
                {{testDetails}}
            </textarea>
        </div>
    `,
})
export class ProgressDisplayComponent implements OnInit {
    @Input() public process: object;
    @Input() public userInfo: object;
    @Input() public appAuth: object;
    @Input() public forAdmin: boolean;

    private testStatus: string;
    private testDetails: string;

    private testing: boolean;

    constructor() {
        this.testStatus = "Standing by...";
    }

    public ngOnInit(): void {
        if (this.forAdmin) {
            // TODO tell logger that this is for admin
        } else {
            // TODO
        }
    }

    public readyToStart(): boolean {
        return !!(this.process && this.userInfo && this.appAuth);
    }

    public startTest(skipLogin: boolean) {
        this.testStatus = "Starting...";
        this.testDetails = "";

        chrome.runtime.sendMessage({
            action: "start",
            skipLogin,
        });
        this.testing = true;
    }

    public endTest() {
        this.testStatus = "Ended.";
        chrome.runtime.sendMessage({
            action: "end",
        });
        this.testing = false;
    }
}
