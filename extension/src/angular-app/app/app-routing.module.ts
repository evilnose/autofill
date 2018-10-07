import {NgModule} from "@angular/core";
import {
    RouterModule, Routes,
} from "@angular/router";

import {AuthGuard} from "./services/auth-guard.service";
import {UserFormComponent} from "./user-form/user-form.component";
import {WelcomeComponent} from "./welcome/welcome.component";
import AccountComponent from "./account/account.component";
import {SendModule} from "./send/send.module";
import {ContribModule} from "./contrib/contrib.module";

const appRoutes: Routes = [
    {
        path: "welcome",
        component: WelcomeComponent,
    },
    {
        path: "send",
        loadChildren: () => SendModule,
    },
    {
        path: "form",
        component: UserFormComponent,
        canActivate: [AuthGuard],
    },
    {
        path: "contribute",
        loadChildren: () => ContribModule,
    },
    {
        path: "account",
        component: AccountComponent,
        canActivate: [AuthGuard],
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
