import React from "react";
import { View, Text, StyleSheet } from "react-native";

const styles = StyleSheet.create({
  summaryCard: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  summaryLabel: {
    color: "#4b5563",
    fontSize: 14,
    fontWeight: "500",
  },
  summaryValue: {
    color: "#111827",
    fontSize: 32,
    fontWeight: "700",
    marginTop: 8,
  },
  summarySubtitle: {
    color: "#6b7280",
    fontSize: 12,
    marginTop: 4,
  },
  listCard: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  listCardContent: {
    flex: 1,
  },
  listCardTitle: {
    color: "#111827",
    fontWeight: "600",
    fontSize: 16,
  },
  listCardValue: {
    color: "#6b7280",
    fontSize: 14,
    marginTop: 4,
  },
  scoreBadge: {
    backgroundColor: "#dbeafe",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  scoreText: {
    color: "#1e3a8a",
    fontWeight: "700",
    fontSize: 14,
  },
  conflictCard: {
    borderLeftWidth: 4,
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
  },
  conflictCritical: {
    backgroundColor: "#fef2f2",
    borderLeftColor: "#ef4444",
  },
  conflictHigh: {
    backgroundColor: "#fff7ed",
    borderLeftColor: "#f97316",
  },
  conflictMedium: {
    backgroundColor: "#fefce8",
    borderLeftColor: "#eab308",
  },
  conflictLow: {
    backgroundColor: "#f0fdf4",
    borderLeftColor: "#22c55e",
  },
  conflictTextCritical: {
    color: "#7f1d1d",
  },
  conflictTextHigh: {
    color: "#7c2d12",
  },
  conflictTextMedium: {
    color: "#713f12",
  },
  conflictTextLow: {
    color: "#15803d",
  },
  conflictText: {
    fontWeight: "600",
    fontSize: 14,
    textTransform: "capitalize",
  },
});

interface CardProps {
  title: string;
  value: string | number;
  subtitle?: string;
}

export const SummaryCard: React.FC<CardProps> = ({ title, value, subtitle }) => {
  return (
    <View style={styles.summaryCard}>
      <Text style={styles.summaryLabel}>{title}</Text>
      <Text style={styles.summaryValue}>{value}</Text>
      {subtitle && <Text style={styles.summarySubtitle}>{subtitle}</Text>}
    </View>
  );
};

interface ListCardProps {
  title: string;
  value: string;
  score?: number;
}

export const ListCard: React.FC<ListCardProps> = ({ title, value, score }) => {
  return (
    <View style={styles.listCard}>
      <View style={styles.listCardContent}>
        <Text style={styles.listCardTitle}>{title}</Text>
        <Text style={styles.listCardValue}>{value}</Text>
      </View>
      {score && (
        <View style={styles.scoreBadge}>
          <Text style={styles.scoreText}>{score}</Text>
        </View>
      )}
    </View>
  );
};

interface ConflictCardProps {
  level: "critical" | "high" | "medium" | "low";
  count: number;
}

export const ConflictCard: React.FC<ConflictCardProps> = ({ level, count }) => {
  const levelStyles: Record<string, any> = {
    critical: {
      card: styles.conflictCritical,
      text: styles.conflictTextCritical,
    },
    high: {
      card: styles.conflictHigh,
      text: styles.conflictTextHigh,
    },
    medium: {
      card: styles.conflictMedium,
      text: styles.conflictTextMedium,
    },
    low: {
      card: styles.conflictLow,
      text: styles.conflictTextLow,
    },
  };

  const style = levelStyles[level];

  return (
    <View style={[styles.conflictCard, style.card]}>
      <Text style={[styles.conflictText, style.text]}>
        {level}: {count}
      </Text>
    </View>
  );
};

