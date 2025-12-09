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

interface AnalysisResult {
  filename: string;
  file_type: string;
  file_size: number;
  row_count?: number;
  columns?: string[];
  detected_type?: string;
  insights: string[];
  warnings: string[];
  recommendations: string[];
}

const DataInjectionScreen: React.FC = () => {
  const { token, canAccess, user } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<any>(null);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [extractionResult, setExtractionResult] = useState<ExtractionResult | null>(null);
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null);
  const [activeTab, setActiveTab] = useState<'upload' | 'analyze'>('upload');

  const canImport = canAccess('importData');

  const pickDocument = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ['text/csv', 'application/pdf', 'text/plain'],
        copyToCacheDirectory: true,
      });

      if (result.canceled) return;

      const file = result.assets[0];
      setSelectedFile(file);
      setPreviewImage(null);
      setExtractionResult(null);
      setAnalysisResult(null);
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
      setAnalysisResult(null);
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
      setAnalysisResult(null);
    } catch (error) {
      Alert.alert('Error', 'Failed to capture photo');
    }
  };

  const analyzeData = async () => {
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

      const response = await fetch(`${API_BASE_URL}/api/data-injection/analyze`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      const data = await response.json();
      setAnalysisResult(data);
      setActiveTab('analyze');
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to analyze data');
    } finally {
      setIsLoading(false);
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
    if (!canImport) {
      Alert.alert('Access Denied', 'You need Worker or Admin role to import data');
      return;
    }

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
      if (data.success) {
        Alert.alert('Import Complete', data.message || 'Data imported successfully');
      } else {
        Alert.alert('Import Failed', data.detail || 'Failed to import data');
      }
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to import data');
    } finally {
      setIsLoading(false);
    }
  };

  const clearSelection = () => {
    setSelectedFile(null);
    setPreviewImage(null);
    setExtractionResult(null);
    setAnalysisResult(null);
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.content}>
        <Text style={styles.title}>Data Injection</Text>
        <Text style={styles.subtitle}>
          Upload CSV, PDF, or capture images to extract and analyze data
        </Text>

        {/* Role Badge */}
        <View style={styles.roleBadge}>
          <Text style={styles.roleText}>
            {canImport ? '✓ You can import data' : '👁️ View & Analyze Only'}
          </Text>
        </View>

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
            <View style={styles.previewHeader}>
              <Text style={styles.sectionTitle}>Selected File</Text>
              <TouchableOpacity onPress={clearSelection}>
                <Text style={styles.clearButton}>✕ Clear</Text>
              </TouchableOpacity>
            </View>
            
            {previewImage ? (
              <Image source={{ uri: previewImage }} style={styles.previewImage} />
            ) : (
              <View style={styles.fileInfo}>
                <Text style={styles.fileName}>{selectedFile.name}</Text>
                <Text style={styles.fileType}>{selectedFile.mimeType}</Text>
              </View>
            )}

            {/* Action Buttons */}
            <View style={styles.actionButtons}>
              <TouchableOpacity
                style={[styles.analyzeButton, isLoading && styles.buttonDisabled]}
                onPress={analyzeData}
                disabled={isLoading}
              >
                {isLoading ? (
                  <ActivityIndicator color="#fff" size="small" />
                ) : (
                  <Text style={styles.analyzeButtonText}>📊 Analyze</Text>
                )}
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.extractButton, isLoading && styles.buttonDisabled]}
                onPress={extractData}
                disabled={isLoading}
              >
                {isLoading ? (
                  <ActivityIndicator color="#fff" size="small" />
                ) : (
                  <Text style={styles.extractButtonText}>🔍 Extract Data</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Analysis Results */}
        {analysisResult && (
          <View style={styles.resultContainer}>
            <Text style={styles.sectionTitle}>📊 Analysis Results</Text>
            
            <View style={styles.analysisGrid}>
              <View style={styles.analysisItem}>
                <Text style={styles.analysisLabel}>File Type</Text>
                <Text style={styles.analysisValue}>{analysisResult.file_type?.toUpperCase()}</Text>
              </View>
              <View style={styles.analysisItem}>
                <Text style={styles.analysisLabel}>Size</Text>
                <Text style={styles.analysisValue}>{(analysisResult.file_size / 1024).toFixed(1)} KB</Text>
              </View>
              {analysisResult.row_count && (
                <View style={styles.analysisItem}>
                  <Text style={styles.analysisLabel}>Rows</Text>
                  <Text style={styles.analysisValue}>{analysisResult.row_count}</Text>
                </View>
              )}
              {analysisResult.detected_type && (
                <View style={styles.analysisItem}>
                  <Text style={styles.analysisLabel}>Detected Type</Text>
                  <Text style={styles.analysisValue}>{analysisResult.detected_type}</Text>
                </View>
              )}
            </View>

            {analysisResult.columns && analysisResult.columns.length > 0 && (
              <View style={styles.columnsBox}>
                <Text style={styles.columnsLabel}>Columns Found:</Text>
                <Text style={styles.columnsText}>{analysisResult.columns.join(', ')}</Text>
              </View>
            )}

            {analysisResult.insights.length > 0 && (
              <View style={styles.insightsBox}>
                <Text style={styles.insightsLabel}>💡 Insights</Text>
                {analysisResult.insights.map((insight, idx) => (
                  <Text key={idx} style={styles.insightText}>• {insight}</Text>
                ))}
              </View>
            )}

            {analysisResult.warnings.length > 0 && (
              <View style={styles.warningsBox}>
                <Text style={styles.warningsLabel}>⚠️ Warnings</Text>
                {analysisResult.warnings.map((warning, idx) => (
                  <Text key={idx} style={styles.warningText}>• {warning}</Text>
                ))}
              </View>
            )}
          </View>
        )}

        {/* Extraction Results */}
        {extractionResult && (
          <View style={styles.resultContainer}>
            <Text style={styles.sectionTitle}>🔍 Extraction Result</Text>
            
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
              {extractionResult.confidence !== undefined && (
                <View style={styles.resultItem}>
                  <Text style={styles.resultLabel}>Confidence</Text>
                  <Text style={styles.resultValue}>
                    {Math.round((extractionResult.confidence || 0) * 100)}%
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

            {extractionResult.extracted_data && extractionResult.extracted_data.length > 0 && (
              <>
                {/* Preview first 3 records */}
                <View style={styles.previewRecords}>
                  <Text style={styles.previewLabel}>Preview (first 3 records):</Text>
                  {extractionResult.extracted_data.slice(0, 3).map((record, idx) => (
                    <View key={idx} style={styles.recordPreview}>
                      <Text style={styles.recordText}>
                        {JSON.stringify(record, null, 2).substring(0, 200)}...
                      </Text>
                    </View>
                  ))}
                </View>

                {/* Import Button */}
                {canImport ? (
                  <TouchableOpacity
                    style={[styles.importButton, isLoading && styles.buttonDisabled]}
                    onPress={importData}
                    disabled={isLoading}
                  >
                    <Text style={styles.importButtonText}>
                      📥 Import {extractionResult.extracted_data.length} Records
                    </Text>
                  </TouchableOpacity>
                ) : (
                  <View style={styles.noImportBox}>
                    <Text style={styles.noImportText}>
                      🔒 Contact a Worker or Admin to import this data
                    </Text>
                  </View>
                )}
              </>
            )}

            {extractionResult.error && (
              <View style={styles.errorBox}>
                <Text style={styles.errorText}>❌ {extractionResult.error}</Text>
              </View>
            )}
          </View>
        )}

        <View style={styles.spacer} />
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
    marginBottom: 16,
  },
  roleBadge: {
    backgroundColor: colors.slate[800],
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    marginBottom: 20,
    alignSelf: 'flex-start',
  },
  roleText: {
    fontSize: 12,
    color: colors.text.secondary,
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
    borderWidth: 1,
    borderColor: colors.slate[700],
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
  previewHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text.primary,
  },
  clearButton: {
    fontSize: 14,
    color: colors.red[400],
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
  actionButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  analyzeButton: {
    flex: 1,
    backgroundColor: colors.slate[700],
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  analyzeButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text.primary,
  },
  extractButton: {
    flex: 1,
    backgroundColor: colors.primary[600],
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  extractButtonText: {
    fontSize: 14,
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
    marginBottom: 16,
  },
  analysisGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 12,
    marginBottom: 12,
  },
  analysisItem: {
    width: '50%',
    marginBottom: 12,
  },
  analysisLabel: {
    fontSize: 12,
    color: colors.text.muted,
  },
  analysisValue: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text.primary,
    marginTop: 2,
  },
  columnsBox: {
    backgroundColor: colors.slate[800],
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
  },
  columnsLabel: {
    fontSize: 12,
    color: colors.text.muted,
    marginBottom: 4,
  },
  columnsText: {
    fontSize: 12,
    color: colors.text.secondary,
  },
  insightsBox: {
    backgroundColor: colors.info.bg,
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: colors.info.border,
  },
  insightsLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.info.text,
    marginBottom: 8,
  },
  insightText: {
    fontSize: 12,
    color: colors.text.secondary,
    marginBottom: 4,
  },
  warningsBox: {
    backgroundColor: colors.warning.bg,
    borderRadius: 8,
    padding: 12,
    borderWidth: 1,
    borderColor: colors.warning.border,
  },
  warningsLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.warning.text,
    marginBottom: 8,
  },
  warningText: {
    fontSize: 12,
    color: colors.text.secondary,
    marginBottom: 4,
  },
  resultMeta: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 12,
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
  previewRecords: {
    marginBottom: 16,
  },
  previewLabel: {
    fontSize: 12,
    color: colors.text.muted,
    marginBottom: 8,
  },
  recordPreview: {
    backgroundColor: colors.slate[800],
    borderRadius: 8,
    padding: 8,
    marginBottom: 8,
  },
  recordText: {
    fontSize: 10,
    color: colors.text.secondary,
    fontFamily: 'monospace',
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
  noImportBox: {
    backgroundColor: colors.slate[800],
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  noImportText: {
    fontSize: 13,
    color: colors.text.muted,
    textAlign: 'center',
  },
  errorBox: {
    backgroundColor: colors.danger.bg,
    borderRadius: 8,
    padding: 12,
    borderWidth: 1,
    borderColor: colors.danger.border,
  },
  errorText: {
    fontSize: 13,
    color: colors.danger.text,
  },
  spacer: {
    height: 32,
  },
});

export default DataInjectionScreen;
