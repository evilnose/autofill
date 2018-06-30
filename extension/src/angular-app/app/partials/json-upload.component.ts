import {Component, Input} from "@angular/core";
import {FileService} from "../services/file.service";

@Component({
    selector: "json-upload",
    styleUrls: ["../../assets/scss/app.scss"],
    template: `
        <label for="{{uniqueId}}" class="{{btnStyle}}">
            Load JSON...
        </label>
        <input id="{{uniqueId}}" type="file" size="" (change)="fileChange($event)" class="hidden-file-upload"
               accept=".json">
    `,
})
export class JsonUploadComponent {
    @Input() private onFileChange: (jsonStr: string) => any;
    @Input() private btnText: string;
    @Input() private btnStyle: string;
    @Input() private uniqueId: string;

    constructor(public fileService: FileService) {
        this.uniqueId = "not-unique-id";
        this.btnText = "Load File...";
    }

    private fileChange(event: any): void {
        const fileList: FileList = event.target.files;
        if (fileList.length > 0) {
            this.fileService.readFileAsJSONString(fileList[0])
                .then(this.onFileChange);
        }
    }
}