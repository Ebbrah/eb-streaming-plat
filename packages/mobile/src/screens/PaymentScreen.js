import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  SafeAreaView,
  ScrollView,
  Alert,
  ActivityIndicator,
  TextInput,
} from 'react-native';
import { useAuth } from '../context/AuthContext';
import { Ionicons } from '@expo/vector-icons';
import axios from 'axios';
import { API_URL } from '../config';

const PAYMENT_PROVIDERS = [
  {
    id: 'mpesa',
    name: 'M-PESA',
    description: 'Pay using M-PESA mobile money',
    icon: 'phone-portrait'
  },
  {
    id: 'mix',
    name: 'Mix Payment',
    description: 'Pay using credit/debit card',
    icon: 'card'
  }
];

const PaymentScreen = ({ navigation, route }) => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [subscriptionStatus, setSubscriptionStatus] = useState(null);
  const [phoneNumber, setPhoneNumber] = useState('');

  useEffect(() => {
    checkSubscriptionStatus();
  }, []);

  const checkSubscriptionStatus = async () => {
    try {
      const response = await axios.get(
        `${API_URL}/api/payments/subscription`,
        {
          headers: {
            'Authorization': `Bearer ${user.token}`,
            'Content-Type': 'application/json'
          }
        }
      );

      if (response.data.success) {
        setSubscriptionStatus(response.data.data);
      }
    } catch (error) {
      console.error('Error checking subscription:', error.response?.data || error.message);
    }
  };

  const handlePayment = async (provider) => {
    if (!phoneNumber) {
      Alert.alert('Error', 'Please enter your phone number');
      return;
    }

    try {
      setLoading(true);
      const response = await axios.post(
        `${API_URL}/api/payments/${provider}`,
        {
          amount: 5.99,
          phoneNumber,
          description: 'Monthly Subscription'
        },
        {
          headers: {
            'Authorization': `Bearer ${user.token}`,
            'Content-Type': 'application/json'
          }
        }
      );

      if (response.data.success) {
        if (provider === 'mpesa') {
          Alert.alert(
            'M-PESA Payment',
            'Please check your phone for the M-PESA prompt and enter your PIN to complete the payment.',
            [
              {
                text: 'OK',
                onPress: () => verifyPayment(response.data.data.paymentId, provider)
              }
            ]
          );
        } else {
          // Handle Mix payment response
          Alert.alert(
            'Payment Initiated',
            'Please complete the payment in the next screen.',
            [
              {
                text: 'OK',
                onPress: () => verifyPayment(response.data.data.paymentId, provider)
              }
            ]
          );
        }
      } else {
        Alert.alert('Error', response.data.message || 'Failed to initiate payment');
      }
    } catch (error) {
      console.error('Payment error:', error.response?.data || error.message);
      Alert.alert(
        'Error',
        error.response?.data?.message || 'Failed to process payment. Please try again.'
      );
    } finally {
      setLoading(false);
    }
  };

  const verifyPayment = async (paymentId, provider) => {
    try {
      setLoading(true);
      const response = await axios.post(
        `${API_URL}/api/payments/verify`,
        {
          paymentId,
          provider
        },
        {
          headers: {
            'Authorization': `Bearer ${user.token}`,
            'Content-Type': 'application/json'
          }
        }
      );

      if (response.data.success) {
        Alert.alert(
          'Success',
          'Your payment has been processed successfully!',
          [
            {
              text: 'OK',
              onPress: () => {
                checkSubscriptionStatus();
                navigation.navigate('Home');
              }
            }
          ]
        );
      } else {
        Alert.alert('Error', response.data.message || 'Payment verification failed');
      }
    } catch (error) {
      console.error('Verification error:', error.response?.data || error.message);
      Alert.alert(
        'Error',
        error.response?.data?.message || 'Failed to verify payment. Please contact support.'
      );
    } finally {
      setLoading(false);
    }
  };

  const cancelSubscription = async () => {
    try {
      setLoading(true);
      const response = await axios.post(
        `${API_URL}/api/payments/subscription/cancel`,
        {},
        {
          headers: {
            'Authorization': `Bearer ${user.token}`,
            'Content-Type': 'application/json'
          }
        }
      );

      if (response.data.success) {
        Alert.alert('Success', 'Your subscription has been cancelled.');
        checkSubscriptionStatus();
      } else {
        Alert.alert('Error', response.data.message || 'Failed to cancel subscription');
      }
    } catch (error) {
      console.error('Cancellation error:', error.response?.data || error.message);
      Alert.alert(
        'Error',
        error.response?.data?.message || 'Failed to cancel subscription. Please try again.'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
        <Ionicons name="arrow-back" size={24} color="#fff" />
      </TouchableOpacity>
      
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.content}>
          <Text style={styles.title}>Choose Payment Method</Text>
          <Text style={styles.subtitle}>Select your preferred payment method</Text>

          <TextInput
            style={styles.input}
            placeholder="Enter your phone number"
            placeholderTextColor="#888"
            value={phoneNumber}
            onChangeText={setPhoneNumber}
            keyboardType="phone-pad"
          />

          {PAYMENT_PROVIDERS.map((provider) => (
            <TouchableOpacity
              key={provider.id}
              style={styles.providerCard}
              onPress={() => handlePayment(provider.id)}
              disabled={loading}
            >
              <View style={styles.providerHeader}>
                <Ionicons name={provider.icon} size={24} color="#6A0DAD" />
                <Text style={styles.providerName}>{provider.name}</Text>
              </View>
              <Text style={styles.providerDescription}>{provider.description}</Text>
            </TouchableOpacity>
          ))}

          {subscriptionStatus?.status === 'active' && (
            <TouchableOpacity
              style={styles.cancelButton}
              onPress={cancelSubscription}
              disabled={loading}
            >
              <Text style={styles.cancelButtonText}>Cancel Subscription</Text>
            </TouchableOpacity>
          )}

          {loading && (
            <View style={styles.loadingOverlay}>
              <ActivityIndicator size="large" color="#6A0DAD" />
            </View>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F3E5F5',
  },
  backButton: {
    position: 'absolute',
    top: 50,
    left: 20,
    zIndex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingVertical: 20,
    paddingHorizontal: 20,
  },
  content: {
    width: '100%',
    alignItems: 'center',
    padding: 20,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#6A0DAD',
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    marginBottom: 30,
  },
  providerCard: {
    width: '100%',
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 20,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#E1BEE7',
  },
  providerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  providerName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#6A0DAD',
    marginLeft: 10,
  },
  providerDescription: {
    fontSize: 14,
    color: '#666',
  },
  cancelButton: {
    backgroundColor: '#ff6b6b',
    paddingVertical: 15,
    paddingHorizontal: 30,
    borderRadius: 5,
    width: '100%',
    marginTop: 20,
  },
  cancelButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  input: {
    width: '100%',
    height: 50,
    backgroundColor: '#fff',
    borderRadius: 5,
    paddingHorizontal: 15,
    color: '#000',
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#E1BEE7',
  },
});

export default PaymentScreen; 