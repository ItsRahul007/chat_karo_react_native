import { supabase } from "@/util/supabase";
import { GoogleSignin } from "@react-native-google-signin/google-signin";
import { useRouter } from "expo-router";
import { createContext, PropsWithChildren, useEffect, useState } from "react";
import { useToast } from "./ToastContext";

type AuthContextType = {
  isLoggedIn: boolean;
  isReady: boolean;
  login: () => void;
  logout: () => void;
};

export const AuthContext = createContext<AuthContextType>({
  isLoggedIn: false,
  isReady: false,
  login: () => {},
  logout: () => {},
});

const AuthProvider = ({ children }: PropsWithChildren) => {
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(false);
  const [isReady, setIsReady] = useState<boolean>(false);
  const { showToast } = useToast();
  const router = useRouter();

  const login = async () => {
    try {
      await GoogleSignin.hasPlayServices();
      const response = await GoogleSignin.signIn();
      if (!response.data || !response.data.idToken) {
        showToast("Login Failed", "error");
        return;
      }

      const { data, error } = await supabase.auth.signInWithIdToken({
        provider: "google",
        token: response.data.idToken,
      });

      if (error) {
        showToast(error.message, "error");
        return;
      }

      //! if it is a new user, move him to profile?id=new route
      const isUserExists = await supabase
        .from("users")
        .select("email")
        .eq("email", data.user.email)
        .single();

      if (isUserExists.data == null) {
        setIsLoggedIn(true);
        router.replace("/profile/new");
        return;
      }

      setIsLoggedIn(true);
      router.replace("/");
    } catch (error) {
      if (error instanceof Error) {
        showToast(error.message, "error");
      } else {
        showToast("An unexpected error occurred.", "error");
      }

      setIsLoggedIn(false);
    }
  };

  const logout = async () => {
    try {
      await supabase.auth.signOut();
      setIsLoggedIn(false);
      router.replace("/login");
    } catch (error) {
      if (error instanceof Error) {
        showToast(error.message, "error");
      } else {
        showToast("An unexpected error occurred.", "error");
      }
    }
  };

  useEffect(() => {
    GoogleSignin.configure({
      webClientId: process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID,
      scopes: [
        "https://www.googleapis.com/auth/userinfo.email",
        "https://www.googleapis.com/auth/userinfo.profile",
      ],
    });

    const checkSession = async () => {
      try {
        const { data } = await supabase.auth.getSession();
        if (data.session) {
          const isUserExists = await supabase
            .from("users")
            .select("email")
            .eq("email", data.session.user.email)
            .single();

          if (isUserExists.data == null) {
            setIsLoggedIn(true);
            router.replace("/profile/new");
            return;
          }
          setIsLoggedIn(true);
        }
      } catch (error) {
        console.error("Session check failed", error);
      } finally {
        setIsReady(true);
      }
    };
    checkSession();
  }, []);

  return (
    <AuthContext.Provider value={{ isLoggedIn, login, logout, isReady }}>
      {children}
    </AuthContext.Provider>
  );
};

export default AuthProvider;
