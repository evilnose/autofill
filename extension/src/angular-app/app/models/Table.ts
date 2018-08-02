export class Table {
    private readonly head2I: object;
    private readonly editables: object;

    constructor(public headingAliases: string[], public originalColNames: string[] | null, private rows: string[][],
                private editableList: number[] | null) {
        this.head2I = {};
        if (originalColNames === null) {
            // if no column names have to be kept, name them the same as headings
            this.originalColNames = headingAliases.slice();
        }
        for (let i = 0; i < headingAliases.length; i++) {
            this.head2I[headingAliases[i]] = i;
        }

        this.editables = {};
        if (editableList) {
            for (const i of editableList) {
                this.editables[this.headingAliases[i]] = true;
            }
        }
    }

    public h2I(heading: string): number {
        return this.head2I[heading];
    }

    public copied(): Table {
        const newRows = [];
        for (const l of this.rows) {
            newRows.push(l.slice());
        }
        return new Table(this.headingCopy(), this.originalColNames, newRows, this.editableList.slice());
    }

    public headingCopy(): string[] {
        return this.headingAliases.slice();
    }

    public asObjList(): object[] {
        const list = [];
        for (const row of this.rows) {
            const obj = {};
            for (let i = 0; i < this.originalColNames.length; i++) {
                obj[this.originalColNames[i]] = row[i];
            }
            list.push(obj);
        }
        return list;
    }

    public get len(): number {
        return this.rows.length;
    }

    public at(heading: string, r: number): string {
        return this.rows[r][this.head2I[heading]];
    }

    public editableAt(heading: string): boolean {
        return this.editables[heading];
    }

    public pushRow(row: object) {
        const rowList = [];
        for (const h of this.headingAliases) {
            rowList.push(row[h]);
        }
        this.rows.push(rowList);
    }

    public update(heading: string, row: number, val: string) {
        this.rows[row][this.head2I[heading]] = val;
    }
}
