import {Injectable} from "@angular/core";
import {SelectOption} from "../partials/dropdown.component";

@Injectable()
export class OptionsService {
    private static fromObjects(obj: any[]): SelectOption[] {
        const options = [];
        for (const o of obj) {
            options.push(new SelectOption(o.label, o.id));
        }
        return options;
    }

    private static fromLabels(labels: string[]): SelectOption[] {
        const options = [];
        for (const l of labels) {
            options.push(new SelectOption(l, l)); // put label as id too
        }
        return options;
    }

    public getSuffixOptions(): SelectOption[] {
        return OptionsService.fromLabels([
            "Jr.",
            "Sr.",
            "II",
            "III",
            "IV",
        ]);
    }
}
