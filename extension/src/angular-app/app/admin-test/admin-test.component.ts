import {Component, Input, ViewChild} from "@angular/core";
import {FormControl, FormGroup, Validators} from "@angular/forms";
import {MatDialog} from "@angular/material";
import {AppCredential, AppInfo, IFixture, IProcess} from "../models/Info";
import {DropdownComponent, SelectOption} from "../partials/dropdown.component";
import {FixtureViewerComponent} from "../partials/fixture-viewer.component";
import {DbService} from "../services/db.service";

@Component({
    selector: "tester",
    styleUrls: ["./admin-test.scss", "../../assets/scss/app.scss"],
    template: `
        <div class="test-area">
            <form [formGroup]="testForm">
                <div>
                    <div class="row">
                        <div class="col-md-6">
                            <div class="row fixture-actions-div">
                                <div class="col-md-6">
                                    <dropdown-search [btnText]="'Select User Fixture'" formControlName="userFixture"
                                                     [options]="getFixtureOptionsPromise"
                                                     [btnClass]="'btn btn-sm btn-block btn-info sec-admin-btn'"
                                                     [fullClass]="'bot-abs'"
                                                     dropdownRequired=""></dropdown-search>
                                </div>
                                <div class="col-md-6">
                                    <button class="btn btn-sm btn-block btn-info sec-admin-btn bot-abs" type="button"
                                            (click)="openFixtureEditor()">
                                        View/Edit Fixtures
                                    </button>
                                </div>
                            </div>
                        </div>
                        <div class="col-md-6">
                            <div class="container">
                                <div class="alert alert-danger" *ngIf="!testProcess">
                                    Need input: process JSON.
                                </div>
                                <div class="alert alert-danger" *ngIf="!this.fixtureId">
                                    Need input: user fixture.
                                </div>
                                <div class="alert alert-danger" *ngIf="!appInfo.abbrevName">
                                    Need input: target app.
                                </div>
                                <div *ngIf="this.fixtureId && appInfo.abbrevName">
                                    <app-credential [appFullName]="this.appFullName" [appId]="appId"
                                                    (changed)="onCredChanged($event)"
                                                    [isContrib]="true"></app-credential>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </form>
            <hr/>
            <progress-display [process]="testProcess" [userInfo]="getCurrentFixtureData()" [appAuth]="appAuth"
                              [skipLogin]="skipLogin"
                              [forAdmin]="true"></progress-display>
        </div>
    `,
})
export class AdminTestComponent {
    @ViewChild(DropdownComponent) public dropdown: DropdownComponent;
    @Input() private appId: string;
    @Input() private appInfo: AppInfo;
    @Input() private testProcess: IProcess;
    private appAuth: AppCredential;
    private skipLogin: boolean;
    private fixtureModel: IFixture;
    private selectedFixtureText: string;
    private testForm: FormGroup;
    private readonly getFixtureOptionsPromise: Promise<SelectOption[]>;
    private fixtureMap: object;

    constructor(dbService: DbService, public dialog: MatDialog) {
        this.selectedFixtureText = "Fixture not selected.";

        this.testForm = new FormGroup({
            userFixture: new FormControl(this.fixtureModel, Validators.required),
        });

        this.getFixtureOptionsPromise = dbService.getFixtures()
            .then((fixtures: object[]) => {
                this.fixtureMap = fixtures;
                return DropdownComponent.createOptions(fixtures, "display_name");
            });

        this.appInfo = new AppInfo();
    }

    private get fixtureIdField() {
        return this.testForm.get("userFixture");
    }

    private get fixtureId() {
        const field = this.fixtureIdField;
        if (field) {
            return field.value;
        }
        return null;
    }

    private get appFullName() {
        if (this.appInfo) {
            return this.appInfo.fullName;
        }
        return null;
    }

    private openFixtureEditor(): void {
        const dialogRef = this.dialog.open(FixtureViewerComponent, {
            height: "600px",
            width: "900px",
            // TODO pass in currently selected
        });
        const self = this;
        dialogRef.afterClosed().subscribe((result: any) => {
            self.dropdown.reloadContent();
        });
    }

    private getCurrentFixtureData() {
        if (!this.fixtureMap || !this.fixtureId) {
            return {};
        }
        return JSON.parse(this.fixtureMap[this.fixtureId].fixture_data);
    }

    private onCredChanged($event: AppCredential | boolean) {
        if (typeof($event) === "boolean") {
            this.skipLogin = $event;
        } else {
            this.appAuth = $event;
        }
    }
}
