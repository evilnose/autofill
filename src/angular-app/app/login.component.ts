import {Component, HostListener} from '@angular/core';
import {Router} from '@angular/router';
import {AuthService} from './services/auth.service';

@Component({
    template: `
        <h2>Sign in</h2>
        <p>{{getLoginStatusMessage()}}</p>
        <p>
            <button (click)="login(true)" class="btn btn-primary" *ngIf="!authService.isAuthenticated()">Login</button>
            <button (click)="logout(token)" class="btn btn-primary" *ngIf="authService.isAuthenticated()">Logout</button>
        </p>
        <div class="form-check">
            <label class="form-check-label">
                <input type="checkbox" class="form-check-input" (click)="rememberMe = !rememberMe">
                Remember me in this browser
            </label>
        </div>`,
    styleUrls: ['../assets/scss/app.scss'],
})
export class LoginComponent {
    message: string;
    rememberMe: boolean;

    constructor(public authService: AuthService, public router: Router) {
        this.rememberMe = false;
    }

    login(interactive: boolean): void {
        let self = this;
        this.authService.login(interactive, this.rememberMe, function (errMessage: string) {
            if (!errMessage) {
                if (self.authService.isAuthenticated()) {
                    self.redirectBack();

                    self.authService.redirectUrl = null;
                }
            } else {
                console.error(errMessage);
            }
        });
    }

    logout(toRemove): void {
        this.authService.logout();
    }

    private redirectBack(): void {
        // If no redirect has been set, use the default
        let redirect = this.authService.redirectUrl || '/welcome';

        // Redirect the user
        this.router.navigate([redirect]);
    }

    private getLoginStatusMessage(): string {
        if (this.authService.isAuthenticated()) {
            this.redirectBack();
            return "Logged in. You will be redirected shortly.";
        } else {
            return "Please log in to access your data and services.";
        }
    }
}