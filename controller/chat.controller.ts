import { CHAT_PAGE_SIZE } from "@/util/constants";
import { TableNames } from "@/util/enum";
import {
  MediaAttachment,
  Message,
  SingleChat,
  SingleCommunityChat,
} from "@/util/interfaces/types";
import { supabase } from "@/util/supabase";
import { Toast } from "@/util/toast";
import * as FileSystem from "expo-file-system/legacy";
import * as MediaLibrary from "expo-media-library";
import * as Notifications from "expo-notifications";
import { Alert, Platform } from "react-native";

const saveMediaIntoDevice = async ({ type, url }: MediaAttachment) => {
  if (!url) return;

  try {
    const { status } = await MediaLibrary.requestPermissionsAsync(true);
    if (status !== "granted") {
      Toast.alert("Please grant permission to save media.");
      return;
    }

    const urlWithoutParams = url.split("?")[0];
    let fileExtension = urlWithoutParams.split(".").pop();

    // Fallback if extension is invalid or missing
    if (
      !fileExtension ||
      fileExtension.length > 5 ||
      fileExtension.includes("/")
    ) {
      if (type === "image") fileExtension = "jpg";
      else if (type === "video") fileExtension = "mp4";
      else if (type === "audio") fileExtension = "mp3";
      else fileExtension = fileExtension ?? "file";
    }

    const fileUrlName = urlWithoutParams.split("/").pop();
    const fileName = `chat_karo_${Date.now()}_${fileUrlName}.${fileExtension}`;
    // @ts-ignore
    const fileUri = FileSystem.cacheDirectory + fileName;

    const response = await fetch(url, { method: "HEAD" });
    const contentLength = response.headers.get("content-length");
    const fileSizeInMB = contentLength
      ? parseInt(contentLength, 10) / (1024 * 1024)
      : 0;

    if (fileSizeInMB > 3) {
      Alert.alert(
        "Download",
        `This file is large (${fileSizeInMB.toFixed(
          2,
        )}MB) and may take a moment to download. Do you want to continue?`,
        [
          {
            text: "Cancel",
            onPress: () => {
              return;
            },
            style: "cancel",
          },
          {
            text: "Download",
            onPress: () => {
              downloadFile({
                notification: true,
                mediaType: type!,
                mediaUrl: url,
                fileUri,
              });
            },
          },
        ],
      );
      return; // Stop execution, wait for user choice
    }

    // If small file or HEAD request failed, just download
    downloadFile({ mediaType: type!, mediaUrl: url, fileUri });
  } catch (error) {
    console.error(error);
    Toast.error("Failed to save media.");
  }
};

const downloadFile = async ({
  notification = false,
  mediaType,
  mediaUrl,
  fileUri,
}: {
  notification?: boolean;
  mediaType: string;
  mediaUrl: string;
  fileUri: string;
}) => {
  // Create a 'download' channel for silent progress updates
  if (Platform.OS === "android") {
    await Notifications.setNotificationChannelAsync("download", {
      name: "Download Progress",
      importance: Notifications.AndroidImportance.LOW,
    });
  }

  let lastNotificationId: string | null = null;
  let lastProgress = 0;

  try {
    const callback = async (
      downloadProgress: FileSystem.DownloadProgressData,
    ) => {
      const progress =
        downloadProgress.totalBytesWritten /
        downloadProgress.totalBytesExpectedToWrite;

      // Update notification every 15% to avoid spamming/lag
      if (progress - lastProgress >= 0.15 || progress === 1) {
        lastProgress = progress;
        const percentage = Math.round(progress * 100);

        if (lastNotificationId) {
          await Notifications.dismissNotificationAsync(lastNotificationId);
        }

        if (notification) {
          lastNotificationId = await Notifications.scheduleNotificationAsync({
            content: {
              title: "Downloading...",
              body: `${percentage}% completed`,
              priority: Notifications.AndroidNotificationPriority.LOW,
              sound: false,
            },
            trigger: null,
          });
        }
      }
    };

    const downloadResumable = FileSystem.createDownloadResumable(
      mediaUrl,
      fileUri,
      {},
      callback,
    );

    // Initial notification
    if (notification) {
      lastNotificationId = await Notifications.scheduleNotificationAsync({
        content: {
          title: "Downloading...",
          body: "Starting download...",
          priority: Notifications.AndroidNotificationPriority.LOW,
        },
        trigger: null,
      });
    }

    const result = await downloadResumable.downloadAsync();
    if (result && result.uri) {
      // Dismiss progress notification
      if (lastNotificationId) {
        await Notifications.dismissNotificationAsync(lastNotificationId);
      }

      // Save to lib
      if (mediaType === "image" || mediaType === "video") {
        await MediaLibrary.saveToLibraryAsync(result.uri);
        await Notifications.scheduleNotificationAsync({
          content: {
            title: "Saved!",
            body: "Media saved to your gallery.",
          },
          trigger: null,
        });
      } else {
        const asset = await MediaLibrary.createAssetAsync(result.uri);
        await MediaLibrary.createAlbumAsync("ChatKaro", asset, false);
        await Notifications.scheduleNotificationAsync({
          content: {
            title: "Saved!",
            body: "File saved successfully.",
          },
          trigger: null,
        });
      }
    }
  } catch (e) {
    console.error(e);
    if (lastNotificationId) {
      await Notifications.dismissNotificationAsync(lastNotificationId);
    }
    Toast.error("Download failed");
  }
};

//? personal chat list
const getPrivateChats = async (
  userId: bigint | number | string,
  page: number = 0,
  pageSize: number = CHAT_PAGE_SIZE,
): Promise<SingleChat[]> => {
  try {
    if (!userId) return [];

    const from = page * pageSize;
    const to = from + pageSize - 1;

    const { data, error } = await supabase
      .from(TableNames.inbox)
      .select("*")
      .eq("myId", userId)
      .eq("isGroup", false)
      .order("isPinned", { ascending: false })
      .order("unreadMessageCount", { ascending: false })
      .order("lastMessage->>createdAt", { ascending: false })
      .range(from, to);

    if (error) throw error;

    return data;
  } catch (error) {
    Toast.error("Error fetching chats");
    console.error("Error fetching chats:", error);
    return [];
  }
};

//? community chat list
const getCommunityChats = async (
  userId: bigint | number | string,
  page: number = 0,
  pageSize: number = CHAT_PAGE_SIZE,
  orderBy: string = "lastMessage->>createdAt",
): Promise<SingleCommunityChat[]> => {
  try {
    if (!userId) return [];

    const from = page * pageSize;
    const to = from + pageSize - 1;

    const { data, error } = await supabase
      .from(TableNames.inbox)
      .select("*")
      .eq("myId", userId)
      .eq("isGroup", true)
      .order("isPinned", { ascending: false })
      .order("unreadMessageCount", { ascending: false })
      .order(orderBy, { ascending: false })
      .range(from, to);

    if (error) throw error;

    return data;
  } catch (error) {
    console.error("Error fetching chats:", error);
    return [];
  }
};

//? used for fetching chat messages
const getChatById = async (
  id: string,
  isGroup: boolean,
  page: number = 0,
  pageSize: number = CHAT_PAGE_SIZE,
): Promise<Message[]> => {
  try {
    const from = page * pageSize;
    const to = from + pageSize - 1;

    const { data, error } = await supabase
      .from(TableNames.messages)
      .select(isGroup ? "*, sender:users (firstName, lastName, avatar)" : "*")
      .eq("conversationId", id)
      .order("createdAt", { ascending: false })
      .range(from, to);

    if (error) throw error;

    const mentionIds = Array.from(
      new Set(
        data
          .filter((m: any) => m.mentionMessageId)
          .map((m: any) => m.mentionMessageId),
      ),
    );

    const parentMessagesMap: Record<string, any> = {};
    if (mentionIds.length > 0) {
      const { data: parents, error: parentErr } = await supabase
        .from(TableNames.messages)
        .select(
          `id, message, media, senderId, sender:users (firstName, lastName)`,
        )
        .in("id", mentionIds);

      if (!parentErr && parents) {
        parents.forEach((p: any) => {
          parentMessagesMap[p.id] = p;
        });
      }
    }

    return data.map((message: any) => {
      const parentMsg = message.mentionMessageId
        ? parentMessagesMap[message.mentionMessageId]
        : null;

      return {
        ...message,
        sender: isGroup ? message.sender : null,
        mentionMessage: parentMsg
          ? {
              ...parentMsg,
              sender: parentMsg.sender || null,
            }
          : null,
      };
    });
  } catch (error) {
    console.error("Error fetching chat:", error);
    Toast.error("Error fetching chat");
    return [];
  }
};

//? used for fetching chat detail (group/person name, and avatar)
const getChatProfileById = async (
  id: string,
  isGroup: boolean,
): Promise<{
  avatar: string;
  name: string;
  id: bigint;
  about?: string;
  email?: string;
} | null> => {
  try {
    if (isGroup) {
      const { data, error } = await supabase
        .from(TableNames.conversations)
        .select("groupName,groupImage,groupAbout,id")
        .eq("id", id)
        .single();

      if (error) throw error;

      return {
        avatar: data.groupImage,
        name: data.groupName,
        about: data.groupAbout,
        id: data.id,
      };
    } else {
      const { data, error } = await supabase
        .from(TableNames.users)
        .select("firstName,lastName,avatar,about,email,id")
        .eq("id", id)
        .single();

      if (error) throw error;

      return {
        avatar: data.avatar,
        name: `${data.firstName} ${data.lastName}`,
        about: data.about,
        email: data.email,
        id: data.id,
      };
    }
  } catch (error) {
    console.error("Error fetching chat profile detail:", error);
    Toast.error("Error fetching chat profile detail");
    return null;
  }
};

const sendMessage = async (
  conversationId: bigint | number | string,
  myId: bigint | number | string,
  {
    mentionMessageId = null,
    media = null,
    message = null,
  }: {
    mentionMessageId?: bigint | number | string | null;
    media?: MediaAttachment[] | null;
    message?: string | null;
  } = {},
) => {
  //? check if message or media is present
  if (!message && !media) {
    Toast.error("Message or media is required");
    return null;
  }

  try {
    const { data, error } = await supabase
      .from(TableNames.messages)
      .insert({
        conversationId: conversationId,
        senderId: myId,
        message,
        media,
        mentionMessageId,
      })
      .select("*");

    if (error) throw error;

    return data;
  } catch (error) {
    console.error("Error sending message:", error);
    Toast.error("Error sending message");
    return null;
  }
};

const startNewChat = async (
  myId: bigint | number | string,
  chatWithId: bigint | number | string,
  messageContent: {
    message?: string | null;
    media?: MediaAttachment[] | null;
  },
) => {
  try {
    // 1. Create a new conversation
    const { data: conversation, error: convError } = await supabase
      .from(TableNames.conversations)
      .insert({ isGroup: false })
      .select("id")
      .single();

    if (convError) throw convError;
    const conversationId = conversation.id;

    // 2. Add participants
    const participants = [
      { conversationId, userId: myId, isAdmin: false, isOwner: false },
      { conversationId, userId: chatWithId, isAdmin: false, isOwner: false },
    ];

    const { error: partError } = await supabase
      .from(TableNames.participants)
      .insert(participants);

    if (partError) throw partError;

    // 3. Send the first message
    return await sendMessage(conversationId, myId, messageContent);
  } catch (error) {
    console.error("Error starting new chat:", error);
    Toast.error("Error starting new chat");
    return null;
  }
};

const updateLastReadTime = async (
  conversationId: bigint | number | string,
  myId: bigint | number | string,
) => {
  try {
    const { error } = await supabase
      .from(TableNames.participants)
      .update({ lastReadTime: new Date().toISOString() })
      .eq("conversationId", conversationId)
      .eq("userId", myId);

    if (error) throw error;
  } catch (error) {
    console.error("Error updating last read time:", error);
    Toast.error("Error updating last read time");
  }
};

export const updateCommunityProfile = async (
  id: string,
  payload: { groupName?: string; groupAbout?: string; groupImage?: string },
) => {
  try {
    const { data, error } = await supabase
      .from(TableNames.conversations)
      .update(payload)
      .eq("id", id)
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error("Error updating community profile:", error);
    Toast.error("Error updating community profile");
    return null;
  }
};

const getChatMembersById = async (conversationId: string) => {
  try {
    const { data, error } = await supabase
      .from(TableNames.participants)
      .select(
        `
        isAdmin,
        isOwner,
        users (
          id,
          firstName,
          lastName,
          avatar
        )
      `,
      )
      .neq("isRemoved", true)
      .eq("conversationId", conversationId);

    if (error) throw error;

    return data.map((p: any) => ({
      id: p.users.id,
      name: `${p.users.firstName} ${p.users.lastName}`,
      avatar: p.users.avatar,
      isAdmin: p.isAdmin,
      isOwner: p.isOwner,
    }));
  } catch (error) {
    console.error("Error fetching chat members:", error);
    return [];
  }
};

const getChatMediaById = async (conversationId: string) => {
  try {
    const { data, error } = await supabase
      .from(TableNames.messages)
      .select("media")
      .eq("conversationId", conversationId)
      .not("media", "is", null);

    if (error) throw error;

    // Each message has media: MediaAttachment[]
    // we want to return a flat array
    return data.flatMap((m: any) => m.media || []);
  } catch (error) {
    console.error("Error fetching chat media:", error);
    return [];
  }
};

const addCommunityMembers = async (
  conversationId: string | number | bigint,
  userIds: (string | number | bigint)[],
) => {
  try {
    const participants = userIds.map((userId) => ({
      conversationId,
      userId,
      isAdmin: false,
      isOwner: false,
    }));

    const { error } = await supabase
      .from(TableNames.participants)
      .insert(participants);

    if (error) throw error;
    Toast.success("Members added successfully");
    return true;
  } catch (error) {
    console.error("Error adding members:", error);
    Toast.error("Failed to add members");
    return false;
  }
};

const createCommunity = async ({
  groupName,
  groupImage,
  groupAbout,
  participants,
}: {
  groupName: string;
  groupImage?: string;
  groupAbout?: string;
  participants: {
    userId: string | number | bigint;
    isAdmin: boolean;
    isOwner: boolean;
  }[];
}) => {
  try {
    // 1. Create a new community conversation
    const { data: conversation, error: convError } = await supabase
      .from(TableNames.conversations)
      .insert({
        isGroup: true,
        groupName,
        groupImage,
        groupAbout,
      })
      .select("id")
      .single();

    if (convError) throw convError;
    const conversationId = conversation.id;

    // 2. Add participants
    const participantsData = participants.map((p) => ({
      ...p,
      conversationId,
    }));

    const { error: partError } = await supabase
      .from(TableNames.participants)
      .insert(participantsData);

    if (partError) throw partError;

    Toast.success("Community created successfully");
    return conversationId;
  } catch (error) {
    console.error("Error creating community:", error);
    Toast.error("Failed to create community");
    return null;
  }
};

export {
  addCommunityMembers,
  createCommunity,
  getChatById,
  getChatMediaById,
  getChatMembersById,
  getChatProfileById,
  getCommunityChats,
  getPrivateChats,
  saveMediaIntoDevice,
  sendMessage,
  startNewChat,
  updateLastReadTime,
};
