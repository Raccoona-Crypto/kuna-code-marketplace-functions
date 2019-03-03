import { get } from 'lodash';
import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import * as MappingUtils from './mapping-utils';
import UserProvider from './providers/user';

import App from './firestore';


export const getAllOffers = functions.https.onRequest(async (request, response) => {
    const snapshot = await App.db.collection('offers')
        .where('delete_time', '==', null)
        .get();

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
    const { body } = request;

    try {
        const userData = get(body, 'user');
        if (!userData) {
            response.status(400).send('Need user');
            return;
        }

        const userDoc = await UserProvider.resolveUser(userData);
        const offerObj = MappingUtils.createOffer(body, userDoc);
        const docRef = await App.db.collection('offers').add(offerObj);

        console.log('Document written with ID: ', docRef.id);

        response.send({
            id: docRef.id,
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
        throw new Error('ID is empty');
    }
    const { body } = request;

    const offer: admin.firestore.DocumentSnapshot = await App.db.collection('offers').doc(id).get();
    if (!offer.exists) {
        response.sendStatus(404);
        return;
    }

    const offerData: MappingUtils.Offer = offer.data() as MappingUtils.Offer;
    const updatedObject = MappingUtils.mapOfferObject(offerData, body);

    try {
        await App.db.collection('offers').doc(id).update(updatedObject);
        response.sendStatus(204);
    } catch (error) {
        console.error(error);
        response.sendStatus(500);
    }
});


export const deleteOffer = functions.https.onRequest(async (request, response) => {
    const id = get(request.query, 'id');
    if (!id) {
        response.sendStatus(400);
        return;
    }

    const securityToken = get(request.query, 'token');

    const docReference = App.db.collection('offers').doc(id);
    const offer = await docReference.get();

    if (!offer.exists) {
        response.sendStatus(404);
        return;
    }

    if (securityToken !== offer.get('security_token')) {
        response.sendStatus(401);
        return;
    }

    try {
        await docReference.update({
            delete_time: admin.firestore.Timestamp.now(),
        });

        console.log('Document deleted with ID: ', id);
        response.sendStatus(204);
    } catch (error) {
        console.error(error);
        response.sendStatus(500);
    }
});


export const addRating = functions.https.onRequest(async (request, response) => {
    const id = request.params[0];
    if (!id) {
        throw new Error('ID is empty');
    }

    const { body } = request;
    const rating = MappingUtils.createRating(body);

    try {
        const docRef = await App.db.collection('users').doc(id).collection('ratings').add(rating);
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
    const { body } = request;

    const rating: admin.firestore.DocumentSnapshot = await App.db.collection('users').doc(userId).collection("ratings").doc(ratingId).get();
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
        await App.db.collection('users').doc(userId).collection("ratings").doc(ratingId).update(updatedObject);
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

    const { body } = request;
    const rating = MappingUtils.createRating(body);

    try {
        await App.db.collection('users').doc(userId).collection('ratings').doc(ratingId).delete();
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
        const rating = change.after.data() as MappingUtils.Rating;
        // Get value of the newly added rating
        const score = +rating.score;

        // Get a reference to the restaurant
        const userRef = App.db.collection('users').doc(context.params.userId);

        // Update aggregations in a transaction
        return App.db.runTransaction(
            async (transaction) => {
                const userDoc = await transaction.get(userRef);

                const userData = userDoc.data() as MappingUtils.User;
                const avgRating = userData.avg_rating || 0;
                const numOfRatings = userData.num_of_ratings || 0;

                const newNumRatings = numOfRatings + 1;

                // Compute new average rating
                const oldRatingTotal = avgRating * numOfRatings;
                const newAvgRating = (oldRatingTotal + score) / newNumRatings;

                console.log(oldRatingTotal);
                console.log(newAvgRating);
                // Update restaurant info

                return transaction.update(userRef, {
                    avg_rating: newAvgRating,
                    num_of_ratings: newNumRatings,
                });
            },
        );
    });