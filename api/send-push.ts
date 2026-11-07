import type { IncomingMessage, ServerResponse } from 'http';
import admin from 'firebase-admin';
import fs from 'fs';
import path from 'path';

// Vercel serverless functions receive standard Node HttpRequest decorated with parsed body/query helpers
export type NextApiRequest = IncomingMessage & {
  body: any;
  query: any;
  method?: string;
};

export type NextApiResponse = ServerResponse & {
  status: (code: number) => NextApiResponse;
  json: (data: any) => void;
};

// Initialize Firebase Admin once using service account credentials from environment variables or local fallback file
if (!admin.apps.length) {
  try {
    let serviceAccount: any = null;
    const serviceAccountVar = process.env.FIREBASE_SERVICE_ACCOUNT;
    
    if (serviceAccountVar) {
      serviceAccount = JSON.parse(serviceAccountVar);
    } else {
      // Look for custom local JSON file inside workspace
      const localPath = path.join(process.cwd(), 'firebase-service-account.json');
      if (fs.existsSync(localPath)) {
        console.log('Using local firebase-service-account.json fallback.');
        const fileContent = fs.readFileSync(localPath, 'utf8');
        serviceAccount = JSON.parse(fileContent);
      }
    }

    if (serviceAccount) {
      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount)
      });
      console.log('Firebase Admin SDK initialized successfully.');
    } else {
      console.warn('FIREBASE_SERVICE_ACCOUNT environment variable and local firebase-service-account.json file are both missing.');
    }
  } catch (error) {
    console.error('Failed to initialize Firebase Admin SDK:', error);
  }
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Only allow POST request
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed. Use POST.' });
  }

  const { token, title, body, orderId } = req.body;

  if (!token) {
    return res.status(400).json({ error: 'Missing destination fcmToken (token).' });
  }

  const notificationTitle = title || 'New Delivery Available 🍔';
  const notificationBody = body || 'McBurger • £8.50 • 2.3 miles away';

  try {
    if (!admin.apps.length) {
      return res.status(501).json({
        error: 'Firebase Admin not configured. Please add the FIREBASE_SERVICE_ACCOUNT secret inside Vercel Dashboard settings.',
        simulated: true,
        data: { title: notificationTitle, body: notificationBody, orderId }
      });
    }

    // Construct the standard high-priority message payload for Android/PWA
    const message: admin.messaging.Message = {
      token: token,
      notification: {
        title: notificationTitle,
        body: notificationBody,
      },
      // Include data fields for custom deep-linking, deep action selectors, and routing
      data: {
        title: notificationTitle,
        body: notificationBody,
        orderId: orderId || '',
        click_action: `/?action=view&orderId=${orderId || ''}`,
        url: `/?action=view&orderId=${orderId || ''}`
      },
      android: {
        priority: 'high',
        notification: {
          icon: 'icon', // Uses android drawables or standard launcher icon
          color: '#090a0f',
          sound: 'default',
          clickAction: 'FLUTTER_NOTIFICATION_CLICK', // standard web receiver fallback
          notificationCount: 1, // trigger launcher badge / dot updates
        },
      },
      webpush: {
        headers: {
          Urgency: 'high'
        },
        notification: {
          title: notificationTitle,
          body: notificationBody,
          icon: '/icon.png',
          badge: '/icon.png',
          vibrate: [200, 100, 200, 100, 200],
          actions: [
            { action: 'accept', title: 'Accept ✅' },
            { action: 'decline', title: 'Decline ❌' }
          ]
        },
        fcmOptions: {
          link: `/?action=view&orderId=${orderId || ''}`
        }
      }
    };

    const response = await admin.messaging().send(message);
    return res.status(200).json({
      success: true,
      messageId: response
    });
  } catch (error: any) {
    console.error('FCM Dispatch failure:', error);
    return res.status(500).json({
      error: 'Failed to send FCM push notification',
      details: error.message
    });
  }
}
