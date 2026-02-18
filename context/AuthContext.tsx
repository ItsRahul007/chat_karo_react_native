import { UserProfile } from "@/util/interfaces/types";
import { supabase } from "@/util/supabase";
import { GoogleSignin } from "@react-native-google-signin/google-signin";
import { Session } from "@supabase/supabase-js";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "expo-router";
import { createContext, PropsWithChildren, useEffect, useState } from "react";
import { useToast } from "./ToastContext";

type AuthContextType = {
  isLoggedIn: boolean;
  isReady: boolean;
  login: () => void;
  logout: () => void;
  updateUser: (data: Partial<UserProfile>) => void;
  user: UserProfile | null;
  isLoading: boolean;
};

export const AuthContext = createContext<AuthContextType>({
  isLoggedIn: false,
  isReady: false,
  login: () => {},
  logout: () => {},
  updateUser: () => {},
  user: null,
  isLoading: false,
});

const AuthProvider = ({ children }: PropsWithChildren) => {
  const [session, setSession] = useState<Session | null>(null);
  const [isAuthChecked, setIsAuthChecked] = useState(false);
  const { showToast } = useToast();
  const router = useRouter();
  const queryClient = useQueryClient();

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setIsAuthChecked(true);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (_event === "SIGNED_OUT") {
        queryClient.clear();
        router.replace("/login");
      }
    });

    GoogleSignin.configure({
      webClientId: process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID,
      scopes: [
        "https://www.googleapis.com/auth/userinfo.email",
        "https://www.googleapis.com/auth/userinfo.profile",
      ],
    });

    return () => subscription.unsubscribe();
  }, [queryClient, router]);

  const { data: userProfile, isLoading: isProfileLoading } = useQuery({
    queryKey: ["userProfile", session?.user?.id],
    queryFn: async () => {
      if (!session?.user?.email) return null;
      const { data, error } = await supabase
        .from("users")
        .select("*")
        .eq("email", session.user.email)
        .single();

      if (error && error.code !== "PGRST116") {
        throw error;
      }
      return data as UserProfile;
    },
    enabled: !!session?.user?.email,
  });

  const loginMutation = useMutation({
    mutationFn: async () => {
      await GoogleSignin.hasPlayServices();
      const response = await GoogleSignin.signIn();
      if (!response.data || !response.data.idToken) {
        throw new Error("Login Failed");
      }

      const { error } = await supabase.auth.signInWithIdToken({
        provider: "google",
        token: response.data.idToken,
      });

      if (error) {
        throw error;
      }
    },
    onSuccess: () => {
      router.replace("/");
    },
    onError: (error: Error) => {
      showToast(error.message, "error");
    },
  });

  const logoutMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
    },
    onError: (error: Error) => {
      showToast(error.message, "error");
    },
  });

  const updateUser = (data: Partial<UserProfile>) => {
    queryClient.setQueryData(
      ["userProfile", session?.user?.id],
      (oldData: UserProfile | undefined) => {
        if (!oldData) return data as UserProfile;
        return { ...oldData, ...data };
      },
    );
  };

  useEffect(() => {
    if (isAuthChecked && session && !isProfileLoading && userProfile === null) {
      router.replace("/profile/new");
    }
  }, [session, isProfileLoading, userProfile, isAuthChecked, router]);

  const isReady = isAuthChecked && (!session || !isProfileLoading);

  return (
    <AuthContext.Provider
      value={{
        isLoggedIn: !!session,
        isReady,
        login: loginMutation.mutate,
        logout: logoutMutation.mutate,
        updateUser,
        user: userProfile || null,
        isLoading: loginMutation.isPending || logoutMutation.isPending,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export default AuthProvider;
