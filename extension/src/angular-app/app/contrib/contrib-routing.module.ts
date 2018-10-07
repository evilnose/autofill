import { NgModule } from "@angular/core";
import { RouterModule, Routes } from "@angular/router";

import {ContribComponent} from './contrib.component'
import {AuthGuard} from "../services/auth-guard.service";
import {ProcessEditComponent} from "./process/process-edit.component";
import {FixtureViewerComponent} from "../partials/fixture-viewer.component";
import FieldViewerComponent from "../field-viewer/field-viewer.component";

const routes: Routes = [
    {
        path: "",
        component: ContribComponent,
        canActivate: [AuthGuard],
        children: [
            { path: "", redirectTo: "process", pathMatch: "full" },
            { path: "process", component: ProcessEditComponent },
            { path: "fixture", component: FixtureViewerComponent },
            { path: "field_viewer", component: FieldViewerComponent },
        ],
    },
];

@NgModule({
    exports: [RouterModule],
    imports: [RouterModule.forChild(routes)]
})
export class ContribRoutingModule { }