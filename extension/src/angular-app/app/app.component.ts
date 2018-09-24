import {Component, OnInit} from "@angular/core";
import {PageScrollConfig} from "ng2-page-scroll";
import {AuthService} from "./services/auth.service";
import {DbService} from "./services/db.service";
import {User} from "firebase";
import {Router} from "@angular/router";

@Component({
    selector: "app-root",
    styleUrls: ["./app.component.scss", "../assets/scss/app.scss"],
    templateUrl: "./app.component.html",
})

export class AppComponent implements OnInit {
    constructor(public authService: AuthService, public dbService: DbService, private router: Router) {
        this.configPageScroll();
    }

    public ngOnInit(): void {
        this.dbService.updateUserStatus();
        this.authService.setAuthStateChangeHandler((user: User) => {
           if (user) {
               this.dbService.updateUserStatus();
           } else {
               // User is logged out; redirect to main page.
               this.dbService.isAdmin = false;
               this.router.navigate(["/"]);
           }
        });
    }

    private configPageScroll(): void {
        PageScrollConfig.defaultScrollOffset = 75;
        PageScrollConfig.defaultEasingLogic = {
            ease: (t: number, b: number, c: number, d: number): number => {
                // easeInOutExpo easing
                if (t === 0) { return b; }
                if (t === d) { return b + c; }
                if ((t /= d / 2) < 1) { return c / 2 * Math.pow(2, 10 * (t - 1)) + b; }
                return c / 2 * (-Math.pow(2, -10 * --t) + 2) + b;
            },
        };
    }
}
