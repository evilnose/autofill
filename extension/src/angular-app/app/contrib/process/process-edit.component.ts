import {Component, ElementRef, ViewChild} from "@angular/core";
import {FormControl, FormGroup, Validators} from "@angular/forms";
import {AppInfo} from "../../models/Info";
import {SelectOption} from "../../partials/dropdown.component";
import {DbService} from "../../services/db.service";
import {FileService} from "../../services/file.service";
import {Process} from "../process";

export enum SubmitStatus {
    IDLE,
    SUBMITTING,
    DONE,
    FAILED,
}

@Component({
    selector: "process-edit",
    styleUrls: ["../../../assets/scss/app.scss"],
    templateUrl: "./process-edit.component.html",
})
export class ProcessEditComponent {
    @ViewChild("pcsForm") public formEl: ElementRef;
    public editingProcess: boolean;

    public testerOpen: boolean;
    public SubmitStatusRef = SubmitStatus;
    public submitStatus: SubmitStatus;
    private model: Process;
    private processForm: FormGroup;
    private getAppOptionsPromise: Promise<SelectOption[]>;
    private appMap: object;
    private jsonValid: boolean;

    constructor(private fileService: FileService, private dbService: DbService) {
        this.model = new Process();
        // this.updateAppOptions();
        this.processForm = new FormGroup({
            appId: new FormControl(this.model.appId, Validators.required),
            processJSON: new FormControl(this.model.content, Validators.required),
        });
        // TODO catch this
        this.processForm.get("appId").valueChanges
            .subscribe((id: string) =>
                this.dbService.getOfficialProcess(id)
                    .then(this.updateJSON.bind(this)));

        this.processForm.get("processJSON").valueChanges
            .subscribe((jsonStr: string) => {
                try {
                    JSON.parse(jsonStr);
                    this.jsonValid = true;
                } catch (e) {
                    this.jsonValid = false;
                }
            });

        this.submitStatus = SubmitStatus.IDLE;
        this.editingProcess = false;
        this.testerOpen = false;

        // Make promise to return apps
        this.getAppOptionsPromise = this.dbService.getAppListOptions()
            .catch((err) => {
                this.handleNetworkError(err);
                console.error(err);
                return null;
            });

        this.dbService.getAppMap()
            .then((appMap) => {
                this.appMap = appMap;
            });
    }

    get processJSONField() {
        return this.processForm.get("processJSON");
    }

    get processJSON() {
        const field = this.processJSONField;
        if (field) {

            return JSON.parse(field.value);
        }
        return null;
    }

    get appIdField() {
        return this.processForm.get("appId");
    }

    get appId() {
        const field = this.appIdField;
        if (field) {
            return field.value;
        }
        return null;
    }

    get currAppData() {
        if (this.appMap && this.appId) {
            return this.appMap[this.appId] as AppInfo;
        }
        return {};
    }

    public updateJSON(jsonStr: string): void {
        if (jsonStr) {
            try {
                const json = JSON.parse(jsonStr);
                this.processJSONField.setValue(JSON.stringify(json, null, 2));
            } catch (e) {
                this.processJSONField.setValue(jsonStr);
            }
        }
    }

    public submitProcess(): void {
        // TODO make contrib possible (e.g. non-official)
        this.processForm.markAsTouched();
        if (this.processForm.valid) {
            if (confirm("Are you sure you want to submit this process?")) {
                this.submitStatus = SubmitStatus.SUBMITTING;
                this.dbService.submitOfficialProcess(this.processForm.get("appId").value,
                    this.prepareProcess())
                    .then(() => this.submitStatus = SubmitStatus.DONE)
                    .catch((err) => {
                        // TODO handle error
                        this.submitStatus = SubmitStatus.FAILED;
                        console.error(err);
                    });
            }
        } else {
            // TODO touch?
            console.error("Form is invalid");
        }
    }

    private handleNetworkError(err: any) {
        // TODO handle network (Firebase) error
        console.error("Network error handler not done.");
    }

    private prepareProcess(): string {
        // strip newlines
        return JSON.stringify(JSON.parse(this.processForm.get("processJSON").value));
    }
}
