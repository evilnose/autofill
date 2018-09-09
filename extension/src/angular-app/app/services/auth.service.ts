import {Injectable} from "@angular/core";

import {FirebaseApp} from "angularfire2";
import {AngularFireAuth} from "angularfire2/auth";
import {FirebaseError, User} from "firebase";

@Injectable()
export class AuthService {
    public redirectUrl: string;

    constructor(public firebaseApp: FirebaseApp, public afAuth: AngularFireAuth) {
    }

    public logout(): void {
        this.afAuth.auth.signOut();
    }

    public isAuthenticated(): boolean {
        return !!this.firebaseApp.auth().currentUser;
    }

    public getCurrentUser(): User {
        return this.firebaseApp.auth().currentUser;
    }

    public getUid(): string {
        const u = this.getCurrentUser();
        if (u) {
            return u.uid;
        } else {
            return undefined;
        }
    }

    public setAuthStateChangeHandler(handler: (value: User) => void): void {
        this.afAuth.auth.onAuthStateChanged(handler);
    }
}
