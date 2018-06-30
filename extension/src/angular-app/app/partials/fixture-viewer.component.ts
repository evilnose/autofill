import {Component} from "@angular/core";
import {DbService} from "../services/db.service";
import {SelectOption} from "./dropdown.component";

@Component({
    selector: "fixture-editor",
    styleUrls: ["../../assets/scss/app.scss", "./progress-combined.scss"],
    template: `
        <div class="row top-action-bar">
            <div class="col-lg-2">
                <json-upload [btnText]="'Load local'" [btnStyle]="'btn btn-small btn-primary btn-std'"
                             [onFileChange]="fixtureChange.bind(this)"
                             [uniqueId]="'hidden-fixture-upload'"></json-upload>
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
                <textarea [readonly]="!editing" class="fixture-editor">{{currFixtureData}}</textarea>
            </div>
        </div>
    `,
})
export class FixtureViewerComponent {
    private static createOptions(map: object, labelProp: string): SelectOption[] {
        const list: SelectOption[] = [];
        for (const key of Object.keys(map)) {
            list.push(new SelectOption(map[key][labelProp], key));
        }
        list.sort((a: SelectOption, b: SelectOption) => {
            return a.label.localeCompare(b.label);
        });
        return list;
    }

    private fixtureOptions: SelectOption[];
    private fixtureMap: object;
    private currFixtureId: string;
    private currFixtureName: string;
    private isLoading: boolean;
    private editing: boolean;

    private currFixtureData: string;

    constructor(public dbService: DbService) {
        this.reinitialize();
    }

    private reinitialize() {
        this.isLoading = true;
        this.editing = false;
        this.currFixtureData = "";
        this.dbService.getFixtures().then((fixtures: object[]) => {
            this.isLoading = false;
            this.fixtureMap = fixtures;
            this.fixtureOptions = FixtureViewerComponent.createOptions(fixtures, "display_name");
        });
    }

    private viewFixture(id: string) {
        this.editing = false;
        this.currFixtureId = id;
        this.currFixtureData = this.fixtureMap[id].fixture_data;
        this.currFixtureName = this.fixtureMap[id].display_name;
    }

    private fixtureChange(jsonStr: string) {
        this.currFixtureData = JSON.stringify(JSON.parse(jsonStr), null, 2);
    }

    private saveToCurr() {
        if (confirm(`Overwrite this fixture "${this.fixtureMap[this.currFixtureId].display_name}"?`)) {
            this.dbService
                .setFixture(this.currFixtureId, this.currFixtureData)
                .then(this.reinitialize.bind(this));
        }
    }

    private saveAs() {
        const name = prompt("Enter display name for new fixture:");
        console.log(name);
        this.dbService
            .newFixture(name, this.currFixtureData)
            .then(this.reinitialize.bind(this));
    }

    private deleteCurr() {
        if (confirm(`Permanently delete this fixture "${this.fixtureMap[this.currFixtureId].display_name}"?`)) {
            this.dbService
                .deleteFixture(this.currFixtureId)
                .then(this.reinitialize.bind(this));
        }
    }
}
