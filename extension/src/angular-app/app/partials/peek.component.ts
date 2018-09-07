import {Component, Input} from "@angular/core";

@Component({
    template: `
        <div [hidden]="contentHidden">
            <ng-content></ng-content><button class="btn btn-link" (click)="contentHidden = true">hide</button>
        </div>
        <button class="btn btn-link" (click)="contentHidden = false" [hidden]="!contentHidden">show</button>
    `,
    styleUrls: ['../../assets/scss/app.scss'],
    selector: 'peek',
})
export default class PeekComponent {
    @Input() private contentHidden: boolean;

    constructor() {
        this.contentHidden = true;
    }
}