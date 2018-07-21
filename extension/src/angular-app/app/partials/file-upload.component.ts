import {Component, Input} from "@angular/core";
import {FileService} from "../services/file.service";

@Component({
    selector: "file-upload",
    styleUrls: ["../../assets/scss/app.scss"],
    template: `
        <label for="{{uniqueId}}" class="{{btnClass}}">
            {{btnText}}
        </label>
        <input id="{{uniqueId}}" type="file" size="" (change)="fileChange($event)" (click)="upload.value = null"
               class="hidden-file-upload"
               accept="{{extension}}" #upload>
    `,
})
export class FileUploadComponent {
    @Input() private onFileChange: (fileStr: string) => any;
    @Input() private btnText: string;
    @Input() private btnClass: string;
    @Input() private uniqueId: string;
    @Input() private extension: string;

    constructor(public fileService: FileService) {
        this.uniqueId = "not-unique-id";
        this.btnText = "Load File...";
        this.extension = ".json";
    }

    private fileChange(event: any): void {
        const fileList: FileList = event.target.files;
        if (fileList.length > 0) {
            this.fileService.readFileAsText(fileList[0])
                .then(this.onFileChange);
        }
    }
}
