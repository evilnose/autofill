import {Injectable} from '@angular/core';

import {AngularFireAuth} from 'angularfire2/auth';

@Injectable()
export class AuthService {

    constructor(public afAuth: AngularFireAuth) {
    }

    login(interactive, callback): void {
        // TODO move logic to login component
        // Request an OAuth token from the Chrome Identity API.
        chrome.identity.getAuthToken({interactive: !!interactive},
            function (token) {
                if (chrome.runtime.lastError && !interactive) {
                    callback("It was not possible to get a token programmatically.");
                }
                if (chrome.runtime.lastError) {
                    callback(chrome.runtime.lastError);
                } else if (token) {
                    // Authorize Firebase with the OAuth Access Token.
                    let credential = this.afAuth.auth.GoogleAuthProvider.credential(null, token);
                    this.afAuth.signInAndRetrieveDataWithCredential(credential)
                        .then(function () {
                            callback(null);
                        })
                        .catch(function (error) {
                            // The OAuth token might have been invalidated. Lets' remove it from cache.
                            if (error.code === 'auth/invalid-credential') {
                                chrome.identity.removeCachedAuthToken({token: token}, function () {
                                    this.login(interactive, callback);
                                });
                            }
                        });
                } else {
                    callback('The OAuth Token was null');
                }
            });
    }

    logout(): void {
        this.afAuth.auth.signOut();
    }

}