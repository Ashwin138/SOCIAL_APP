import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Image, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SPACING } from '../constants/theme';
import { getNotifications, markNotificationAsRead, markAllNotificationsAsRead } from '../utils/storage';

export default function NotificationsScreen({ navigation }) {
  const [notifications, setNotifications] = useState([]);
  const [refreshing, setRefreshing] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);

  useEffect(() => {
    loadCurrentUser();
  }, []);

  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      loadNotifications();
    });
    return unsubscribe;
  }, [navigation]);

  const loadCurrentUser = async () => {
    const { getCurrentUser } = require('../utils/storage');
    const user = await getCurrentUser();
    setCurrentUser(user);
    if (user) {
      loadNotifications(user.username);
    }
  };

  const loadNotifications = async (username) => {
    const user = username || currentUser?.username;
    if (!user) return;
    
    const data = await getNotifications();
    // Filter notifications for current user only
    const myNotifications = data.filter(n => n.to === user);
    setNotifications(myNotifications);
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadNotifications(currentUser?.username);
    setRefreshing(false);
  };

  const handleNotificationPress = async (notification) => {
    await markNotificationAsRead(notification.id);
    
    // Navigate based on notification type
    if (notification.type === 'like' || notification.type === 'comment') {
      if (notification.postId && notification.postData) {
        // Navigate directly to the post's comments screen
        navigation.navigate('Comments', { post: notification.postData });
      } else {
        navigation.navigate('Home');
      }
    } else if (notification.type === 'friend_request') {
      navigation.navigate('Friends');
    } else if (notification.type === 'message') {
      navigation.navigate('Messages');
    }
    
    loadNotifications(currentUser?.username);
  };

  const handleMarkAllAsRead = async () => {
    await markAllNotificationsAsRead();
    loadNotifications(currentUser?.username);
  };

  const formatTimestamp = (timestamp) => {
    try {
      const date = new Date(timestamp);
      const now = new Date();
      const diffMs = now - date;
      const diffMins = Math.floor(diffMs / 60000);
      const diffHours = Math.floor(diffMs / 3600000);
      const diffDays = Math.floor(diffMs / 86400000);

      if (diffMins < 1) return 'Just now';
      if (diffMins < 60) return `${diffMins}m ago`;
      if (diffHours < 24) return `${diffHours}h ago`;
      if (diffDays < 7) return `${diffDays}d ago`;
      
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    } catch (error) {
      return 'Recently';
    }
  };

  const getNotificationIcon = (type) => {
    switch (type) {
      case 'like':
        return { name: 'heart', color: COLORS.error };
      case 'comment':
        return { name: 'chatbubble', color: COLORS.primary };
      case 'friend_request':
        return { name: 'person-add', color: COLORS.success };
      case 'message':
        return { name: 'mail', color: COLORS.primary };
      default:
        return { name: 'notifications', color: COLORS.text };
    }
  };

  const renderNotification = ({ item }) => {
    const icon = getNotificationIcon(item.type);
    
    return (
      <TouchableOpacity
        style={[styles.notificationCard, !item.read && styles.unreadCard]}
        onPress={() => handleNotificationPress(item)}
      >
        <View style={[styles.iconContainer, { backgroundColor: icon.color + '20' }]}>
          <Ionicons name={icon.name} size={24} color={icon.color} />
        </View>
        
        <View style={styles.notificationContent}>
          <Text style={styles.notificationText}>
            <Text style={styles.username}>{item.from}</Text>
            {' '}
            {item.message}
          </Text>
          <Text style={styles.timestamp}>{formatTimestamp(item.timestamp)}</Text>
        </View>
        
        {!item.read && <View style={styles.unreadDot} />}
      </TouchableOpacity>
    );
  };

  const EmptyComponent = () => (
    <View style={styles.emptyState}>
      <Ionicons name="notifications-outline" size={80} color={COLORS.textLight} />
      <Text style={styles.emptyText}>No notifications yet</Text>
      <Text style={styles.emptySubtext}>You'll see notifications for likes, comments, and friend requests here</Text>
    </View>
  );

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color={COLORS.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Notifications</Text>
        {notifications.some(n => !n.read) && (
          <TouchableOpacity onPress={handleMarkAllAsRead}>
            <Text style={styles.markAllRead}>Mark all read</Text>
          </TouchableOpacity>
        )}
        {!notifications.some(n => !n.read) && <View style={{ width: 80 }} />}
      </View>
      
      <FlatList
        data={notifications}
        renderItem={renderNotification}
        keyExtractor={(item) => item.id}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[COLORS.primary]} />
        }
        ListEmptyComponent={EmptyComponent}
        contentContainerStyle={notifications.length === 0 ? styles.emptyListContainer : { paddingBottom: 100 }}
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
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.md,
    paddingVertical: 12,
    backgroundColor: COLORS.background,
    borderBottomWidth: 0.5,
    borderBottomColor: COLORS.border,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  markAllRead: {
    fontSize: 14,
    color: COLORS.primary,
    fontWeight: '600',
  },
  notificationCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: SPACING.md,
    backgroundColor: COLORS.surface,
    borderBottomWidth: 0.5,
    borderBottomColor: COLORS.border,
  },
  unreadCard: {
    backgroundColor: COLORS.surfaceLight,
  },
  iconContainer: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SPACING.md,
  },
  notificationContent: {
    flex: 1,
  },
  notificationText: {
    fontSize: 15,
    color: COLORS.text,
    lineHeight: 20,
  },
  username: {
    fontWeight: '600',
    color: COLORS.text,
  },
  timestamp: {
    fontSize: 13,
    color: COLORS.textLight,
    marginTop: 4,
  },
  unreadDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: COLORS.primary,
    marginLeft: SPACING.sm,
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SPACING.xl * 3,
  },
  emptyListContainer: {
    flex: 1,
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
    textAlign: 'center',
    paddingHorizontal: SPACING.xl,
  },
});
