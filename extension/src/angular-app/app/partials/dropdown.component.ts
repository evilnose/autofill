import {Component, Directive, ElementRef, forwardRef, Input, OnInit} from "@angular/core";
import {
    AbstractControl,
    ControlValueAccessor,
    FormControl,
    NG_VALIDATORS, NG_VALUE_ACCESSOR,
    Validator,
    ValidatorFn,
} from "@angular/forms";

export class SelectOption {
    constructor(public label: string, public id: string) {
        if (!label || !id) {
            // TODO don't throw in production
            throw new Error("SelectOption has undefined label or id");
        }
    }
}

@Component({
    host: {
        "(document:click)": "onClick($event)",
    },
    providers: [
        {
            multi: true,
            provide: NG_VALUE_ACCESSOR,
            useExisting: forwardRef(() => DropdownComponent),
        },
    ],
    selector: "dropdown-search",
    styleUrls: ["dropdown.scss"],
    template: `
        <div class="full-dropdown">
            <span class="dropdown-selected text-left">You selected: {{selectedLabel}}</span>
            <button type="button" (click)="toggleShow()" class="{{finalBtnClass}}">{{btnText}}</button>

            <div [hidden]="hideMenu" class="dropdown-content">
                <input type="text" placeholder="{{searchText}}" class="dropdown-search"
                       (keyup)="filterDropdown(dropdownSearch.value)" #dropdownSearch/>
                <span *ngFor="let o of filteredOptions" (click)="selectItem(o)">{{o.label}}</span>
            </div>
        </div>
    `,
})
export class DropdownComponent implements OnInit, ControlValueAccessor {
    private static filterQuery(label: string, query: string): boolean {
        return label.toLowerCase().includes(query.toLowerCase());
    }

    @Input() public options: SelectOption[] | Promise<SelectOption[]>;
    @Input() public btnText: string;
    @Input() public btnClass: string;
    private _hideMenu: boolean;
    private allOptions: SelectOption[];
    private filteredOptions: SelectOption[];
    private selectedLabel: string;
    private finalBtnClass: string;
    private _propagateChange: (id: string) => any;
    private _onTouchedFn: (err: any) => any;

    private searchText: string;

    constructor(private _eRef: ElementRef) {
        this._hideMenu = true;
        this.btnText = "Select";
    }

    public ngOnInit(): void {
        this.allOptions = [];
        this.filteredOptions = [];
        this.reloadContent();
        this.finalBtnClass = this.btnClass || "btn btn-primary";
    }

    public registerOnChange(fn: any): void {
        this._propagateChange = fn;
    }

    public registerOnTouched(fn: any): void {
        this._onTouchedFn = fn;
    }

    public writeValue(obj: any): void {
        // TODO
    }

    public reloadContent(): void {
        this.selectedLabel = "None";
        this.searchText = "Loading...";

        const self = this;
        Promise.resolve(this.options)
            .then((options) => {
                if (options) {
                    self.allOptions = self.filteredOptions = options;
                    self.searchText = "Search...";
                } else {
                    // Getting options failed and caught on the other side.
                    self.searchText = "Error: Check page for messages.";
                }
            })
            .catch((err) => {
                // Getting options failed and NOT caught on the other side
                console.error("A Promise with error is passed to dropdown component; please resolve any errors " +
                    "before passing the options Promise to dropdown: " + err);
            });
    }

    private onClick(event: Event): void {
        // If user clicks outside of dropdown, hide it.
        if (!this._eRef.nativeElement.contains(event.target) && !this.hideMenu) {
            this.hideMenu = true;
        }

    }

    set hideMenu(hide: boolean) {
        if (hide && this._onTouchedFn) {
            // touch on hide menu (e.g. blur)
            this._onTouchedFn(null);
        }
        this._hideMenu = hide;
    }

    get hideMenu(): boolean {
        return this._hideMenu;
    }

    private toggleShow(): void {
        this.hideMenu = !this.hideMenu;
    }

    private selectItem(o: SelectOption): void {
        this.selectedLabel = o.label;
        this.hideMenu = true;
        this._propagateChange(o.id);
    }

    private filterDropdown(query: string): void {
        this.filteredOptions = this.allOptions.filter((o) => DropdownComponent.filterQuery(o.label, query));
    }
}

// validation function
function validateDropdownFactory(): ValidatorFn {
    return (c: AbstractControl) => {
        const isValid = c.value !== null;

        if (isValid) {
            return null;
        } else {
            return {
                dropdownRequired: {
                    valid: false,
                },
            };
        }
    };
}

@Directive({
    providers: [
        {provide: NG_VALIDATORS, useExisting: DropdownRequired, multi: true},
    ],
    selector: "[dropdownRequired][ngModel]",
})
export class DropdownRequired implements Validator {
    public validator: ValidatorFn;

    constructor() {
        this.validator = validateDropdownFactory();
    }

    public validate(fc: FormControl) {
        return this.validator(fc);
    }
}
