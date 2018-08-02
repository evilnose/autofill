import {Injectable} from "@angular/core";
import {
    AngularFirestore,
    AngularFirestoreCollection, AngularFirestoreDocument, QuerySnapshot,
} from "angularfire2/firestore";
import {AppCredential, IUserData} from "../models/Info";
import {SelectOption} from "../partials/dropdown.component";
import {AuthService} from "./auth.service";
import {User} from "firebase";
import FormField from "../models/FormField";
import {DataFormatService} from "./data-format.service";

@Injectable()
export class DbService {
    public getCollAsMap(coll: AngularFirestoreCollection): Promise<object> {
        return coll.ref.get()
            .then(this.formatService.formatQuerySnapshotAsMap);
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

    public isAdmin: boolean;
    private readonly userColl: AngularFirestoreCollection;
    private readonly appColl: AngularFirestoreCollection;
    private readonly officialProcessColl: AngularFirestoreCollection;
    private readonly officialFixtureColl: AngularFirestoreCollection;
    private readonly formFieldColl: AngularFirestoreCollection;
    private readonly processColl: AngularFirestoreCollection;

    constructor(private db: AngularFirestore, private authService: AuthService, private formatService: DataFormatService) {
        this.userColl = db.collection("users");
        this.appColl = db.collection("apps");
        this.officialProcessColl = db.collection("official_processes");
        this.officialFixtureColl = db.collection("official_fixtures");
        this.formFieldColl = db.collection("official_fields");
        this.processColl = db.collection("processes");

        this.isAdmin = false;
        const self = this;
        authService.onStateChange((user: User) => {
            self.updateUserStatus();
        });
    }

    private getUserAdminStatus(): Promise<boolean> {
        return this.getPermissions().then((perm) => perm.isAdmin);
    }

    public updateUserStatus(): void {
        this.getUserAdminStatus().then((isAdm) => this.isAdmin = isAdm);
    }

    public getAppListOptions(): Promise<SelectOption[]> {
        return this.getCollectionAsOptionsRef(this.appColl, "fullName");
    }

    public getAppMap(): Promise<object> {
        return this.getCollAsMap(this.appColl);
    }

    public getAppCollection(): Promise<any> {
        return this.appColl.ref.get();
    }

    public getFixtureListOptions(): Promise<SelectOption[]> {
        return this.getCollectionAsOptionsRef(this.officialFixtureColl, "display_name");
    }

    //
    // public getOfficialProcesses(): Promise<any> {
    //     return DbService.getCollByRef(this.officialProcessColl);
    // }

    public getFixtures(): Promise<object> {
        return this.getCollAsMap(this.officialFixtureColl);
    }

    public getOfficialProcess(id: string): Promise<string> {
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

    public getCollectionAsOptionsRef(collection: AngularFirestoreCollection,
                                     labelName: string): Promise<SelectOption[]> {
        return collection.ref.get()
            .then((qs) => this.formatService.formatQuerySnapshotAsOptions(qs, labelName));
    }

    public setOfficialFixture(id: string, fixtureData: string): Promise<void> {
        return this.officialFixtureColl.ref.doc(id).update({
            fixture_data: fixtureData,
        });
    }

    public newOfficialFixture(displayName: string, fixtureData: string): Promise<any> {
        return this.officialFixtureColl.ref.add({
            display_name: displayName,
            fixture_data: fixtureData,
        });
    }

    public delOfficialFixture(id: string): Promise<void> {
        return this.officialFixtureColl.ref.doc(id).delete();
    }

    public getCredentials(appId: string, isContrib: boolean): Promise<AppCredential> {
        return this.queryCredentials(appId, isContrib)
            .then((querySnapshot) => {
                if (querySnapshot.docs.length === 0) {
                    // no matched doc
                    return null;
                } else {
                    return querySnapshot.docs[0].data() as AppCredential;
                }
            });
    }

    public submitCredentials(creds: AppCredential, isContrib: boolean): Promise<void> {
        return this.queryCredentials(creds.app_id, isContrib)
            .then((querySnapshot: QuerySnapshot<AppCredential>) => {
                const data = {
                    username: creds.username,
                    password: creds.password,
                    app_id: creds.app_id,
                };
                if (querySnapshot.docs.length === 0) {
                    const credColl = this.getCredentialsColl(isContrib);
                    credColl.ref.add(data);
                } else {
                    return querySnapshot.docs[0].ref.set(data);
                }
            });
    }

    public getOfficialFormFields(): Promise<FormField[]> {
        return this.formFieldColl.ref.doc("0").get().then((doc) => {
            if (doc.exists && doc.data().fields) {
                return doc.data().fields as FormField[];
            } else {
                return [];
            }
        });
    }

    public setOfficialFormFields(formFields: FormField[]): Promise<void> {
        return this.formFieldColl.ref.doc("0").update({
            fields: formFields,
        });
    }

    private get currUserPath(): string {
        return `users/${this.authService.getUid()}`;
    }

    public getCurrUserData(): Promise<IUserData> {
        return this.db.collection(this.currUserPath + "/user_data").ref.doc("0").get().then(
            (doc) => doc.data().data as IUserData,
        );
    }

    public setCurrUserData(userData: any): Promise<void> {
        return this.db.collection(this.currUserPath + "/user_data").ref.doc("0").update({
            data: userData,
        });
    }

    protected getPermissions(): Promise<any> {
        let uid;
        if (!this.authService.isAuthenticated()) {
            return Promise.resolve({});
        } else {
            uid = this.authService.getUid();
        }
        const userDoc = this.userColl.ref.doc(uid);
        return userDoc.get().then((doc) => {
            return !doc.exists ? {} : doc.data().permissions;
        });
    }

    private queryCredentials(appId: string, isContrib: boolean): Promise<QuerySnapshot<AppCredential>> {
        const credColl = this.getCredentialsColl(isContrib);
        return credColl.ref.where("app_id", "==", appId).get() as Promise<QuerySnapshot<AppCredential>>;
    }

    private getCredentialsColl(isContrib: boolean): AngularFirestoreCollection {
        const collName = isContrib ? "dev_app_credentials" : "app_credentials";
        const uid = this.authService.getUid();
        if (uid) {
            return this.db.collection("users/" + uid + "/" + collName);
        } else {
            alert("You're supposed to be logged in. Either I screwed up or you did something sketchy.");
        }
    }
}


