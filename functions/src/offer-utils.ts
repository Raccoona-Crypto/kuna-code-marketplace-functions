import * as uuid from 'uuid';
import * as admin from 'firebase-admin';

export type Offer = {
    amount: number;
    comment: string;
    commission?: number;
    currency: string;
    side: 'sell' | 'buy';
    user_id: string;

    creation_time?: string; // ISO String Format
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
            creation_time: new Date().toISOString(),
            security_token: uuid.v4(),
        } as Offer,
        body,
    );
}

export async function mapOfferModelResponse(model: admin.firestore.DocumentSnapshot): Promise<any> {
    const modelData = model.data();

    const response: any = {
        comment: modelData.comment,
        side: modelData.side,
        amount: modelData.amount,
        currency: modelData.currency,
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
            };
        } catch (error) {
            console.error(error);
            console.warn('User object exists, but!', typeof modelData.user, modelData.user);
        }
    }

    return response;
}
