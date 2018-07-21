import {Component} from "@angular/core";
import {Router} from "@angular/router";
import {AuthService} from "./services/auth.service";
import {DbService} from "./services/db.service";

@Component({
    template: `
        <div class="div-signin">
            <form class="form-signin text-center">
                <h2>Sign in</h2>
                <p>{{getLoginStatusMessage()}}</p>
                <label for="inputEmail" class="sr-only">Email address</label>
                <input type="email" id="inputEmail" class="form-control" placeholder="Email address" required autofocus>
                <label for="inputPassword" class="sr-only">Password</label>
                <input type="password" id="inputPassword" class="form-control" placeholder="Password" required>
                <div class="checkbox my-3">
                    <label>
                        <input type="checkbox" (click)="this.remember = !this.remember;"> Remember me
                    </label>
                </div>
                <button (click)="toLogin()" class="btn-go btn btn-primary mx-auto">
                    Login
                </button>
            </form>
        </div>`,
    styleUrls: ["../assets/scss/app.scss"],
})
export class LoginComponent {
    public message: string;
    public remember: boolean;
    private readonly FALLBACK_URL = "/welcome";
    private redirecting: boolean;

    constructor(public authService: AuthService, public router: Router, private dbService: DbService) {
        this.remember = false;
        this.redirecting = false;
    }

    public toLogin(): void {
        this.authService.login(this.remember, this.authRedirect.bind(this));
    }

    public toLogout(): void {
        this.authService.logout();
    }

    private authRedirect(): void {
        if (this.authService.redirectUrl === "/contribute") {
            this.redirecting = true;
            // need to test for admin identity
            this.dbService.getContribStatus()
                .then((isContrib) => {
                    if (isContrib) {
                        this.redirectTo(this.authService.redirectUrl);
                    } else {
                        this.redirectTo(this.FALLBACK_URL);
                    }
                });
        } else {
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
