import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import * as uuid from 'uuid';

admin.initializeApp();
let db = admin.firestore();

function getOfferObj(body) {
    return {
        amount: body.amount,
        comment: body.comment,
        commission: body.commission,
        currency: body.currency,
        side: body.side,
        user_id: body.user_id,
        creation_time: new Date().toISOString(),
        security_token: uuid.v4()
    };
}

export const getAllOffers = functions.https.onRequest(async (request, response) => {
    let snapshot = await db.collection('offers').get();

    response.send(snapshot.docs.map((obj) => obj.data()));
});

export const addOffer = functions.https.onRequest(async (request, response) => {
    const {body} = request;

    let offerObj = getOfferObj(body);

    try {
        const docRef = await db.collection('offers').add(offerObj);
        console.log('Document written with ID: ', docRef.id);
        response.send({
            token: offerObj.security_token,
        });
    } catch (error) {
        console.error(error);
        response.sendStatus(500);
    }
});

export const updateOffer = functions.https.onRequest(async (request, response) => {
    let id = request.params.id;
    const {body} = request;

    let offerObj = getOfferObj(body);

    try {
        const docRef = await db.collection('offers').doc(id).set(offerObj);
        response.send({
            token: offerObj.security_token,
        });
    } catch (error) {
        console.error(error);
        response.sendStatus(500);
    }
});
