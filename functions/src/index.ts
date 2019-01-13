import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';

admin.initializeApp();
let db = admin.firestore();

export const getAllOffers = functions.https.onRequest((request, response) => {
    var arr = [];
    db.collection("offers").get().then(function (querySnapshot) {
        querySnapshot.forEach(function (doc) {
            console.log(doc.id, " => ", doc.data());
            arr.push(doc.data());
        });
        response.send(arr);
    }).catch(function (error) {
        console.error("Error showing all offers: ", error);
    });
});

export const addOffer = functions.https.onRequest((request, response) => {
    let requestJson = request.body;
    let offerObj = {
        amount: requestJson.amount,
        comment: requestJson.comment,
        commission: requestJson.commission,
        creation_time: requestJson.creation_time,
        currency: requestJson.currency,
        security_token: requestJson.security_token,
        side: requestJson.side,
        user: requestJson.user
    };
    db.collection("offers").add(offerObj)
        .then(function (docRef) {
            console.log("Document written with ID: ", docRef.id);
        })
        .catch(function (error) {
            console.error("Error adding document: ", error);
        });
    response.end();
});
