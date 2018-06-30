import {Component, OnInit} from '@angular/core';

import {User} from '../user';

@Component({
    selector: 'user-form',
    templateUrl: './user-form.component.html',
    styleUrls: ['../../assets/scss/app.scss']
})
export class UserFormComponent implements OnInit {
    testy = 'Fill me in!';

    model = new User(1, 'Gary', 'Geng');

    submitted = false;

    constructor() {
    }

    ngOnInit() {
    }

    onSubmit() {
        this.submitted = true;
    }

}