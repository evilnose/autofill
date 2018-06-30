import {Injectable} from "@angular/core";
import {
AngularFirestore,
AngularFirestoreCollection, AngularFirestoreDocument,
} from "angularfire2/firestore";
import {User} from "firebase";
import {SelectOption} from "../partials/dropdown.component";
import {AuthService} from "./auth.service";

@Injectable()
export class DbService {
    public static getCollByRef(coll: AngularFirestoreCollection): Promise<object> {
        return coll.ref.get()
            .then((querySnapshot: any) => {
                const docMap: object = {};
                querySnapshot.forEach((doc: any) => {
                    docMap[doc.id] = doc.data();
                });
                return docMap;
            });
    }

    public static getDocByRef(afsDoc: AngularFirestoreDocument, onError: (err: any) => any | null): Promise<any> {
        if (onError) {
            return afsDoc.ref.get()
                .then((doc: any) => {
                    return doc.data();
                })
                .catch(onError);
        } else {
            return afsDoc.ref.get()
                .then((doc: any) => {
                        if (!doc.exists) {
                            return {};
                        }
                        return doc.data();
                    },
                );
        }
    }

    private static officialProcessPath(appId: string) {
        return `official_processes/${appId}`;
    }
    public isUserAdmin: boolean;
    private readonly userColl: AngularFirestoreCollection;

    private readonly appColl: AngularFirestoreCollection;
    private readonly officialProcessColl: AngularFirestoreCollection;

    private readonly officialFixtureColl: AngularFirestoreCollection;

    private readonly processColl: AngularFirestoreCollection;

    constructor(private db: AngularFirestore, private authService: AuthService) {
        this.userColl = db.collection("users");
        this.appColl = db.collection("apps");
        this.officialProcessColl = db.collection("official_processes");
        this.officialFixtureColl = db.collection("official_fixtures");
        this.processColl = db.collection("processes");

        this.isUserAdmin = false;
        const self = this;
        authService.onStateChange((user: User) => {
            self.updateUserStatus();
        });
    }

    public isAdmin(): Promise<boolean> {
        return this.getPermissions().then((perm) => !!perm.isAdmin);
    }

    public updateUserStatus(): void {
        this.isAdmin().then((isAdm) => this.isUserAdmin = isAdm);
    }

    public getAppListOptions(): Promise<SelectOption[]> {
        return this.getCollectionAsOptionsRef(this.appColl, "fullName");
    }

    public getFixtureListOptions(): Promise<SelectOption[]> {
        return this.getCollectionAsOptionsRef(this.officialFixtureColl, "display_name");
    }

    public getFixtures(): Promise<object> {
        return DbService.getCollByRef(this.officialFixtureColl);
    }

    public getOfficialProcess(id: string): Promise<object> {
        return this.getDocByPath(DbService.officialProcessPath(id), null).then((data) => data.process);
    }

    public submitOfficialProcess(pcsId: string, processStr: string): Promise<any> {
        return this.officialProcessColl.doc(pcsId).ref.update({
            process: processStr,
        });
    }

    public getDocByPath(path: string, onError: (err: any) => any | null): Promise<any> {
        return DbService.getDocByRef(this.db.doc(path), onError);
    }

    public getFixture(id: string, onError: (err: any) => any | null): Promise<object> {
        return DbService.getDocByRef(this.officialFixtureColl.doc(id), onError);
    }

    public getCollectionAsOptions(path: string, labelName: string): Promise<SelectOption[]> {
        return this.getCollectionAsOptionsRef(this.db.collection(path), labelName);
    }

    public getCollectionAsOptionsRef(collection: AngularFirestoreCollection,
                                     labelName: string): Promise<SelectOption[]> {
        return collection.ref.get()
            .then((querySnapshot: any) => {
                const options: SelectOption[] = [];
                querySnapshot.forEach((doc: any) => {
                    const data = doc.data();
                    options.push(new SelectOption(data[labelName], doc.id));
                });
                return options;
            });
    }

    public setFixture(id: string, fixtureData: string): Promise<void> {
        return this.officialFixtureColl.ref.doc(id).update({
            fixture_data: fixtureData,
        });
    }

    public newFixture(displayName: string, fixtureData: string): Promise<any> {
        return this.officialFixtureColl.ref.add({
            display_name: displayName,
            fixture_data: fixtureData,
        });
    }

    public deleteFixture(id: string): Promise<void> {
        return this.officialFixtureColl.ref.doc(id).delete();
    }

    protected getPermissions(): Promise<any> {
        let uid;
        if (!this.authService.isAuthenticated()) {
            return Promise.resolve({});
        } else {
            uid = this.authService.getCurrentUser().uid;
        }
        const userDoc = this.userColl.ref.doc(uid);
        return userDoc.get().then((doc) => {
            return !doc.exists ? {} : doc.data().permissions;
        });
    }
}
