import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';

import * as OfferUtils from './offer-utils';

admin.initializeApp();
const db = admin.firestore();

export const getAllOffers = functions.https.onRequest(async (request, response) => {
    const snapshot = await db.collection('offers').get();

    const result = Promise.all(
        snapshot.docs.map(
            (obj: admin.firestore.DocumentSnapshot) => OfferUtils.mapOfferModelResponse(obj),
        ),
    );

    response.send({
        offers: await result,
    });
});


export const addOffer = functions.https.onRequest(async (request, response) => {
    const { body } = request;

    const offerObj = OfferUtils.createOffer(body);

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
    const id = request.params[0];
    const { body } = request;

    const offer: admin.firestore.DocumentSnapshot = await db.collection('offers').doc(id).get();
    if (!offer.exists) {
        response.sendStatus(404);
        return;
    }

    const offerData: OfferUtils.Offer = offer.data() as OfferUtils.Offer;

    // @TODO Need to check it.
    // if (offerData.security_token !== request.query.security_token) {
    //     response.sendStatus(403);
    //     return;
    // }

    const updatedObject = OfferUtils.mapOfferObject(offerData, body);

    try {
        await db.collection('offers').doc(id).set(updatedObject);
        response.send(200);
    } catch (error) {
        console.error(error);
        response.sendStatus(500);
    }
});
