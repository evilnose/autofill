import { Component, OnInit } from '@angular/core';

@Component({
    selector: 'send',
    templateUrl: './send.component.html',
    styleUrls: ['../../assets/scss/app.scss']
})

export class SendComponent implements OnInit {
    message = "";

    constructor() { }

    ngOnInit(): void {
    }


    sendForm(): void {
        this.message = "Sending form...";
        chrome.runtime.sendMessage({
            action: "login",
        })
    }
}