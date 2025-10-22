import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SPACING } from '../constants/theme';
import { getCurrentUser, getMessages, getUsers } from '../utils/storage';

export default function MessagesScreen({ navigation }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [conversations, setConversations] = useState([]);

  useEffect(() => {
    loadConversations();
  }, []);

  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      loadConversations();
    });
    return unsubscribe;
  }, [navigation]);

  const loadConversations = async () => {
    try {
      const user = await getCurrentUser();
      if (!user) return;
      
      setCurrentUser(user);
      
      const messages = await getMessages();
      const users = await getUsers();
      
      // Get unique conversations
      const conversationMap = new Map();
      
      messages.forEach(msg => {
        if (msg.from === user.username || msg.to === user.username) {
          const otherUser = msg.from === user.username ? msg.to : msg.from;
          
          if (!conversationMap.has(otherUser) || new Date(msg.timestamp) > new Date(conversationMap.get(otherUser).timestamp)) {
            conversationMap.set(otherUser, msg);
          }
        }
      });
      
      // Convert to array and add user details
      const conversationList = Array.from(conversationMap.entries()).map(([username, lastMessage]) => {
        const otherUserData = users.find(u => u.username === username);
        const unreadCount = messages.filter(m => m.from === username && m.to === user.username && !m.read).length;
        
        return {
          username,
          displayName: otherUserData?.displayName || username,
          profilePic: otherUserData?.profilePic,
          lastMessage: lastMessage.text,
          timestamp: lastMessage.timestamp,
          unreadCount,
        };
      });
      
      // Sort by timestamp
      conversationList.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
      
      setConversations(conversationList);
    } catch (error) {
      console.error('Error loading conversations:', error);
    }
  };

  const renderConversation = ({ item }) => (
    <TouchableOpacity
      style={styles.conversationCard}
      onPress={() => navigation.navigate('Chat', { username: item.username })}
    >
      {item.profilePic ? (
        <Image source={{ uri: item.profilePic }} style={styles.avatar} />
      ) : (
        <View style={styles.avatarPlaceholder}>
          <Ionicons name="person" size={24} color={COLORS.primary} />
        </View>
      )}
      
      <View style={styles.conversationInfo}>
        <View style={styles.conversationHeader}>
          <Text style={styles.displayName}>{item.displayName}</Text>
          <Text style={styles.timestamp}>
            {new Date(item.timestamp).toLocaleDateString('en-US', {
              month: 'short',
              day: 'numeric',
            })}
          </Text>
        </View>
        
        <View style={styles.messagePreview}>
          <Text
            style={[styles.lastMessage, item.unreadCount > 0 && styles.unreadMessage]}
            numberOfLines={1}
          >
            {item.lastMessage}
          </Text>
          {item.unreadCount > 0 && (
            <View style={styles.unreadBadge}>
              <Text style={styles.unreadText}>{item.unreadCount}</Text>
            </View>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Messages</Text>
      </View>

      <FlatList
        data={conversations}
        renderItem={renderConversation}
        keyExtractor={item => item.username}
        contentContainerStyle={[styles.list, { paddingBottom: 120 }]}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Ionicons name="chatbubbles-outline" size={64} color={COLORS.textLight} />
            <Text style={styles.emptyText}>No messages yet</Text>
            <Text style={styles.emptySubtext}>Start chatting with your friends!</Text>
          </View>
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    backgroundColor: COLORS.surface,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  list: {
    padding: SPACING.sm,
  },
  conversationCard: {
    flexDirection: 'row',
    backgroundColor: COLORS.surface,
    padding: SPACING.md,
    borderRadius: 12,
    marginBottom: SPACING.sm,
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
  },
  avatarPlaceholder: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: COLORS.background,
    justifyContent: 'center',
    alignItems: 'center',
  },
  conversationInfo: {
    flex: 1,
    marginLeft: SPACING.md,
  },
  conversationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.xs,
  },
  displayName: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text,
  },
  timestamp: {
    fontSize: 12,
    color: COLORS.textLight,
  },
  messagePreview: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  lastMessage: {
    fontSize: 14,
    color: COLORS.textSecondary,
    flex: 1,
  },
  unreadMessage: {
    fontWeight: '600',
    color: COLORS.text,
  },
  unreadBadge: {
    backgroundColor: COLORS.primary,
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: SPACING.sm,
    paddingHorizontal: 6,
  },
  unreadText: {
    color: COLORS.surface,
    fontSize: 12,
    fontWeight: 'bold',
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SPACING.xl * 3,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.textSecondary,
    marginTop: SPACING.md,
  },
  emptySubtext: {
    fontSize: 14,
    color: COLORS.textLight,
    marginTop: SPACING.xs,
  },
});