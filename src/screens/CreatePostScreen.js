// src/screens/CreatePostScreen.js
import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Image, Alert, Platform, KeyboardAvoidingView, ScrollView, Dimensions } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SPACING } from '../constants/theme';

const { width } = Dimensions.get('window');

export default function CreatePostScreen({ navigation }) {
  const [images, setImages] = useState([]);
  const [caption, setCaption] = useState('');

  const pickImage = async () => {
    if (images.length >= 10) {
      Alert.alert('Limit Reached', 'You can only add up to 10 images per post');
      return;
    }

    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission required', 'Please grant access to your photos');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 1,
    });

    if (!result.canceled) {
      setImages([...images, result.assets[0].uri]);
    }
  };

  const removeImage = (index) => {
    setImages(images.filter((_, i) => i !== index));
  };

  const handlePost = async () => {
    if (images.length === 0 && !caption) {
      Alert.alert('Error', 'Please add at least a photo or caption');
      return;
    }

    try {
      const currentUserJson = await AsyncStorage.getItem('currentUser');
      if (!currentUserJson) {
        Alert.alert('Error', 'Please log in first');
        return;
      }
      const currentUser = JSON.parse(currentUserJson);

      const newPost = {
        id: Date.now().toString(),
        userId: currentUser.id || currentUser.username,
        username: currentUser.username,
        images: images, // Now storing array of images
        imageUri: images[0] || null, // Keep first image for backward compatibility
        caption: caption.trim() || '',
        timestamp: new Date().toISOString(),
        likes: 0,
        comments: 0,
      };

      const postsJson = await AsyncStorage.getItem('posts');
      const posts = postsJson ? JSON.parse(postsJson) : [];
      const updatedPosts = [...posts, newPost];
      await AsyncStorage.setItem('posts', JSON.stringify(updatedPosts));

      setImages([]);
      setCaption('');
      Alert.alert('Success', 'Post created!');
      navigation.navigate('Home');
    } catch (error) {
      console.error('Error creating post:', error);
      Alert.alert('Error', 'Failed to create post');
    }
  };

  return (
    <KeyboardAvoidingView 
      style={styles.container} 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView style={styles.formContainer}>
        <Text style={styles.title}>New Post</Text>
        
        {/* Images Grid */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.imagesScroll}>
          {images.map((img, index) => (
            <View key={index} style={styles.imageContainer}>
              <Image source={{ uri: img }} style={styles.previewImage} />
              <TouchableOpacity 
                style={styles.removeButton}
                onPress={() => removeImage(index)}
              >
                <Ionicons name="close-circle" size={24} color={COLORS.error} />
              </TouchableOpacity>
            </View>
          ))}
          
          {images.length < 10 && (
            <TouchableOpacity style={styles.addImageButton} onPress={pickImage}>
              <Ionicons name="add-circle-outline" size={50} color={COLORS.primary} />
              <Text style={styles.addImageText}>Add Photo</Text>
              <Text style={styles.imageCountText}>{images.length}/10</Text>
            </TouchableOpacity>
          )}
        </ScrollView>
        
        <TextInput
          style={styles.captionInput}
          placeholder="Write a caption..."
          placeholderTextColor={COLORS.textLight}
          value={caption}
          onChangeText={setCaption}
          multiline
          maxLength={200}
        />
        
        <TouchableOpacity style={styles.button} onPress={handlePost}>
          <Text style={styles.buttonText}>Share Post</Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
    justifyContent: 'center',
  },
  formContainer: {
    flex: 1,
    padding: SPACING.lg,
  },
  title: {
    fontSize: 24,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: SPACING.lg,
    textAlign: 'center',
  },
  imagesScroll: {
    marginBottom: SPACING.lg,
  },
  imageContainer: {
    width: width - 60,
    height: width - 60,
    marginRight: SPACING.md,
    borderRadius: 12,
    overflow: 'hidden',
    position: 'relative',
  },
  previewImage: {
    width: '100%',
    height: '100%',
  },
  removeButton: {
    position: 'absolute',
    top: 10,
    right: 10,
    backgroundColor: COLORS.surface,
    borderRadius: 12,
  },
  addImageButton: {
    width: width - 60,
    height: width - 60,
    backgroundColor: COLORS.surfaceLight,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: COLORS.border,
    borderStyle: 'dashed',
  },
  addImageText: {
    marginTop: SPACING.sm,
    color: COLORS.textSecondary,
    fontSize: 16,
    fontWeight: '600',
  },
  imageCountText: {
    marginTop: SPACING.xs,
    color: COLORS.textLight,
    fontSize: 13,
  },
  captionInput: {
    backgroundColor: COLORS.surfaceLight,
    padding: SPACING.md,
    borderRadius: 8,
    marginBottom: SPACING.lg,
    fontSize: 15,
    color: COLORS.text,
    borderWidth: 1,
    borderColor: COLORS.border,
    minHeight: 100,
    textAlignVertical: 'top',
  },
  button: {
    backgroundColor: COLORS.primary,
    padding: SPACING.md,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: SPACING.xl,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});