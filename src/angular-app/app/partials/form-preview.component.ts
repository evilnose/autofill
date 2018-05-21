import { Component, Input } from '@angular/core';
import {User} from '../user.ts';

@Component({
    selector: 'form-preview',
    template:`
        <p>TODO here is the preview of the form that you're about to send.</p>
    `,
    styleUrls: ['../../assets/scss/app.scss']
})

export class FormPreviewComponent {
    @Input() hero: User;

    constructor() { }
}