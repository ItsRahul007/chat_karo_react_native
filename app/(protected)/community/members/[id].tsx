import BackgroundGredientIconButton from "@/components/common/BackgroundGredientIconButton";
import CommonBackButton from "@/components/common/CommonBackButton";
import MemberActionsModal from "@/components/community/MemberActionsModal";
import MemberItem from "@/components/community/MemberItem";
import { AuthContext } from "@/context/AuthContext";
import { useSocket } from "@/context/SocketContext";
import { getChatMembersById } from "@/controller/chat.controller";
import { useIconColor } from "@/util/common.functions";
import {
  gradientIconButtonIconSize,
  gradientIconButtonSize,
} from "@/util/constants";
import { QueryKeys, SearchParams } from "@/util/enum";
import { SingleUser } from "@/util/interfaces/commonInterfaces";
import { EmitMessages } from "@/util/socket.calls";
import { Toast } from "@/util/toast";
import { Entypo } from "@expo/vector-icons";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Link, useLocalSearchParams } from "expo-router";
import React, { useContext, useMemo, useState } from "react";
import { ActivityIndicator, FlatList, Text, View } from "react-native";
import { SafeAreaProvider, SafeAreaView } from "react-native-safe-area-context";

const Members = () => {
  const { id: conversationId } = useLocalSearchParams();
  const { user: currentUser } = useContext(AuthContext);
  const { socket } = useSocket();
  const iconColor = useIconColor();
  const queryClient = useQueryClient();

  const [showModal, setShowModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState<SingleUser | null>(null);

  const {
    data: chatMembers = [],
    refetch,
    isLoading,
  } = useQuery({
    queryKey: [QueryKeys.communityMembers, conversationId],
    queryFn: () => getChatMembersById(conversationId as string),
    enabled: !!conversationId,
  });

  const { isUserAdmin, isUserOwner } = useMemo(() => {
    if (!currentUser || !chatMembers.length)
      return { isUserAdmin: false, isUserOwner: false };
    const member = chatMembers.find(
      (m) => m.id.toString() === currentUser.id.toString(),
    );
    return {
      isUserAdmin: !!(member?.isAdmin || member?.isOwner),
      isUserOwner: !!member?.isOwner,
    };
  }, [currentUser, chatMembers]);

  const updateMemberAdminStatusLocal = (userId: string, isAdmin: boolean) => {
    queryClient.setQueryData(
      [QueryKeys.communityMembers, conversationId],
      (old: SingleUser[] | undefined) => {
        if (!old) return old;
        const updated = old.map((member) =>
          member.id.toString() === userId.toString()
            ? { ...member, isAdmin }
            : member,
        );
        // Sort locally to maintain Owner -> Admin -> Member order
        return [...updated].sort((a, b) => {
          const rank = (m: SingleUser) => (m.isOwner ? 0 : m.isAdmin ? 1 : 2);
          return rank(a) - rank(b);
        });
      },
    );
  };

  const removeMember = (userId: string) => {
    socket?.emit(EmitMessages.REMOVE_COMMUNITY_MEMBER, {
      conversationId,
      userId,
    });

    // Optimistically remove from local list
    queryClient.setQueryData(
      [QueryKeys.communityMembers, conversationId],
      (old: SingleUser[] | undefined) => {
        if (!old) return old;
        return old.filter((m) => m.id.toString() !== userId.toString());
      },
    );

    Toast.loading("Removing member...");
    setShowModal(false);
  };

  const makeAdmin = (userId: string) => {
    socket?.emit(EmitMessages.MAKE_ADMIN, {
      conversationId,
      userId,
    });
    updateMemberAdminStatusLocal(userId, true);
    setShowModal(false);
  };

  const dismissAdmin = (userId: string) => {
    socket?.emit(EmitMessages.DISMISS_ADMIN, {
      conversationId,
      userId,
    });
    updateMemberAdminStatusLocal(userId, false);
    setShowModal(false);
  };

  const handleLongPress = (user: SingleUser) => {
    // Don't show options for current user
    if (user.id.toString() === currentUser?.id.toString()) return;

    // Only Admins and Owners can see options
    if (!isUserAdmin) return;

    setSelectedUser(user);
    setShowModal(true);
  };

  return (
    <SafeAreaProvider>
      <SafeAreaView className="flex-1 bg-light-background-primary dark:bg-dark-background-primary relative">
        <View className="h-14 flex-row items-center px-4 gap-x-4 border-b border-gray-200 dark:border-gray-800">
          <CommonBackButton />
          <Text className="text-xl font-bold text-light-text-primary dark:text-dark-text-primary">
            Members
          </Text>
        </View>

        {isLoading ? (
          <View className="flex-1 items-center justify-center">
            <ActivityIndicator color={iconColor} />
          </View>
        ) : (
          <FlatList
            data={chatMembers}
            keyExtractor={(item) => item.id}
            contentContainerStyle={{ padding: 16, gap: 16 }}
            renderItem={({ item }) => (
              <MemberItem
                user={item}
                onLongPress={() => handleLongPress(item)}
              />
            )}
            ListEmptyComponent={
              <View className="items-center justify-center mt-10">
                <Text className="text-light-text-secondaryLight dark:text-dark-text-secondaryLight">
                  No members found
                </Text>
              </View>
            }
          />
        )}

        {isUserAdmin && (
          <Link
            href={`/search?for=${SearchParams.addCommunityMember}&conversationId=${conversationId}`}
            asChild
          >
            <BackgroundGredientIconButton
              icon={
                <Entypo
                  name="plus"
                  size={gradientIconButtonIconSize}
                  color="white"
                />
              }
              onPress={() => console.log("add member")}
              size={gradientIconButtonSize}
              className="absolute bottom-8 right-8"
            />
          </Link>
        )}

        {/* Member Actions Modal */}
        <MemberActionsModal
          visible={showModal}
          onClose={() => setShowModal(false)}
          selectedUser={selectedUser}
          isUserOwner={isUserOwner}
          isUserAdmin={isUserAdmin}
          onMakeAdmin={makeAdmin}
          onDismissAdmin={dismissAdmin}
          onRemoveMember={removeMember}
        />
      </SafeAreaView>
    </SafeAreaProvider>
  );
};

export default Members;
