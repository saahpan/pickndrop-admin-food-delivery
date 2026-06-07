import * as admin from "firebase-admin";
import { getFirestore } from "firebase-admin/firestore";
import { readFileSync } from "fs";
import { join } from "path";

if (!admin.apps.length) {
  const saPath = join(process.cwd(), "service-account-food.json");
  const serviceAccount = JSON.parse(readFileSync(saPath, "utf-8"));
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });
}

export const adminAuth = admin.auth();
export const foodDb = getFirestore("food-delivery");
