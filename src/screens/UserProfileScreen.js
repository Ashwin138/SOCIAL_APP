import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, Image, TouchableOpacity, FlatList } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SPACING, SHADOWS, TYPOGRAPHY } from '../constants/theme';
import { getUsers, getCurrentUser, sendFriendRequest, getFriendRequests } from '../utils/storage';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function UserProfileScreen({ route, navigation }) {
  const { username } = route.params;
  const [user, setUser] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);
  const [posts, setPosts] = useState([]);
  const [isFriend, setIsFriend] = useState(false);
  const [requestSent, setRequestSent] = useState(false);

  useEffect(() => {
    loadUserProfile();
  }, []);

  const loadUserProfile = async () => {
    const users = await getUsers();
    const profileUser = users.find(u => u.username === username);
    setUser(profileUser);

    const current = await getCurrentUser();
    setCurrentUser(current);

    // Check if already friends
    const friends = current?.friends || [];
    setIsFriend(friends.includes(username));

    // Check if request already sent
    const requests = await getFriendRequests();
    const hasPendingRequest = requests.some(
      r => r.from === current.username && r.to === username && r.status === 'pending'
    );
    setRequestSent(hasPendingRequest);

    // Load user's posts
    const allPosts = await AsyncStorage.getItem('posts');
    if (allPosts) {
      const parsedPosts = JSON.parse(allPosts);
      const userPosts = parsedPosts.filter(p => p.username === username);
      setPosts(userPosts);
    }
  };

  const handleAddFriend = async () => {
    await sendFriendRequest(currentUser.username, username);
    setRequestSent(true);
  };

  const handleMessage = () => {
    navigation.navigate('Chat', { username });
  };

  const renderPost = ({ item }) => (
    <View style={styles.postCard}>
      {item.imageUri && (
        <Image source={{ uri: item.imageUri }} style={styles.postImage} />
      )}
      <View style={styles.postInfo}>
        <Text style={styles.postCaption} numberOfLines={2}>{item.caption}</Text>
        <View style={styles.postStats}>
          <View style={styles.statItem}>
            <Ionicons name="heart" size={16} color={COLORS.error} />
            <Text style={styles.statText}>{item.likes || 0}</Text>
          </View>
        </View>
      </View>
    </View>
  );

  if (!user) {
    return (
      <View style={styles.container}>
        <Text style={styles.emptyText}>User not found</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          {user.profilePic ? (
            <Image source={{ uri: user.profilePic }} style={styles.profilePic} />
          ) : (
            <View style={styles.profilePicPlaceholder}>
              <Ionicons name="person" size={50} color={COLORS.primary} />
            </View>
          )}
          
          <Text style={styles.displayName}>{user.displayName || user.username}</Text>
          <Text style={styles.username}>@{user.username}</Text>
          
          {user.bio && <Text style={styles.bio}>{user.bio}</Text>}

          <View style={styles.statsContainer}>
            <View style={styles.statBox}>
              <Text style={styles.statNumber}>{posts.length}</Text>
              <Text style={styles.statLabel}>Posts</Text>
            </View>
            <View style={styles.statBox}>
              <Text style={styles.statNumber}>{user.friends?.length || 0}</Text>
              <Text style={styles.statLabel}>Friends</Text>
            </View>
          </View>

          <View style={styles.actionButtons}>
            {!isFriend && !requestSent && (
              <TouchableOpacity style={styles.primaryButton} onPress={handleAddFriend}>
                <Ionicons name="person-add" size={20} color={COLORS.surface} />
                <Text style={styles.buttonText}>Add Friend</Text>
              </TouchableOpacity>
            )}
            
            {requestSent && !isFriend && (
              <View style={styles.pendingButton}>
                <Ionicons name="time" size={20} color={COLORS.textSecondary} />
                <Text style={styles.pendingText}>Request Sent</Text>
              </View>
            )}

            {isFriend && (
              <>
                <TouchableOpacity style={styles.friendButton}>
                  <Ionicons name="checkmark-circle" size={20} color={COLORS.success} />
                  <Text style={styles.friendText}>Friends</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.secondaryButton} onPress={handleMessage}>
                  <Ionicons name="chatbubble" size={20} color={COLORS.primary} />
                  <Text style={styles.secondaryButtonText}>Message</Text>
                </TouchableOpacity>
              </>
            )}
          </View>
        </View>

        <View style={styles.postsSection}>
          <Text style={styles.sectionTitle}>Posts</Text>
          {posts.length === 0 ? (
            <View style={styles.emptyState}>
              <Ionicons name="images-outline" size={64} color={COLORS.textLight} />
              <Text style={styles.emptyText}>No posts yet</Text>
            </View>
          ) : (
            <FlatList
              data={posts}
              renderItem={renderPost}
              keyExtractor={item => item.id}
              numColumns={3}
              scrollEnabled={false}
            />
          )}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    backgroundColor: COLORS.surface,
    alignItems: 'center',
    padding: SPACING.lg,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  profilePic: {
    width: 100,
    height: 100,
    borderRadius: 50,
  },
  profilePicPlaceholder: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: COLORS.background,
    justifyContent: 'center',
    alignItems: 'center',
  },
  displayName: {
    ...TYPOGRAPHY.h2,
    marginTop: SPACING.md,
  },
  username: {
    ...TYPOGRAPHY.body,
    color: COLORS.textSecondary,
    marginTop: SPACING.xs,
  },
  bio: {
    ...TYPOGRAPHY.body,
    color: COLORS.text,
    textAlign: 'center',
    marginTop: SPACING.md,
    paddingHorizontal: SPACING.lg,
  },
  statsContainer: {
    flexDirection: 'row',
    marginTop: SPACING.lg,
    gap: SPACING.xl,
  },
  statBox: {
    alignItems: 'center',
  },
  statNumber: {
    ...TYPOGRAPHY.h3,
    fontWeight: 'bold',
  },
  statLabel: {
    ...TYPOGRAPHY.caption,
    marginTop: SPACING.xs,
  },
  actionButtons: {
    flexDirection: 'row',
    marginTop: SPACING.lg,
    gap: SPACING.sm,
  },
  primaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.primary,
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.sm,
    borderRadius: 8,
    gap: SPACING.xs,
    ...SHADOWS.small,
  },
  secondaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.sm,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: COLORS.primary,
    gap: SPACING.xs,
  },
  friendButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.sm,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: COLORS.success,
    gap: SPACING.xs,
  },
  pendingButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.background,
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.sm,
    borderRadius: 8,
    gap: SPACING.xs,
  },
  buttonText: {
    color: COLORS.surface,
    fontWeight: '600',
    fontSize: 16,
  },
  secondaryButtonText: {
    color: COLORS.primary,
    fontWeight: '600',
    fontSize: 16,
  },
  friendText: {
    color: COLORS.success,
    fontWeight: '600',
    fontSize: 16,
  },
  pendingText: {
    color: COLORS.textSecondary,
    fontWeight: '600',
    fontSize: 16,
  },
  postsSection: {
    padding: SPACING.md,
  },
  sectionTitle: {
    ...TYPOGRAPHY.h3,
    marginBottom: SPACING.md,
  },
  postCard: {
    flex: 1,
    margin: 2,
    aspectRatio: 1,
    backgroundColor: COLORS.surface,
    borderRadius: 8,
    overflow: 'hidden',
  },
  postImage: {
    width: '100%',
    height: '70%',
  },
  postInfo: {
    padding: SPACING.xs,
    height: '30%',
  },
  postCaption: {
    fontSize: 12,
    color: COLORS.text,
  },
  postStats: {
    flexDirection: 'row',
    marginTop: SPACING.xs,
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  statText: {
    fontSize: 12,
    color: COLORS.textSecondary,
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