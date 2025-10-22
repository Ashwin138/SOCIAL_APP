import AsyncStorage from '@react-native-async-storage/async-storage';

// User Management
export const saveUser = async (user) => {
  try {
    const users = await getUsers();
    const existingIndex = users.findIndex(u => u.username === user.username);
    
    if (existingIndex >= 0) {
      users[existingIndex] = { ...users[existingIndex], ...user };
    } else {
      users.push(user);
    }
    
    await AsyncStorage.setItem('users', JSON.stringify(users));
    await AsyncStorage.setItem('currentUser', JSON.stringify(user));
    return user;
  } catch (error) {
    console.error('Error saving user:', error);
    throw error;
  }
};

export const getUsers = async () => {
  try {
    const users = await AsyncStorage.getItem('users');
    return users ? JSON.parse(users) : [];
  } catch (error) {
    console.error('Error getting users:', error);
    return [];
  }
};

export const getCurrentUser = async () => {
  try {
    const user = await AsyncStorage.getItem('currentUser');
    return user ? JSON.parse(user) : null;
  } catch (error) {
    console.error('Error getting current user:', error);
    return null;
  }
};

export const updateCurrentUser = async (updates) => {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser) return null;
    
    const updatedUser = { ...currentUser, ...updates };
    await saveUser(updatedUser);
    return updatedUser;
  } catch (error) {
    console.error('Error updating current user:', error);
    throw error;
  }
};

export const getUserByUsername = async (username) => {
  try {
    const users = await getUsers();
    return users.find(u => u.username === username) || null;
  } catch (error) {
    console.error('Error getting user by username:', error);
    return null;
  }
};

// Friend Requests
export const sendFriendRequest = async (fromUsername, toUsername) => {
  try {
    const requests = await getFriendRequests();
    
    // Check if request already exists
    const existingRequest = requests.find(
      r => r.from === fromUsername && r.to === toUsername && r.status === 'pending'
    );
    
    if (existingRequest) {
      return existingRequest;
    }
    
    const newRequest = {
      id: Date.now().toString(),
      from: fromUsername,
      to: toUsername,
      status: 'pending',
      timestamp: new Date().toISOString(),
    };
    requests.push(newRequest);
    await AsyncStorage.setItem('friendRequests', JSON.stringify(requests));
    return newRequest;
  } catch (error) {
    console.error('Error sending friend request:', error);
    throw error;
  }
};

export const getFriendRequests = async () => {
  try {
    const requests = await AsyncStorage.getItem('friendRequests');
    return requests ? JSON.parse(requests) : [];
  } catch (error) {
    console.error('Error getting friend requests:', error);
    return [];
  }
};

export const acceptFriendRequest = async (requestId) => {
  try {
    const requests = await getFriendRequests();
    const request = requests.find(r => r.id === requestId);
    
    if (request) {
      request.status = 'accepted';
      await AsyncStorage.setItem('friendRequests', JSON.stringify(requests));
      
      // Add to friends list for both users
      const users = await getUsers();
      const fromUserIndex = users.findIndex(u => u.username === request.from);
      const toUserIndex = users.findIndex(u => u.username === request.to);
      
      if (fromUserIndex >= 0 && toUserIndex >= 0) {
        if (!users[fromUserIndex].friends) users[fromUserIndex].friends = [];
        if (!users[toUserIndex].friends) users[toUserIndex].friends = [];
        
        if (!users[fromUserIndex].friends.includes(request.to)) {
          users[fromUserIndex].friends.push(request.to);
        }
        if (!users[toUserIndex].friends.includes(request.from)) {
          users[toUserIndex].friends.push(request.from);
        }
        
        await AsyncStorage.setItem('users', JSON.stringify(users));
        
        // Update current user if it's one of them
        const currentUser = await getCurrentUser();
        if (currentUser) {
          if (currentUser.username === request.from) {
            await AsyncStorage.setItem('currentUser', JSON.stringify(users[fromUserIndex]));
          } else if (currentUser.username === request.to) {
            await AsyncStorage.setItem('currentUser', JSON.stringify(users[toUserIndex]));
          }
        }
      }
    }
    return request;
  } catch (error) {
    console.error('Error accepting friend request:', error);
    throw error;
  }
};

export const rejectFriendRequest = async (requestId) => {
  try {
    const requests = await getFriendRequests();
    const updatedRequests = requests.filter(r => r.id !== requestId);
    await AsyncStorage.setItem('friendRequests', JSON.stringify(updatedRequests));
  } catch (error) {
    console.error('Error rejecting friend request:', error);
    throw error;
  }
};

// Messages
export const sendMessage = async (fromUsername, toUsername, text) => {
  try {
    const messages = await getMessages();
    const newMessage = {
      id: Date.now().toString(),
      from: fromUsername,
      to: toUsername,
      text,
      timestamp: new Date().toISOString(),
      read: false,
    };
    messages.push(newMessage);
    await AsyncStorage.setItem('messages', JSON.stringify(messages));
    return newMessage;
  } catch (error) {
    console.error('Error sending message:', error);
    throw error;
  }
};

export const getMessages = async () => {
  try {
    const messages = await AsyncStorage.getItem('messages');
    return messages ? JSON.parse(messages) : [];
  } catch (error) {
    console.error('Error getting messages:', error);
    return [];
  }
};

export const getConversation = async (user1, user2) => {
  try {
    const messages = await getMessages();
    return messages
      .filter(m => (m.from === user1 && m.to === user2) || (m.from === user2 && m.to === user1))
      .sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
  } catch (error) {
    console.error('Error getting conversation:', error);
    return [];
  }
};

export const markMessagesAsRead = async (fromUsername, toUsername) => {
  try {
    const messages = await getMessages();
    const updatedMessages = messages.map(m => {
      if (m.from === fromUsername && m.to === toUsername && !m.read) {
        return { ...m, read: true };
      }
      return m;
    });
    await AsyncStorage.setItem('messages', JSON.stringify(updatedMessages));
  } catch (error) {
    console.error('Error marking messages as read:', error);
  }
};

export const getUnreadCount = async (username) => {
  try {
    const messages = await getMessages();
    return messages.filter(m => m.to === username && !m.read).length;
  } catch (error) {
    console.error('Error getting unread count:', error);
    return 0;
  }
};

// Comments
export const addComment = async (postId, username, text) => {
  try {
    const comments = await getComments();
    const newComment = {
      id: Date.now().toString(),
      postId,
      username,
      text,
      timestamp: new Date().toISOString(),
    };
    comments.push(newComment);
    await AsyncStorage.setItem('comments', JSON.stringify(comments));
    return newComment;
  } catch (error) {
    console.error('Error adding comment:', error);
    throw error;
  }
};

export const getComments = async () => {
  try {
    const comments = await AsyncStorage.getItem('comments');
    return comments ? JSON.parse(comments) : [];
  } catch (error) {
    console.error('Error getting comments:', error);
    return [];
  }
};

export const getPostComments = async (postId) => {
  try {
    const comments = await getComments();
    return comments
      .filter(c => c.postId === postId)
      .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
  } catch (error) {
    console.error('Error getting post comments:', error);
    return [];
  }
};

export const deleteComment = async (commentId) => {
  try {
    const comments = await getComments();
    const updatedComments = comments.filter(c => c.id !== commentId);
    await AsyncStorage.setItem('comments', JSON.stringify(updatedComments));
  } catch (error) {
    console.error('Error deleting comment:', error);
    throw error;
  }
};

// Likes
export const toggleLike = async (postId, username) => {
  try {
    const likes = await getLikes();
    const existingLike = likes.find(l => l.postId === postId && l.username === username);
    
    if (existingLike) {
      // Unlike
      const updatedLikes = likes.filter(l => !(l.postId === postId && l.username === username));
      await AsyncStorage.setItem('likes', JSON.stringify(updatedLikes));
      return false;
    } else {
      // Like
      const newLike = {
        id: Date.now().toString(),
        postId,
        username,
        timestamp: new Date().toISOString(),
      };
      likes.push(newLike);
      await AsyncStorage.setItem('likes', JSON.stringify(likes));
      return true;
    }
  } catch (error) {
    console.error('Error toggling like:', error);
    throw error;
  }
};

export const getLikes = async () => {
  try {
    const likes = await AsyncStorage.getItem('likes');
    return likes ? JSON.parse(likes) : [];
  } catch (error) {
    console.error('Error getting likes:', error);
    return [];
  }
};

export const getPostLikes = async (postId) => {
  try {
    const likes = await getLikes();
    return likes.filter(l => l.postId === postId);
  } catch (error) {
    console.error('Error getting post likes:', error);
    return [];
  }
};

export const isPostLiked = async (postId, username) => {
  try {
    const likes = await getLikes();
    return likes.some(l => l.postId === postId && l.username === username);
  } catch (error) {
    console.error('Error checking if post is liked:', error);
    return false;
  }
};

// Notifications Management
export const getNotifications = async () => {
  try {
    const notifications = await AsyncStorage.getItem('notifications');
    return notifications ? JSON.parse(notifications) : [];
  } catch (error) {
    console.error('Error getting notifications:', error);
    return [];
  }
};

export const addNotification = async (notification) => {
  try {
    const notifications = await getNotifications();
    const newNotification = {
      id: Date.now().toString(),
      timestamp: new Date().toISOString(),
      read: false,
      ...notification,
    };
    notifications.unshift(newNotification);
    await AsyncStorage.setItem('notifications', JSON.stringify(notifications));
    return newNotification;
  } catch (error) {
    console.error('Error adding notification:', error);
    throw error;
  }
};

export const markNotificationAsRead = async (notificationId) => {
  try {
    const notifications = await getNotifications();
    const updated = notifications.map(n => 
      n.id === notificationId ? { ...n, read: true } : n
    );
    await AsyncStorage.setItem('notifications', JSON.stringify(updated));
  } catch (error) {
    console.error('Error marking notification as read:', error);
  }
};

export const markAllNotificationsAsRead = async () => {
  try {
    const notifications = await getNotifications();
    const updated = notifications.map(n => ({ ...n, read: true }));
    await AsyncStorage.setItem('notifications', JSON.stringify(updated));
  } catch (error) {
    console.error('Error marking all notifications as read:', error);
  }
};

export const getUnreadNotificationCount = async (username) => {
  try {
    const notifications = await getNotifications();
    // Filter by username if provided, otherwise return all
    const userNotifications = username 
      ? notifications.filter(n => n.to === username && !n.read)
      : notifications.filter(n => !n.read);
    return userNotifications.length;
  } catch (error) {
    console.error('Error getting unread count:', error);
    return 0;
  }
};