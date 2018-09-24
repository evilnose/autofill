import {Component, OnInit} from "@angular/core";
import {ActivatedRoute, Router} from "@angular/router";
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
                <div class="alert alert-warning" *ngIf="reason === 'delete-account'">
                    Please log in again to delete your account
                </div>
                <h2>Sign in</h2>
                <p>{{getLoginStatusMessage()}}</p>
                <div *ngIf="!authService.isAuthenticated()">
                    <firebase-ui></firebase-ui>
                    <div class="checkbox my-3">
                        <label>
                            <input type="checkbox" [(ngModel)]="remember" [ngModelOptions]="{standalone: true}"
                                   (change)="rememberClicked(remember)"> Remember me
                        </label>
                    </div>
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
    private reason: string;

    constructor(public authService: AuthService, public router: Router, private dbService: DbService,
                private firebaseApp: FirebaseApp, private activatedRoute: ActivatedRoute) {
        this.redirecting = false;
    }

    ngOnInit() {
        this.firebaseApp.auth().setPersistence(firebase.auth.Auth.Persistence.SESSION)
            .catch(err => this.lastError = err);
        this.activatedRoute.queryParams.subscribe((params) => {
            this.reason = params.reason;
        });
    }

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
            this.redirectTo(this.authService.redirectUrl || this.FALLBACK_URL);
        }
    }

    private redirectTo(url: string): void {
        // Redirect the user
        this.redirecting = true;
        this.router.navigate([url], {
            queryParams: this.authService.redirectQueryParams,
        })
            .then(() => {
                this.authService.redirectUrl = null;
                this.authService.redirectQueryParams = null;
                this.redirecting = false;
            })
            .catch((reason) => {
                console.error(reason);
                this.redirecting = false;
            });
    }

    private getLoginStatusMessage(): string {
        if (this.authService.isAuthenticated()) {
            if (!this.redirecting) {
                this.authRedirect();
            }
            return "Logged in; you should be redirected shortly.";
        } else {
            if (this.reason === 'delete-account') {
                this.authService.redirectUrl = '/account';
                this.authService.redirectQueryParams = {
                    prompt: 'delete-now',
                };
                return "You are about to perform a sensitive action. Please log in again to verify your identity.";
            }
            return "Please log in to access your data and services.";
        }
    }
}
