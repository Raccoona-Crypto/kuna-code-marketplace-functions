import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';

import * as OfferUtils from './offer-utils';
import { TOffer } from './offer-utils';

admin.initializeApp();
let db = admin.firestore();

export const getAllOffers = functions.https.onRequest(async (request, response) => {
    let snapshot = await db.collection('offers').get();

    response.send(
        snapshot.docs.map(
            (obj: any) => OfferUtils.mapOfferModelResponse(obj.data()),
        ),
    );
});


export const addOffer = functions.https.onRequest(async (request, response) => {
    const { body } = request;

    let offerObj = OfferUtils.createOffer(body);

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
    let id = request.params[0];
    const { body } = request;

    const offer = await db.collection('offers').doc(id).get();
    if (!offer) {
        response.sendStatus(404);
        return;
    }

    const offerData: TOffer = offer.data() as TOffer;

    // @TODO Need to check it.
    // if (offerData.security_token !== request.query.security_token) {
    //     response.sendStatus(403);
    //     return;
    // }

    const updatedObject = OfferUtils.mapOfferObject(offerData, body);

    try {
        const docRef = await db.collection('offers').doc(id).set(updatedObject);
        response.send(200);
    } catch (error) {
        console.error(error);
        response.sendStatus(500);
    }
});
