import {Component} from '@angular/core';
import {Router} from '@angular/router';
import {AuthService} from './services/auth.service';

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
    styleUrls: ['../assets/scss/app.scss'],
})
export class LoginComponent {
    message: string;
    remember: boolean;

    constructor(public authService: AuthService, public router: Router) {
        this.remember = false;
    }

    toLogin(): void {
        this.authService.login(this.remember, () => this.redirectBack());
    }

    toLogout(): void {
        this.authService.logout();
    }

    private redirectBack(): void {
        // If no redirect has been set, use the default
        let redirect = this.authService.redirectUrl || '/welcome';

        // Redirect the user
        this.router.navigate([redirect]);
        this.authService.redirectUrl = null;
    }

    private getLoginStatusMessage(): string {
        if (this.authService.isAuthenticated()) {
            return "Logged in; you will be redirected shortly.";
        } else {
            return "Please log in to access your data and services.";
        }
    }
}