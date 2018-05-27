import { Component } from '@angular/core';
import {PageScrollConfig} from 'ng2-page-scroll';
import {AuthService} from "./services/auth.service";

@Component({
    selector: 'app-root',
    templateUrl: './app.component.html',
    styleUrls: ['../assets/scss/app.scss']
})

export class AppComponent {
    constructor(public authService: AuthService) {
        this.configPageScroll();
    }

    private configPageScroll(): void {
        PageScrollConfig.defaultScrollOffset = 75;
        PageScrollConfig.defaultEasingLogic = {
            ease: (t: number, b: number, c: number, d: number): number => {
                // easeInOutExpo easing
                if (t === 0) return b;
                if (t === d) return b + c;
                if ((t /= d / 2) < 1) return c / 2 * Math.pow(2, 10 * (t - 1)) + b;
                return c / 2 * (-Math.pow(2, -10 * --t) + 2) + b;
            }
        };
    }
}
