import {Injectable} from "@angular/core";

import {FirebaseApp} from "angularfire2";
import {AngularFireAuth} from "angularfire2/auth";
import * as firebase from "firebase";
import {FirebaseError, User} from "firebase";

@Injectable()
export class AuthService {
    private static handleSignInError(err: FirebaseError): void {
        console.error("Could not connect to Firebase.");
    }
    public redirectUrl: string;

    constructor(public firebaseApp: FirebaseApp, public afAuth: AngularFireAuth) {
    }

    public login(remember: boolean, callback: (a: any) => any): void {
        const provider = new firebase.auth.GoogleAuthProvider();
        provider.addScope("profile");
        provider.addScope("email");

        const persistence = remember ? firebase.auth.Auth.Persistence.LOCAL : firebase.auth.Auth.Persistence.SESSION;
        this.firebaseApp.auth().setPersistence(persistence)
            .then(() => this.firebaseApp.auth().signInWithPopup(provider))
            .then(callback)
            .catch(AuthService.handleSignInError);
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

    public onStateChange(handler: (value: User) => void): void {
        this.afAuth.auth.onAuthStateChanged(handler);
    }
}
