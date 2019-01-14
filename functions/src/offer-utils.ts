import * as uuid from 'uuid';

export type TOffer = {
    amount: number;
    comment: string;
    commission?: number;
    currency: string;
    side: 'sell' | 'buy';
    user_id: string;

    creation_time?: string; // ISO String Format
    security_token?: string;
};


export type TOfferRequestBody = {
    amount: number;
    comment: string;
    commission?: number;
    currency: string;
    side: 'sell' | 'buy';
    user_id: string;
};


export function mapOfferObject(offer: TOffer, body: TOfferRequestBody): TOffer {
    offer.amount = body.amount;
    offer.comment = body.comment;
    offer.commission = body.commission;
    offer.currency = body.currency;
    offer.side = body.side;
    offer.user_id = body.user_id;

    return offer;
}

export function createOffer(body: TOfferRequestBody) {
    return mapOfferObject(
        {
            creation_time: new Date().toISOString(),
            security_token: uuid.v4(),
        } as TOffer,
        body,
    );
}

export function mapOfferModelResponse(modelData: any): any {
    const response: any = {
        comment: modelData.comment,
        side: modelData.side,
        amount: modelData.amount,
        currency: modelData.currency,
        commission: modelData.commission,
        creation_time: modelData.creation_time,
    };

    if (modelData.user) {
        try {
            const userData = modelData.user.data();

            response.user = {
                name: userData.name,
                contact: userData.contact,
            };
        } catch (error) {
            console.error(error);
            console.warn('User object exists, but!', modelData.user);
        }
    }

    return response;
}
