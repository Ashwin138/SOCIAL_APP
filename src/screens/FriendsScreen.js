import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Image, TextInput, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SPACING, SHADOWS } from '../constants/theme';
import { getUsers, getCurrentUser, getFriendRequests, sendFriendRequest, acceptFriendRequest, rejectFriendRequest } from '../utils/storage';

export default function FriendsScreen({ navigation }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [users, setUsers] = useState([]);
  const [friendRequests, setFriendRequests] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('all');

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      loadData();
    });
    return unsubscribe;
  }, [navigation]);

  const loadData = async () => {
    const user = await getCurrentUser();
    setCurrentUser(user);
    
    const allUsers = await getUsers();
    const filteredUsers = allUsers.filter(u => u.username !== user?.username);
    setUsers(filteredUsers);
    
    const requests = await getFriendRequests();
    const myRequests = requests.filter(r => r.to === user?.username && r.status === 'pending');
    setFriendRequests(myRequests);
  };

  const handleSendRequest = async (username) => {
    try {
      await sendFriendRequest(currentUser.username, username);
      Alert.alert('Success', 'Friend request sent!');
      loadData();
    } catch (error) {
      Alert.alert('Error', 'Failed to send friend request');
    }
  };

  const handleAcceptRequest = async (requestId) => {
    try {
      await acceptFriendRequest(requestId);
      Alert.alert('Success', 'Friend request accepted!');
      loadData();
    } catch (error) {
      Alert.alert('Error', 'Failed to accept friend request');
    }
  };

  const handleRejectRequest = async (requestId) => {
    try {
      await rejectFriendRequest(requestId);
      loadData();
    } catch (error) {
      Alert.alert('Error', 'Failed to reject friend request');
    }
  };

  const handleMessage = (username) => {
    navigation.navigate('Chat', { username });
  };

  const filteredUsers = users.filter(user => {
    const matchesSearch = user.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         (user.displayName || '').toLowerCase().includes(searchQuery.toLowerCase());
    
    if (activeTab === 'friends') {
      return matchesSearch && currentUser?.friends?.includes(user.username);
    }
    
    return matchesSearch;
  });

  const renderUser = ({ item }) => {
    const isFriend = currentUser?.friends?.includes(item.username);
    const hasPendingRequest = friendRequests.some(r => r.from === item.username);
    
    return (
      <TouchableOpacity 
        style={styles.userCard}
        onPress={() => navigation.navigate('UserProfile', { username: item.username })}
      >
        <View style={styles.userInfo}>
          {item.profilePic ? (
            <Image source={{ uri: item.profilePic }} style={styles.avatar} />
          ) : (
            <View style={styles.avatarPlaceholder}>
              <Ionicons name="person" size={24} color={COLORS.primary} />
            </View>
          )}
          <View style={styles.userDetails}>
            <Text style={styles.displayName}>{item.displayName || item.username}</Text>
            <Text style={styles.username}>@{item.username}</Text>
            {item.bio && <Text style={styles.bio} numberOfLines={1}>{item.bio}</Text>}
          </View>
        </View>
        
        <View style={styles.actionButtons}>
          {isFriend ? (
            <>
              <TouchableOpacity
                style={styles.messageButton}
                onPress={() => handleMessage(item.username)}
              >
                <Ionicons name="chatbubble" size={20} color={COLORS.surface} />
              </TouchableOpacity>
              <Ionicons name="checkmark-circle" size={24} color={COLORS.success} />
            </>
          ) : !hasPendingRequest ? (
            <TouchableOpacity
              style={styles.addButton}
              onPress={() => handleSendRequest(item.username)}
            >
              <Ionicons name="person-add" size={20} color={COLORS.primary} />
            </TouchableOpacity>
          ) : (
            <Text style={styles.pendingText}>Pending</Text>
          )}
        </View>
      </TouchableOpacity>
    );
  };

  const renderRequest = ({ item }) => {
    const user = users.find(u => u.username === item.from);
    if (!user) return null;
    
    return (
      <View style={styles.requestCard}>
        <TouchableOpacity 
          style={styles.userInfo}
          onPress={() => navigation.navigate('UserProfile', { username: user.username })}
        >
          {user.profilePic ? (
            <Image source={{ uri: user.profilePic }} style={styles.avatar} />
          ) : (
            <View style={styles.avatarPlaceholder}>
              <Ionicons name="person" size={24} color={COLORS.primary} />
            </View>
          )}
          <View style={styles.userDetails}>
            <Text style={styles.displayName}>{user.displayName || user.username}</Text>
            <Text style={styles.username}>@{user.username}</Text>
            <Text style={styles.requestLabel}>wants to be friends</Text>
          </View>
        </TouchableOpacity>
        
        <View style={styles.requestActions}>
          <TouchableOpacity
            style={[styles.actionButton, styles.acceptButton]}
            onPress={() => handleAcceptRequest(item.id)}
          >
            <Text style={styles.actionButtonText}>Accept</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.actionButton, styles.rejectButton]}
            onPress={() => handleRejectRequest(item.id)}
          >
            <Text style={styles.actionButtonText}>Delete</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Friends</Text>
      </View>

      <View style={styles.searchContainer}>
        <Ionicons name="search" size={20} color={COLORS.textLight} style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search users..."
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholderTextColor={COLORS.textLight}
        />
      </View>

      <View style={styles.tabs}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'all' && styles.activeTab]}
          onPress={() => setActiveTab('all')}
        >
          <Text style={[styles.tabText, activeTab === 'all' && styles.activeTabText]}>
            Suggestions
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'friends' && styles.activeTab]}
          onPress={() => setActiveTab('friends')}
        >
          <Text style={[styles.tabText, activeTab === 'friends' && styles.activeTabText]}>
            Friends ({currentUser?.friends?.length || 0})
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'requests' && styles.activeTab]}
          onPress={() => setActiveTab('requests')}
        >
          <Text style={[styles.tabText, activeTab === 'requests' && styles.activeTabText]}>
            Requests {friendRequests.length > 0 && `(${friendRequests.length})`}
          </Text>
        </TouchableOpacity>
      </View>

      {activeTab === 'requests' ? (
        <FlatList
          data={friendRequests}
          renderItem={renderRequest}
          keyExtractor={item => item.id}
          contentContainerStyle={[styles.list, { paddingBottom: 120 }]}
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <Ionicons name="people-outline" size={64} color={COLORS.textLight} />
              <Text style={styles.emptyText}>No friend requests</Text>
            </View>
          }
        />
      ) : (
        <FlatList
          data={filteredUsers}
          renderItem={renderUser}
          keyExtractor={item => item.username}
          contentContainerStyle={[styles.list, { paddingBottom: 120 }]}
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <Ionicons name="people-outline" size={64} color={COLORS.textLight} />
              <Text style={styles.emptyText}>
                {activeTab === 'friends' ? 'No friends yet' : 'No users found'}
              </Text>
            </View>
          }
        />
      )}
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
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    margin: SPACING.md,
    paddingHorizontal: SPACING.md,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  searchIcon: {
    marginRight: SPACING.sm,
  },
  searchInput: {
    flex: 1,
    paddingVertical: 12,
    fontSize: 16,
    color: COLORS.text,
  },
  tabs: {
    flexDirection: 'row',
    backgroundColor: COLORS.surface,
    marginHorizontal: SPACING.md,
    borderRadius: 8,
    padding: 4,
    marginBottom: SPACING.md,
  },
  tab: {
    flex: 1,
    paddingVertical: SPACING.sm,
    alignItems: 'center',
    borderRadius: 6,
  },
  activeTab: {
    backgroundColor: COLORS.primary,
  },
  tabText: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.textSecondary,
  },
  activeTabText: {
    color: COLORS.surface,
  },
  list: {
    padding: SPACING.md,
  },
  userCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: COLORS.surface,
    padding: SPACING.md,
    borderRadius: 12,
    marginBottom: SPACING.sm,
    ...SHADOWS.small,
  },
  requestCard: {
    backgroundColor: COLORS.surface,
    padding: SPACING.md,
    borderRadius: 12,
    marginBottom: SPACING.sm,
    ...SHADOWS.small,
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
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
  userDetails: {
    marginLeft: SPACING.md,
    flex: 1,
  },
  displayName: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text,
  },
  username: {
    fontSize: 14,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  bio: {
    fontSize: 12,
    color: COLORS.textLight,
    marginTop: 4,
  },
  requestLabel: {
    fontSize: 13,
    color: COLORS.textSecondary,
    marginTop: 4,
  },
  actionButtons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  addButton: {
    padding: SPACING.sm,
  },
  messageButton: {
    backgroundColor: COLORS.primary,
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  pendingText: {
    fontSize: 13,
    color: COLORS.textLight,
    fontWeight: '600',
  },
  requestActions: {
    flexDirection: 'row',
    gap: SPACING.sm,
    marginTop: SPACING.md,
  },
  actionButton: {
    flex: 1,
    paddingVertical: SPACING.sm,
    borderRadius: 8,
    alignItems: 'center',
  },
  acceptButton: {
    backgroundColor: COLORS.primary,
  },
  rejectButton: {
    backgroundColor: COLORS.background,
  },
  actionButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.text,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SPACING.xl * 2,
  },
  emptyText: {
    fontSize: 16,
    color: COLORS.textLight,
    marginTop: SPACING.md,
  },
});