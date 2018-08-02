import {Component, EventEmitter, Input, Output} from "@angular/core";
import {Table} from "../models/Table";
import {DbService} from "../services/db.service";

@Component({
    selector: "edi-table",
    styleUrls: ["./table.component.scss", "../../assets/scss/app.scss"],
    template: `
        <div *ngIf="_table" style="height: 70vh; overflow: auto;">
            <table>
                <tr>
                    <th *ngFor="let h of _table.headingAliases"
                        class="{{_table.editableAt(h) ? 'editable-header' : 'normal-header'}}"
                        [style.width]="getWidth(h)">
                        {{h}}
                    </th>
                </tr>
                <tr *ngFor="let r of range(_table.len)">
                    <td *ngFor="let h of _table.headingAliases" class="{{_table.editableAt(h) ? 'editable-td' : 'td'}}">
                        <input *ngIf="_table.editableAt(h)" type="text" [value]="_table.at(h, r)"
                               (change)="inputChange(h, r, $event.target.value)"/>
                        <div *ngIf="!_table.editableAt(h)">
                            {{_table.at(h, r)}}
                        </div>
                    </td>
                </tr>
            </table>
            <div *ngIf="_table.len === 0" class="alert alert-warning">The table is empty.</div>
        </div>
        <div *ngIf="!_table">
            Loading table...
        </div>
    `,
})
export default class TableComponent {
    @Output() public changed: EventEmitter<Table>;
    @Input() private columnWidths: number[];
    private _table: Table;
    private updatedTable: Table; // we will only modify this table

    constructor(private dbService: DbService) {
        this.changed = new EventEmitter<Table>();
    }

    private inputChange(head: string, r: number, val: string) {
        this.updatedTable.update(head, r, val);
        this.changed.emit(this.updatedTable);
    }

    private getWidth(h: string): string {
        if (this.columnWidths) {
            return `${this.columnWidths[this._table.h2I(h)] * 100}%`;
        }
        return `${100 / this._table.headingAliases.length}%`;
    }

    @Input("initialTable")
    public set initialTable(t: Table) {
        this._table = t;
        if (t) {
            this.updatedTable = this._table.copied();
        }
    }

    private range(end: number): number[] {
        const res = [];
        for (let i = 0; i < end; i++) {
            res.push(i);
        }
        return res;
    }
}
