import {Component, Input} from "@angular/core";
import {SelectOption} from "./dropdown.component";

@Component({
    selector: "generic-dropdown",
    template: `
        <dropdown-search [btnClass]="'btn btn-secondary'" [btnText]="'Select...'" [options]="options"
                         formControlName="formControlName" dropdownRequired></dropdown-search>
    `,
})
export class GenericDropdownComponent {
    @Input() private formControlName: string;
    @Input() private options: SelectOption[];
}
