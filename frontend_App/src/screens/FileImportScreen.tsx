import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  Image,
  ScrollView,
  ActivityIndicator,
  TextInput,
} from 'react-native';
import {
  pickDocument,
  pickImageFromGallery,
  PickedFile,
} from '../utils/filePicker';
import { uploadFileIntelligent } from '../services/api';

const DATA_TYPES = [
  { id: 'trains', label: '🚇 Trains', color: '#3498db' },
  { id: 'certificates', label: '📜 Certificates', color: '#27ae60' },
  { id: 'job-cards', label: '🔧 Job Cards', color: '#e74c3c' },
  { id: 'branding', label: '🏷️ Branding', color: '#9b59b6' },
  { id: 'mileage', label: '📏 Mileage', color: '#f39c12' },
  { id: 'cleaning', label: '🧹 Cleaning', color: '#1abc9c' },
];

const FileImportScreen: React.FC = () => {
  const [selectedFile, setSelectedFile] = useState<PickedFile | null>(null);
  const [selectedDataType, setSelectedDataType] = useState<string>('trains');
  const [loading, setLoading] = useState(false);
  const [uploadResult, setUploadResult] = useState<any>(null);

  const handlePickFile = async () => {
    try {
      const file = await pickDocument();
      if (file) {
        console.log('File selected:', file);
        setSelectedFile(file);
        setUploadResult(null);
      }
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to pick file');
    }
  };

  const handlePickImage = async () => {
    try {
      const file = await pickImageFromGallery();
      if (file) {
        console.log('Image selected:', file);
        setSelectedFile(file);
        setUploadResult(null);
      }
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to pick image');
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) {
      Alert.alert('No File', 'Please select a file first');
      return;
    }

    setLoading(true);
    setUploadResult(null);

    try {
      console.log('[Upload] Starting upload...');
      console.log('[Upload] File:', selectedFile);
      console.log('[Upload] Data Type:', selectedDataType);

      const response = await uploadFileIntelligent(
        selectedFile,
        selectedDataType,
        false // Don't store in Cloudinary for now
      );

      console.log('[Upload] Response:', response.data);
      setUploadResult(response.data);

      if (response.data.status === 'success') {
        Alert.alert(
          'Upload Successful ✅',
          `Parsed: ${response.data.records_parsed} records\nSaved: ${response.data.records_saved} records`
        );
      } else {
        Alert.alert(
          'Upload Partial',
          response.data.error || 'Some records may not have been saved'
        );
      }
    } catch (error: any) {
      console.error('[Upload] Error:', error);
      const errorMsg = error.response?.data?.detail || error.message || 'Upload failed';
      Alert.alert('Upload Failed ❌', errorMsg);
      setUploadResult({ status: 'error', error: errorMsg });
    } finally {
      setLoading(false);
    }
  };

  const formatFileSize = (bytes?: number): string => {
    if (!bytes) return 'Unknown';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const isImage = selectedFile?.mimeType?.startsWith('image/');

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>📁 File Import</Text>
      <Text style={styles.subtitle}>Upload data files to the backend</Text>

      {/* File Selection */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>1. Select File</Text>
        <View style={styles.buttonRow}>
          <TouchableOpacity
            style={[styles.button, styles.pickButton]}
            onPress={handlePickFile}
            disabled={loading}
          >
            <Text style={styles.buttonText}>📄 Pick Document</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.button, styles.imageButton]}
            onPress={handlePickImage}
            disabled={loading}
          >
            <Text style={styles.buttonText}>🖼️ Pick Image</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Selected File Info */}
      {selectedFile && (
        <View style={styles.fileCard}>
          <Text style={styles.fileName}>{selectedFile.name}</Text>
          <Text style={styles.fileDetail}>
            Size: {formatFileSize(selectedFile.size)} | Type: {selectedFile.mimeType || 'Unknown'}
          </Text>
          {isImage && (
            <Image
              source={{ uri: selectedFile.uri }}
              style={styles.imagePreview}
              resizeMode="contain"
            />
          )}
        </View>
      )}

      {/* Data Type Selection */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>2. Select Data Type</Text>
        <View style={styles.dataTypeGrid}>
          {DATA_TYPES.map((type) => (
            <TouchableOpacity
              key={type.id}
              style={[
                styles.dataTypeButton,
                { borderColor: type.color },
                selectedDataType === type.id && { backgroundColor: type.color },
              ]}
              onPress={() => setSelectedDataType(type.id)}
            >
              <Text
                style={[
                  styles.dataTypeText,
                  selectedDataType === type.id && styles.dataTypeTextSelected,
                ]}
              >
                {type.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Upload Button */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>3. Upload to Server</Text>
        <TouchableOpacity
          style={[
            styles.uploadButton,
            (!selectedFile || loading) && styles.uploadButtonDisabled,
          ]}
          onPress={handleUpload}
          disabled={!selectedFile || loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.uploadButtonText}>
              🚀 Upload & Process
            </Text>
          )}
        </TouchableOpacity>
      </View>

      {/* Upload Result */}
      {uploadResult && (
        <View style={[
          styles.resultCard,
          uploadResult.status === 'success' ? styles.resultSuccess : styles.resultError
        ]}>
          <Text style={styles.resultTitle}>
            {uploadResult.status === 'success' ? '✅ Success' : '❌ Error'}
          </Text>
          {uploadResult.records_parsed !== undefined && (
            <Text style={styles.resultText}>
              Records Parsed: {uploadResult.records_parsed}
            </Text>
          )}
          {uploadResult.records_saved !== undefined && (
            <Text style={styles.resultText}>
              Records Saved: {uploadResult.records_saved}
            </Text>
          )}
          {uploadResult.error && (
            <Text style={styles.resultError}>{uploadResult.error}</Text>
          )}
        </View>
      )}

      {/* Tips */}
      <View style={styles.tipsCard}>
        <Text style={styles.tipsTitle}>💡 Supported Formats</Text>
        <Text style={styles.tipText}>• CSV files with headers</Text>
        <Text style={styles.tipText}>• PDF documents (AI extraction)</Text>
        <Text style={styles.tipText}>• Drag files to emulator to add them</Text>
      </View>
    </ScrollView>
  );
};


const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a1a2e',
    padding: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    textAlign: 'center',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: '#888',
    textAlign: 'center',
    marginBottom: 20,
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 12,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 12,
  },
  button: {
    flex: 1,
    padding: 14,
    borderRadius: 10,
    alignItems: 'center',
  },
  pickButton: {
    backgroundColor: '#3498db',
  },
  imageButton: {
    backgroundColor: '#9b59b6',
  },
  buttonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  fileCard: {
    backgroundColor: '#16213e',
    padding: 16,
    borderRadius: 12,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#0f3460',
  },
  fileName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 4,
  },
  fileDetail: {
    fontSize: 12,
    color: '#888',
  },
  imagePreview: {
    width: '100%',
    height: 150,
    marginTop: 12,
    borderRadius: 8,
    backgroundColor: '#0f3460',
  },
  dataTypeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  dataTypeButton: {
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 8,
    borderWidth: 2,
    backgroundColor: 'transparent',
  },
  dataTypeText: {
    fontSize: 13,
    color: '#fff',
    fontWeight: '500',
  },
  dataTypeTextSelected: {
    color: '#fff',
    fontWeight: '700',
  },
  uploadButton: {
    backgroundColor: '#27ae60',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  uploadButtonDisabled: {
    backgroundColor: '#555',
  },
  uploadButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
  resultCard: {
    padding: 16,
    borderRadius: 12,
    marginBottom: 20,
  },
  resultSuccess: {
    backgroundColor: 'rgba(39, 174, 96, 0.2)',
    borderWidth: 1,
    borderColor: '#27ae60',
  },
  resultError: {
    backgroundColor: 'rgba(231, 76, 60, 0.2)',
    borderWidth: 1,
    borderColor: '#e74c3c',
  },
  resultTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 8,
  },
  resultText: {
    fontSize: 14,
    color: '#ccc',
    marginBottom: 4,
  },
  tipsCard: {
    backgroundColor: 'rgba(241, 196, 15, 0.1)',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(241, 196, 15, 0.3)',
    marginBottom: 40,
  },
  tipsTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#f1c40f',
    marginBottom: 8,
  },
  tipText: {
    fontSize: 12,
    color: '#bbb',
    marginBottom: 4,
  },
});

export default FileImportScreen;
