import { AvatarGroupProps } from '@/util/interfaces/commonInterfaces';
import React from 'react';
import { View, Text, Image } from 'react-native';

const AvatarGroup = ({ users, limit = 4 }: AvatarGroupProps) => {
  // 1. Logic to slice data
  const usersToShow = users.slice(0, limit);
  const excessCount = users.length - limit;

  const avatarClass = "w-12 h-12 rounded-full border-[3px] border-light-comunityCard-background dark:border-dark-comunityCard-background";

  return (
    <View className="flex-row items-center">
      {usersToShow.map((user, index) => (
        <Image
          key={user.id}
          source={{ uri: user.uri }}
          className={`
            ${avatarClass}
            ${index !== 0 ? `-ml-3` : ''} 
          `}
          style={{ zIndex: limit - index }}
        />
      ))}

      {excessCount > 0 && (
        <View
          className={`
            ${avatarClass} 
            -ml-3 z-0
            bg-indigo-900 justify-center items-center
          `}
        >
          <Text className="text-white font-bold text-lg">
            +{excessCount}
          </Text>
        </View>
      )}
    </View>
  );
};

export default AvatarGroup;