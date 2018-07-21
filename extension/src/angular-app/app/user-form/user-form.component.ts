import {Component} from "@angular/core";
import {FormGroup} from "@angular/forms";
import {IFormField, IUserData} from "../models/Info";
import {Table} from "../models/Table";
import {DbService} from "../services/db.service";
import {OptionsService} from "../services/options.service";
import {SubmitStatus} from "../contrib/process/process-edit.component";

@Component({
    selector: "user-form",
    templateUrl: "./user-form.component.html",
    styleUrls: ["./user-form.component.scss", "../../assets/scss/app.scss"],
})
export class UserFormComponent {
    public initTable: Table;
    public tableUpToDate: boolean;
    public saveStatus: SubmitStatus;
    public SubmitStatusRef = SubmitStatus;
    private latestTable: Table;
    private display2Field: object;

    constructor(public optionsService: OptionsService, private dbService: DbService) {
        this.tableUpToDate = true;
        this.saveStatus = SubmitStatus.IDLE;
        this.display2Field = {};
        Promise.all([dbService.getCurrUserData(), dbService.getOfficialFormFields()])
            .then((li: any) => {
                const userData: IUserData = li[0];
                const formFields: IFormField[] = li[1];
                const tableInfo = formFields.map((field) => {
                    // Also fill in the map from displayed name to field name
                    this.display2Field[field.displayName] = field.fieldName;
                    return [
                        field.displayName,
                        field.description,
                        userData[field.fieldName] || "",
                    ];
                });
                this.initTable = new Table(["Field Name", "Description", "Your Value"],
                    null,
                    tableInfo, [2]);
            });
    }

    public saveTable() {
        this.saveStatus = SubmitStatus.SUBMITTING;
        const newData: object = this.latestTable.asObjList().reduce((previous: object, current: object) => {
            // map "Field Name" (which is actually displayName) to fieldName then assign user value to it
            previous[this.display2Field[current["Field Name"]]] = current["Your Value"];
            return previous;
        }, {});
        this.dbService.setCurrUserData(newData)
            .then(() => {
                this.tableUpToDate = true;
                this.saveStatus = SubmitStatus.DONE;
            })
            .catch((reason: any) => {
                // TODO handle error
                this.saveStatus = SubmitStatus.FAILED;
                console.error(reason);
            });
    }

    public tableChanged(newTable: Table) {
        this.tableUpToDate = false;
        this.latestTable = newTable;
    }
}
