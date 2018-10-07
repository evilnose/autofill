import {NgModule} from "@angular/core";
import {SendComponent} from "./send.component";
import {StatusDotComponent} from "../partials/status-dot.component";
import {SharedModule} from "../../shared.module";
import {SendRoutingModule} from "./send-routing.module";

@NgModule({
    imports: [
        SharedModule,
        SendRoutingModule,
    ],
    declarations: [
        SendComponent,
        StatusDotComponent,
    ]
})
export class SendModule {}
