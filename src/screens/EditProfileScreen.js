import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image, Alert } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SPACING, SHADOWS } from '../constants/theme';
import CustomInput from '../components/CustomInput';
import CustomButton from '../components/CustomButton';
import { getCurrentUser, updateCurrentUser } from '../utils/storage';

export default function EditProfileScreen({ navigation }) {
  const [loading, setLoading] = useState(false);
  const [profilePic, setProfilePic] = useState(null);
  const [displayName, setDisplayName] = useState('');
  const [bio, setBio] = useState('');
  const [errors, setErrors] = useState({});

  useEffect(() => {
    loadUserData();
  }, []);

  const loadUserData = async () => {
    const user = await getCurrentUser();
    if (user) {
      setDisplayName(user.displayName || user.username);
      setBio(user.bio || '');
      setProfilePic(user.profilePic || null);
    }
  };

  const pickImage = async () => {
    const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
    
    if (!permissionResult.granted) {
      Alert.alert('Permission Required', 'Please allow access to your photo library.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled) {
      setProfilePic(result.assets[0].uri);
    }
  };

  const handleSave = async () => {
    setErrors({});
    
    if (!displayName.trim()) {
      setErrors({ displayName: 'Display name is required' });
      return;
    }

    try {
      setLoading(true);
      await updateCurrentUser({
        displayName: displayName.trim(),
        bio: bio.trim(),
        profilePic,
      });
      Alert.alert('Success', 'Profile updated successfully!');
      navigation.goBack();
    } catch (error) {
      Alert.alert('Error', 'Failed to update profile. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color={COLORS.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Edit Profile</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.profilePicSection}>
          <TouchableOpacity style={styles.profilePicContainer} onPress={pickImage}>
            {profilePic ? (
              <Image source={{ uri: profilePic }} style={styles.profilePic} />
            ) : (
              <View style={styles.profilePicPlaceholder}>
                <Ionicons name="person" size={50} color={COLORS.textLight} />
              </View>
            )}
            <View style={styles.editIconContainer}>
              <Ionicons name="camera" size={20} color={COLORS.surface} />
            </View>
          </TouchableOpacity>
          <Text style={styles.changePhotoText}>Change Profile Photo</Text>
        </View>

        <CustomInput
          placeholder="Display Name"
          value={displayName}
          onChangeText={setDisplayName}
          icon="person-outline"
          error={errors.displayName}
        />

        <CustomInput
          placeholder="Bio"
          value={bio}
          onChangeText={setBio}
          icon="document-text-outline"
          multiline
          maxLength={150}
        />
        <Text style={styles.charCount}>{bio.length}/150</Text>

        <CustomButton
          title="Save Changes"
          onPress={handleSave}
          loading={loading}
          style={styles.saveButton}
        />
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
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text,
  },
  content: {
    flex: 1,
    padding: SPACING.lg,
  },
  profilePicSection: {
    alignItems: 'center',
    marginBottom: SPACING.xl,
  },
  profilePicContainer: {
    position: 'relative',
    marginBottom: SPACING.sm,
  },
  profilePic: {
    width: 120,
    height: 120,
    borderRadius: 60,
  },
  profilePicPlaceholder: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: COLORS.surfaceLight,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: COLORS.border,
  },
  editIconContainer: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: COLORS.primary,
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: COLORS.background,
  },
  changePhotoText: {
    color: COLORS.primary,
    fontSize: 14,
    fontWeight: '600',
  },
  charCount: {
    textAlign: 'right',
    color: COLORS.textLight,
    fontSize: 12,
    marginTop: -SPACING.sm,
    marginBottom: SPACING.md,
  },
  saveButton: {
    marginTop: SPACING.md,
  },
});