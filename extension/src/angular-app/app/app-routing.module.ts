import {NgModule} from "@angular/core";
import {
    RouterModule, Routes,
} from "@angular/router";

import {ProcessEditComponent} from "./contrib/process/process-edit.component";
import {SendComponent} from "./send/send.component";
import {AuthGuard} from "./services/auth-guard.service";
import {UserFormComponent} from "./user-form/user-form.component";
import {WelcomeComponent} from "./welcome/welcome.component";
import {ContribComponent} from "./contrib/contrib.component";
import {FixtureViewerComponent} from "./partials/fixture-viewer.component";
import FieldViewerComponent from "./field-viewer/field-viewer.component";

const appRoutes: Routes = [
    {
        path: "welcome",
        component: WelcomeComponent,
    },
    {
        path: "send",
        component: SendComponent,
        canActivate: [AuthGuard],
    },
    {
        path: "form",
        component: UserFormComponent,
        canActivate: [AuthGuard],
    },
    {
        path: "contribute",
        component: ContribComponent,
        canActivate: [AuthGuard],
        children: [
            { path: "", redirectTo: "process", pathMatch: "full" },
            { path: "process", component: ProcessEditComponent },
            { path: "fixture", component: FixtureViewerComponent },
            { path: "field_viewer", component: FieldViewerComponent },
            // { path: "fields", compo}
        ],
    },
    {
        path: "",
        redirectTo: "/welcome",
        pathMatch: "full",
    },
];

@NgModule({
    imports: [
        RouterModule.forRoot(
            appRoutes,
            {enableTracing: true},
        ),
    ],
    exports: [
        RouterModule,
    ],
})
export class AppRoutingModule {
}
