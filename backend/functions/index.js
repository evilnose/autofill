const functions = require('firebase-functions');
const admin = require('firebase-admin');
// const serviceAccount = require('../credentials/college-app-autofill-firebase-adminsdk-9gxwb-3961ac289b');

admin.initializeApp();
const db = admin.firestore();

exports.updateAppFormat = functions.https.onRequest((req, res) => {
    let docRef = db.collection('apps').doc('HdsTQXOJtqrie8FbtSQv');
    docRef.get().then(function (doc) {
        if (doc.exists) {
            console.log("Common App data: " + JSON.stringify(doc.data()));
        } else {
            console.log("Error retrieving doc.");
        }
    });
});

