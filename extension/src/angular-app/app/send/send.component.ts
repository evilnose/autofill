import {Component, OnInit} from '@angular/core';
import {Status, StatusTextMap} from "../partials/status-dot.component";
import {DbService} from "../services/db.service";
import {AppCredential, AppInfo, IProcess, IUserData} from "../models/Info";
import {SelectOption} from "../partials/dropdown.component";
import {FormControl, FormGroup, Validators} from "@angular/forms";
import {DataFormatService} from "../services/data-format.service";

@Component({
    selector: 'send',
    templateUrl: './send.component.html',
    styleUrls: ['send.component.scss', '../../assets/scss/app.scss']
})

export class SendComponent {
    public readonly userInfoStatusTexts : StatusTextMap;
    public readonly appStatusTexts: StatusTextMap;
    public readonly credentialsStatusTexts: StatusTextMap;
    private userInfoStatus: Status;
    private appStatus: Status;
    private credentialsStatus: Status;

    public sendForm: FormGroup;
    private processObj: IProcess;
    private userInfo: IUserData;
    private appAuth: AppCredential;
    private skipLogin: boolean;

    public appOptions: SelectOption[];
    private appInfoMap: object;

    constructor(private dbService: DbService, private formatService: DataFormatService) {
        this.userInfoStatusTexts = new StatusTextMap(
            "Need: Your info form.",
            "Getting your form data...",
            "Form data retrieved!",
            "Failed to get form data.",
        );
        this.appStatusTexts = new StatusTextMap(
            "Please select an App.",
            "Getting App template...",
            "App template retrieved!",
            "Failed to get App template.",
        );
        this.credentialsStatusTexts = new StatusTextMap(
            "Please enter/confirm credentials.",
            "Getting your credentials...",
            "Credentials ready.",
            "Failed to get credentials.",
        );

        this.sendForm = new FormGroup({
            appId: new FormControl(null, Validators.required),
        });
        this.sendForm.get("appId").valueChanges
            .subscribe((id: string) => {
                this.appStatus = Status.PENDING;
                this.dbService.getOfficialProcess(id)
                    .then((jsonStr: string) => {
                        if (jsonStr) {
                            this.processObj = JSON.parse(jsonStr);
                            this.appStatus = Status.SUCCESS;
                            return;
                        }
                        this.appStatus = Status.FAILED;
                    })
                    .catch(this.handleFirebaseError.bind(this));
            });
        this.getAppInfo();
        this.appStatus = Status.IDLE;

        this.userInfoStatus = Status.PENDING;
        this.dbService
            .getCurrUserData()
            .then((data: IUserData) => {
                this.userInfoStatus = Status.SUCCESS;
                this.userInfo = data;
            })
            .catch((reason: any) => {
                console.error(reason);
                this.userInfoStatus = Status.FAILED;
            });

        this.skipLogin = false;
        this.appAuth = null;
        this.credentialsStatus = Status.IDLE;
    }

    private getAppInfo(): void {
        this.dbService.getAppCollection()
            .then((querySnapshot: any) => {
                this.appInfoMap = this.formatService.formatQuerySnapshotAsMap(querySnapshot);
                this.appOptions = this.formatService.formatQuerySnapshotAsOptions(querySnapshot, "fullName")
            });
    }

    public get currAppId(): string {
        return this.sendForm.get("appId").value;
    }

    public get appFullName(): string {
        if (this.appInfoMap && this.currAppId) {
            return this.appInfoMap[this.currAppId].fullName;
        }
        return null;
    }

    private handleFirebaseError(reason: any) {
        console.error(reason);
    }

    private onCredChanged($event: AppCredential | boolean) {
        if (typeof($event) === "boolean") {
            this.skipLogin = $event;
        } else {
            this.appAuth = $event;
        }
        if (this.skipLogin || this.appAuth) {
            this.credentialsStatus = Status.SUCCESS;
        } else {
            this.credentialsStatus = Status.PENDING;
        }
    }
}