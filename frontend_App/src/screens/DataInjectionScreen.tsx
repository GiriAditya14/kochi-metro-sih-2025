import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  ActivityIndicator,
  Alert,
  Image,
} from 'react-native';
import * as DocumentPicker from 'expo-document-picker';
import * as ImagePicker from 'expo-image-picker';
import { colors } from '../lib/utils';
import { useAuth } from '../context/AuthContext';
import { API_BASE_URL } from '../lib/api';

interface ExtractionResult {
  success: boolean;
  source: string;
  filename?: string;
  data_type?: string;
  confidence?: number;
  extracted_data?: any[];
  summary?: string;
  error?: string;
}

const DataInjectionScreen: React.FC = () => {
  const { token, hasPermission } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<any>(null);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [extractionResult, setExtractionResult] = useState<ExtractionResult | null>(null);

  const canInject = hasPermission('worker');

  const pickDocument = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ['text/csv', 'application/pdf'],
        copyToCacheDirectory: true,
      });

      if (result.canceled) return;

      const file = result.assets[0];
      setSelectedFile(file);
      setPreviewImage(null);
      setExtractionResult(null);
    } catch (error) {
      Alert.alert('Error', 'Failed to pick document');
    }
  };

  const pickImage = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission needed', 'Please grant gallery access');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        quality: 0.8,
      });

      if (result.canceled) return;

      const asset = result.assets[0];
      setSelectedFile({
        uri: asset.uri,
        name: asset.fileName || 'image.jpg',
        mimeType: asset.mimeType || 'image/jpeg',
      });
      setPreviewImage(asset.uri);
      setExtractionResult(null);
    } catch (error) {
      Alert.alert('Error', 'Failed to pick image');
    }
  };

  const takePhoto = async () => {
    try {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission needed', 'Please grant camera access');
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        quality: 0.8,
      });

      if (result.canceled) return;

      const asset = result.assets[0];
      setSelectedFile({
        uri: asset.uri,
        name: 'camera_capture.jpg',
        mimeType: 'image/jpeg',
      });
      setPreviewImage(asset.uri);
      setExtractionResult(null);
    } catch (error) {
      Alert.alert('Error', 'Failed to capture photo');
    }
  };

  const extractData = async () => {
    if (!selectedFile) {
      Alert.alert('Error', 'Please select a file first');
      return;
    }

    setIsLoading(true);
    try {
      const formData = new FormData();
      formData.append('file', {
        uri: selectedFile.uri,
        name: selectedFile.name,
        type: selectedFile.mimeType,
      } as any);

      const response = await fetch(`${API_BASE_URL}/api/data-injection/extract`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      const data = await response.json();
      setExtractionResult(data);

      if (data.success) {
        Alert.alert('Success', `Extracted ${data.extracted_data?.length || 0} records`);
      } else {
        Alert.alert('Extraction Failed', data.error || 'Unknown error');
      }
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to extract data');
    } finally {
      setIsLoading(false);
    }
  };

  const importData = async () => {
    if (!extractionResult?.extracted_data?.length) {
      Alert.alert('Error', 'No data to import');
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/api/data-injection/import`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          data_type: extractionResult.data_type,
          data: extractionResult.extracted_data,
        }),
      });

      const data = await response.json();
      Alert.alert('Import Status', data.message || 'Data queued for import');
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to import data');
    } finally {
      setIsLoading(false);
    }
  };

  if (!canInject) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.noAccess}>
          <Text style={styles.noAccessIcon}>🔒</Text>
          <Text style={styles.noAccessTitle}>Access Restricted</Text>
          <Text style={styles.noAccessText}>
            You need Worker or Admin role to inject data.
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.content}>
        <Text style={styles.title}>Data Injection</Text>
        <Text style={styles.subtitle}>
          Upload CSV, PDF, or capture images to extract and import data
        </Text>

        {/* Upload Options */}
        <View style={styles.uploadOptions}>
          <TouchableOpacity style={styles.uploadButton} onPress={pickDocument}>
            <Text style={styles.uploadIcon}>📄</Text>
            <Text style={styles.uploadLabel}>CSV / PDF</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.uploadButton} onPress={pickImage}>
            <Text style={styles.uploadIcon}>🖼️</Text>
            <Text style={styles.uploadLabel}>Gallery</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.uploadButton} onPress={takePhoto}>
            <Text style={styles.uploadIcon}>📷</Text>
            <Text style={styles.uploadLabel}>Camera</Text>
          </TouchableOpacity>
        </View>

        {/* Selected File Preview */}
        {selectedFile && (
          <View style={styles.previewContainer}>
            <Text style={styles.sectionTitle}>Selected File</Text>
            {previewImage ? (
              <Image source={{ uri: previewImage }} style={styles.previewImage} />
            ) : (
              <View style={styles.fileInfo}>
                <Text style={styles.fileName}>{selectedFile.name}</Text>
                <Text style={styles.fileType}>{selectedFile.mimeType}</Text>
              </View>
            )}

            <TouchableOpacity
              style={[styles.extractButton, isLoading && styles.buttonDisabled]}
              onPress={extractData}
              disabled={isLoading}
            >
              {isLoading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.extractButtonText}>Extract Data</Text>
              )}
            </TouchableOpacity>
          </View>
        )}

        {/* Extraction Results */}
        {extractionResult && (
          <View style={styles.resultContainer}>
            <Text style={styles.sectionTitle}>Extraction Result</Text>
            
            <View style={styles.resultMeta}>
              <View style={styles.resultItem}>
                <Text style={styles.resultLabel}>Source</Text>
                <Text style={styles.resultValue}>{extractionResult.source}</Text>
              </View>
              <View style={styles.resultItem}>
                <Text style={styles.resultLabel}>Data Type</Text>
                <Text style={styles.resultValue}>
                  {extractionResult.data_type || 'Unknown'}
                </Text>
              </View>
              {extractionResult.confidence && (
                <View style={styles.resultItem}>
                  <Text style={styles.resultLabel}>Confidence</Text>
                  <Text style={styles.resultValue}>
                    {Math.round(extractionResult.confidence * 100)}%
                  </Text>
                </View>
              )}
              <View style={styles.resultItem}>
                <Text style={styles.resultLabel}>Records</Text>
                <Text style={styles.resultValue}>
                  {extractionResult.extracted_data?.length || 0}
                </Text>
              </View>
            </View>

            {extractionResult.summary && (
              <View style={styles.summaryBox}>
                <Text style={styles.summaryText}>{extractionResult.summary}</Text>
              </View>
            )}

            {extractionResult.extracted_data?.length > 0 && (
              <TouchableOpacity
                style={[styles.importButton, isLoading && styles.buttonDisabled]}
                onPress={importData}
                disabled={isLoading}
              >
                <Text style={styles.importButtonText}>
                  Import {extractionResult.extracted_data.length} Records
                </Text>
              </TouchableOpacity>
            )}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg.primary,
  },
  content: {
    flex: 1,
    padding: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.text.primary,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: colors.text.secondary,
    marginBottom: 24,
  },
  uploadOptions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  uploadButton: {
    flex: 1,
    backgroundColor: colors.bg.secondary,
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    marginHorizontal: 4,
  },
  uploadIcon: {
    fontSize: 32,
    marginBottom: 8,
  },
  uploadLabel: {
    fontSize: 12,
    color: colors.text.secondary,
    fontWeight: '500',
  },
  previewContainer: {
    backgroundColor: colors.bg.secondary,
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text.primary,
    marginBottom: 12,
  },
  previewImage: {
    width: '100%',
    height: 200,
    borderRadius: 12,
    marginBottom: 16,
  },
  fileInfo: {
    backgroundColor: colors.slate[800],
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  fileName: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.text.primary,
  },
  fileType: {
    fontSize: 12,
    color: colors.text.muted,
    marginTop: 4,
  },
  extractButton: {
    backgroundColor: colors.primary[600],
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  extractButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  resultContainer: {
    backgroundColor: colors.bg.secondary,
    borderRadius: 16,
    padding: 16,
  },
  resultMeta: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 16,
  },
  resultItem: {
    width: '50%',
    marginBottom: 12,
  },
  resultLabel: {
    fontSize: 12,
    color: colors.text.muted,
  },
  resultValue: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.text.primary,
    marginTop: 2,
  },
  summaryBox: {
    backgroundColor: colors.slate[800],
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
  },
  summaryText: {
    fontSize: 13,
    color: colors.text.secondary,
    lineHeight: 20,
  },
  importButton: {
    backgroundColor: colors.green[600],
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  importButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  noAccess: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  noAccessIcon: {
    fontSize: 64,
    marginBottom: 16,
  },
  noAccessTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: colors.text.primary,
    marginBottom: 8,
  },
  noAccessText: {
    fontSize: 14,
    color: colors.text.secondary,
    textAlign: 'center',
  },
});

export default DataInjectionScreen;
