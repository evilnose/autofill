import {Component, OnInit} from "@angular/core";
import {Router} from "@angular/router";
import {AuthService} from "./services/auth.service";
import {DbService} from "./services/db.service";
import * as firebase from 'firebase/app';
import {FirebaseApp} from "angularfire2";

@Component({
    template: `
        <div class="div-signin">
            <form class="form-signin text-center">
                <div class="alert alert-danger" *ngIf="lastError">
                    {{lastError}}
                </div>
                <h2>Sign in</h2>
                <p>{{getLoginStatusMessage()}}</p>
                <!--<label for="inputEmail" class="sr-only">Email address</label>-->
                <!--<input type="email" id="inputEmail" class="form-control" placeholder="Email address" required autofocus>-->
                <!--<label for="inputPassword" class="sr-only">Password</label>-->
                <!--<input type="password" id="inputPassword" class="form-control" placeholder="Password" required>-->
                <!--<div class="checkbox my-3">-->
                <!--<label>-->
                <!--<input type="checkbox" (click)="this.remember = !this.remember;"> Remember me-->
                <!--</label>-->
                <!--</div>-->
                <firebase-ui></firebase-ui>
                <div class="checkbox my-3">
                    <label>
                        <input type="checkbox" [(ngModel)]="remember" [ngModelOptions]="{standalone: true}"
                               (change)="rememberClicked(remember)"> Remember me
                    </label>
                </div>
            </form>
        </div>`,
    styleUrls: ["./login.component.scss", "../assets/scss/app.scss"],
})
export class LoginComponent implements OnInit {
    public message: string;
    private readonly FALLBACK_URL = "/welcome";
    private redirecting: boolean;
    private lastError: any;

    constructor(public authService: AuthService, public router: Router, private dbService: DbService, private firebaseApp: FirebaseApp) {
        this.redirecting = false;
    }

    ngOnInit() {
        this.firebaseApp.auth().setPersistence(firebase.auth.Auth.Persistence.SESSION)
            .catch(err => this.lastError = err);
    }

    //
    // public googleLogin(): void {
    //     this.authService.login(this.remember, this.authRedirect.bind(this));
    // }

    private rememberClicked(remember: boolean): void {
        const persistence = remember ? firebase.auth.Auth.Persistence.LOCAL : firebase.auth.Auth.Persistence.SESSION;
        this.firebaseApp.auth().setPersistence(persistence)
            .catch(err => this.lastError = err);
    }

    public toLogout(): void {
        this.authService.logout();
    }

    private authRedirect(): void {
        if (this.authService.redirectUrl === "/contribute") {
            this.redirecting = true;
            // need to test for admin identity
            if (this.dbService.isAdmin) {
                this.redirectTo(this.authService.redirectUrl);
            } else {
                this.redirectTo(this.FALLBACK_URL);
            }
        } else {
            console.log("redirecting to", this.authService.redirectUrl);
            this.redirectTo(this.authService.redirectUrl || this.FALLBACK_URL);
        }
    }

    private redirectTo(url: string): void {
        // Redirect the user
        this.redirecting = true;
        this.router.navigate([url])
            .then(() => this.redirecting = false)
            .catch((reason) => {
                console.error(reason);
                this.redirecting = false;
            });
        this.authService.redirectUrl = null;
    }

    private getLoginStatusMessage(): string {
        if (this.authService.isAuthenticated()) {
            if (!this.redirecting) {
                this.authRedirect();
                console.log("redirecting");
            }
            return "Logged in; you should be redirected shortly.";
        } else {
            return "Please log in to access your data and services.";
        }
    }
}
