import {Component, Input, ViewChild} from "@angular/core";
import {FormControl, FormGroup, Validators} from "@angular/forms";
import {MatDialog} from "@angular/material";
import {DropdownComponent, SelectOption} from "../partials/dropdown.component";
import {FixtureViewerComponent} from "../partials/fixture-viewer.component";
import {DbService} from "../services/db.service";

@Component({
    selector: "tester",
    styleUrls: ["./admin-test.scss", "../../assets/scss/app.scss"],
    template: `
        <div class="test-area">
            <h2>Test</h2>
            <form [formGroup]="testForm">
                <div>
                    <div class="row">
                        <div class="col-md-6">
                            <div class="row fixture-actions-div">
                                <div class="col-md-6">
                                    <dropdown-search [btnText]="'Select User Fixture'" formControlName="userFixture"
                                                         [options]="getFixtureOptionsPromise"
                                                     [btnClass]="'btn btn-sm btn-block btn-info sec-admin-btn'"
                                                     dropdownRequired=""></dropdown-search>
                                </div>
                                <div class="col-md-6">
                                    <button class="btn btn-sm btn-block btn-info sec-admin-btn bot-align" type="button"
                                            (click)="openFixtureEditor()">
                                        View/Edit Fixtures
                                    </button>
                                </div>
                            </div>
                        </div>
                        <div class="col-md-6" *ngIf="!authProvided">
                            Your selected user fixture does not provide needed app authentication.<br/>
                            You can enter a one-time authentication below:
                            <label for="username"></label>
                            Username: <input id="username" type="text"/>
                            <label for="password"></label>
                            Password: <input id="password" type="password"/>
                        </div>
                    </div>
                </div>
            </form>
            <hr />
            <progress-display [process]="testProcess" [userInfo]="userJSON" [appAuth]="authJSON"
                              [forAdmin]="true"></progress-display>
        </div>
    `,
})
export class AdminTestComponent {
    @Input() public testProcess: object;
    @ViewChild(DropdownComponent) public dropdown: DropdownComponent;

    private userJSON: object;
    private authJSON: object;
    private selectedFixtureText: string;
    private getFixtureOptionsPromise: Promise<SelectOption[]>;
    private authProvided: boolean;
    private testForm: FormGroup;

    constructor(dbService: DbService, public dialog: MatDialog) {
        this.selectedFixtureText = "Fixture not selected.";
        this.getFixtureOptionsPromise = dbService.getFixtureListOptions();
        this.authProvided = true;

        this.testForm = new FormGroup({
            userFixture: new FormControl(this.userJSON, Validators.required),
        });
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

    // TODO add message reminding admin that he is/isn't overriding appAuth in user fixture.
}
