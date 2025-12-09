import React from "react";
import { TouchableOpacity, Text, TextInput, View, StyleSheet } from "react-native";

const styles = StyleSheet.create({
  button: {
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 24,
    alignItems: "center",
    marginBottom: 12,
  },
  buttonPrimary: {
    backgroundColor: "#2563eb",
  },
  buttonSecondary: {
    backgroundColor: "#e5e7eb",
  },
  buttonText: {
    fontWeight: "600",
    fontSize: 16,
  },
  buttonTextPrimary: {
    color: "#fff",
  },
  buttonTextSecondary: {
    color: "#1f2937",
  },
  inputContainer: {
    marginBottom: 16,
  },
  inputLabel: {
    color: "#374151",
    fontWeight: "600",
    marginBottom: 8,
    fontSize: 14,
  },
  input: {
    borderWidth: 1,
    borderColor: "#d1d5db",
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: "#fff",
    fontSize: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#111827",
    marginTop: 16,
    marginBottom: 12,
  },
});

interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: "primary" | "secondary";
  disabled?: boolean;
}

export const Button: React.FC<ButtonProps> = ({
  title,
  onPress,
  variant = "primary",
  disabled = false,
}) => {
  const bgColor = variant === "primary" ? styles.buttonPrimary : styles.buttonSecondary;
  const textColor = variant === "primary" ? styles.buttonTextPrimary : styles.buttonTextSecondary;
  const opacity = disabled ? 0.5 : 1;

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled}
      style={[styles.button, bgColor, { opacity }]}
    >
      <Text style={[styles.buttonText, textColor]}>{title}</Text>
    </TouchableOpacity>
  );
};

interface InputFieldProps {
  label: string;
  placeholder: string;
  value: string;
  onChangeText: (text: string) => void;
}

export const InputField: React.FC<InputFieldProps> = ({
  label,
  placeholder,
  value,
  onChangeText,
}) => {
  return (
    <View style={styles.inputContainer}>
      <Text style={styles.inputLabel}>{label}</Text>
      <TextInput
        style={styles.input}
        placeholder={placeholder}
        value={value}
        onChangeText={onChangeText}
        placeholderTextColor="#999"
      />
    </View>
  );
};

interface SectionTitleProps {
  title: string;
}

export const SectionTitle: React.FC<SectionTitleProps> = ({ title }) => {
  return <Text style={styles.sectionTitle}>{title}</Text>;
};

