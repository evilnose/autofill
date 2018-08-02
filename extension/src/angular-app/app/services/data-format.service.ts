import {Injectable} from "@angular/core";
import {SelectOption} from "../partials/dropdown.component";

@Injectable()
export class DataFormatService {
    public formatQuerySnapshotAsOptions(querySnapshot: any, labelName: string): SelectOption[] {
        const options: SelectOption[] = [];
        querySnapshot.forEach((doc: any) => {
            const data = doc.data();
            options.push(new SelectOption(data[labelName], doc.id));
        });
        return options;
    }

    public formatQuerySnapshotAsMap(querySnapshot: any): object {
        const docMap: object = {};
        querySnapshot.forEach((doc: any) => {
            docMap[doc.id] = doc.data();
        });
        return docMap;
    }
}