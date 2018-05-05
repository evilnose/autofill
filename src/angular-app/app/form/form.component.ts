import { Component, OnInit } from '@angular/core';

@Component({
    selector: 'form',
    templateUrl: './form.component.html',
    styleUrls: ['./form.component.scss']
})

export class FormComponent implements OnInit {
    testy = 'Fill me in!';

    constructor() { }

    ngOnInit() {
    }

}