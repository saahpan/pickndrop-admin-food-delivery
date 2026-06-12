import * as admin from "firebase-admin";
import { getFirestore } from "firebase-admin/firestore";
import { readFileSync } from "fs";
import { join } from "path";

if (!admin.apps.length) {
  let serviceAccount: object;

  if (process.env.FIREBASE_FOOD_SA) {
    serviceAccount = JSON.parse(
      Buffer.from(process.env.FIREBASE_FOOD_SA, "base64").toString("utf-8"),
    );
  } else {
    const saPath = join(process.cwd(), "service-account-food.json");
    serviceAccount = JSON.parse(readFileSync(saPath, "utf-8"));
  }

  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount as admin.ServiceAccount),
    storageBucket: process.env.FIREBASE_STORAGE_BUCKET,
  });
}

export const adminAuth = admin.auth();
export const foodDb = getFirestore("food-delivery");
