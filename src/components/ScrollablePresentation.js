import React, { useState } from 'react';
import {
  Dimensions,
  Image,
  Modal,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';
import { cozyTheme } from '../styles/cozyTheme';

const { width, height } = Dimensions.get('window');

const ScrollablePresentation = () => {
  const [enlargedSlide, setEnlargedSlide] = useState(null);
  const [currentSlideIndex, setCurrentSlideIndex] = useState(0);

  // Your actual PDF slides converted to images
  const slides = [
    {
      id: 1,
      image: require('../../assets/presentation/Coyotes In Your Community - OC Animal Care Presentation-01.jpg'),
      title: "Title Slide"
    },
    {
      id: 2,
      image: require('../../assets/presentation/Coyotes In Your Community - OC Animal Care Presentation-02.jpg'),
      title: "Slide 2"
    },
    // {
    //   id: 3,
    //   image: require('../../assets/presentation/Coyotes In Your Community - OC Animal Care Presentation-03.jpg'),
    //   title: "Slide 3"
    // },
    {
      id: 3,
      image: require('../../assets/presentation/Coyotes In Your Community - OC Animal Care Presentation-04.jpg'),
      title: "Slide 4"
    },
    {
      id: 4,
      image: require('../../assets/presentation/Coyotes In Your Community - OC Animal Care Presentation-05.jpg'),
      title: "Slide 5"
    },
    {
      id: 5,
      image: require('../../assets/presentation/Coyotes In Your Community - OC Animal Care Presentation-06.jpg'),
      title: "Slide 6"
    },
    {
      id: 6,
      image: require('../../assets/presentation/Coyotes In Your Community - OC Animal Care Presentation-07.jpg'),
      title: "Slide 7"
    },
    {
      id: 7,
      image: require('../../assets/presentation/Coyotes In Your Community - OC Animal Care Presentation-08.jpg'),
      title: "Slide 8"
    },
    {
      id: 8,
      image: require('../../assets/presentation/Coyotes In Your Community - OC Animal Care Presentation-09.jpg'),
      title: "Slide 9"
    },
    {
      id: 9,
      image: require('../../assets/presentation/Coyotes In Your Community - OC Animal Care Presentation-10.jpg'),
      title: "Slide 10"
    },
    {
      id: 10,
      image: require('../../assets/presentation/Coyotes In Your Community - OC Animal Care Presentation-11.jpg'),
      title: "Slide 11"
    },
    {
      id: 11,
      image: require('../../assets/presentation/Coyotes In Your Community - OC Animal Care Presentation-12.jpg'),
      title: "Slide 12"
    },
    {
      id: 12,
      image: require('../../assets/presentation/Coyotes In Your Community - OC Animal Care Presentation-13.jpg'),
      title: "Slide 13"
    },
    {
      id: 13,
      image: require('../../assets/presentation/Coyotes In Your Community - OC Animal Care Presentation-14.jpg'),
      title: "Slide 14"
    },
    {
      id: 14,
      image: require('../../assets/presentation/Coyotes In Your Community - OC Animal Care Presentation-15.jpg'),
      title: "Slide 15"
    },
    {
      id: 15,
      image: require('../../assets/presentation/Coyotes In Your Community - OC Animal Care Presentation-16.jpg'),
      title: "Slide 16"
    },
    {
      id: 16,
      image: require('../../assets/presentation/Coyotes In Your Community - OC Animal Care Presentation-17.jpg'),
      title: "Slide 17"
    },
    {
      id: 17,
      image: require('../../assets/presentation/Coyotes In Your Community - OC Animal Care Presentation-18.jpg'),
      title: "Slide 18"
    },
    {
      id: 18,
      image: require('../../assets/presentation/Coyotes In Your Community - OC Animal Care Presentation-19.jpg'),
      title: "Slide 19"
    },
    {
      id: 19,
      image: require('../../assets/presentation/Coyotes In Your Community - OC Animal Care Presentation-20.jpg'),
      title: "Slide 20"
    },
    {
      id: 20,
      image: require('../../assets/presentation/Coyotes In Your Community - OC Animal Care Presentation-21.jpg'),
      title: "Slide 21"
    },
    {
      id: 21,
      image: require('../../assets/presentation/Coyotes In Your Community - OC Animal Care Presentation-22.jpg'),
      title: "Slide 22"
    },
    {
      id: 22,
      image: require('../../assets/presentation/Coyotes In Your Community - OC Animal Care Presentation-23.jpg'),
      title: "Slide 23"
    },
    {
      id: 23,
      image: require('../../assets/presentation/Coyotes In Your Community - OC Animal Care Presentation-24.jpg'),
      title: "Slide 24"
    },
    {
      id: 24,
      image: require('../../assets/presentation/Coyotes In Your Community - OC Animal Care Presentation-25.jpg'),
      title: "Slide 25"
    },
    {
      id: 25,
      image: require('../../assets/presentation/Coyotes In Your Community - OC Animal Care Presentation-26.jpg'),
      title: "Slide 26"
    },
    {
      id: 26,
      image: require('../../assets/presentation/Coyotes In Your Community - OC Animal Care Presentation-27.jpg'),
      title: "Slide 27"
    },
    {
      id: 27,
      image: require('../../assets/presentation/Coyotes In Your Community - OC Animal Care Presentation-28.jpg'),
      title: "Slide 28"
    },
    {
      id: 28,
      image: require('../../assets/presentation/Coyotes In Your Community - OC Animal Care Presentation-29.jpg'),
      title: "Slide 29"
    },
    {
      id: 29,
      image: require('../../assets/presentation/Coyotes In Your Community - OC Animal Care Presentation-30.jpg'),
      title: "Slide 30"
    },
    {
      id: 30,
      image: require('../../assets/presentation/Coyotes In Your Community - OC Animal Care Presentation-31.jpg'),
      title: "Slide 31"
    },
    {
      id: 31,
      image: require('../../assets/presentation/Coyotes In Your Community - OC Animal Care Presentation-32.jpg'),
      title: "Slide 32"
    }
  ];

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView 
        style={styles.scrollContainer}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={true}
        bounces={true}
      >
        <View style={styles.header}>
          <Text style={styles.scrollHint}>Tap to enlarge images</Text>
        </View>
        {slides.map((slide, index) => (
          <TouchableOpacity 
            key={slide.id} 
            style={styles.slideContainer}
            onPress={() => {
              setEnlargedSlide(slide);
              setCurrentSlideIndex(index);
            }}
            activeOpacity={0.8}
          >
            <Image
              source={slide.image}
              style={styles.slideImage}
              resizeMode="contain"
            />
          </TouchableOpacity>
        ))}
        
        <View style={styles.endContainer}>
          <Text style={styles.endText}>📚 End of Presentation</Text>
          <Text style={styles.endSubtext}>Thank you for learning about coyote safety!</Text>
        </View>
      </ScrollView>
      
      {/* Enlarged Image Modal */}
      <Modal
        visible={enlargedSlide !== null}
        transparent={true}
        animationType="fade"
        onRequestClose={() => {
          setEnlargedSlide(null);
          setCurrentSlideIndex(0);
        }}
      >
        <View style={styles.modalOverlay}>
          <TouchableOpacity 
            style={styles.modalCloseArea}
            onPress={() => {
              setEnlargedSlide(null);
              setCurrentSlideIndex(0);
            }}
            activeOpacity={1}
          >
            <View style={styles.modalContent}>
              {enlargedSlide && (
                <>
                  <ScrollView
                    style={styles.enlargedImageContainer}
                    contentContainerStyle={styles.enlargedImageContent}
                    maximumZoomScale={3}
                    minimumZoomScale={1}
                    showsHorizontalScrollIndicator={false}
                    showsVerticalScrollIndicator={false}
                  >
                    <Image
                      source={enlargedSlide.image}
                      style={styles.enlargedImage}
                      resizeMode="contain"
                    />
                  </ScrollView>
                  
                  {/* Up Arrow */}
                  {currentSlideIndex > 0 && (
                    <TouchableOpacity
                      style={styles.upArrow}
                      onPress={() => {
                        const newIndex = currentSlideIndex - 1;
                        setCurrentSlideIndex(newIndex);
                        setEnlargedSlide(slides[newIndex]);
                      }}
                    >
                      <Text style={styles.arrowText}>▲</Text>
                    </TouchableOpacity>
                  )}
                  
                  {/* Down Arrow */}
                  {currentSlideIndex < slides.length - 1 && (
                    <TouchableOpacity
                      style={styles.downArrow}
                      onPress={() => {
                        const newIndex = currentSlideIndex + 1;
                        setCurrentSlideIndex(newIndex);
                        setEnlargedSlide(slides[newIndex]);
                      }}
                    >
                      <Text style={styles.arrowText}>▼</Text>
                    </TouchableOpacity>
                  )}
                  
                  {/* Slide Counter */}
                  <View style={styles.slideCounter}>
                    <Text style={styles.slideCounterText}>
                      {currentSlideIndex + 1} / {slides.length}
                    </Text>
                  </View>
                </>
              )}
              <TouchableOpacity 
                style={styles.closeButton}
                onPress={() => {
                  setEnlargedSlide(null);
                  setCurrentSlideIndex(0);
                }}
              >
                <Text style={styles.closeButtonText}>✕</Text>
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    padding: 8,
    alignItems: 'center',
    margin: 4,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: cozyTheme.colors.textPrimary,
    marginBottom: 6,
    textAlign: 'center',
    fontFamily: cozyTheme.typography.primary,
  },
  headerSubtitle: {
    fontSize: 16,
    color: cozyTheme.colors.textSecondary,
    marginBottom: 8,
    textAlign: 'center',
    fontFamily: cozyTheme.typography.secondary,
  },
  scrollHint: {
    fontSize: 16,
    color: cozyTheme.colors.textSecondary,
    fontStyle: 'italic',
    textAlign: 'center',
    fontFamily: cozyTheme.typography.secondary,
    marginTop: 2,
  },
  scrollContainer: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 20,
  },
  slideContainer: {
    marginHorizontal: 16,
    marginVertical: 4,
    backgroundColor: cozyTheme.colors.surface,
    borderRadius: 8,
    overflow: 'hidden',
    borderWidth: 0.5,
    borderColor: '#E0E0E0',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 4,
  },
  slideImage: {
    width: width - 40,
    height: undefined,
    aspectRatio: 16/9,
    maxWidth: '100%',
    borderRadius: 4,
  },
  endContainer: {
    margin: 20,
    padding: 32,
    backgroundColor: cozyTheme.colors.accent,
    borderRadius: 28,
    alignItems: 'center',
    borderWidth: 4,
    borderColor: '#000',
    borderStyle: 'dashed',
    ...cozyTheme.shadows.large,
  },
  endText: {
    fontSize: 28,
    fontWeight: 'bold',
    color: cozyTheme.colors.textPrimary,
    marginBottom: 12,
    textAlign: 'center',
    fontFamily: cozyTheme.typography.primary,
  },
  endSubtext: {
    fontSize: 18,
    color: cozyTheme.colors.textSecondary,
    textAlign: 'center',
    lineHeight: 26,
    fontWeight: '500',
    fontFamily: cozyTheme.typography.secondary,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalCloseArea: {
    flex: 1,
    width: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    width: '95%',
    height: '90%',
    position: 'relative',
  },
  enlargedImageContainer: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  enlargedImageContent: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  enlargedImage: {
    width: width * 0.95,
    height: height * 0.8,
    maxWidth: '100%',
    maxHeight: '100%',
  },
  closeButton: {
    position: 'absolute',
    top: 20,
    right: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    borderRadius: 20,
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  closeButtonText: {
    color: 'white',
    fontSize: 20,
    fontWeight: 'bold',
  },
  upArrow: {
    position: 'absolute',
    left: '50%',
    top: '20%',
    transform: [{ translateX: -25 }],
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    borderRadius: 25,
    width: 50,
    height: 50,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  downArrow: {
    position: 'absolute',
    left: '50%',
    bottom: '20%',
    transform: [{ translateX: -25 }],
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    borderRadius: 25,
    width: 50,
    height: 50,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  arrowText: {
    color: 'white',
    fontSize: 30,
    fontWeight: 'bold',
  },
  slideCounter: {
    position: 'absolute',
    bottom: 20,
    left: '50%',
    transform: [{ translateX: -50 }],
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    borderRadius: 15,
    paddingHorizontal: 15,
    paddingVertical: 8,
    zIndex: 1000,
  },
  slideCounterText: {
    color: 'white',
    fontSize: 14,
    fontWeight: 'bold',
  },
});

export default ScrollablePresentation;
