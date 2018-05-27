import {NgModule} from '@angular/core';
import {BrowserModule} from '@angular/platform-browser';
import {LocationStrategy, HashLocationStrategy} from '@angular/common';
import {FormsModule} from '@angular/forms'
import {Ng2PageScrollModule} from 'ng2-page-scroll';
import {Router} from '@angular/router';

import {AngularFireModule} from 'angularfire2';
import {AngularFireDatabaseModule} from 'angularfire2/database';
import {AngularFireAuthModule, AngularFireAuth} from 'angularfire2/auth';

import {AppComponent} from './app.component';
import {AppRoutingModule} from './app-routing.module';
import {LoginComponent} from './login.component';
import {LoginRoutingModule} from './login-routing.module';
import {WelcomeComponent} from './welcome/welcome.component';
import {UserFormComponent} from './user-form/user-form.component';
import {SendComponent} from './send/send.component';

import {AuthService} from './services/auth.service';

@NgModule({
    imports: [
        AppRoutingModule,
        AngularFireModule.initializeApp({
            apiKey: "AIzaSyCyczTiCl2w-rvUtKz-zj5VTayYF9QoANc",
            authDomain: "college-app-autofill.firebaseapp.com",
            databaseURL: "https://college-app-autofill.firebaseio.com",
            projectId: "college-app-autofill",
            storageBucket: "college-app-autofill.appspot.com",
            messagingSenderId: "109331497527"
        }, 'college-app-autofill'),
        AngularFireDatabaseModule,
        AngularFireAuthModule,
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
        {provide: LocationStrategy, useClass: HashLocationStrategy},
        AngularFireAuth,
        AuthService,
    ],
    bootstrap: [AppComponent]
})

export class AppModule {
    // Diagnostic only: inspect router configuration
    constructor(router: Router) {
        console.log('Routes: ', JSON.stringify(router.config, undefined, 2));
    }
}