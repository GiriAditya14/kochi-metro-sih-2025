import * as DocumentPicker from 'expo-document-picker';
import * as ImagePicker from 'expo-image-picker';
import { Platform } from 'react-native';

// Types for file results
export interface PickedFile {
  uri: string;
  name: string;
  size?: number;
  mimeType?: string;
}

// Pick any document (PDF, CSV, ZIP, etc.)
export const pickDocument = async (
  allowedTypes?: string[]
): Promise<PickedFile | null> => {
  try {
    const result = await DocumentPicker.getDocumentAsync({
      type: '*/*', // Accept all file types
      copyToCacheDirectory: true,
      multiple: false,
    });

    console.log('DocumentPicker result:', JSON.stringify(result, null, 2));

    if (result.canceled) {
      console.log('User cancelled document picker');
      return null;
    }

    if (!result.assets || result.assets.length === 0) {
      console.log('No assets returned');
      return null;
    }

    const file = result.assets[0];
    return {
      uri: file.uri,
      name: file.name,
      size: file.size,
      mimeType: file.mimeType,
    };
  } catch (error) {
    console.error('Error picking document:', error);
    throw error;
  }
};

// Pick PDF files only (on Android, filters after selection)
export const pickPDF = async (): Promise<PickedFile | null> => {
  const file = await pickDocument();
  if (file && !file.name.toLowerCase().endsWith('.pdf')) {
    throw new Error('Please select a PDF file');
  }
  return file;
};

// Pick CSV files only
export const pickCSV = async (): Promise<PickedFile | null> => {
  const file = await pickDocument();
  if (file && !file.name.toLowerCase().endsWith('.csv')) {
    throw new Error('Please select a CSV file');
  }
  return file;
};

// Pick ZIP files only
export const pickZIP = async (): Promise<PickedFile | null> => {
  const file = await pickDocument();
  if (file && !file.name.toLowerCase().endsWith('.zip')) {
    throw new Error('Please select a ZIP file');
  }
  return file;
};

// Pick image from gallery
export const pickImageFromGallery = async (): Promise<PickedFile | null> => {
  try {
    // Request permission first
    const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
    
    console.log('Gallery permission:', permissionResult);

    if (!permissionResult.granted) {
      throw new Error('Permission to access gallery was denied. Please enable in Settings.');
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: false, // Set to false for better emulator compatibility
      quality: 0.8,
      allowsMultipleSelection: false,
    });

    console.log('ImagePicker result:', JSON.stringify(result, null, 2));

    if (result.canceled) {
      console.log('User cancelled image picker');
      return null;
    }

    if (!result.assets || result.assets.length === 0) {
      console.log('No image assets returned');
      return null;
    }

    const image = result.assets[0];
    return {
      uri: image.uri,
      name: image.fileName || `image_${Date.now()}.jpg`,
      size: image.fileSize,
      mimeType: image.mimeType || 'image/jpeg',
    };
  } catch (error) {
    console.error('Error picking image:', error);
    throw error;
  }
};

// Take photo with camera
export const takePhoto = async (): Promise<PickedFile | null> => {
  try {
    const permissionResult = await ImagePicker.requestCameraPermissionsAsync();
    
    console.log('Camera permission:', permissionResult);

    if (!permissionResult.granted) {
      throw new Error('Permission to access camera was denied. Please enable in Settings.');
    }

    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: false,
      quality: 0.8,
    });

    console.log('Camera result:', JSON.stringify(result, null, 2));

    if (result.canceled) {
      console.log('User cancelled camera');
      return null;
    }

    if (!result.assets || result.assets.length === 0) {
      console.log('No camera assets returned');
      return null;
    }

    const image = result.assets[0];
    return {
      uri: image.uri,
      name: image.fileName || `photo_${Date.now()}.jpg`,
      size: image.fileSize,
      mimeType: image.mimeType || 'image/jpeg',
    };
  } catch (error) {
    console.error('Error taking photo:', error);
    throw error;
  }
};
