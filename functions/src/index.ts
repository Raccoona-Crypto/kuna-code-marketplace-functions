import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';

import * as MappingUtils from './mapping-utils';

admin.initializeApp();
const db = admin.firestore();

export const getAllOffers = functions.https.onRequest(async (request, response) => {
    const snapshot = await db.collection('offers').get();

    const result = Promise.all(
        snapshot.docs.map(
            (obj: admin.firestore.DocumentSnapshot) => MappingUtils.mapOfferModelResponse(obj),
        ),
    );

    response.send({
        offers: await result,
    });
});


export const addOffer = functions.https.onRequest(async (request, response) => {
    const id = request.params[0];
    if (!id) {
        throw new Error('Id is empty');
    }
    const {body} = request;

    const offerObj = MappingUtils.createOffer(body);

    try {
        const docRef = await db.collection('offers').doc(id).set(offerObj);
        console.log('Document written with ID: ', id);
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
    if (!id) {
        throw new Error('Id is empty');
    }
    const {body} = request;

    const offer: admin.firestore.DocumentSnapshot = await db.collection('offers').doc(id).get();
    if (!offer.exists) {
        response.sendStatus(404);
        return;
    }

    const offerData: MappingUtils.Offer = offer.data() as MappingUtils.Offer;

    // @TODO Need to check it.
    // if (offerData.security_token !== request.query.security_token) {
    //     response.sendStatus(403);
    //     return;
    // }

    const updatedObject = MappingUtils.mapOfferObject(offerData, body);

    try {
        await db.collection('offers').doc(id).update(updatedObject);
        response.send(200);
    } catch (error) {
        console.error(error);
        response.sendStatus(500);
    }
});

export const deleteOffer = functions.https.onRequest(async (request, response) => {
    const id = request.params[0];
    if (!id) {
        throw new Error('Id is empty');
    }
    const {body} = request;

    const offerObj = MappingUtils.createOffer(body);

    try {
        const docRef = await db.collection('offers').doc(id).delete();
        console.log('Document deleted with ID: ', id);
        response.send({
            token: offerObj.security_token,
        });
    } catch (error) {
        console.error(error);
        response.sendStatus(500);
    }
});

export const addRating = functions.https.onRequest(async (request, response) => {
    const id = request.params[0];
    if (!id) {
        throw new Error('Id is empty');
    }
    const {body} = request;

    const rating = MappingUtils.createRating(body);


    try {
        const docRef = await db.collection('users').doc(id).collection('ratings').add(rating);
        console.log('Rating written with ID: ', docRef.id);
        response.send({
            token: rating.security_token,
        });
    } catch (error) {
        console.error(error);
        response.sendStatus(500);
    }
});

export const updateRating = functions.https.onRequest(async (request, response) => {
    const userId = request.params[0];
    if (!userId) {
        throw new Error('userId is empty');
    }
    const ratingId = request.params[1];
    if (!ratingId) {
        throw new Error('ratingId is empty');
    }
    const {body} = request;

    const rating: admin.firestore.DocumentSnapshot = await db.collection('users').doc(userId).collection("ratings").doc(ratingId).get();
    if (!rating.exists) {
        response.sendStatus(404);
        return;
    }

    const ratingData: MappingUtils.Rating = rating.data() as MappingUtils.Rating;

    // @TODO Need to check it.
    // if (offerData.security_token !== request.query.security_token) {
    //     response.sendStatus(403);
    //     return;
    // }

    const updatedObject = MappingUtils.mapRatingObject(ratingData, body);

    try {
        await db.collection('users').doc(userId).collection("ratings").doc(ratingId).update(updatedObject);
        response.send(200);
    } catch (error) {
        console.error(error);
        response.sendStatus(500);
    }
});


export const deleteRating = functions.https.onRequest(async (request, response) => {
    const userId = request.params[0];
    if (!userId) {
        throw new Error('userId is empty');
    }
    const ratingId = request.params[1];
    if (!ratingId) {
        throw new Error('ratingId is empty');
    }
    const {body} = request;

    const rating = MappingUtils.createRating(body);


    try {
        const docRef = await db.collection('users').doc(userId).collection("ratings").doc(ratingId).delete();
        console.log('Rating deleted with ID: ', ratingId);
        response.send({
            token: rating.security_token,
        });
    } catch (error) {
        console.error(error);
        response.sendStatus(500);
    }
});

export const aggregateRatings = functions.firestore.document('users/{userId}/ratings/{ratingId}')
    .onWrite((change, context) => {
        const rating = change.after.data() as  MappingUtils.Rating;
        // Get value of the newly added rating
        const score = rating.score;
        console.log(rating);

        // Get a reference to the restaurant
        const userRef = db.collection('users').doc(context.params.userId);

        // Update aggregations in a transaction
        return db.runTransaction(transaction => {
            return transaction.get(userRef).then(userDoc => {
                // Compute new number of ratings

                const user = userDoc.data() as MappingUtils.User;
                const numOfRatings = user.num_of_ratings;
                const avgRating = user.avg_rating;

                const newNumRatings = numOfRatings + 1;

                // Compute new average rating
                const oldRatingTotal = avgRating * numOfRatings;
                const newAvgRating = (oldRatingTotal + score) / newNumRatings;

                console.log(oldRatingTotal);
                console.log(newAvgRating);
                // Update restaurant info
                return transaction.update(userRef, {
                    avg_rating: newAvgRating,
                    num_of_ratings: newNumRatings
                });
            });
        });
    });