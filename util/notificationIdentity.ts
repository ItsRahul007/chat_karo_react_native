import AsyncStorage from "@react-native-async-storage/async-storage";

/**
 * The logged-in user, cached where a background handler can reach it.
 *
 * Notification actions can fire with no React tree alive — a killed app woken
 * by a direct reply has no AuthContext to read `user.id` from, and the id we
 * need is the users-table id, not something derivable from the auth session.
 * AuthContext writes it here whenever it changes; background handlers read it.
 */

const IDENTITY_KEY = "@chatkaro/notification-identity";

export interface NotificationIdentity {
  id: string;
  name: string;
  avatar?: string;
}

export const cacheNotificationIdentity = async (
  identity: NotificationIdentity | null,
) => {
  try {
    if (!identity?.id) {
      await AsyncStorage.removeItem(IDENTITY_KEY);
      return;
    }
    await AsyncStorage.setItem(IDENTITY_KEY, JSON.stringify(identity));
  } catch (error) {
    console.log("Error caching notification identity:", error);
  }
};

export const readNotificationIdentity =
  async (): Promise<NotificationIdentity | null> => {
    try {
      const raw = await AsyncStorage.getItem(IDENTITY_KEY);
      return raw ? (JSON.parse(raw) as NotificationIdentity) : null;
    } catch (error) {
      console.log("Error reading notification identity:", error);
      return null;
    }
  };
