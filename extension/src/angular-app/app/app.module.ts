import {HashLocationStrategy, LocationStrategy} from "@angular/common";
import {NgModule} from "@angular/core";
import {Router} from "@angular/router";
import {AngularFireModule} from "angularfire2";
import {AngularFireAuth, AngularFireAuthModule} from "angularfire2/auth";
import {AngularFirestoreModule} from "angularfire2/firestore";
import {Ng2PageScrollModule} from "ng2-page-scroll";
import {AppRoutingModule} from "./app-routing.module";

import {AppComponent} from "./app.component";
import {LoginRoutingModule} from "./login-routing.module";
import {LoginComponent} from "./login.component";
import {UserFormComponent} from "./user-form/user-form.component";
import {WelcomeComponent} from "./welcome/welcome.component";

import {AuthService} from "./services/auth.service";
import {DbService} from "./services/db.service";
import {FileService} from "./services/file.service";
import {MessengerService} from "./services/messenger.service";
import {OptionsService} from "./services/options.service";
import {DataFormatService} from "./services/data-format.service";
import {FirebaseUIModule} from "firebaseui-angular";
import * as firebase from "firebase";
import * as firebaseui from "firebaseui";
import AccountComponent from "./account/account.component";
import ResourceListComponent from "./partials/resource-list.component";
import PeekComponent from "./partials/peek.component";
import {initAppConfig} from "../env/firebase-initApp";
import {ContribModule} from "./contrib/contrib.module";
import {SendModule} from "./send/send.module";
import {SharedModule} from "../shared.module";
import {BrowserAnimationsModule} from "@angular/platform-browser/animations";
import {BrowserModule} from "@angular/platform-browser";

const firebaseUiAuthConfig: firebaseui.auth.Config = {
    signInFlow: 'popup',
    signInOptions: [
        // {
        //     requireDisplayName: false,
        //     provider: firebase.auth.EmailAuthProvider.PROVIDER_ID
        // },
        firebase.auth.GoogleAuthProvider.PROVIDER_ID,
        {
            scopes: ['email',],
            // customParameters: {
            //     'auth_type': 'reauthenticate'
            // },
            provider: firebase.auth.FacebookAuthProvider.PROVIDER_ID
        },
        // firebase.auth.TwitterAuthProvider.PROVIDER_ID,
        // firebase.auth.GithubAuthProvider.PROVIDER_ID,
        // firebaseui.auth.AnonymousAuthProvider.PROVIDER_ID
    ],
    tosUrl: 'http://evilnose.github.io/autofill-site/tos',
    privacyPolicyUrl: 'http://evilnose.github.io/autofill-site/privacy',
    credentialHelper: firebaseui.auth.CredentialHelper.ACCOUNT_CHOOSER_COM
};

@NgModule({
    bootstrap: [AppComponent],
    declarations: [
        AppComponent,
        AccountComponent,
        UserFormComponent,
        WelcomeComponent,
        LoginComponent,
        ResourceListComponent,
        PeekComponent,
    ],
    imports: [
        BrowserAnimationsModule,
        BrowserModule,
        AppRoutingModule,
        AngularFireModule.initializeApp(initAppConfig, "college-app-autofill"),
        AngularFireAuthModule,
        AngularFirestoreModule,
        LoginRoutingModule,
        Ng2PageScrollModule,
        FirebaseUIModule.forRoot(firebaseUiAuthConfig),
        SharedModule,
        ContribModule,
        SendModule,
    ],
    providers: [
        {provide: LocationStrategy, useClass: HashLocationStrategy},
        AngularFireAuth,
        AuthService,
        DbService,
        FileService,
        MessengerService,
        OptionsService,
        DataFormatService,
    ],
})

export class AppModule {
    // Diagnostic only: inspect router configuration
    constructor(router: Router) {
        // console.log("Routes: ", JSON.stringify(router.config, undefined, 2));
    }
}
