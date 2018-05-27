import {Injectable} from '@angular/core';

import {AngularFireAuth} from 'angularfire2/auth';
import {FirebaseApp} from "angularfire2";
import * as firebase from 'firebase';
import {User} from "firebase";

@Injectable()
export class AuthService {
    redirectUrl: string;

    constructor(public firebaseApp: FirebaseApp, public afAuth: AngularFireAuth) {}

    login(interactive: boolean, callback: Function): void {
        let self = this;
        let provider = new firebase.auth.GoogleAuthProvider();
        provider.addScope('profile');
        provider.addScope('email');
        this.firebaseApp.auth().signInWithPopup(provider);
    }

    logout(): void {
        this.afAuth.auth.signOut();
    }


    isAuthenticated(): boolean {
        return !!this.firebaseApp.auth().currentUser;
    }

    getCurrentUser(): User {
        return this.firebaseApp.auth().currentUser;
    }

}