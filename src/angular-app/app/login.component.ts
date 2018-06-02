import {Component} from '@angular/core';
import {Router} from '@angular/router';
import {AuthService} from './services/auth.service';

@Component({
    template: `
        <div class="container-fluid mt-4">
            <h2 class="text-center mb-3">Sign in</h2>
            <p class="text-center mt-2 mb-4">{{getLoginStatusMessage()}}</p>
            <button (click)="login()" class="btn-go btn btn-primary my-3 mx-auto"
                    *ngIf="!authService.isAuthenticated()">
                Login
            </button>
            <button (click)="logout()" class="btn-go btn btn-primary my-3 mx-auto"
                    *ngIf="authService.isAuthenticated()">
                Logout
            </button>
            <p class="text-center">
                <small><i>Your login session will persist until 30 minutes from now or after the browser
                    is closed.</i></small>
            </p>
        </div>`,
    styleUrls: ['../assets/scss/app.scss'],
})
export class LoginComponent {
    message: string;

    constructor(public authService: AuthService, public router: Router) {
    }

    login(): void {
        let self = this;
        this.authService.login(function (errMessage: string) {
            if (!errMessage) {
                if (self.authService.isAuthenticated()) {
                    self.redirectBack();
                }
            } else {
                console.error(errMessage);
            }
        });
    }

    logout(): void {
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
            this.redirectBack();
            return "Logged in; you will be redirected shortly.";
        } else {
            return "Please log in to access your data and services.";
        }
    }
}