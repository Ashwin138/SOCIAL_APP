import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TextInput, TouchableOpacity, KeyboardAvoidingView, Platform, Alert, Image, ScrollView, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SPACING, TYPOGRAPHY } from '../constants/theme';
import { getPostComments, addComment, deleteComment, getCurrentUser, addNotification, getPostLikes, getUserByUsername } from '../utils/storage';

const { width } = Dimensions.get('window');

export default function CommentsScreen({ route, navigation }) {
  const { post } = route.params;
  const [comments, setComments] = useState([]);
  const [inputText, setInputText] = useState('');
  const [currentUser, setCurrentUser] = useState(null);
  const [likeCount, setLikeCount] = useState(0);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [userProfilePics, setUserProfilePics] = useState({});
  const [postOwnerPic, setPostOwnerPic] = useState(null);
  
  const images = post.images || (post.imageUri ? [post.imageUri] : []);

  useEffect(() => {
    loadComments();
    loadCurrentUser();
    loadLikes();
    loadPostOwnerProfile();
  }, []);

  const loadCurrentUser = async () => {
    const user = await getCurrentUser();
    setCurrentUser(user);
  };

  const loadComments = async () => {
    const postComments = await getPostComments(post.id);
    setComments(postComments);
    
    // Load profile pics for commenters
    const pics = {};
    for (const comment of postComments) {
      const user = await getUserByUsername(comment.username);
      if (user && user.profilePic) {
        pics[comment.username] = user.profilePic;
      }
    }
    setUserProfilePics(pics);
  };

  const loadLikes = async () => {
    const likes = await getPostLikes(post.id);
    setLikeCount(likes.length);
  };

  const loadPostOwnerProfile = async () => {
    const user = await getUserByUsername(post.username);
    if (user && user.profilePic) {
      setPostOwnerPic(user.profilePic);
    }
  };

  const handleAddComment = async () => {
    if (!inputText.trim()) return;

    try {
      await addComment(post.id, currentUser.username, inputText.trim());
      setInputText('');
      loadComments();
      
      // Send notification if commenting on someone else's post
      if (post.username !== currentUser.username) {
        await addNotification({
          type: 'comment',
          from: currentUser.username,
          to: post.username,
          message: 'commented on your post',
          postId: post.id,
          postData: post, // Include full post data for navigation
        });
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to add comment');
    }
  };

  const handleDeleteComment = async (commentId) => {
    Alert.alert(
      'Delete Comment',
      'Are you sure you want to delete this comment?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteComment(commentId);
              loadComments();
            } catch (error) {
              Alert.alert('Error', 'Failed to delete comment');
            }
          },
        },
      ]
    );
  };

  const renderComment = ({ item }) => {
    const isOwner = item.username === currentUser?.username;
    
    return (
      <View style={styles.commentCard}>
        <View style={styles.commentHeader}>
          <View style={styles.avatar}>
            <Ionicons name="person" size={16} color={COLORS.primary} />
          </View>
          <View style={styles.commentContent}>
            <View style={styles.commentTop}>
              <Text style={styles.commentUsername}>{item.username}</Text>
              <Text style={styles.commentTime}>
                {new Date(item.timestamp).toLocaleDateString('en-US', { 
                  month: 'short', 
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit'
                })}
              </Text>
            </View>
            <Text style={styles.commentText}>{item.text}</Text>
          </View>
          {isOwner && (
            <TouchableOpacity onPress={() => handleDeleteComment(item.id)}>
              <Ionicons name="trash-outline" size={18} color={COLORS.error} />
            </TouchableOpacity>
          )}
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color={COLORS.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Comments</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView>
        {/* Post Images Section */}
        {images.length > 0 && (
          <View style={styles.imagesContainer}>
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
                  style={styles.postImage} 
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

        {/* Post Details */}
        <View style={styles.postDetails}>
          <View style={styles.postHeader}>
            {postOwnerPic ? (
              <Image source={{ uri: postOwnerPic }} style={styles.avatarImage} />
            ) : (
              <View style={styles.avatar}>
                <Ionicons name="person" size={20} color={COLORS.primary} />
              </View>
            )}
            <View style={styles.postInfo}>
              <Text style={styles.postUsername}>{post.username}</Text>
              <Text style={styles.postCaption}>{post.caption}</Text>
              <Text style={styles.postTime}>
                {new Date(post.timestamp).toLocaleDateString('en-US', { 
                  month: 'short', 
                  day: 'numeric',
                  year: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit'
                })}
              </Text>
            </View>
          </View>

          {/* Like Count */}
          {likeCount > 0 && (
            <Text style={styles.likesCount}>
              {likeCount} {likeCount === 1 ? 'like' : 'likes'}
            </Text>
          )}
        </View>

        {/* Comments Section Header */}
        <View style={styles.commentsHeader}>
          <Text style={styles.commentsHeaderText}>
            {comments.length === 0 
              ? 'No comments yet' 
              : `${comments.length} ${comments.length === 1 ? 'comment' : 'comments'}`
            }
          </Text>
        </View>

        {/* Comments List */}
        {comments.map((item) => {
          const isOwner = item.username === currentUser?.username;
          const commenterPic = userProfilePics[item.username];
          return (
            <View key={item.id} style={styles.commentCard}>
              <View style={styles.commentHeader}>
                {commenterPic ? (
                  <Image source={{ uri: commenterPic }} style={styles.commentAvatarImage} />
                ) : (
                  <View style={styles.commentAvatar}>
                    <Ionicons name="person" size={16} color={COLORS.primary} />
                  </View>
                )}
                <View style={styles.commentContent}>
                  <Text style={styles.commentText}>
                    <Text style={styles.commentUsername}>{item.username}</Text>
                    {' '}
                    {item.text}
                  </Text>
                  <Text style={styles.commentTime}>
                    {new Date(item.timestamp).toLocaleDateString('en-US', { 
                      month: 'short', 
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </Text>
                </View>
                {isOwner && (
                  <TouchableOpacity onPress={() => handleDeleteComment(item.id)}>
                    <Ionicons name="trash-outline" size={18} color={COLORS.error} />
                  </TouchableOpacity>
                )}
              </View>
            </View>
          );
        })}
        
        <View style={{ height: 100 }} />
      </ScrollView>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
      >
        <View style={styles.inputContainer}>
          <View style={styles.avatar}>
            <Ionicons name="person" size={16} color={COLORS.primary} />
          </View>
          <TextInput
            style={styles.input}
            placeholder="Add a comment..."
            value={inputText}
            onChangeText={setInputText}
            placeholderTextColor={COLORS.textLight}
            multiline
            maxLength={500}
          />
          <TouchableOpacity
            onPress={handleAddComment}
            disabled={!inputText.trim()}
          >
            <Text style={[styles.postButton, !inputText.trim() && styles.postButtonDisabled]}>
              Post
            </Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
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
    paddingVertical: SPACING.md,
    backgroundColor: COLORS.background,
    borderBottomWidth: 0.5,
    borderBottomColor: COLORS.border,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  imagesContainer: {
    position: 'relative',
  },
  postImage: {
    width: width,
    aspectRatio: 1,
    backgroundColor: COLORS.surface,
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
  postDetails: {
    backgroundColor: COLORS.background,
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.md,
    borderBottomWidth: 0.5,
    borderBottomColor: COLORS.border,
  },
  postHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: SPACING.sm,
  },
  postInfo: {
    flex: 1,
  },
  postUsername: {
    fontWeight: '600',
    color: COLORS.text,
    fontSize: 15,
    marginBottom: 4,
  },
  postCaption: {
    color: COLORS.text,
    lineHeight: 20,
    fontSize: 15,
    marginBottom: 6,
  },
  postTime: {
    fontSize: 12,
    color: COLORS.textLight,
  },
  likesCount: {
    fontWeight: '600',
    color: COLORS.text,
    fontSize: 14,
  },
  commentsHeader: {
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.md,
    backgroundColor: COLORS.surface,
    borderBottomWidth: 0.5,
    borderBottomColor: COLORS.border,
  },
  commentsHeaderText: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.textSecondary,
    textTransform: 'uppercase',
  },
  commentCard: {
    backgroundColor: COLORS.background,
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.md,
    borderBottomWidth: 0.5,
    borderBottomColor: COLORS.border,
  },
  commentHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: COLORS.surface,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SPACING.md,
  },
  avatarImage: {
    width: 36,
    height: 36,
    borderRadius: 18,
    marginRight: SPACING.md,
  },
  commentAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: COLORS.surface,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SPACING.sm,
  },
  commentAvatarImage: {
    width: 32,
    height: 32,
    borderRadius: 16,
    marginRight: SPACING.sm,
  },
  commentContent: {
    flex: 1,
  },
  commentText: {
    color: COLORS.text,
    lineHeight: 20,
    fontSize: 15,
    marginBottom: 4,
  },
  commentUsername: {
    fontWeight: '600',
    color: COLORS.text,
  },
  commentTime: {
    fontSize: 12,
    color: COLORS.textLight,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: SPACING.md,
    backgroundColor: COLORS.surface,
    borderTopWidth: 0.5,
    borderTopColor: COLORS.border,
  },
  input: {
    flex: 1,
    backgroundColor: COLORS.background,
    borderRadius: 20,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    fontSize: 15,
    maxHeight: 100,
    marginRight: SPACING.sm,
    color: COLORS.text,
  },
  postButton: {
    color: COLORS.primary,
    fontWeight: '600',
    fontSize: 15,
  },
  postButtonDisabled: {
    color: COLORS.textLight,
  },
});