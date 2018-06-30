import {Component, OnInit} from '@angular/core';
import {AuthService} from "../services/auth.service";

@Component({
    selector: 'welcome',
    templateUrl: './welcome.component.html',
    styleUrls: ['../../assets/scss/app.scss']
})

export class WelcomeComponent implements OnInit {

    constructor(public authService: AuthService) {
    }

    ngOnInit() {
    }

    getWelcomeMessage(): string {
        let msg: string = "Welcome";
        if (this.authService.isAuthenticated())
            return msg;
    }
}
