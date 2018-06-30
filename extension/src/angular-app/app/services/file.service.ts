import {Injectable} from "@angular/core";

@Injectable()
export class FileService {
    public readFileAsJSONString(file: File): Promise<string> {
        return new Promise( (resolve) => {
            const fr = new FileReader();
            fr.onload = (e: any) => {
                resolve(e.target.result);
            };
            fr.readAsText(file);
        });
    }
}
