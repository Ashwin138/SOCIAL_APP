import AsyncStorage from '@react-native-async-storage/async-storage';

export const clearAllData = async () => {
  try {
    await AsyncStorage.multiRemove([
      'posts',
      'comments',
      'likes',
      'messages',
      'friendRequests',
      'users',
      'currentUser',
    ]);
    console.log('All data cleared successfully');
    return true;
  } catch (error) {
    console.error('Error clearing data:', error);
    return false;
  }
};

export const resetDatabase = async () => {
  try {
    await AsyncStorage.clear();
    console.log('Database reset successfully');
    return true;
  } catch (error) {
    console.error('Error resetting database:', error);
    return false;
  }
};
