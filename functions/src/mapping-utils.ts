import * as uuid from 'uuid';
import * as admin from 'firebase-admin';

export type Offer = {
    amount: number;
    comment: string;
    commission?: number;
    currency: string;
    side: 'sell' | 'buy';
    user_id: string;

    creation_time?: admin.firestore.Timestamp;
    delete_time: admin.firestore.Timestamp | null;
    security_token?: string;
};


export type OfferRequestBody = {
    amount: number;
    comment: string;
    commission?: number;
    currency: string;
    side: 'sell' | 'buy';
    user_id: string;
};

export type Rating = {
    score: number;
    comment: string;
    user_id: string;

    creation_time?: admin.firestore.Timestamp;
    security_token?: string;
};

export type RatingRequestBody = {
    score: number;
    comment: string;
    user_id: string;
};

export type User = {
    contact: string;
    num_of_ratings: number;
    name: string;
    avg_rating: number;
};


export function mapOfferObject(offer: Offer, body: OfferRequestBody): Offer {
    offer.amount = body.amount;
    offer.comment = body.comment;
    offer.commission = body.commission;
    offer.currency = body.currency;
    offer.side = body.side;
    offer.user_id = body.user_id;

    return offer;
}

export function createOffer(body: OfferRequestBody) {
    return mapOfferObject(
        {
            delete_time: null,
            creation_time: admin.firestore.Timestamp.now(),
            security_token: uuid.v4(),
        } as Offer,
        body,
    );
}


export function mapRatingObject(rating: Rating, body: RatingRequestBody): Rating {
    rating.comment = body.comment;
    rating.user_id = body.user_id;
    rating.score = body.score;

    return rating;
}

export function createRating(body: RatingRequestBody) {
    return mapRatingObject(
        {
            creation_time: admin.firestore.Timestamp.now(),

            /** @TODO Why, Karl, why?????? */
            security_token: uuid.v4(),
        } as Rating,
        body,
    );
}



export async function mapOfferModelResponse(model: admin.firestore.DocumentSnapshot): Promise<any> {
    const modelData = model.data();

    const response: any = {
        id: model.id,
        amount: modelData.amount,
        currency: modelData.currency,
        comment: modelData.comment,
        side: modelData.side,
        commission: modelData.commission,
        creation_time: modelData.creation_time,
    };

    if (modelData.user && typeof modelData.user === 'object') {
        try {
            const userRef: admin.firestore.DocumentReference = modelData.user;
            if (!userRef) {
                throw new Error('User not found');
            }

            const userData = await userRef.get();

            response.user = {
                name: userData.data().name,
                contact: userData.data().contact,
                avg_rating: userData.data().avg_rating,
                num_of_ratings: userData.data().num_of_ratings,

            };
        } catch (error) {
            console.error(error);
            console.warn('User object exists, but!', typeof modelData.user, modelData.user);
        }
    }

    return response;
}
