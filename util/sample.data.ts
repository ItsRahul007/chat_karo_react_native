import {
  CommunityCardProps,
  PersonCardProps,
} from "./interfaces/commonInterfaces";
import { I_Story } from "./types/story.types";

export const sampleCommunityData: CommunityCardProps[] = [
  {
    id: "c1",
    name: "React Native Developers",
    lastMessage: "Has anyone tried the new fabric architecture yet?",
    messagedPersonName: "Jordan",
    unreadMessageCount: 5,
    lastMessageTime: "11:20 AM",
    avatar:
      "https://ui-avatars.com/api/?name=React+Native&background=61dafb&color=fff",
    limit: 3, // Optional limit for this specific card
    users: [
      {
        id: "u1",
        name: "Jordan",
        avatar:
          "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&auto=format&fit=crop&q=60",
        isOwner: true,
      },
      {
        id: "u2",
        name: "Alex",
        avatar:
          "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&auto=format&fit=crop&q=60",
      },
      {
        id: "u3",
        name: "Sam",
        isAdmin: true,
        avatar:
          "https://images.unsplash.com/photo-1599566150163-29194dcaad36?w=100&auto=format&fit=crop&q=60",
      },
      {
        id: "u4",
        name: "Taylor",
        avatar:
          "https://images.unsplash.com/photo-1527980965255-d3b416303d12?w=100&auto=format&fit=crop&q=60",
      },
    ],
    messages: [
      {
        id: "cm1-1",
        message: "Hey everyone! Does anyone have experience with Expo Router?",
        sender: "u1",
        senderName: "Jordan",
        avatar:
          "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&auto=format&fit=crop&q=60",
        timestamp: "2026-01-15T10:00:00",
        isRead: true,
      },
      {
        id: "cm1-2",
        message:
          "Yes! I've been using it for my latest project. It's a game changer.",
        sender: "u2",
        senderName: "Alex",
        avatar:
          "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&auto=format&fit=crop&q=60",
        timestamp: "2026-01-15T10:05:00",
        isRead: true,
      },
      {
        id: "cm1-3",
        message: "Check out this screenshot of the deep linking config.",
        sender: "u2",
        senderName: "Alex",
        avatar:
          "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&auto=format&fit=crop&q=60",
        timestamp: "2026-01-15T10:06:00",
        isRead: true,
        media: [
          {
            mediaUrl:
              "https://images.unsplash.com/photo-1555099962-4199c345e5dd?w=500&auto=format&fit=crop&q=60",
            mediaType: "image",
          },
        ],
      },
      {
        id: "cm1-4",
        message: "Has anyone tried the new fabric architecture yet?",
        sender: "u3",
        senderName: "Sam",
        avatar:
          "https://images.unsplash.com/photo-1599566150163-29194dcaad36?w=100&auto=format&fit=crop&q=60",
        timestamp: "2026-01-15T11:20:00",
        isRead: false,
      },
    ],
  },
  {
    id: "c2",
    name: "Weekend Football",
    lastMessage: "I'll bring the extra ball, see you at 5!",
    messagedPersonName: "Mike",
    unreadMessageCount: 0, // No unread badge should show
    lastMessageTime: "4:00 PM",
    avatar:
      "https://www.independent.com.mt/file.aspx?f=167366&width=630&height=340",
    limit: 4,
    users: [
      {
        id: "u5",
        name: "Mike",
        avatar:
          "https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?w=100&auto=format&fit=crop&q=60",
        isAdmin: true,
      },
      {
        id: "u6",
        name: "Chris",
        avatar:
          "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&auto=format&fit=crop&q=60",
      },
      {
        id: "u7",
        name: "Tom",
        avatar:
          "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&auto=format&fit=crop&q=60",
      },
    ],
    messages: [
      {
        id: "cm2-1",
        message: "Who's in for this Saturday?",
        sender: "u5",
        senderName: "Mike",
        avatar:
          "https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?w=100&auto=format&fit=crop&q=60",
        timestamp: "2026-01-14T14:30:00",
        isRead: true,
      },
      {
        id: "cm2-2",
        message: "I'm in! 🙋‍♂️",
        sender: "me",
        senderName: "You",
        avatar: "https://i.pravatar.cc/150?u=me",
        timestamp: "2026-01-14T14:32:00",
        isRead: true,
      },
      {
        id: "cm2-3",
        message: "Look at this goal from last week!",
        sender: "u6",
        senderName: "Chris",
        avatar:
          "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&auto=format&fit=crop&q=60",
        timestamp: "2026-01-14T15:00:00",
        isRead: true,
        media: [
          {
            mediaUrl:
              "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerJoyrides.mp4",
            mediaType: "video",
          },
        ],
      },
      {
        id: "cm2-4",
        message: "Nice! 🔥",
        sender: "u7",
        senderName: "Tom",
        avatar:
          "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&auto=format&fit=crop&q=60",
        timestamp: "2026-01-14T15:05:00",
        isRead: true,
      },
      {
        id: "cm2-5",
        message: "I'll bring the extra ball, see you at 5!",
        sender: "u5",
        senderName: "Mike",
        avatar:
          "https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?w=100&auto=format&fit=crop&q=60",
        timestamp: "2026-01-16T16:00:00",
        isRead: true,
      },
    ],
  },
  {
    id: "c3",
    name: "Design Team",
    lastMessage: "Can we review the Figma prototypes?",
    messagedPersonName: "Sarah",
    unreadMessageCount: 12,
    lastMessageTime: "11:00 AM",
    avatar:
      "https://images.unsplash.com/photo-1561070791-2526d30994b5?w=100&auto=format&fit=crop&q=60",
    // limit is undefined here, your component should use its default
    users: [
      {
        id: "u8",
        name: "Sarah",
        avatar:
          "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100&auto=format&fit=crop&q=60",
        isAdmin: true,
      },
      {
        id: "u9",
        name: "David",
        avatar:
          "https://images.unsplash.com/photo-1633332755192-727a05c4013d?w=100&auto=format&fit=crop&q=60",
      },
      {
        id: "u10",
        name: "Emma",
        avatar:
          "https://images.unsplash.com/photo-1580489944761-15a19d654956?w=100&auto=format&fit=crop&q=60",
      },
      {
        id: "u11",
        name: "James",
        avatar:
          "https://images.unsplash.com/photo-1531427186611-ecfd6d936c79?w=100&auto=format&fit=crop&q=60",
      },
      {
        id: "u12",
        name: "Olivia",
        avatar:
          "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=100&auto=format&fit=crop&q=60",
      },
      {
        id: "u13",
        name: "Daniel",
        avatar:
          "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=100&auto=format&fit=crop&q=60",
      },
    ],
    messages: [
      {
        id: "cm3-1",
        message: "Here are some moodboard ideas",
        sender: "u8",
        senderName: "Sarah",
        avatar:
          "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100&auto=format&fit=crop&q=60",
        timestamp: "2026-01-15T09:00:00",
        isRead: true,
        media: [
          {
            mediaUrl:
              "https://images.unsplash.com/photo-1626785774573-4b799314346d?w=500&auto=format&fit=crop&q=60",
            mediaType: "image",
          },
          {
            mediaUrl:
              "https://images.unsplash.com/photo-1509343256512-d77a5cb3791b?w=500&auto=format&fit=crop&q=60",
            mediaType: "image",
          },
        ],
      },
      {
        id: "cm3-2",
        message: "I love the color palette in the second one!",
        sender: "u9",
        senderName: "David",
        avatar:
          "https://images.unsplash.com/photo-1633332755192-727a05c4013d?w=100&auto=format&fit=crop&q=60",
        timestamp: "2026-01-15T09:10:00",
        isRead: true,
      },
      {
        id: "cm3-3",
        message: "Can we review the Figma prototypes?",
        sender: "u10",
        senderName: "Emma",
        avatar:
          "https://images.unsplash.com/photo-1580489944761-15a19d654956?w=100&auto=format&fit=crop&q=60",
        timestamp: "2026-01-16T11:00:00",
        isRead: false,
      },
    ],
  },
];

export const chatList: PersonCardProps[] = [
  {
    id: "1",
    avatar: "https://i.pravatar.cc/400?u=1",
    name: "Alex Johnson",
    userName: "alex_johnson",
    email: "alex.johnson@example.com",
    lastMessage: "Hey, are we still on for lunch?",
    unreadMessageCount: 2,
    lastMessageTime: "10:30 AM",
    isTyping: false,
    isPined: true,
    messages: [
      {
        id: "m1",
        message: "Hey! How are you doing?",
        sender: "1",
        timestamp: "2026-01-11T09:00:00",
        isRead: true,
      },
      {
        id: "m2",
        message: "I'm doing great! Just finished that project we talked about.",
        sender: "me",
        timestamp: "2026-01-11T09:02:00",
        isRead: true,
      },
      {
        id: "m3",
        message:
          "That's awesome! How did it turn out? aushgdf usah iudsag ciudsg ficgd",
        sender: "1",
        timestamp: "2026-01-11T09:03:00",
        isRead: true,
      },
      {
        id: "m4",
        message:
          "Better than expected! The client loved it. osudhf dshfd sbgfvod sgfuids ficudgs",
        sender: "me",
        timestamp: "2026-01-11T09:05:00",
        isRead: true,
      },
      {
        id: "m5",
        message: "I knew you could do it! 🎉",
        sender: "1",
        timestamp: "2026-01-11T09:06:00",
        isRead: true,
      },
      {
        id: "m6",
        message: "Thanks for the encouragement!",
        sender: "me",
        timestamp: "2026-01-11T09:07:00",
        isRead: true,
      },
      {
        id: "m7",
        message: "So, I was thinking about lunch today...",
        sender: "1",
        timestamp: "2026-01-11T09:15:00",
        isRead: true,
      },
      {
        id: "m8",
        message: "Yeah? What did you have in mind?",
        sender: "me",
        timestamp: "2026-01-11T09:16:00",
        isRead: true,
      },
      {
        id: "m9",
        message: "There's this new Italian place downtown",
        sender: "1",
        timestamp: "2026-01-11T09:17:00",
        isRead: true,
      },
      {
        id: "m10",
        message: "I've heard great things about their pasta!",
        sender: "1",
        timestamp: "2026-01-11T09:17:30",
        isRead: true,
      },
      {
        id: "m11",
        message: "Sounds perfect! I love Italian food 🍝",
        sender: "me",
        timestamp: "2026-01-11T09:18:00",
        isRead: true,
      },
      {
        id: "m12",
        message: "Great! What time works for you?",
        sender: "1",
        timestamp: "2026-01-11T09:20:00",
        isRead: true,
      },
      {
        id: "m13",
        message: "How about 12:30?",
        sender: "me",
        timestamp: "2026-01-11T09:21:00",
        isRead: true,
      },
      {
        id: "m14",
        message: "Perfect timing!",
        sender: "1",
        timestamp: "2026-01-11T09:22:00",
        isRead: true,
      },
      {
        id: "m15",
        message: "Should I make a reservation?",
        sender: "1",
        timestamp: "2026-01-11T09:23:00",
        isRead: true,
      },
      {
        id: "m16",
        message: "Yes please! For 2 people.",
        sender: "me",
        timestamp: "2026-01-11T09:24:00",
        isRead: true,
      },
      {
        id: "m17",
        message: "Done! Just booked it.",
        sender: "1",
        timestamp: "2026-01-11T09:26:00",
        isRead: true,
      },
      {
        id: "m18",
        message: "You're the best! 😊",
        sender: "me",
        timestamp: "2026-01-11T09:27:00",
        isRead: true,
      },
      {
        id: "m19",
        message: "By the way, did you see the game last night?",
        sender: "1",
        timestamp: "2026-01-11T09:30:00",
        isRead: true,
      },
      {
        id: "m20",
        message: "No! I missed it. Who won?",
        sender: "me",
        timestamp: "2026-01-11T09:31:00",
        isRead: true,
      },
      {
        id: "m21",
        message: "Lakers won by 10 points! It was intense.",
        sender: "1",
        timestamp: "2026-01-11T09:32:00",
        isRead: true,
      },
      {
        id: "m22",
        message: "Wow! I should have watched it.",
        sender: "me",
        timestamp: "2026-01-11T09:33:00",
        isRead: true,
      },
      {
        id: "m23",
        message: "",
        sender: "1",
        timestamp: "2026-01-11T09:34:00",
        isRead: true,
        media: [
          {
            mediaUrl:
              "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4",
            mediaType: "video",
          },
        ],
      },
      {
        id: "m24",
        message: "Thanks! That would be great.",
        sender: "me",
        timestamp: "2026-01-11T09:35:00",
        isRead: true,
      },
      {
        id: "m25",
        message: "Also, are you bringing your laptop to lunch?",
        sender: "1",
        timestamp: "2026-01-11T09:40:00",
        isRead: true,
      },
      {
        id: "m26",
        message: "I can if you need me to. Why?",
        sender: "me",
        timestamp: "2026-01-11T09:41:00",
        isRead: true,
      },
      {
        id: "m27",
        message: "I wanted to show you something I've been working on",
        sender: "1",
        timestamp: "2026-01-11T09:42:00",
        isRead: true,
        media: [
          {
            mediaUrl:
              "https://images.unsplash.com/photo-1498050108023-c5249f4df085?w=500&auto=format&fit=crop&q=60",
            mediaType: "image",
          },
          {
            mediaUrl:
              "https://images.unsplash.com/photo-1657598339759-fd1432d833f0?w=500&auto=format&fit=crop&q=60",
            mediaType: "image",
          },
          {
            mediaUrl:
              "https://images.unsplash.com/photo-1767858874498-8fd814ef8548?q=80&w=500&auto=format&fit=crop",
            mediaType: "image",
          },
        ],
      },
      {
        id: "m28",
        message: "Sure! I'll bring it along.",
        sender: "me",
        timestamp: "2026-01-11T09:43:00",
        isRead: true,
        media: [
          {
            mediaUrl:
              "https://images.unsplash.com/photo-1768542142195-283c2bfeaac7?q=80&w=987&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
            mediaType: "image",
          },
        ],
      },
      {
        id: "m29",
        message: "Awesome! See you soon then.",
        sender: "1",
        timestamp: "2026-01-11T09:45:00",
        isRead: true,
      },
      {
        id: "m30",
        message: "Hey, are we still on for lunch?",
        sender: "1",
        timestamp: "2026-01-11T10:30:00",
        isRead: false,
      },
      {
        id: "m31",
        message: "Just confirming the time!",
        sender: "1",
        timestamp: "2026-01-11T10:31:00",
        isRead: false,
        replyTo: {
          id: "m13",
          message: "How about 12:30?",
          sender: "me",
          timestamp: "2026-01-11T09:21:00",
          isRead: true,
        },
      },
    ],
  },
  {
    id: "2",
    avatar: "https://i.pravatar.cc/400?u=2",
    name: "Sarah Williams",
    userName: "sarah_williams",
    email: "sarah.williams@example.com",
    lastMessage: "I just sent over the design files.",
    unreadMessageCount: 0,
    lastMessageTime: "9:15 AM",
    isTyping: true,
    messages: [
      {
        id: "m2-1",
        message: "Hey Sarah, any updates on the design?",
        sender: "me",
        timestamp: "2026-01-11T08:50:00",
        isRead: true,
      },
      {
        id: "m2-2",
        message: "Yes! Check this out.",
        sender: "2",
        timestamp: "2026-01-11T09:00:00",
        isRead: true,
        media: [
          {
            mediaUrl:
              "https://images.unsplash.com/photo-1561070791-2526d30994b5?w=500&auto=format&fit=crop&q=60",
            mediaType: "image",
          },
        ],
      },
      {
        id: "m2-3",
        message: "I just sent over the design files.",
        sender: "2",
        timestamp: "2026-01-11T09:15:00",
        isRead: true,
        media: [
          {
            mediaUrl:
              "https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf",
            mediaType: "file",
          },
        ],
      },
      {
        id: "m2-4",
        message: "Here is a sample audio file for you to check out.",
        sender: "2",
        timestamp: "2026-01-11T09:20:00",
        isRead: true,
        media: [
          {
            mediaUrl:
              "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3",
            mediaType: "audio",
          },
        ],
      },
    ],
  },
  {
    id: "3",
    avatar: "https://i.pravatar.cc/400?u=3",
    name: "Michael Chen",
    userName: "michael_chen",
    email: "michael.chen@example.com",
    lastMessage: "Can you check the PR when you have a sec?",
    unreadMessageCount: 5,
    lastMessageTime: "Yesterday",
    isTyping: false,
  },
  {
    id: "4",
    avatar: "https://i.pravatar.cc/400?u=4",
    name: "Emily Davis",
    userName: "emily_davis",
    email: "emily.davis@example.com",
    lastMessage: "lol that was hilarious 😂",
    lastMessageTime: "Yesterday",
    isTyping: false,
  },
  {
    id: "5",
    avatar: "https://i.pravatar.cc/400?u=5",
    name: "David Miller",
    userName: "david_miller",
    email: "david.miller@example.com",
    lastMessage: "Let me know when you arrive.",
    unreadMessageCount: 1,
    lastMessageTime: "Mon",
    isTyping: false,
  },
  {
    id: "6",
    avatar: "https://i.pravatar.cc/400?u=6",
    name: "Jessica Wilson",
    userName: "jessica_wilson",
    email: "jessica.wilson@example.com",
    lastMessage: "typing...",
    unreadMessageCount: 0,
    lastMessageTime: "Just now",
    isTyping: true,
  },
  {
    id: "7",
    avatar: "https://i.pravatar.cc/400?u=7",
    name: "James Anderson",
    userName: "james_anderson",
    email: "james.anderson@example.com",
    lastMessage: "The meeting has been rescheduled to 3 PM.",
    lastMessageTime: "Sun",
    isTyping: false,
  },
  {
    id: "8",
    avatar: "https://i.pravatar.cc/400?u=8",
    name: "Olivia Martinez",
    userName: "olivia_martinez",
    email: "olivia.martinez@example.com",
    lastMessage: "Thanks so much for your help!",
    unreadMessageCount: 0,
    lastMessageTime: "Oct 25",
    isTyping: false,
  },
  {
    id: "9",
    avatar: "https://i.pravatar.cc/400?u=9",
    name: "William Taylor",
    userName: "william_taylor",
    email: "william.taylor@example.com",
    lastMessage: "Did you watch the game last night?",
    unreadMessageCount: 3,
    lastMessageTime: "Oct 24",
    isTyping: false,
  },
  {
    id: "10",
    avatar: "https://i.pravatar.cc/400?u=10",
    name: "Sophia Thomas",
    userName: "sophia_thomas",
    email: "sophia.thomas@example.com",
    lastMessage: "Sending the invoice now.",
    lastMessageTime: "Oct 22",
    isTyping: false,
  },
  {
    id: "11",
    avatar: "https://i.pravatar.cc/400?u=11",
    name: "Daniel Hernandez",
    userName: "daniel_hernandez",
    email: "daniel.hernandez@example.com",
    lastMessage: "Where is the location?",
    unreadMessageCount: 1,
    lastMessageTime: "11:45 AM",
    isTyping: false,
  },
  {
    id: "12",
    avatar: "https://i.pravatar.cc/400?u=12",
    name: "Isabella Moore",
    userName: "isabella_moore",
    email: "isabella.moore@example.com",
    lastMessage: "Sounds good to me.",
    lastMessageTime: "Yesterday",
    isTyping: false,
  },
  {
    id: "13",
    avatar: "https://i.pravatar.cc/400?u=13",
    name: "Joseph Martin",
    userName: "joseph_martin",
    email: "joseph.martin@example.com",
    lastMessage: "I'll call you in 5 minutes.",
    unreadMessageCount: 0,
    lastMessageTime: "10:05 AM",
    isTyping: true,
  },
  {
    id: "14",
    avatar: "https://i.pravatar.cc/400?u=14",
    name: "Mia Jackson",
    userName: "mia_jackson",
    email: "mia.jackson@example.com",
    lastMessage: "Happy Birthday! 🎂",
    unreadMessageCount: 1,
    lastMessageTime: "Yesterday",
    isTyping: false,
  },
  {
    id: "15",
    avatar: "https://i.pravatar.cc/400?u=15",
    name: "Henry Thompson",
    userName: "henry_thompson",
    email: "henry.thompson@example.com",
    lastMessage: "Please review the attached document.",
    lastMessageTime: "Mon",
    isTyping: false,
  },
  {
    id: "16",
    avatar: "https://i.pravatar.cc/400?u=16",
    name: "Charlotte White",
    userName: "charlotte_white",
    email: "charlotte.white@example.com",
    lastMessage: "See you at the party!",
    unreadMessageCount: 0,
    lastMessageTime: "Fri",
    isTyping: false,
  },
  {
    id: "17",
    avatar: "https://i.pravatar.cc/400?u=17",
    name: "Alexander Lopez",
    userName: "alexander_lopez",
    email: "alexander.lopez@example.com",
    lastMessage: "Do we need to bring anything?",
    unreadMessageCount: 4,
    lastMessageTime: "Thu",
    isTyping: false,
  },
  {
    id: "18",
    avatar: "https://i.pravatar.cc/400?u=18",
    name: "Amelia Lee",
    userName: "amelia_lee",
    email: "amelia.lee@example.com",
    lastMessage: "Okay, got it.",
    lastMessageTime: "Wed",
    isTyping: false,
  },
  {
    id: "19",
    avatar: "https://i.pravatar.cc/400?u=19",
    name: "Benjamin Gonzalez",
    userName: "benjamin_gonzalez",
    email: "benjamin.gonzalez@example.com",
    lastMessage: "Are you free for a quick call?",
    unreadMessageCount: 0,
    lastMessageTime: "Tue",
    isTyping: true,
  },
  {
    id: "20",
    avatar: "https://i.pravatar.cc/400?u=20",
    name: "Harper Harris",
    userName: "harper_harris",
    email: "harper.harris@example.com",
    lastMessage: "No worries, take your time.",
    lastMessageTime: "Mon",
    isTyping: false,
  },
];

export const myStory: I_Story = {
  id: "1",
  name: "You",
  avatar: "https://i.pravatar.cc/150?u=me",
  media: [
    {
      mediaUrl:
        "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&auto=format&fit=crop&q=60",
      mediaType: "image",
      timestamp: "2026-01-14T14:32:00",
    },
    {
      mediaUrl:
        "https://t3.ftcdn.net/jpg/06/16/34/92/360_F_616349295_hw3oZYyNeRrz2s1h2n6x5fBLwHUA4Gpw.jpg",
      mediaType: "image",
      timestamp: "2026-01-14T14:32:00",
    },

    {
      mediaUrl:
        "https://plus.unsplash.com/premium_photo-1664474619075-644dd191935f?w=500&auto=format&fit=crop&q=60",
      mediaType: "image",
      timestamp: "2026-01-28T15:00:00",
    },
  ],
  isSeen: true,
  isHidden: false,
};

export const otherUsersStory: I_Story[] = [
  {
    id: "2",
    name: "John Doe",
    avatar: "https://i.pravatar.cc/150?u=2",
    media: [
      {
        mediaUrl:
          "https://images.unsplash.com/photo-1517841905240-472988babdf9?w=500&auto=format&fit=crop&q=60",
        mediaType: "image",
        timestamp: "2026-01-28T09:00:00",
      },
    ],
    isSeen: false,
    isHidden: false,
  },
  {
    id: "3",
    name: "Jane Smith",
    avatar: "https://i.pravatar.cc/150?u=3",
    media: [
      {
        mediaUrl:
          "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=500&auto=format&fit=crop&q=60",
        mediaType: "image",
        timestamp: "2026-01-28T10:30:00",
      },
      {
        mediaUrl:
          "https://images.unsplash.com/photo-1517487881594-2787fef5ebf7?w=500&auto=format&fit=crop&q=60",
        mediaType: "image",
        timestamp: "2026-01-28T10:35:00",
      },
    ],
    isSeen: false,
    isHidden: false,
  },
  {
    id: "4",
    name: "Mike Ross",
    avatar: "https://i.pravatar.cc/150?u=4",
    media: [
      {
        mediaUrl:
          "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=500&auto=format&fit=crop&q=60",
        mediaType: "image",
        timestamp: "2026-01-28T11:00:00",
      },
    ],
    isSeen: true,
    isHidden: false,
  },
  {
    id: "5",
    name: "Rachel Zane",
    avatar: "https://i.pravatar.cc/150?u=5",
    media: [
      {
        mediaUrl:
          "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=500&auto=format&fit=crop&q=60",
        mediaType: "image",
        timestamp: "2026-01-28T12:00:00",
      },
    ],
    isSeen: false,
    isHidden: false,
  },
  {
    id: "6",
    name: "Harvey Specter",
    avatar: "https://i.pravatar.cc/150?u=6",
    media: [
      {
        mediaUrl:
          "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=500&auto=format&fit=crop&q=60",
        mediaType: "image",
        timestamp: "2026-01-28T14:00:00",
      },
      {
        mediaUrl:
          "https://images.unsplash.com/photo-1522075469751-3a3694c60e9e?w=500&auto=format&fit=crop&q=60",
        mediaType: "image",
        timestamp: "2026-01-28T14:10:00",
      },
    ],
    isSeen: true,
    isHidden: false,
  },
];
