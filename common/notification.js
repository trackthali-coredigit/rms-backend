// notificationService.js
const admin = require("firebase-admin");
const serviceAccount = require("./notification.json");
const { db } = require("../config/db");
const { Op } = require("sequelize");
const { emitToSockets } = require("../config/socketConfig")

admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
});

const sendNotification = async (userId, message, data) => {
    try {
        console.log("XXXXXXXXXXXXXX", userId);
        console.log(userId);
        var tokenArray = []
        const tokensResult = await db.Token.findAll({
            attributes: [
                [db.sequelize.fn('GROUP_CONCAT', db.sequelize.col('device_token')), 'tokens']
            ],
            where: {
                user_id: { [Op.in]: userId },
            },
            order: [['token_id', 'DESC']]
        });

        console.log("#################################################tokensResult", tokensResult);
        const tokensString = tokensResult[0].get('tokens');
        if (tokensString) {
            tokenArray = tokensString.split(',');
            // console.log("device tokens tokenArray", tokenArray)
        }
        if (tokenArray.length === 0) {
            console.log('No device tokens found for other users');
            return; // or throw an error if you prefer
        }
        const stringData = {};
        for (const [key, value] of Object.entries(data)) {
            stringData[key] = value.toString();
        }
        console.log(">>>>>>>>>>>>>>>>>>>>token ARRy",tokenArray);
        // Construct the message
        const notificationMessage = {
            tokens: tokenArray,
            notification: {
                title: "Mabo",
                body: message
            },
            data: stringData, // Custom data payload
        };

        // Send the notification using FCM
        const response = await admin.messaging().sendMulticast(notificationMessage);
        for (const id of userId) {
            console.log("id", id);
            try {
                let notificationCount = await db.Notification.count({ where: { notification_to: id, status: "Unread" } });
                // console.log(">>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>im in notification count emit", notificationCount);
                // const info = { notificationCount }
                await emitToSockets(id, "notification_count", notificationCount);

            } catch (error) {
                // console.error("Error in afterCreate hook:", error);
            }
        }
        console.log('Successfully sent notification:', response);

        return response;
    } catch (error) {
        console.error('Error sending notification:', error);
        throw error;
    }
};
// const { JWT } = require("google-auth-library");

// const generate_access_token = async (req, result) => {
//     const body = {};
  
//     var serviceAccount = {
//         type: "service_account",
//         project_id: "mabo-881d1",
//         private_key_id: "d2e50b2c1e7294137547c0c001b11136b3afd71b",
//         private_key: "-----BEGIN PRIVATE KEY-----\nMIIEvgIBADANBgkqhkiG9w0BAQEFAASCBKgwggSkAgEAAoIBAQCyyKcT6A/vlxLh\n5dGYibnrHSzjXFGVTgvo0YlOBvGOlqHV56K9UGDd+NWAxXlT3lyRZsP+vXAu9egQ\nR6WNFvPNhw8pfiIRxyjcN3fl6GMbL5f254tmFwa8GLEIXjfWjwu/5guhI5ZPgEWS\nmSmBGWXMlmSUW9xlO5VYSAH32t2tNTMeFjssJyg/qDg5hgZvCXkgB0tngTnDM+/r\nWR8WMXm74htDdQkosCAhia+L+UtCyCtS267t+N6b9qjn87b8TUi4U5j2aFdAyqyD\nHynyUvKf/gdVYE3OJ9nEad5/IBVmTQKBCbCpaXXC6btmxEOrgMh8rtUwsLUYxlPH\nRtTthKF1AgMBAAECggEAGCb2N0C64mWY1e6bnY1BkgsbdM2UceScxEOGVoWmnVop\nG8ISoJuasnH6uc4zoUphW/0zjhbecGGlC4n6SfCnWAUeXb8d8CPlF7bgmi0GMnaA\nA4ltMgn7TW7Sf6xmw7QIZNC5knfBxxSvkWniiv+42mYYyVgNkpl1h/sWVPr6xnq2\ntEak7WVrjZYAFzMYFj8raQTMs+mOqb6u4ib84O8P4CecU1cSsdhaz4uNNYekHhYX\nFjL7kO3XwQWUTQ8ArTK2ahDPiFfY6MGl0xiWSo3Y0eeJ1TpFaaXDk88wxYuykk+k\nafUz1jY1MU2nrUWPbrn/wYbbPadaG90/Ti08n9/d8wKBgQDvkQUzJlpoAaQt4bNc\nv1DHhcLBPTvvO84Yur+47ORQ5ByO5C0pJmAYGoxKqPq1gniO4YrrPcAMCuR+fcgr\nrxWBfdn1c0ksRUUFAlPKUj/Fjoyi5Te5byWMDOpUEb3bT+Zy702/1+QDHqvpAq2s\nO5iiN6Q5zk73vI4uTr1Ss8yZLwKBgQC/DD1Wf0Mdz7evV2X2boZgfYFttN4mEpmC\nGO+YGZoqf8w+JM2Ivt3eteMLiWBbb/MqGpjXlaMb9QkMT2LLTKhBOkuPRGTU4n6R\nWNnKfdIp/vD85lxKSv6f9rafJxAiLKi5/9M5KqLqQ1nxPtppzQBD5Hnkvd3V9fNh\nndJshX2+mwKBgQCEWUvUHEYp225GYsBiZtdLwxv7AcdQvWt4wgMVONpRzhPw5SIF\n78t6xX/n5z7KdBACb5v9phmpDYN6Vib16z4oUczOCyjLqmEdCVIdHh9ZFw2fGJ8W\ndM77dk8mrr6CoLuhl48Og0jWaGV0zyP/WNVUGQVDYjTCLIsoDhwNyoMnxQKBgCcz\n08JUCumrHf4U6Q9QTrKuDkj8vDkDyAwyIbgMSN4/qyF1W9ebktuIZzaO0f7xUexp\n2MMkKXwrI9gq0hL1f/EijS6w0h/8+gvJN6edeeq0La83deioyub4MTEnSuA4WccQ\n/77TSOrZNzORui/LqSpFT93oOAUXmwGE6RDrs4nRAoGBAJfQFt0G84MTbfr6mqfk\nGLf1eNoxY4VV6gf+SAnv2uZYPXZ/f0zw8v8O/gTUkhoWa2WqNTYtPY9JF7pBdKnv\nOiqev/vdvwf1hX71KSOtzMGgAe06woWfdZC7RhHDKaSs0Iv4TpIo5ag+Z7hy5d5P\nvGJD0ew3A5fr7FTXyX8lITek\n-----END PRIVATE KEY-----\n",
//         client_email: "firebase-adminsdk-c0sps@mabo-881d1.iam.gserviceaccount.com",
//         client_id: "103251049482349263492",
//         auth_uri: "https://accounts.google.com/o/oauth2/auth",
//         token_uri: "https://oauth2.googleapis.com/token",
//         auth_provider_x509_cert_url: "https://www.googleapis.com/oauth2/v1/certs",
//         client_x509_cert_url: "https://www.googleapis.com/robot/v1/metadata/x509/firebase-adminsdk-c0sps%40mabo-881d1.iam.gserviceaccount.com",
//         universe_domain: "googleapis.com"
//     };
  
//     try {
   
//       const client = new JWT(
//         serviceAccount.client_email,
//         null,
//         serviceAccount.private_key,
//         ["https://www.googleapis.com/auth/firebase.messaging"]
//       );
  
//       async function getAccessToken() {
//         try {
//           const accessToken = await client.authorize();
//           console.log("Access Token:", accessToken.access_token);
//           return accessToken.access_token;
//         } catch (error) {
//           console.log("Error generating access token:", error);
//         }
//       }
  
//       // Example usage: Get the access token and send a message
//       getAccessToken().then((accessToken) => {
//         body.accessToken = accessToken;
//         result(null, body);
//         return;
//         // Use the access token to send a request to the FCM API
//         // Your code to send the request goes here
//       });
//     } catch (error) {
//       commonService.handleError(error, "accesstoken", result);
//     }
//   };

//   generate_access_token();

// sendNotification([34], "Helloxx", { msg: "Helloxx" })
module.exports = { sendNotification };