import {Component} from "@angular/core";
import {SubmitStatus} from "../contrib/process/process-edit.component";
import FormField from "../models/FormField";
import {IFormField} from "../models/Info";
import {Table} from "../models/Table";
import {DbService} from "../services/db.service";

@Component({
    selector: "field-viewer",
    styleUrls: ["../../assets/scss/app.scss"],
    template: `
        <div class="container-fluid">
            <h1>Official Form Fields</h1>
            <hr/>
            <div class="alert alert-info" *ngIf="saveStatus == SubmitStatusRef.SUBMITTING">Saving...</div>
            <div class="alert alert-success" *ngIf="saveStatus == SubmitStatusRef.DONE">Save successful!</div>
            <div class="alert alert-error" *ngIf="saveStatus == SubmitStatusRef.FAILED">Save Failed. Please check your
                internet connection and try again.
                <!-- TODO bug report link -->
            </div>
            <div class="row">
                <div class="col-md-2">
                    <file-upload [btnText]="'Upload CSV'" [btnClass]="'btn btn-primary btn-fixed-width'"
                                 [extension]="'.csv'"
                                 [onFileChange]="this.fileChanged.bind(this)"></file-upload>
                </div>
                <div class="col-md-2">
                    <button *ngIf="!tableUpToDate" type="button" class="btn btn-success btn-fixed-width"
                            (click)="saveTable()" [disabled]="saveStatus == SubmitStatusRef.SUBMITTING">Save
                    </button>
                </div>
            </div>
            <div>
                *The CSV file <strong>is delimited by ';'</strong> and should be in format of
                "field_name;description;displayed_name". Do not include headers.
            </div>
            <edi-table [initialTable]="tbl" [columnWidths]="[0.3, 0.4, 0.3]"></edi-table>
            <div *ngIf="badTable" class="jumbotron">
                There are some problems with the table. Please contact an admin.
            </div>
        </div>
    `,
})
export default class FieldViewerComponent {
    private tbl: Table;
    private tableUpToDate: boolean;
    private saveStatus: SubmitStatus;
    private SubmitStatusRef = SubmitStatus;
    private badTable: boolean;

    constructor(private dbService: DbService) {
        this.saveStatus = SubmitStatus.IDLE;
        this.dbService.getOfficialFormFields()
            .then((fields: IFormField[]) => fields.map((f) => [
                f.fieldName,
                f.description,
                f.displayName,
            ]))
            .then(this.updateTable.bind(this))
            .then(() => this.tableUpToDate = true)
            .catch(() => this.badTable = true);
        this.badTable = false;
    }

    private updateTable(tableList: string[][]) {
        this.tbl = new Table(["Field", "Description", "Displayed Name"],
            ["fieldName", "description", "displayName"], tableList, []);
    }

    private fileChanged(csvStr: string) {
        const lines = csvStr.split("\n");
        this.tableUpToDate = false;
        const rows = [];
        for (const line of lines) {
            const split = line.split(";");
            if (split[0]) {
                // only push if field name exists
                rows.push(split);
            }
        }
        this.updateTable(rows);
    }

    private saveTable() {
        this.saveStatus = SubmitStatus.SUBMITTING;
        this.dbService.setOfficialFormFields(this.tbl.asObjList() as FormField[])
            .then(() => this.saveStatus = SubmitStatus.DONE)
            .catch((reason: any) => {
                this.saveStatus = SubmitStatus.FAILED;
                console.error(reason);
            });
    }
}

