import {Injectable} from "@angular/core";
import {
    ActivatedRouteSnapshot, CanActivate,
    Router,
    RouterStateSnapshot,
} from "@angular/router";
import {AuthService} from "./auth.service";
import {DbService} from "./db.service";

@Injectable()
export class AuthGuard implements CanActivate {
    constructor(private authService: AuthService, private router: Router, private dbService: DbService) {
    }

    public canActivate(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): boolean | Promise<boolean> {
        const url: string = state.url;


        if (!this.authService.isAuthenticated()) {
            // Store the attempted URL for redirecting
            this.authService.redirectUrl = url;

            // Navigate to the login page with extras
            this.router.navigate(["/login"]);
            return false;
        } else if (url === "/contribute") {
            // Check if user is a registered contributor (or admin, as of now)
            return this.dbService.isAdmin;
        } else {
            return true;
        }
    }
}
