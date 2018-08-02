import {Component, Input, OnInit} from "@angular/core";

export class StatusTextMap {
    constructor(
        public idle: string,
        public pending: string,
        public success: string,
        public failed: string,
    ) {}
}

@Component({
    selector: "status-dot",
    template: `
        <div class="text-center dot-container">
            <span class="dot" [style.background-color]="dotColor"></span>
            <span class="message">{{messageText}}</span>
        </div>
    `,
    styleUrls: ["../../assets/scss/app.scss", "./status-dot.scss"],
})
export class StatusDotComponent implements OnInit {
    private dotColor: string;
    @Input() private textMap: StatusTextMap;
    private messageText: string;
    private DEFAULT_TEXTS = new StatusTextMap(
        "Idle",
        "Working...",
        "Success!",
        "Failed.",
    );

    ngOnInit() {
        this.status = Status.IDLE;
    }

    @Input()
    public set status(status: Status) {
        if (status === null || status === undefined) {
            return;
        }

        switch (status) {
            case Status.IDLE as Status:
                this.dotColor = "#bbb";
                this.messageText = this.getText("idle");
                break;
            case Status.PENDING:
                this.dotColor = "#f5da00";
                this.messageText = this.getText("pending");
                break;
            case Status.SUCCESS:
                this.dotColor = "#00d50c";
                this.messageText = this.getText("success");
                break;
            case Status.FAILED:
                this.dotColor = "#ff0003";
                this.messageText = this.getText("failed");
                break;
        }
    }

    getText(attr: string) {
        return this.textMap ? this.textMap[attr] || this.DEFAULT_TEXTS[attr] : this.DEFAULT_TEXTS[attr];
    }
}

export enum Status {
    IDLE,
    PENDING,
    SUCCESS,
    FAILED,
}
