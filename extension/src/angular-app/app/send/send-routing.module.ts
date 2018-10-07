import {NgModule} from "@angular/core";
import {RouterModule, Routes} from "@angular/router";
import {SendComponent} from "./send.component";
import {AuthGuard} from "../services/auth-guard.service";

const routes: Routes = [
    {
        path: "",
        component: SendComponent,
        canActivate: [AuthGuard],
    }
];

@NgModule({
    exports: [RouterModule],
    imports: [RouterModule.forChild(routes)],
})
export class SendRoutingModule {
}