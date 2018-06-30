import {Injectable} from '@angular/core';
import {
    CanActivate, Router,
    ActivatedRouteSnapshot,
    RouterStateSnapshot
} from '@angular/router';
import {AuthService} from './auth.service';
import {DbService} from "./db.service";

@Injectable()
export class AuthGuard implements CanActivate {
    constructor(private authService: AuthService, private router: Router, private dbService: DbService) {
    }

    canActivate(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): boolean | Promise<boolean> {
        let url: string = state.url;

        // if (!this.authService.isAuthenticated()) {
        //     // Store the attempted URL for redirecting
        //     this.authService.redirectUrl = url;
        //
        //     // Navigate to the login page with extras
        //     this.router.navigate(['/login']);
        //     return false;
        // } else if (url === '/contribute') {
        //     // Check if user is a registered contributor (or admin, as of now)
        //     return this.dbService.isAdmin();
        // }    else {
        //     return true;
        // }
        console.warn("Auth guard temporarily disabled");
        return true;
    }
}