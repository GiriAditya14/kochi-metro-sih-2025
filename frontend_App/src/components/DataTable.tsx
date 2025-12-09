import React from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import { Card } from './Card';

interface Column {
  key: string;
  title: string;
  render?: (value: any, row: any) => React.ReactNode;
}

interface DataTableProps {
  title?: string;
  columns: Column[];
  data: any[];
  emptyMessage?: string;
}

export const DataTable: React.FC<DataTableProps> = ({ 
  title, 
  columns, 
  data, 
  emptyMessage = 'No data available' 
}) => {
  return (
    <Card>
      {title && <Text style={styles.title}>{title}</Text>}
      <ScrollView horizontal showsHorizontalScrollIndicator={true}>
        <View>
          {/* Header */}
          <View style={styles.headerRow}>
            {columns.map((col) => (
              <View key={col.key} style={styles.headerCell}>
                <Text style={styles.headerText}>{col.title}</Text>
              </View>
            ))}
          </View>
          
          {/* Body */}
          {data.length > 0 ? (
            data.map((row, rowIndex) => (
              <View key={rowIndex} style={[styles.row, rowIndex % 2 === 0 ? styles.evenRow : {}]}>
                {columns.map((col) => (
                  <View key={col.key} style={styles.cell}>
                    {col.render ? (
                      col.render(row[col.key], row)
                    ) : (
                      <Text style={styles.cellText}>{row[col.key]}</Text>
                    )}
                  </View>
                ))}
              </View>
            ))
          ) : (
            <View style={styles.emptyRow}>
              <Text style={styles.emptyText}>{emptyMessage}</Text>
            </View>
          )}
        </View>
      </ScrollView>
    </Card>
  );
};

const styles = StyleSheet.create({
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 16,
  },
  headerRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
    paddingBottom: 12,
  },
  headerCell: {
    width: 120,
    paddingHorizontal: 8,
  },
  headerText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#6b7280',
    textTransform: 'uppercase',
  },
  row: {
    flexDirection: 'row',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  evenRow: {
    backgroundColor: '#f9fafb',
  },
  cell: {
    width: 120,
    paddingHorizontal: 8,
    justifyContent: 'center',
  },
  cellText: {
    fontSize: 14,
    color: '#374151',
  },
  emptyRow: {
    paddingVertical: 32,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 14,
    color: '#6b7280',
  },
});
