import {NgModule} from '@angular/core';
import {BrowserModule} from '@angular/platform-browser';
import {RouterModule, Routes} from '@angular/router';
import { LocationStrategy, HashLocationStrategy } from '@angular/common';

import {AppComponent} from './app.component';
import {WelcomeComponent} from './welcome/welcome.component';
import {FormComponent} from './form/form.component';
import {SendComponent} from './send/send.component';

const appRoutes: Routes = [
    {
        path: 'welcome',
        component: WelcomeComponent,
    },
    {
        path: 'form',
        component: FormComponent,
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
        )
    ],
    declarations: [
        AppComponent,
        FormComponent,
        WelcomeComponent,
        SendComponent,
    ],
    providers: [
        { provide: LocationStrategy, useClass: HashLocationStrategy }
    ],
    bootstrap: [AppComponent]
})

export class AppModule {
}