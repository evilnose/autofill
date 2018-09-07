import {Component, ContentChild, Input, OnInit, TemplateRef} from "@angular/core";
import {Status} from "./status-dot.component";

@Component({
    template: `
        <div *ngIf="deleteStatus === StatusRef.SUCCESS" class="alert alert-success">
            Deletion successful.
        </div>
        <div *ngIf="deleteStatus === StatusRef.FAILED" class="alert alert-danger">
            Deletion failed. Reason: {{deleteErrorMessage}}.
            You can report this error by emailing to collegeapp.autofill@gmail.com. Please include the error message, if applicable.
        </div>
        <div *ngIf="deleteStatus === StatusRef.PENDING" class="alert alert-info">
            Deleting...
        </div>
        <div *ngIf="getStatus === StatusRef.SUCCESS" class="resource-block">
            <div *ngIf="resList?.length > 0" class="container-fluid">
                <div *ngFor="let r of resList" class="row">
                    <div class="col-md-8 container-center">
                        <ng-template [ngTemplateOutlet]="templateRef"
                                     [ngTemplateOutletContext]="{$implicit: r.data}"></ng-template>
                    </div>
                    <div class="col-md-4 container-center justify-content-center">
                        <button class="btn btn-danger" (click)="deleteResource(r)" [disabled]="deleting">Delete</button>
                    </div>
                    <hr/>
                </div>
            </div>
            <div *ngIf="!resList || resList.length === 0" class="alert alert-warning">
                There are no instances of this resource.
            </div>
        </div>
        <div *ngIf="getStatus === StatusRef.EXECUTING" class="alert alert-info">
            Retrieving resources...
        </div>
        <div *ngIf="getStatus === StatusRef.FAILED" class="alert alert-danger">
            Unexpected error: {{getErrorMessage}}
        </div>
    `,
    styleUrls: ['../../assets/scss/app.scss', './resource-list.component.scss'],
    selector: 'res-list',
})
export default class ResourceListComponent implements OnInit {
    @Input() private getResListFn: () => any[];
    private resList: any[];
    private StatusRef = Status;
    private getStatus: Status;
    private deleteStatus: Status;
    private getErrorMessage: string;
    private deleteErrorMessage: string;
    private deleting: boolean;
    @ContentChild(TemplateRef) private templateRef: TemplateRef<any>;

    constructor() {
        this.deleting = false;
        this.getStatus = Status.IDLE;
        this.deleteStatus = Status.IDLE;
    }

    async initialize() {
        try {
            this.getStatus = Status.PENDING;
            this.resList = await this.getResListFn();
            this.getStatus = Status.SUCCESS;
        } catch (e) {
            this.getErrorMessage = e;
            this.getStatus = Status.FAILED;
        }
    }

    ngOnInit() {
        this.initialize();
    }

    private async deleteResource(r: any) {
        this.deleting = true;
        try {
            this.deleteStatus = Status.PENDING;
            await r.delete();
            this.deleting = false;
            this.deleteStatus = Status.SUCCESS;
            this.initialize();
        } catch (e) {
            this.deleteErrorMessage = e;
            this.deleteStatus = Status.FAILED;
        }
    }
}