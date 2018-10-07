import {Component} from "@angular/core";
import {DbService} from "../services/db.service";
import {DropdownComponent, SelectOption} from "./dropdown.component";
import {FormControl} from "@angular/forms";

@Component({
    selector: "fixture-editor",
    styleUrls: ["../../assets/scss/app.scss", "./progress-combined.scss"],
    template: `
        <div class="row top-action-bar">
            <div class="col-lg-2">
                <file-upload [btnText]="'Load local'" [btnClass]="'btn btn-small btn-primary btn-std'"
                             [onFileChange]="updateFixture.bind(this)"
                             [uniqueId]="'hidden-fixture-upload'"></file-upload>
            </div>
            <div class="col-lg-4">
                <h3>{{currFixtureName}}</h3>
            </div>
            <div class="col-lg-2">
                <button class="btn btn-small btn-warning btn-std" (click)="saveToCurr()"
                        [disabled]="!currFixtureId">
                    Save
                </button>
            </div>
            <div class="col-lg-2">
                <button class="btn btn-small btn-success btn-std" (click)="saveAs()">Save as...</button>
            </div>
            <div class="col-lg-2">
                <button class="btn btn-small btn-danger btn-std" (click)="deleteCurr()" [disabled]="!currFixtureId">
                    Delete
                </button>
            </div>
        </div>
        <div class="row panels">
            <div class="col-md-5 left-panel">
                <ul class="fixture-list">
                    <li *ngIf="isLoading">Loading...</li>
                    <li *ngFor="let f of fixtureOptions" (click)="viewFixture(f.id)" class="fixture-item">
                        {{f.label}}
                    </li>
                </ul>
            </div>
            <div class="col-md-7">
                <button class="btn btn-small btn-outline-primary text-area-btn" *ngIf="!editing" (click)="editing=true">
                    Edit
                </button>
                <button class="btn btn-small btn-outline-primary text-area-btn" *ngIf="editing" (click)="editing=false">
                    Done
                </button>
                <textarea [readonly]="!editing" class="fixture-editor"
                          [formControl]="fixtureData">{{currFixtureData}}</textarea>
            </div>
        </div>
    `,
})
export class FixtureViewerComponent {
    private fixtureOptions: SelectOption[];
    private fixtureMap: object;
    private fixtureData: FormControl;
    private currFixtureId: string;
    private currFixtureName: string;
    private isLoading: boolean;
    private editing: boolean;

    constructor(public dbService: DbService) {
        this.fixtureData = new FormControl();
        this.reinitialize();
    }

    private reinitialize() {
        this.isLoading = true;
        this.editing = false;
        this.fixtureData.setValue("");
        this.dbService.getFixtures().then((fixtures: object[]) => {
            this.isLoading = false;
            this.fixtureMap = fixtures;
            this.fixtureOptions = DropdownComponent.createOptions(fixtures, "display_name");
        });
    }

    private viewFixture(id: string) {
        this.editing = false;
        this.currFixtureId = id;
        this.fixtureData.setValue(this.fixtureMap[id].fixture_data);
        this.currFixtureName = this.fixtureMap[id].display_name;
    }

    private updateFixture(jsonStr: string) {
        this.fixtureData.setValue(JSON.stringify(JSON.parse(jsonStr), null, 2));
    }

    private saveToCurr() {
        // TODO non-official for contrib
        if (confirm(`Overwrite this fixture "${this.fixtureMap[this.currFixtureId].display_name}"?`)) {
            if (this.dbService.isAdmin) {
                this.dbService
                    .setOfficialFixture(this.currFixtureId, this.fixtureData.value)
                    .then(this.reinitialize.bind(this));
            } else {
            //     this.dbService
            //         .setFixture(this.currFixtureId, this.fixtureData.value)
            //         .then(this.reinitialize.bind(this));
            }
        }
    }

    private saveAs() {
        // TODO non-official for contrib
        const name = prompt("Enter display name for new fixture:");
        this.dbService
            .newOfficialFixture(name, this.fixtureData.value)
            .then(this.reinitialize.bind(this));
    }

    private deleteCurr() {
        // TODO non-official for contrib
        if (confirm(`Permanently delete this fixture "${this.fixtureMap[this.currFixtureId].display_name}"?`)) {
            this.dbService
                .delOfficialFixture(this.currFixtureId)
                .then(this.reinitialize.bind(this));
        }
    }
}
