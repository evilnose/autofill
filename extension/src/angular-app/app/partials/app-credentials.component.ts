import {Component, EventEmitter, Input, OnInit, Output} from "@angular/core";
import {FormControl, FormGroup, Validators} from "@angular/forms";
import {SubmitStatus} from "../contrib/process/process-edit.component";
import {AppCredential} from "../models/Info";
import {DbService} from "../services/db.service";

@Component({
    selector: "app-credential",
    styleUrls: ["../../assets/scss/app.scss"],
    template: `
        <div *ngIf="!_skipLogin">
            <div *ngIf="credentialsQueried">
                <div *ngIf="savedCredentials; else credentialForm">
                    <div *ngIf="!modifying; else credentialForm">
                        <h6>Using saved credentials ("{{savedCredentials.username}}") for "{{appFullName}}".</h6>
                        <button class="btn btn-primary text-center float-right" (click)="modifying = true">Change
                        </button>
                    </div>
                </div>
            </div>
            <div *ngIf="!credentialsQueried">
                <div *ngIf="!retrievalFailed" class="alert alert-info">
                    Retrieving {{isContrib ? "development" : ""}} credentials...
                </div>
                <div *ngIf="retrievalFailed" class="alert alert-danger">
                    Failed to retrieve credentials. Please check your network and refresh the page.
                </div>
            </div>
            <div>
                <span *ngIf="credsRequired">
                    You are required to enter credentials for this app. The reason given is: '{{credsRequired}}'.
                </span>
                <span *ngIf="!credsRequired">
                   You may <a href="javascript:void(0)" (click)="this.skipLogin=true">skip this step</a> if you have 
                   logged into "{{appFullName}}" in the last 30 minutes in this browser (i.e. your session is still 
                   active.)</span>
            </div>
        </div>
        <div *ngIf="this.skipLogin">
            <span>
                <b>Skipping login for "{{appFullName}}". </b><a href="javascript:void(0)"
                                                                (click)="this.skipLogin=false">Cancel</a><br/>
             (Note: don't do this if you have not logged into this app for more 
            than 30 minutes, or the AutoFill process might be stopped at the login screen.)
            </span>
        </div>

        <ng-template #credentialForm>
            <form (ngSubmit)="onSubmit()" [formGroup]="formGroup">
                <div *ngIf="formGroup.invalid && submitTouched" class="alert alert-danger">
                    Enter both the username and password to proceed.
                </div>
                <div *ngIf="submitStatus === SubmitStatusRef.SUBMITTING" class="alert alert-info">
                    Saving...
                </div>
                <div *ngIf="submitStatus === SubmitStatusRef.FAILED" class="alert alert-danger">
                    Save failed. This is mostly likely a network error. Refresh the page or check console for error log.
                </div>
                <div *ngIf="submitStatus === SubmitStatusRef.DONE" class="alert alert-success">
                    Save successful!
                </div>
                <h6>Enter your {{isContrib ? "development" : ""}}
                    credentials for "{{appFullName}}":</h6>
                <div class="form-group">
                    <label for="emailInput">Email</label>
                    <input type="email" class="form-control" id="emailInput" placeholder="Enter email"
                           formControlName="username"
                           required>
                </div>
                <div class="form-group">
                    <label for="passwordInput">Password</label>
                    <input type="password" class="form-control" id="passwordInput" placeholder="Password"
                           formControlName="password"
                           required>
                </div>
                <div class="row">
                    <div class="col-md-7">
                        <div class="form-check">
                            <input type="checkbox" class="form-check-input" id="check" formControlName="remember">
                            <label class="form-check-label" for="check">Remember these credentials</label>
                        </div>
                    </div>
                    <div *ngIf="savedCredentials && savedCredentials.username" class="col-md-2">
                        <a href="javascript:void(0)" (click)="modifying=false" class="align-text-w-btn">Cancel</a>
                    </div>
                    <div class="col-md-3">
                        <button type="submit" class="btn btn-sm btn-primary">Done</button>
                    </div>
                </div>
            </form>
        </ng-template>
    `,
})
export class AppCredentialsComponent implements OnInit {
    @Input() private appFullName: string;
    @Input() private isContrib: boolean;
    @Output() private changed: EventEmitter<AppCredential | boolean> = new EventEmitter<AppCredential | boolean>();
    @Input() private credsRequired: string;
    private _appId: string;
    private savedCredentials: AppCredential;
    private remember: boolean;
    private _skipLogin: boolean;
    private formGroup: FormGroup;

    private credentialsQueried: boolean;
    private modifying: boolean;
    private retrievalFailed: boolean;
    private submitTouched: boolean;
    private submitStatus: SubmitStatus;
    private SubmitStatusRef = SubmitStatus;

    constructor(public dbService: DbService) {
        this.formGroup = new FormGroup({
            username: new FormControl(null, Validators.required),
            password: new FormControl(null, Validators.required),
            appId: new FormControl(this._appId, Validators.required),
            remember: new FormControl(),
        });
    }

    ngOnInit() {
        this.reinitialize();
    }

    private set skipLogin(b: boolean) {
        this.changed.emit(b);
        this._skipLogin = b;
    }

    private get skipLogin(): boolean {
        return this._skipLogin;
    }

    private reinitialize(): void {
        this.credentialsQueried = false;
        this.modifying = false;
        this.retrievalFailed = false;
        this.submitTouched = false;
        this.submitStatus = SubmitStatus.IDLE;
        this._skipLogin = false;
    }

    private onSubmit(): void {
        if (!this.formGroup.valid) {
            this.submitTouched = true;
            return;
        }
        this.changed.emit(this.getFormAsAppCredential());
        this.modifying = false;
        if (this.formGroup.get("remember").value === true) {
            this.submitStatus = SubmitStatus.SUBMITTING;
            this.save()
                .then(() => {
                    this.modifying = false;
                    this.submitStatus = SubmitStatus.DONE;
                    this.updateDisplay();
                })
                .catch((reason) => {
                    console.error(reason);
                    this.submitStatus = SubmitStatus.FAILED;
                });
        }
    }

    private save(): Promise<any> {
        return this.dbService.submitCredentials(this.getFormAsAppCredential(), this.isContrib);
    }

    private getFormAsAppCredential(): AppCredential {
        return new AppCredential(
            this.formGroup.get("appId").value,
            this.formGroup.get("username").value,
            this.formGroup.get("password").value,
        );
    }

    private updateDisplay(): void {
        const id: string = this.formGroup.get("appId").value;
        this.dbService.getCredentials(id, this.isContrib)
            .then((creds: AppCredential) => {
                this.changed.emit(creds);
                this.savedCredentials = creds;
                this.credentialsQueried = true;
            })
            .catch((reason) => {
                console.error(reason);
                this.retrievalFailed = true;
            });
        this.reinitialize();
    }

    @Input()
    public set appId(value: string) {
        if (value && value !== this._appId) {
            this.formGroup.get("appId").setValue(value);
            this.updateDisplay();
        }
    }
}
