import {NgModule} from "@angular/core";
import {ContribComponent} from "./contrib.component";
import {ProcessEditComponent} from "./process/process-edit.component";
import {FixtureViewerComponent} from "../partials/fixture-viewer.component";
import FieldViewerComponent from "../field-viewer/field-viewer.component";
import {ContribRoutingModule} from "./contrib-routing.module";
import {AdminTestComponent} from "../admin-test/admin-test.component";
import {MatTabsModule} from "@angular/material";
import {MatDialogModule} from "@angular/material/dialog";
import {SharedModule} from "../../shared.module";

@NgModule({
    declarations: [
        ContribComponent,
        ProcessEditComponent,
        FixtureViewerComponent,
        FieldViewerComponent,
        AdminTestComponent,
    ],
    entryComponents: [FixtureViewerComponent],
    imports: [
        ContribRoutingModule,
        SharedModule,
        MatTabsModule,
        MatDialogModule,
    ]
})
export class ContribModule {
    constructor () {
        console.log("Contrib loaded");
    }
}