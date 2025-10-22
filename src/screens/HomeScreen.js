// src/screens/HomeScreen.js (Updated with likes and comments)
import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Image,
  TouchableOpacity,
  RefreshControl,
  Alert,
  Dimensions,
  TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SPACING } from '../constants/theme';
import PostCard from '../components/PostCard';
import { getCurrentUser, getUnreadNotificationCount } from '../utils/storage';

const { width } = Dimensions.get('window');

export default function HomeScreen({ navigation }) {
  const [posts, setPosts] = useState([]);
  const [currentUser, setCurrentUser] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const [commentTexts, setCommentTexts] = useState({}); // For comment inputs per post
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    loadPosts();
  }, []);

  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      loadPosts();
    });
    return unsubscribe;
  }, [navigation]);

  const loadPosts = async () => {
    try {
      const user = await getCurrentUser();
      if (user) {
        setCurrentUser(user);
        // Load unread notification count for this user
        const count = await getUnreadNotificationCount(user.username);
        setUnreadCount(count);
      }

      const storedPosts = await AsyncStorage.getItem('posts');
      if (storedPosts) {
        const parsedPosts = JSON.parse(storedPosts);
        // Sort by timestamp, newest first
        parsedPosts.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
        setPosts(parsedPosts);
      }
    } catch (error) {
      console.error('Error loading posts:', error);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadPosts();
    setRefreshing(false);
  };

  const handleNotifications = () => {
    navigation.navigate('Notifications');
  };

  const handleDeletePost = async (postId) => {
    Alert.alert(
      'Delete Post',
      'Are you sure you want to delete this post?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              const postsJson = await AsyncStorage.getItem('posts');
              if (postsJson) {
                const allPosts = JSON.parse(postsJson);
                const updatedPosts = allPosts.filter(post => post.id !== postId);
                await AsyncStorage.setItem('posts', JSON.stringify(updatedPosts));
                setPosts(updatedPosts);
                Alert.alert('Success', 'Post deleted successfully');
              }
            } catch (error) {
              console.error('Error deleting post:', error);
              Alert.alert('Error', 'Failed to delete post');
            }
          },
        },
      ]
    );
  };

  const handleLike = async (postId) => {
    try {
      const postsJson = await AsyncStorage.getItem('posts');
      if (postsJson) {
        const allPosts = JSON.parse(postsJson);
        const postIndex = allPosts.findIndex(p => p.id === postId);
        if (postIndex !== -1) {
          const post = allPosts[postIndex];
          const likeIndex = post.likes ? post.likes.indexOf(currentUser.id) : -1;
          if (likeIndex === -1) {
            post.likes = [...(post.likes || []), currentUser.id];
          } else {
            post.likes.splice(likeIndex, 1);
          }
          allPosts[postIndex] = post;
          await AsyncStorage.setItem('posts', JSON.stringify(allPosts));
          loadPosts(); // Refresh
        }
      }
    } catch (error) {
      console.error('Error liking post:', error);
    }
  };

  const handleAddComment = async (postId) => {
    const text = commentTexts[postId]?.trim();
    if (!text) return;

    try {
      const postsJson = await AsyncStorage.getItem('posts');
      if (postsJson) {
        const allPosts = JSON.parse(postsJson);
        const postIndex = allPosts.findIndex(p => p.id === postId);
        if (postIndex !== -1) {
          const post = allPosts[postIndex];
          const newComment = {
            id: Date.now().toString(),
            userId: currentUser.id,
            userName: currentUser.username,
            text,
            createdAt: new Date().toISOString(),
          };
          post.comments = [...(post.comments || []), newComment];
          allPosts[postIndex] = post;
          await AsyncStorage.setItem('posts', JSON.stringify(allPosts));
          setCommentTexts({ ...commentTexts, [postId]: '' });
          loadPosts(); // Refresh
        }
      }
    } catch (error) {
      console.error('Error adding comment:', error);
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  const renderComment = (comment) => (
    <View style={styles.comment} key={comment.id}>
      <Text style={styles.commentUser}>{comment.userName}</Text>
      <Text style={styles.commentText}>{comment.text}</Text>
      <Text style={styles.commentTime}>{formatDate(comment.createdAt)}</Text>
    </View>
  );

  const handleComment = (post) => {
    navigation.navigate('Comments', { post });
  };

  const renderPost = ({ item }) => {
    const isOwner = currentUser?.username === item.username;
    return (
      <PostCard
        post={{ ...item, isOwner }}
        currentUsername={currentUser?.username}
        onDelete={handleDeletePost}
        onComment={handleComment}
        navigation={navigation}
      />
    );
  };

  const EmptyComponent = () => (
    <View style={styles.emptyContainer}>
      <Ionicons name="camera-outline" size={80} color="#ccc" />
      <Text style={styles.emptyText}>No posts yet</Text>
      <Text style={styles.emptySubtext}>Be the first to share a photo!</Text>
      <TouchableOpacity
        style={styles.createPostButton}
        onPress={() => navigation.navigate('CreatePost')}
      >
        <Text style={styles.createPostButtonText}>Create Post</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.logo}>PhotoShare</Text>
        <View style={styles.headerIcons}>
          <TouchableOpacity 
            style={styles.iconButton}
            onPress={handleNotifications}
          >
            <Ionicons name="heart-outline" size={26} color={COLORS.text} />
            {unreadCount > 0 && (
              <View style={styles.badge}>
                <Text style={styles.badgeText}>{unreadCount > 9 ? '9+' : unreadCount}</Text>
              </View>
            )}
          </TouchableOpacity>
          <TouchableOpacity 
            style={styles.iconButton}
            onPress={() => navigation.navigate('Messages')}
          >
            <Ionicons name="paper-plane-outline" size={26} color={COLORS.text} />
          </TouchableOpacity>
        </View>
      </View>
      
      <FlatList
        data={posts}
        renderItem={renderPost}
        keyExtractor={(item) => item.id}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[COLORS.primary]} />
        }
        ListEmptyComponent={EmptyComponent}
        contentContainerStyle={posts.length === 0 ? styles.emptyListContainer : { paddingBottom: 120 }}
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
  logo: {
    fontSize: 26,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  headerIcons: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconButton: {
    marginLeft: 20,
    position: 'relative',
  },
  badge: {
    position: 'absolute',
    top: -4,
    right: -6,
    backgroundColor: COLORS.error,
    borderRadius: 10,
    minWidth: 18,
    height: 18,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 4,
  },
  badgeText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: 'bold',
  },
  postContainer: {
    backgroundColor: '#fff',
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#6200EE',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  avatarText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  userName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  timestamp: {
    fontSize: 12,
    color: '#999',
    marginTop: 2,
  },
  postImage: {
    width: width,
    height: width,
    backgroundColor: '#f0f0f0',
  },
  captionContainer: {
    padding: 15,
  },
  caption: {
    fontSize: 15,
    color: '#333',
    lineHeight: 20,
  },
  postActions: {
    flexDirection: 'row',
    paddingHorizontal: 15,
    paddingBottom: 15,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 20,
  },
  actionCount: {
    marginLeft: 5,
    color: '#333',
    fontSize: 14,
  },
  commentsContainer: {
    paddingHorizontal: 15,
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  comment: {
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  commentUser: {
    fontWeight: '600',
    color: '#333',
  },
  commentText: {
    color: '#333',
    marginTop: 2,
  },
  commentTime: {
    fontSize: 12,
    color: '#999',
    marginTop: 2,
  },
  commentInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  commentInput: {
    flex: 1,
    backgroundColor: '#f8f9fa',
    padding: 10,
    borderRadius: 20,
    marginRight: 10,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 50,
  },
  emptyListContainer: {
    flexGrow: 1,
    justifyContent: 'center',
  },
  emptyText: {
    fontSize: 20,
    fontWeight: '600',
    color: '#333',
    marginTop: 20,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#999',
    marginTop: 5,
  },
  createPostButton: {
    marginTop: 20,
    backgroundColor: '#6200EE',
    paddingHorizontal: 30,
    paddingVertical: 12,
    borderRadius: 25,
  },
  createPostButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});