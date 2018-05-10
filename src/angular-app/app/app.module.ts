import {NgModule} from '@angular/core';
import {BrowserModule} from '@angular/platform-browser';
import {RouterModule, Routes} from '@angular/router';
import {LocationStrategy, HashLocationStrategy} from '@angular/common';
import {FormsModule} from '@angular/forms'

import {AppComponent} from './app.component';
import {WelcomeComponent} from './welcome/welcome.component';
import {UserFormComponent} from './user-form/user-form.component';
import {SendComponent} from './send/send.component';

const appRoutes: Routes = [
    {
        path: 'welcome',
        component: WelcomeComponent,
    },
    {
        path: 'form',
        component: UserFormComponent,
    },
    {
        path: 'send',
        component: SendComponent,
    },
    {
        path: '',
        redirectTo: '/welcome',
        pathMatch: 'full',
    },
];

@NgModule({
    imports: [
        BrowserModule,
        RouterModule.forRoot(
            appRoutes,
            {enableTracing: true}
        ),
        FormsModule,
    ],
    declarations: [
        AppComponent,
        UserFormComponent,
        WelcomeComponent,
        SendComponent,
    ],
    providers: [
        {provide: LocationStrategy, useClass: HashLocationStrategy}
    ],
    bootstrap: [AppComponent]
})

export class AppModule {
}