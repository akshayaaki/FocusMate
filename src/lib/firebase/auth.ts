import { signInWithPopup, signOut as fbSignOut, type UserCredential } from "firebase/auth";
import { getFirebaseAuth, getGoogleProvider } from "./client";
import { createClient } from "@/lib/supabase/client";

export async function signInWithGoogleFirebase(): Promise<UserCredential> {
  const auth = getFirebaseAuth();
  if (!auth) {
    throw new Error(
      "Firebase authentication is not initialized. Please ensure NEXT_PUBLIC_FIREBASE_API_KEY is configured."
    );
  }

  const provider = getGoogleProvider();
  const credential = await signInWithPopup(auth, provider);
  const user = credential.user;

  // Sync session with Supabase
  try {
    const supabase = createClient();
    const idToken = await user.getIdToken();

    if (idToken) {
      await supabase.auth.signInWithIdToken({
        provider: "google",
        token: idToken,
      }).catch((err) => {
        console.warn("Supabase ID token sign-in fallback:", err?.message || err);
      });
    }
  } catch (err) {
    console.warn("Supabase sync warning:", err);
  }

  return credential;
}

export async function signOutFirebase(): Promise<void> {
  const auth = getFirebaseAuth();
  if (auth) {
    await fbSignOut(auth).catch(() => {});
  }
  const supabase = createClient();
  await supabase.auth.signOut().catch(() => {});
}
