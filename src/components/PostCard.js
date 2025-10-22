import React, { useState, useEffect } from 'react';
import { View, Text, Image, StyleSheet, TouchableOpacity, Alert, Share, ScrollView, Dimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SPACING, TYPOGRAPHY } from '../constants/theme';
import { toggleLike, getPostLikes, isPostLiked, getPostComments, addNotification, getUserByUsername } from '../utils/storage';

const { width } = Dimensions.get('window');

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

export default function PostCard({ post, currentUsername, onDelete, onComment, navigation }) {
  const [isLiked, setIsLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(0);
  const [commentCount, setCommentCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [userProfilePic, setUserProfilePic] = useState(null);
  
  const images = post.images || (post.imageUri ? [post.imageUri] : []);

  useEffect(() => {
    loadPostData();
    loadUserProfile();
  }, [post.id, post.username]);

  const loadPostData = async () => {
    try {
      // Load likes
      const liked = await isPostLiked(post.id, currentUsername);
      setIsLiked(liked);
      
      const likes = await getPostLikes(post.id);
      setLikeCount(likes.length);

      // Load comments
      const comments = await getPostComments(post.id);
      setCommentCount(comments.length);
    } catch (error) {
      console.error('Error loading post data:', error);
    }
  };

  const loadUserProfile = async () => {
    try {
      const user = await getUserByUsername(post.username);
      if (user && user.profilePic) {
        setUserProfilePic(user.profilePic);
      }
    } catch (error) {
      console.error('Error loading user profile:', error);
    }
  };

  const handleLike = async () => {
    if (loading) return;
    
    setLoading(true);
    try {
      const newLiked = await toggleLike(post.id, currentUsername);
      setIsLiked(newLiked);
      setLikeCount(prev => newLiked ? prev + 1 : prev - 1);
      
      // Send notification if liked and it's not own post
      if (newLiked && post.username !== currentUsername) {
        await addNotification({
          type: 'like',
          from: currentUsername,
          to: post.username,
          message: 'liked your post',
          postId: post.id,
          postData: post, // Include full post data for navigation
        });
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to like post');
    } finally {
      setLoading(false);
    }
  };

  const handleComment = () => {
    if (onComment) {
      onComment(post);
    }
  };

  const handleShare = async () => {
    try {
      const result = await Share.share({
        message: `Check out this post by ${post.username}: ${post.caption}\n\nShared from PhotoShare App`,
        title: 'Share Post',
      });
      
      if (result.action === Share.sharedAction) {
        // Shared successfully
        console.log('Post shared');
      }
    } catch (error) {
      console.error('Error sharing:', error);
    }
  };

  const handleDelete = () => {
    Alert.alert(
      'Delete Post',
      'Are you sure you want to delete this post?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Delete', 
          style: 'destructive',
          onPress: () => onDelete(post.id)
        },
      ]
    );
  };

  const handleUserPress = () => {
    if (navigation && post.username !== currentUsername) {
      navigation.navigate('UserProfile', { username: post.username });
    }
  };

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.userInfo}
          onPress={handleUserPress}
          activeOpacity={0.7}
        >
          {userProfilePic ? (
            <Image source={{ uri: userProfilePic }} style={styles.avatarImage} />
          ) : (
            <View style={styles.avatar}>
              <Ionicons name="person" size={20} color={COLORS.primary} />
            </View>
          )}
          <View>
            <Text style={styles.username}>{post.username}</Text>
            <Text style={styles.timestamp}>
              {formatTimestamp(post.timestamp)}
            </Text>
          </View>
        </TouchableOpacity>
        {post.isOwner && (
          <TouchableOpacity onPress={handleDelete} style={styles.deleteButton}>
            <Ionicons name="trash-outline" size={20} color={COLORS.error} />
          </TouchableOpacity>
        )}
      </View>

      {images.length > 0 && (
        <View style={styles.imageContainer}>
          <ScrollView
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            onScroll={(e) => {
              const index = Math.round(e.nativeEvent.contentOffset.x / width);
              setCurrentImageIndex(index);
            }}
            scrollEventThrottle={16}
          >
            {images.map((img, index) => (
              <Image 
                key={index}
                source={{ uri: img }} 
                style={styles.image} 
                resizeMode="cover"
              />
            ))}
          </ScrollView>
          {images.length > 1 && (
            <View style={styles.imageIndicator}>
              {images.map((_, index) => (
                <View 
                  key={index}
                  style={[
                    styles.indicatorDot,
                    currentImageIndex === index && styles.indicatorDotActive
                  ]}
                />
              ))}
            </View>
          )}
        </View>
      )}

      <View style={styles.actionsContainer}>
        <View style={styles.leftActions}>
          <TouchableOpacity 
            style={styles.actionButton} 
            onPress={handleLike}
            disabled={loading}
            activeOpacity={0.7}
          >
            <Ionicons 
              name={isLiked ? 'heart' : 'heart-outline'} 
              size={26} 
              color={isLiked ? COLORS.error : COLORS.text} 
            />
          </TouchableOpacity>
          <TouchableOpacity 
            style={styles.actionButton} 
            onPress={handleComment}
            activeOpacity={0.7}
          >
            <Ionicons name="chatbubble-outline" size={24} color={COLORS.text} />
          </TouchableOpacity>
          <TouchableOpacity 
            style={styles.actionButton} 
            onPress={handleShare}
            activeOpacity={0.7}
          >
            <Ionicons name="share-social-outline" size={24} color={COLORS.text} />
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.content}>
        {likeCount > 0 && (
          <Text style={styles.likes}>
            {likeCount} {likeCount === 1 ? 'like' : 'likes'}
          </Text>
        )}
        
        <Text style={styles.caption}>
          <Text style={styles.captionUsername}>{post.username}</Text> {post.caption}
        </Text>
        
        {commentCount > 0 && (
          <TouchableOpacity onPress={handleComment}>
            <Text style={styles.viewComments}>
              View all {commentCount} {commentCount === 1 ? 'comment' : 'comments'}
            </Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: COLORS.background,
    marginBottom: 4,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: SPACING.md,
    paddingVertical: 10,
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  avatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: COLORS.surfaceLight,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
    borderWidth: 1.5,
    borderColor: COLORS.border,
  },
  avatarImage: {
    width: 32,
    height: 32,
    borderRadius: 16,
    marginRight: 12,
    borderWidth: 1.5,
    borderColor: COLORS.border,
  },
  username: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.text,
  },
  timestamp: {
    fontSize: 11,
    color: COLORS.textLight,
    marginTop: 2,
  },
  deleteButton: {
    padding: SPACING.xs,
  },
  imageContainer: {
    position: 'relative',
  },
  image: {
    width: width,
    height: 400,
    backgroundColor: COLORS.surfaceLight,
  },
  imageIndicator: {
    position: 'absolute',
    bottom: 10,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  indicatorDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: 'rgba(255,255,255,0.4)',
    marginHorizontal: 3,
  },
  indicatorDotActive: {
    backgroundColor: '#fff',
    width: 7,
    height: 7,
    borderRadius: 3.5,
  },
  actionsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: SPACING.md,
    paddingTop: SPACING.sm,
  },
  leftActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  actionButton: {
    padding: SPACING.xs,
    marginRight: SPACING.sm,
  },
  content: {
    paddingHorizontal: SPACING.md,
    paddingBottom: SPACING.md,
    paddingTop: 4,
  },
  likes: {
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 6,
    fontSize: 14,
  },
  caption: {
    fontSize: 14,
    color: COLORS.text,
    lineHeight: 18,
  },
  captionUsername: {
    fontWeight: '600',
  },
  viewComments: {
    color: COLORS.textSecondary,
    marginTop: 6,
    fontSize: 14,
  },
});