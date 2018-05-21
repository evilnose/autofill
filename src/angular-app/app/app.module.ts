import {NgModule} from '@angular/core';
import {BrowserModule} from '@angular/platform-browser';
import {LocationStrategy, HashLocationStrategy} from '@angular/common';
import {FormsModule} from '@angular/forms'
import {Ng2PageScrollModule} from 'ng2-page-scroll';
import {Router} from '@angular/router';

import {AppComponent} from './app.component';
import {AppRoutingModule} from './app-routing.module';

import {LoginComponent} from './login.component';
import {LoginRoutingModule} from './login-routing.module';
import {WelcomeComponent} from './welcome/welcome.component';
import {UserFormComponent} from './user-form/user-form.component';
import {SendComponent} from './send/send.component';

@NgModule({
    imports: [
        AppRoutingModule,
        LoginRoutingModule,
        BrowserModule,
        FormsModule,
        Ng2PageScrollModule,
    ],
    declarations: [
        AppComponent,
        UserFormComponent,
        WelcomeComponent,
        SendComponent,
        LoginComponent,
    ],
    providers: [
        {provide: LocationStrategy, useClass: HashLocationStrategy}
    ],
    bootstrap: [AppComponent]
})

export class AppModule {
    // Diagnostic only: inspect router configuration
    constructor(router: Router) {
        console.log('Routes: ', JSON.stringify(router.config, undefined, 2));
    }
}