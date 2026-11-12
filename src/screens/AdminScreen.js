import React, { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    Image,
    Modal,
    SafeAreaView,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { collection, deleteDoc, doc, onSnapshot, query, updateDoc, where } from 'firebase/firestore';
import { auth, db } from '../lib/firebase';
import { cozyTheme } from '../styles/cozyTheme';

export default function AdminScreen({ navigation }) {
  const [pendingSightings, setPendingSightings] = useState([]);
  const [loadingSightings, setLoadingSightings] = useState(true);
  const [selectedSighting, setSelectedSighting] = useState(null);
  const [showSightingModal, setShowSightingModal] = useState(false);
  const [processingAction, setProcessingAction] = useState(false);

  // Fetch pending sightings
  useEffect(() => {
    const q = query(
      collection(db, 'coyoteSightings'),
      where('approved', '==', false)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const sightingsList = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      // Sort by reportedAt date (most recent first)
      sightingsList.sort((a, b) => {
        const dateA = a.reportedAt?.toDate?.() || new Date(0);
        const dateB = b.reportedAt?.toDate?.() || new Date(0);
        return dateB - dateA;
      });
      setPendingSightings(sightingsList);
      setLoadingSightings(false);
    }, (error) => {
      console.error('Error fetching pending sightings:', error);
      setLoadingSightings(false);
    });

    return () => unsubscribe();
  }, []);

  const formatDate = (timestamp) => {
    if (!timestamp?.toDate) return 'Unknown date';
    const date = timestamp.toDate();
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit'
    });
  };

  const handleApproveSighting = async (sightingId) => {
    setProcessingAction(true);
    try {
      await updateDoc(doc(db, 'coyoteSightings', sightingId), {
        approved: true,
        approvedBy: auth.currentUser?.uid,
        approvedAt: new Date()
      });
      Alert.alert('Success', 'Sighting has been approved and will now appear on the map.');
      setShowSightingModal(false);
      setSelectedSighting(null);
    } catch (error) {
      console.error('Error approving sighting:', error);
      Alert.alert('Error', 'Failed to approve sighting. Please try again.');
    } finally {
      setProcessingAction(false);
    }
  };

  const handleRejectSighting = async (sightingId) => {
    Alert.alert(
      'Reject Sighting',
      'Are you sure you want to reject and delete this sighting? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reject',
          style: 'destructive',
          onPress: async () => {
            setProcessingAction(true);
            try {
              await deleteDoc(doc(db, 'coyoteSightings', sightingId));
              Alert.alert('Success', 'Sighting has been rejected and removed.');
              setShowSightingModal(false);
              setSelectedSighting(null);
            } catch (error) {
              console.error('Error rejecting sighting:', error);
              Alert.alert('Error', 'Failed to reject sighting. Please try again.');
            } finally {
              setProcessingAction(false);
            }
          }
        }
      ]
    );
  };

  const openSightingDetails = (sighting) => {
    setSelectedSighting(sighting);
    setShowSightingModal(true);
  };

  const getAlertLevelLabel = (alertLevel) => {
    switch (alertLevel) {
      case 'sighting':
        return { emoji: '🟢', text: 'Sighting Only (Low Risk)' };
      case 'medium':
        return { emoji: '🟡', text: 'Medium Risk' };
      case 'high':
        return { emoji: '🔴', text: 'High Risk' };
      case 'warning':
        return { emoji: '🟡', text: 'Medium Risk' };
      case 'danger':
        return { emoji: '🔴', text: 'High Risk' };
      default:
        return { emoji: '⚪', text: 'Not specified' };
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView}>
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Text style={styles.backButtonText}>← Back</Text>
          </TouchableOpacity>
          <Text style={styles.title}>Admin Panel</Text>
        </View>

        <View style={styles.content}>
          <Text style={styles.sectionTitle}>Pending Sighting Approvals</Text>
          <Text style={styles.sectionSubtitle}>
            Review and approve sightings before they appear on the map
          </Text>

          {loadingSightings ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={cozyTheme.colors.primary} />
              <Text style={styles.loadingText}>Loading pending sightings...</Text>
            </View>
          ) : pendingSightings.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyIcon}>✅</Text>
              <Text style={styles.emptyText}>No pending sightings to review</Text>
            </View>
          ) : (
            <View style={styles.sightingsList}>
              {pendingSightings.map((sighting) => {
                const alertInfo = getAlertLevelLabel(sighting.alertLevel);
                return (
                  <TouchableOpacity
                    key={sighting.id}
                    style={styles.sightingCard}
                    onPress={() => openSightingDetails(sighting)}
                    activeOpacity={0.7}
                  >
                    <View style={styles.sightingCardHeader}>
                      <Text style={styles.sightingDate}>
                        {formatDate(sighting.reportedAt)}
                      </Text>
                      <Text style={styles.alertBadge}>
                        {alertInfo.emoji} {alertInfo.text}
                      </Text>
                    </View>
                    <Text style={styles.sightingDescription} numberOfLines={2}>
                      {sighting.description || 'No description provided'}
                    </Text>
                    <Text style={styles.sightingReporter}>
                      Reported by: {sighting.reporterName || sighting.reporterEmail || 'Anonymous'}
                    </Text>
                    <Text style={styles.tapToReview}>Tap to review →</Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          )}
        </View>
      </ScrollView>

      {/* Sighting Details Modal */}
      <Modal
        visible={showSightingModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowSightingModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <ScrollView showsVerticalScrollIndicator={false}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Review Sighting</Text>
                <TouchableOpacity
                  style={styles.modalCloseButton}
                  onPress={() => setShowSightingModal(false)}
                >
                  <Text style={styles.modalCloseText}>✕</Text>
                </TouchableOpacity>
              </View>

              {selectedSighting && (
                <>
                  <View style={styles.detailSection}>
                    <Text style={styles.detailLabel}>Date Reported</Text>
                    <Text style={styles.detailValue}>
                      {formatDate(selectedSighting.reportedAt)}
                    </Text>
                  </View>

                  <View style={styles.detailSection}>
                    <Text style={styles.detailLabel}>Sighting Date/Time</Text>
                    <Text style={styles.detailValue}>
                      {selectedSighting.timestamp ? 
                        (selectedSighting.timestamp.toDate ? 
                          selectedSighting.timestamp.toDate().toLocaleString() : 
                          new Date(selectedSighting.timestamp).toLocaleString()
                        ) : 'Not specified'}
                    </Text>
                  </View>

                  <View style={styles.detailSection}>
                    <Text style={styles.detailLabel}>Location</Text>
                    <Text style={styles.detailValue}>
                      {selectedSighting.latitude?.toFixed(5)}, {selectedSighting.longitude?.toFixed(5)}
                    </Text>
                    {(selectedSighting.locationAddress || selectedSighting.location) ? (
                      <Text style={[styles.detailValue, styles.detailValueMuted]}>
                        {selectedSighting.locationAddress || selectedSighting.location}
                      </Text>
                    ) : null}
                  </View>

                  <View style={styles.detailSection}>
                    <Text style={styles.detailLabel}>Alert Level</Text>
                    <Text style={styles.detailValue}>
                      {getAlertLevelLabel(selectedSighting.alertLevel).emoji} {getAlertLevelLabel(selectedSighting.alertLevel).text}
                    </Text>
                  </View>

                  <View style={styles.detailSection}>
                    <Text style={styles.detailLabel}>Encounter Type</Text>
                    <Text style={styles.detailValue}>
                      {selectedSighting.encounterType || 'Not specified'}
                    </Text>
                  </View>

                  <View style={styles.detailSection}>
                    <Text style={styles.detailLabel}>Description</Text>
                    <Text style={styles.detailValue}>
                      {selectedSighting.description || 'No description provided'}
                    </Text>
                  </View>

                  <View style={styles.detailSection}>
                    <Text style={styles.detailLabel}>Hazing Attempted</Text>
                    <Text style={styles.detailValue}>
                      {selectedSighting.hazingAttempted || 'Not specified'}
                    </Text>
                  </View>

                  <View style={styles.detailSection}>
                    <Text style={styles.detailLabel}>Coyote Sick/Injured</Text>
                    <Text style={styles.detailValue}>
                      {selectedSighting.coyoteSickInjured || 'Not specified'}
                    </Text>
                  </View>

                  <View style={styles.detailSection}>
                    <Text style={styles.detailLabel}>Wildlife Feeding Nearby</Text>
                    <Text style={styles.detailValue}>
                      {selectedSighting.wildlifeFeeding || 'Not specified'}
                    </Text>
                  </View>

                  <View style={styles.detailSection}>
                    <Text style={styles.detailLabel}>Reporter Info</Text>
                    <Text style={styles.detailValue}>
                      {selectedSighting.reporterName && `Name: ${selectedSighting.reporterName}\n`}
                      {selectedSighting.reporterEmail && `Email: ${selectedSighting.reporterEmail}\n`}
                      {selectedSighting.reporterPhone && `Phone: ${selectedSighting.reporterPhone}`}
                      {!selectedSighting.reporterName && !selectedSighting.reporterEmail && !selectedSighting.reporterPhone && 'Anonymous'}
                    </Text>
                  </View>

                  {selectedSighting.mediaUrls && selectedSighting.mediaUrls.length > 0 && (
                    <View style={styles.detailSection}>
                      <Text style={styles.detailLabel}>Media Attachments</Text>
                      <View style={styles.mediaContainer}>
                        {selectedSighting.mediaUrls.map((media, index) => (
                          <View key={index} style={styles.mediaThumbnail}>
                            <Image
                              source={{ uri: media.url }}
                              style={styles.mediaImage}
                              resizeMode="cover"
                            />
                          </View>
                        ))}
                      </View>
                    </View>
                  )}

                  <View style={styles.actionButtons}>
                    <TouchableOpacity
                      style={[styles.rejectButton, processingAction && styles.buttonDisabled]}
                      onPress={() => handleRejectSighting(selectedSighting.id)}
                      disabled={processingAction}
                    >
                      {processingAction ? (
                        <ActivityIndicator color="#fff" size="small" />
                      ) : (
                        <Text style={styles.rejectButtonText}>Reject</Text>
                      )}
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={[styles.approveButton, processingAction && styles.buttonDisabled]}
                      onPress={() => handleApproveSighting(selectedSighting.id)}
                      disabled={processingAction}
                    >
                      {processingAction ? (
                        <ActivityIndicator color="#fff" size="small" />
                      ) : (
                        <Text style={styles.approveButtonText}>Approve</Text>
                      )}
                    </TouchableOpacity>
                  </View>
                </>
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: cozyTheme.colors.background,
  },
  scrollView: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 15,
    marginTop: 50,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  backButton: {
    marginRight: 15,
  },
  backButtonText: {
    fontSize: 16,
    color: cozyTheme.colors.primary,
    fontWeight: '500',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: cozyTheme.colors.textPrimary,
  },
  content: {
    padding: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: cozyTheme.colors.textPrimary,
    marginBottom: 20,
  },
  sectionSubtitle: {
    fontSize: 14,
    color: cozyTheme.colors.textLight,
    marginBottom: 20,
  },
  loadingContainer: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: cozyTheme.colors.textLight,
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 40,
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: 12,
  },
  emptyText: {
    fontSize: 16,
    color: cozyTheme.colors.textLight,
  },
  sightingsList: {
    gap: 12,
  },
  sightingCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    marginBottom: 12,
  },
  sightingCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
    flexWrap: 'wrap',
  },
  sightingDate: {
    fontSize: 14,
    fontWeight: '600',
    color: cozyTheme.colors.textPrimary,
  },
  alertBadge: {
    fontSize: 12,
    color: cozyTheme.colors.textSecondary,
    backgroundColor: '#f0f0f0',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  sightingDescription: {
    fontSize: 14,
    color: cozyTheme.colors.textSecondary,
    lineHeight: 20,
    marginBottom: 8,
  },
  sightingReporter: {
    fontSize: 12,
    color: cozyTheme.colors.textLight,
    marginBottom: 4,
  },
  tapToReview: {
    fontSize: 12,
    color: cozyTheme.colors.primary,
    fontWeight: '500',
    textAlign: 'right',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    width: '100%',
    maxHeight: '85%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
    paddingBottom: 12,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: cozyTheme.colors.textPrimary,
  },
  modalCloseButton: {
    padding: 8,
  },
  modalCloseText: {
    fontSize: 24,
    color: cozyTheme.colors.textLight,
  },
  detailSection: {
    marginBottom: 16,
  },
  detailLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: cozyTheme.colors.textLight,
    marginBottom: 4,
    textTransform: 'uppercase',
  },
  detailValue: {
    fontSize: 15,
    color: cozyTheme.colors.textPrimary,
    lineHeight: 22,
  },
  detailValueMuted: {
    marginTop: 6,
    fontSize: 14,
    color: cozyTheme.colors.textSecondary,
  },
  mediaContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 8,
  },
  mediaThumbnail: {
    width: 80,
    height: 80,
    borderRadius: 8,
    overflow: 'hidden',
  },
  mediaImage: {
    width: '100%',
    height: '100%',
  },
  videoPlaceholder: {
    width: '100%',
    height: '100%',
    backgroundColor: '#2c3e50',
    justifyContent: 'center',
    alignItems: 'center',
  },
  videoIcon: {
    fontSize: 24,
    color: '#fff',
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 24,
    gap: 12,
  },
  rejectButton: {
    flex: 1,
    backgroundColor: '#e74c3c',
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
  },
  rejectButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  approveButton: {
    flex: 1,
    backgroundColor: '#27ae60',
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
  },
  approveButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  buttonDisabled: {
    opacity: 0.6,
  },
});