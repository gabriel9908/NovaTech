import { Switch, Route } from "wouter";
import { Toaster } from "@/components/ui/toaster";
import Home from "@/pages/Home";
import { useEffect, useState } from "react";
import { getAuth, onAuthStateChanged } from "firebase/auth";
import { UserProvider } from "./lib/UserContext";
import { User } from "firebase/auth";
import "./lib/firebase"; // Initialize Firebase

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      {/* Fallback to Home for now as it's a one-page application */}
      <Route path="*" component={Home} />
    </Switch>
  );
}

function App() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const auth = getAuth();
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      setUser(firebaseUser);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-t-2 border-primary"></div>
      </div>
    );
  }

  return (
    <UserProvider value={{ user, setUser }}>
      <div className="font-sans text-gray-800 bg-gray-50 min-h-screen">
        <Router />
        <Toaster />
      </div>
    </UserProvider>
  );
}

export default App;
