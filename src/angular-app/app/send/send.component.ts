import { Component, OnInit } from '@angular/core';

@Component({
    selector: 'send',
    templateUrl: './send.component.html',
    styleUrls: ['./send.component.scss']
})

export class SendComponent implements OnInit {
    testy = 'Send me!';

    constructor() { }

    ngOnInit() {
    }

}