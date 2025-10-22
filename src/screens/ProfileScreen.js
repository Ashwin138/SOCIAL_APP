// src/screens/ProfileScreen.js (Instagram-inspired dark theme)
import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image, Alert, FlatList, Dimensions, Share } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { COLORS, SPACING, TYPOGRAPHY } from '../constants/theme';
import CustomButton from '../components/CustomButton';

const { width } = Dimensions.get('window');
const ITEM_SIZE = (width - 6) / 3;

export default function ProfileScreen({ navigation, setIsLoggedIn }) {
  const [user, setUser] = useState(null);
  const [posts, setPosts] = useState([]);

  useEffect(() => {
    loadUserData();
  }, []);

  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      loadUserData();
    });
    return unsubscribe;
  }, [navigation]);

  const loadUserData = async () => {
    try {
      const currentUser = await AsyncStorage.getItem('currentUser');
      if (currentUser) {
        const userData = JSON.parse(currentUser);
        setUser(userData);

        const storedPosts = await AsyncStorage.getItem('posts');
        if (storedPosts) {
          const allPosts = JSON.parse(storedPosts);
          const userPosts = allPosts.filter(post => post.username === userData.username);
          // Sort by newest first
          userPosts.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
          setPosts(userPosts);
        }
      }
    } catch (error) {
      console.error('Error loading user data:', error);
    }
  };

  const handleLogout = () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Logout',
          style: 'destructive',
          onPress: async () => {
            await AsyncStorage.removeItem('currentUser');
            setIsLoggedIn(false);
          },
        },
      ]
    );
  };

  const handleShareProfile = async () => {
    try {
      await Share.share({
        message: `Check out ${user?.displayName || user?.username}'s profile on PhotoShare!`,
        title: 'Share Profile',
      });
    } catch (error) {
      console.error('Error sharing profile:', error);
    }
  };

  const renderPost = ({ item }) => (
    <TouchableOpacity 
      style={styles.postCard}
      onPress={() => navigation.navigate('Comments', { post: item })}
    >
      {item.imageUri ? (
        <Image source={{ uri: item.imageUri }} style={styles.postImage} />
      ) : (
        <View style={[styles.postImage, styles.noImagePost]}>
          <Text style={styles.noImageText} numberOfLines={3}>{item.caption}</Text>
        </View>
      )}
      <View style={styles.postOverlay}>
        <View style={styles.postStats}>
          <Ionicons name="heart" size={20} color="#fff" />
          <Text style={styles.postStatText}>{item.likes || 0}</Text>
        </View>
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Ionicons name="lock-closed" size={14} color={COLORS.text} style={{ marginRight: 6 }} />
          <Text style={styles.headerTitle}>{user?.username || 'Profile'}</Text>
          <Ionicons name="chevron-down" size={16} color={COLORS.text} style={{ marginLeft: 4 }} />
        </View>
        <View style={styles.headerRight}>
          <TouchableOpacity 
            style={styles.headerIcon}
            onPress={() => navigation.navigate('CreatePost')}
          >
            <Ionicons name="add-circle-outline" size={26} color={COLORS.text} />
          </TouchableOpacity>
          <TouchableOpacity 
            style={styles.headerIcon} 
            onPress={handleLogout}
          >
            <Ionicons name="menu-outline" size={28} color={COLORS.text} />
          </TouchableOpacity>
        </View>
      </View>

      <FlatList
        data={posts}
        renderItem={renderPost}
        keyExtractor={item => item.id}
        numColumns={3}
        ListHeaderComponent={
          <View style={styles.profileSection}>
            <View style={styles.profileHeader}>
              {user?.profilePic ? (
                <Image source={{ uri: user.profilePic }} style={styles.profilePic} />
              ) : (
                <View style={styles.profilePicPlaceholder}>
                  <Ionicons name="person" size={50} color={COLORS.primary} />
                </View>
              )}
              
              <View style={styles.statsContainer}>
                <View style={styles.statBox}>
                  <Text style={styles.statNumber}>{posts.length}</Text>
                  <Text style={styles.statLabel}>Posts</Text>
                </View>
                <View style={styles.statBox}>
                  <Text style={styles.statNumber}>{user?.friends?.length || 0}</Text>
                  <Text style={styles.statLabel}>Friends</Text>
                </View>
                <View style={styles.statBox}>
                  <Text style={styles.statNumber}>0</Text>
                  <Text style={styles.statLabel}>Following</Text>
                </View>
              </View>
            </View>

            <View style={styles.profileInfo}>
              <Text style={styles.displayName}>{user?.displayName || user?.username}</Text>
              {user?.bio && <Text style={styles.bio}>{user.bio}</Text>}
            </View>

            <View style={styles.actionButtons}>
              <TouchableOpacity 
                style={styles.editButton}
                onPress={() => navigation.navigate('EditProfile')}
              >
                <Text style={styles.editButtonText}>Edit Profile</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={styles.shareButton}
                onPress={handleShareProfile}
              >
                <Text style={styles.editButtonText}>Share Profile</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={styles.discoverButton}
                onPress={() => navigation.navigate('Friends')}
              >
                <Ionicons name="person-add-outline" size={18} color={COLORS.text} />
              </TouchableOpacity>
            </View>

            <View style={styles.postsHeader}>
              <Ionicons name="grid-outline" size={20} color={COLORS.text} />
              <Text style={styles.postsHeaderText}>POSTS</Text>
            </View>
          </View>
        }
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Ionicons name="camera-outline" size={64} color={COLORS.textLight} />
            <Text style={styles.emptyText}>No posts yet</Text>
            <Text style={styles.emptySubtext}>Start sharing your moments!</Text>
          </View>
        }
        contentContainerStyle={styles.listContent}
        columnWrapperStyle={posts.length > 0 ? styles.row : null}
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
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: COLORS.background,
    paddingHorizontal: SPACING.md,
    paddingVertical: 12,
    borderBottomWidth: 0.5,
    borderBottomColor: COLORS.border,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerIcon: {
    marginLeft: 20,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.text,
  },
  listContent: {
    paddingBottom: 120, // Space for bottom tab bar
  },
  profileSection: {
    backgroundColor: COLORS.background,
    paddingBottom: SPACING.md,
  },
  profileHeader: {
    flexDirection: 'row',
    paddingHorizontal: SPACING.md,
    paddingTop: SPACING.md,
    alignItems: 'center',
  },
  profilePic: {
    width: 86,
    height: 86,
    borderRadius: 43,
    borderWidth: 2,
    borderColor: COLORS.border,
  },
  profilePicPlaceholder: {
    width: 86,
    height: 86,
    borderRadius: 43,
    backgroundColor: COLORS.surfaceLight,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: COLORS.border,
  },
  statsContainer: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingLeft: SPACING.lg,
  },
  statBox: {
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  statLabel: {
    fontSize: 13,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  profileInfo: {
    paddingHorizontal: SPACING.md,
    marginBottom: SPACING.md,
  },
  displayName: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: SPACING.xs,
  },
  bio: {
    fontSize: 14,
    color: COLORS.text,
    lineHeight: 20,
  },
  actionButtons: {
    flexDirection: 'row',
    paddingHorizontal: SPACING.md,
    gap: 8,
    marginBottom: SPACING.md,
  },
  editButton: {
    flex: 1,
    backgroundColor: COLORS.surfaceLight,
    paddingVertical: 8,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  shareButton: {
    flex: 1,
    backgroundColor: COLORS.surfaceLight,
    paddingVertical: 8,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  discoverButton: {
    backgroundColor: COLORS.surfaceLight,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  editButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.text,
  },
  postsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderTopWidth: 0.5,
    borderTopColor: COLORS.border,
    gap: SPACING.xs,
  },
  postsHeaderText: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.textSecondary,
    letterSpacing: 1,
  },
  row: {
    gap: 2,
  },
  postCard: {
    width: ITEM_SIZE,
    height: ITEM_SIZE,
    position: 'relative',
    backgroundColor: COLORS.surfaceLight,
  },
  postImage: {
    width: '100%',
    height: '100%',
    backgroundColor: COLORS.surfaceLight,
  },
  noImagePost: {
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING.sm,
  },
  noImageText: {
    fontSize: 12,
    color: COLORS.textSecondary,
    textAlign: 'center',
  },
  postOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.3)',
    opacity: 0,
  },
  postStats: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    marginTop: ITEM_SIZE / 2 - 15,
  },
  postStatText: {
    color: '#fff',
    fontSize: 16,
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