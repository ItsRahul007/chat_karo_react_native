import { SingleUser } from "@/util/interfaces/commonInterfaces";
import React from "react";
import { Modal, Pressable, Text, View } from "react-native";

interface MemberActionsModalProps {
  visible: boolean;
  onClose: () => void;
  selectedUser: SingleUser | null;
  isUserOwner: boolean;
  isUserAdmin: boolean;
  onMakeAdmin: (userId: string) => void;
  onDismissAdmin: (userId: string) => void;
  onRemoveMember: (userId: string) => void;
}

const MemberActionsModal = ({
  visible,
  onClose,
  selectedUser,
  isUserOwner,
  isUserAdmin,
  onMakeAdmin,
  onDismissAdmin,
  onRemoveMember,
}: MemberActionsModalProps) => {
  if (!selectedUser) return null;

  return (
    <Modal
      animationType="slide"
      transparent={true}
      visible={visible}
      onRequestClose={onClose}
    >
      <Pressable
        className="flex-1 bg-black/50 justify-end"
        onPress={onClose}
      >
        <View className="bg-light-background-primary dark:bg-dark-background-primary rounded-t-[3rem] p-6 pb-12">
          <View className="w-12 h-1.5 bg-gray-300 dark:bg-gray-700 rounded-full self-center mb-6" />
          <Text className="text-xl font-bold text-light-text-primary dark:text-dark-text-primary mb-6 text-center">
            {selectedUser.name}
          </Text>

          {isUserOwner && !selectedUser.isAdmin && !selectedUser.isOwner && (
            <Pressable
              className="py-4 border-b border-gray-100 dark:border-gray-800 active:bg-gray-50 dark:active:bg-gray-900 rounded-xl px-4"
              onPress={() => onMakeAdmin(selectedUser.id)}
            >
              <Text className="text-lg text-light-text-primary dark:text-dark-text-primary text-center">
                Make Admin
              </Text>
            </Pressable>
          )}

          {isUserOwner && selectedUser.isAdmin && (
            <Pressable
              className="py-4 border-b border-gray-100 dark:border-gray-800 active:bg-gray-50 dark:active:bg-gray-900 rounded-xl px-4"
              onPress={() => onDismissAdmin(selectedUser.id)}
            >
              <Text className="text-lg text-light-text-primary dark:text-dark-text-primary text-center">
                Dismiss as Admin
              </Text>
            </Pressable>
          )}

          {/* Owner can remove anyone except self, Admin can remove anyone who is not Owner or Admin */}
          {(isUserOwner && !selectedUser.isOwner) ||
          (isUserAdmin &&
            !isUserOwner &&
            !selectedUser.isOwner &&
            !selectedUser.isAdmin) ? (
            <Pressable
              className="py-4 active:bg-gray-50 dark:active:bg-gray-900 rounded-xl px-4"
              onPress={() => onRemoveMember(selectedUser.id)}
            >
              <Text className="text-lg text-red-500 text-center">
                Remove from Community
              </Text>
            </Pressable>
          ) : null}

          <Pressable
            className="mt-6 py-4 bg-gray-100 dark:bg-gray-800 rounded-3xl"
            onPress={onClose}
          >
            <Text className="text-lg font-semibold text-light-text-primary dark:text-dark-text-primary text-center">
              Cancel
            </Text>
          </Pressable>
        </View>
      </Pressable>
    </Modal>
  );
};

export default MemberActionsModal;
