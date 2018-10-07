import {NgModule} from "@angular/core";
import {FileUploadComponent} from "./app/partials/file-upload.component";
import {DropdownComponent} from "./app/partials/dropdown.component";
import TableComponent from "./app/partials/table.component";
import {AppCredentialsComponent} from "./app/partials/app-credentials.component";
import {ProgressDisplayComponent} from "./app/partials/progress-display.component";
import {FormsModule, ReactiveFormsModule} from "@angular/forms";
import {CommonModule} from "@angular/common";

@NgModule({
    imports: [
        CommonModule,
        FormsModule,
        ReactiveFormsModule,
    ],
    declarations: [
        FileUploadComponent,
        DropdownComponent,
        TableComponent,
        AppCredentialsComponent,
        ProgressDisplayComponent,
    ],
    exports: [
        CommonModule,
        FormsModule,
        ReactiveFormsModule,
        FileUploadComponent,
        DropdownComponent,
        TableComponent,
        AppCredentialsComponent,
        ProgressDisplayComponent,
    ]
})
export class SharedModule {}