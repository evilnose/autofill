import {HashLocationStrategy, LocationStrategy} from "@angular/common";
import {NgModule} from "@angular/core";
import {FormsModule, ReactiveFormsModule} from "@angular/forms";
import {MatDialogModule} from "@angular/material/dialog";
import {BrowserModule} from "@angular/platform-browser";
import {BrowserAnimationsModule} from "@angular/platform-browser/animations";
import {Router} from "@angular/router";
import {AngularFireModule} from "angularfire2";
import {AngularFireAuth, AngularFireAuthModule} from "angularfire2/auth";
import {AngularFirestoreModule} from "angularfire2/firestore";
import {Ng2PageScrollModule} from "ng2-page-scroll";
import {AppRoutingModule} from "./app-routing.module";

import {AdminTestComponent} from "./admin-test/admin-test.component";
import {AppComponent} from "./app.component";
import {ContribComponent} from "./contrib/contrib.component";
import {ProcessEditComponent} from "./contrib/process/process-edit.component";
import {LoginRoutingModule} from "./login-routing.module";
import {LoginComponent} from "./login.component";
import {AppCredentialsComponent} from "./partials/app-credentials.component";
import {DropdownComponent} from "./partials/dropdown.component";
import {FixtureViewerComponent} from "./partials/fixture-viewer.component";
import {FileUploadComponent} from "./partials/file-upload.component";
import {ProgressDisplayComponent} from "./partials/progress-display.component";
import {SendComponent} from "./send/send.component";
import {UserFormComponent} from "./user-form/user-form.component";
import {WelcomeComponent} from "./welcome/welcome.component";

import {AuthService} from "./services/auth.service";
import {DbService} from "./services/db.service";
import {FileService} from "./services/file.service";
import {MessengerService} from "./services/messenger.service";
import {OptionsService} from "./services/options.service";
import TableComponent from "./partials/table.component";
import FieldViewerComponent from "./field-viewer/field-viewer.component";
import {StatusDotComponent} from "./partials/status-dot.component";
import {DataFormatService} from "./services/data-format.service";
import {FirebaseUIModule} from "firebaseui-angular";
import * as firebase from "firebase";
import * as firebaseui from "firebaseui";
import AccountComponent from "./account/account.component";
import ResourceListComponent from "./partials/resource-list.component";
import PeekComponent from "./partials/peek.component";
import {initAppConfig} from "../env/firebase-initApp";

const firebaseUiAuthConfig: firebaseui.auth.Config = {
    signInFlow: 'popup',
    signInOptions: [
        {
            requireDisplayName: false,
            provider: firebase.auth.EmailAuthProvider.PROVIDER_ID
        },
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
    privacyPolicyUrl: 'http://evilnose.github.io/autofill-site/privacy-policy',
    credentialHelper: firebaseui.auth.CredentialHelper.ACCOUNT_CHOOSER_COM
};

@NgModule({
    bootstrap: [AppComponent],
    declarations: [
        AppComponent,
        AccountComponent,
        UserFormComponent,
        WelcomeComponent,
        SendComponent,
        LoginComponent,
        ProcessEditComponent,
        DropdownComponent,
        FixtureViewerComponent,
        ProgressDisplayComponent,
        AdminTestComponent,
        FileUploadComponent,
        AppCredentialsComponent,
        ContribComponent,
        ProcessEditComponent,
        TableComponent,
        FieldViewerComponent,
        StatusDotComponent,
        ResourceListComponent,
        PeekComponent,
    ],
    entryComponents: [FixtureViewerComponent],
    imports: [
        AppRoutingModule,
        AngularFireModule.initializeApp(initAppConfig, "college-app-autofill"),
        AngularFireAuthModule,
        AngularFirestoreModule,
        LoginRoutingModule,
        BrowserModule,
        BrowserAnimationsModule,
        FormsModule,
        Ng2PageScrollModule,
        ReactiveFormsModule,
        MatDialogModule,
        FirebaseUIModule.forRoot(firebaseUiAuthConfig),
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
        console.log("Routes: ", JSON.stringify(router.config, undefined, 2));
    }
}
