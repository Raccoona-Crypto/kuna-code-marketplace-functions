import * as admin from 'firebase-admin';
import App from '../firestore';

async function resolveUser(userBody: any): Promise<admin.firestore.DocumentSnapshot> {
    let userRef = App.db.collection('users').doc(userBody.id);
    let userDoc: admin.firestore.DocumentSnapshot = await userRef.get();

    if (userDoc.exists) {
        const dataToUpdate: any = {};
        if (userBody.name !== userDoc.get('name')) {
            dataToUpdate.name = userBody.name;
        }

        if (userBody.telegram !== userDoc.get('contact')) {
            dataToUpdate.contact = userBody.telegram;
        }

        userRef.update(userBody).catch(error => console.error(error));

        return userDoc;
    }

    await App.db.collection('users').doc(userBody.id).set({
        name: userBody.name,
        contact: userBody.telegram,
        num_of_ratings: 0,
        avg_rating: 0,
        ratings: [],
    });

    userDoc = await userRef.get();

    return userDoc;
}


export default { resolveUser };
