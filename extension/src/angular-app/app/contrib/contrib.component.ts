import {Component} from "@angular/core";

@Component({
    selector: "contrib",
    styleUrls: ["../../assets/scss/app.scss"],
    template: `
        <div class="contrib-root">
            <nav class="navbar fixed-top-padded navbar-expand-md navbar-light bg-light">
                <ul class="navbar-nav mr-auto">
                    <li class="nav-item contrib-nav-item">
                        <a class="nav-link" routerLink="process" routerLinkActive="active">Custom process</a>
                    </li>
                    <li class="nav-item contrib-nav-item">
                        <a class="nav-link" routerLink="fixture" routerLinkActive="active">User fixtures</a>
                    </li>
                    <li class="nav-item contrib-nav-item">
                        <a class="nav-link" routerLink="field_viewer" routerLinkActive="active">View Form Fields</a>
                    </li>
                </ul>
            </nav>
            <router-outlet></router-outlet>
        </div>
    `,
})
export class ContribComponent {}

