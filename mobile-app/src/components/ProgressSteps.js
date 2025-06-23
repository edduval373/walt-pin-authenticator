import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

export default function ProgressSteps({ currentStep }) {
  const steps = [
    { number: 1, label: 'Start' },
    { number: 2, label: 'Photo' },
    { number: 3, label: 'Check' },
    { number: 4, label: 'Results' }
  ];

  return (
    <View style={styles.container}>
      {steps.map((step, index) => (
        <React.Fragment key={step.number}>
          <View style={styles.stepContainer}>
            <View style={[
              styles.stepCircle,
              currentStep === step.number && styles.activeStepCircle
            ]}>
              <Text style={[
                styles.stepNumber,
                currentStep === step.number && styles.activeStepNumber
              ]}>
                {step.number}
              </Text>
            </View>
            <Text style={[
              styles.stepLabel,
              currentStep === step.number && styles.activeStepLabel
            ]}>
              {step.label}
            </Text>
          </View>
          
          {index < steps.length - 1 && (
            <View style={styles.connector} />
          )}
        </React.Fragment>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 30,
    paddingHorizontal: 20,
  },
  stepContainer: {
    alignItems: 'center',
  },
  stepCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#d1d5db',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  activeStepCircle: {
    backgroundColor: '#4f46e5',
  },
  stepNumber: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#6b7280',
  },
  activeStepNumber: {
    color: 'white',
  },
  stepLabel: {
    fontSize: 12,
    color: '#6b7280',
    fontWeight: '500',
  },
  activeStepLabel: {
    color: '#4f46e5',
    fontWeight: '600',
  },
  connector: {
    flex: 1,
    height: 2,
    backgroundColor: '#d1d5db',
    marginHorizontal: 8,
    marginBottom: 16,
    maxWidth: 40,
  },
});