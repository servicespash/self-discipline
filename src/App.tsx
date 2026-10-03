/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect } from 'react';
import { onAuthStateChanged, User, signInWithPopup, GoogleAuthProvider } from 'firebase/auth';
import { doc, getDoc, collection } from 'firebase/firestore';
import { auth, db } from './firebase';
import Onboarding from './components/Onboarding';
import Dashboard from './components/Dashboard';

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [isSlow, setIsSlow] = useState(false);
  const [accessToken, setAccessToken] = useState<string | null>(null);

  useEffect(() => {
    console.log("App mounted, setting up auth listener");
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      console.log("Auth state changed:", currentUser ? "User signed in" : "No user");
      setUser(currentUser);
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  const handleSignIn = async () => {
    const provider = new GoogleAuthProvider();
    provider.addScope('https://www.googleapis.com/auth/calendar.events');
    provider.addScope('https://www.googleapis.com/auth/tasks');
    try {
      const result = await signInWithPopup(auth, provider);
      const credential = GoogleAuthProvider.credentialFromResult(result);
      if (credential?.accessToken) {
        setAccessToken(credential.accessToken);
      }
    } catch (error) {
      console.error("Error signing in: ", error);
    }
  };

  if (loading) return (
    <div className="fixed inset-0 flex flex-col items-center justify-center bg-gray-950 text-emerald-400 p-8 text-center">
      <div className="text-xl font-bold animate-pulse mb-4">Initializing System...</div>
      {isSlow && (
        <div className="text-gray-400">
          <p className="mb-4">Connection is taking longer than expected.</p>
          <button 
            onClick={() => window.location.reload()} 
            className="bg-emerald-600 text-white px-6 py-2 rounded-lg"
          >
            Refresh
          </button>
        </div>
      )}
    </div>
  );
  if (!user) return (
    <div className="p-8 flex flex-col items-center justify-center min-h-screen">
      <h1 className="text-2xl font-bold mb-4">Welcome to SelfDiscipline Consultant</h1>
      <button 
        onClick={handleSignIn}
        className="bg-blue-600 text-white px-6 py-2 rounded-lg"
      >
        Sign in with Google
      </button>
    </div>
  );
  return <Dashboard accessToken={accessToken} />;
}
