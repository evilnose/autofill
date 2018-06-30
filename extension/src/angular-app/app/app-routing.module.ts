import {NgModule} from '@angular/core';
import {
    RouterModule, Routes,
} from '@angular/router';

import {AuthGuard} from './services/auth-guard.service';
import {UserFormComponent} from "./user-form/user-form.component";
import {SendComponent} from "./send/send.component";
import {ContribComponent} from "./contrib/contrib.component";
import {WelcomeComponent} from "./welcome/welcome.component";

const appRoutes: Routes = [
    {
        path: 'welcome',
        component: WelcomeComponent,
    },
    {
        path: 'send',
        component: SendComponent,
        canActivate: [AuthGuard],
    },
    {
        path: 'form',
        component: UserFormComponent,
        canActivate: [AuthGuard],
    },
    {
        path: 'contribute',
        component: ContribComponent,
        canActivate: [AuthGuard],
    },
    {
        path: '',
        redirectTo: '/welcome',
        pathMatch: 'full',
    },
];

@NgModule({
    imports: [
        RouterModule.forRoot(
            appRoutes,
            {enableTracing: true},
        )
    ],
    exports: [
        RouterModule
    ],
})
export class AppRoutingModule {
}