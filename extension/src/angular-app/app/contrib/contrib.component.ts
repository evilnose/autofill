import {Component, ElementRef, ViewChild} from "@angular/core";
import {FormControl, FormGroup, Validators} from "@angular/forms";
import {SelectOption} from "../partials/dropdown.component";
import {DbService} from "../services/db.service";
import {FileService} from "../services/file.service";
import {Process} from "./process";

enum SubmitStatus {
    IDLE,
    SUBMITTING,
    DONE,
}

@Component({
    selector: "contrib",
    styleUrls: ["../../assets/scss/app.scss"],
    templateUrl: "./contrib.component.html",
})
export class ContribComponent {
    @ViewChild("pcsForm") public formEl: ElementRef;
    public editingProcess: boolean;

    public testerOpen: boolean;
    public SubmitStatusRef = SubmitStatus;
    public submitStatus: SubmitStatus;
    private model: Process;
    private processForm: FormGroup;
    private getAppOptionsPromise: Promise<SelectOption[]>;
    constructor(private fileService: FileService, private dbService: DbService) {
        this.model = new Process();
        // this.updateAppOptions();
        this.processForm = new FormGroup({
            appId: new FormControl(this.model.appId, Validators.required),
            processJSON: new FormControl(this.model.content, Validators.required),
        });
        // TODO catch this
        this.processForm.get("appId").valueChanges.subscribe((id) =>
            this.dbService.getOfficialProcess(id).then(this.updateJSON.bind(this)));

        this.submitStatus = SubmitStatus.IDLE;
        this.editingProcess = false;
        this.testerOpen = false;

        // Make promise to return apps
        const self = this;
        this.getAppOptionsPromise = this.dbService.getAppListOptions()
            .catch((err) => {
                self.handleNetworkError(err);
                console.error(err);
                return null;
            });
    }

    get processJSON() {
        return this.processForm.get("processJSON");
    }

    get appId() {
        return this.processForm.get("appId");
    }

    public updateJSON(jsonStr: string): void {
        if (jsonStr) {
            const json = JSON.parse(jsonStr);
            this.processJSON.setValue(JSON.stringify(json, null, 2));
        }
    }

    public submitProcess(): void {
        if (this.processForm.valid) {
            this.submitStatus = SubmitStatus.SUBMITTING;
            this.dbService.submitOfficialProcess(this.processForm.get("appId").value,
                this.prepareProcess())
                .then(() => this.submitStatus = SubmitStatus.DONE)
                .catch((err) => {
                    // TODO handle error
                    console.error(err);
                });
        } else {
            // TODO touch?
            console.error("Form is invalid");
        }
    }

    private handleNetworkError(err: any) {
        // TODO handle network (Firebase) error
        console.warn("Network error handler not done.");
    }

    private prepareProcess(): string {
        // strip newlines
        return JSON.stringify(JSON.parse(this.processForm.get("processJSON").value));
    }
}
