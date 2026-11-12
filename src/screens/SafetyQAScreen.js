import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
import {
  Image,
  LayoutAnimation,
  Linking,
  Platform,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  UIManager,
  View
} from 'react-native';
import ScrollablePresentation from '../components/ScrollablePresentation';
import { cozyTheme } from '../styles/cozyTheme';
import { sharedStyles } from '../styles/sharedStyles';

// Enable LayoutAnimation on Android
if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

const faqData = [
  {
    id: 1,
    category: "Before an Encounter",
    icon: "🚶‍♂️",
    questions: [
      {
        question: "How can I prevent coyote encounters?",
        answer: "• Never feed coyotes or leave food outside\n• Secure garbage cans with tight-fitting lids\n• Remove fallen fruit from trees\n• Keep pet food indoors\n• Install motion-activated lights\n• Remove water sources like leaky faucets\n• Clear brush and dense vegetation near your home"
      },
      {
        question: "What should I do to protect my pets?",
        answer: "• Keep cats indoors, especially at night\n• Walk dogs on a leash, particularly during dawn and dusk\n• Supervise small dogs in your yard\n• Install coyote-proof fencing (at least 6 feet high)\n• Consider a coyote vest for small dogs\n• Don't let pets roam freely outdoors"
      },
      {
        question: "When are coyotes most active?",
        answer: "• Coyotes are most active during dawn and dusk (crepuscular)\n• They may also be active at night\n• During pupping season (spring), they may be more active during the day\n• Urban coyotes can adapt to human schedules and may be active anytime"
      }
    ]
  },
  {
    id: 2,
    category: "During an Encounter",
    icon: "⚠️",
    questions: [
      {
        question: "What should I do if I see a coyote?",
        answer: "• Stay calm and don't run\n• Make yourself appear large by raising your arms\n• Back away slowly while facing the coyote\n• Make loud noises - shout, clap, or use a whistle\n• Throw objects near (not at) the coyote\n• Maintain eye contact\n• Give the coyote space to escape"
      },
      {
        question: "Should I run if I encounter a coyote?",
        answer: "• NEVER run from a coyote\n• Running triggers their chase instinct\n• Instead, back away slowly while facing the animal\n• Make yourself appear large and intimidating\n• Use hazing techniques to encourage them to leave"
      },
      {
        question: "What is 'hazing' and how do I do it?",
        answer: "Hazing means scaring coyotes to make them avoid humans:\n• Yell loudly and wave your arms\n• Bang pots and pans together\n• Use an air horn or whistle\n• Spray them with a hose\n• Throw tennis balls or small rocks near them\n• Use motion-activated sprinklers\n• The goal is to make them uncomfortable, not hurt them"
      },
      {
        question: "What if a coyote approaches me or my pet?",
        answer: "• Pick up small children or pets immediately\n• Don't turn your back on the coyote\n• Make loud noises and throw objects\n• Use bear spray if available and the coyote is very close\n• Fight back if attacked - coyotes usually retreat when confronted\n• Report aggressive behavior to local wildlife authorities"
      }
    ]
  },
  {
    id: 3,
    category: "After an Encounter",
    icon: "📞",
    questions: [
      {
        question: "Should I report a coyote sighting?",
        answer: "• Report aggressive or unusual behavior immediately\n• Use this app to report sightings for community awareness\n• Contact local animal control for aggressive animals\n• Report sick or injured coyotes to wildlife authorities\n• Normal sightings help track population and behavior patterns"
      },
      {
        question: "What if my pet was attacked?",
        answer: "• Seek immediate veterinary care\n• Document injuries with photos\n• Report the incident to local animal control\n• Report the attack location in this app\n• Contact your local health department\n• Consider rabies vaccination status of your pet"
      },
      {
        question: "How do I coyote-proof my property after a sighting?",
        answer: "• Install or repair fencing (6+ feet high, extend underground)\n• Remove attractants: food, water, shelter\n• Trim vegetation to eliminate hiding spots\n• Install motion-activated lights and sprinklers\n• Secure compost bins and garbage cans\n• Consider professional wildlife exclusion services"
      },
      {
        question: "When should I contact authorities?",
        answer: "Contact wildlife authorities if:\n• A coyote approaches without fear\n• A coyote attacks a person or pet\n• You see a sick or injured coyote\n• A coyote is in a school or playground area\n• Repeated aggressive encounters occur\n• A coyote appears to be rabid (unusual behavior)"
      }
    ]
  },
  {
    id: 4,
    category: "Safety & Prevention",
    icon: "🛡️",
    questions: [
      {
        question: "How dangerous are coyotes to humans?",
        answer: "• Coyote attacks on humans are extremely rare\n• Most coyotes are naturally afraid of people\n• Attacks usually involve rabid animals or protective parents\n• Small children are at higher risk than adults\n• Education and prevention are the best protection\n• Fatal attacks are exceptionally rare"
      },
      {
        question: "What attracts coyotes to neighborhoods?",
        answer: "• Pet food left outside\n• Garbage and compost\n• Fallen fruit from trees\n• Bird feeders (attract rodents, which attract coyotes)\n• Water sources\n• Small pets\n• Dense vegetation for shelter\n• Easy access to food and water"
      },
      {
        question: "Can coyotes climb fences?",
        answer: "• Yes, coyotes are excellent climbers and jumpers\n• They can scale 6-foot fences\n• They can also dig under fences\n• Effective fencing should be 6+ feet tall\n• Extend fencing 6 inches underground\n• Add a roller bar or coyote roller to the top\n• Remove objects they could use as stepping stones"
      }
    ]
  }
];

const FAQItem = ({ question, answer, isExpanded, onToggle }) => {
  return (
    <View style={styles.faqItem}>
      <TouchableOpacity onPress={onToggle} style={styles.questionContainer}>
        <Text style={styles.questionText}>{question}</Text>
        <Text style={styles.expandIcon}>{isExpanded ? '−' : '+'}</Text>
      </TouchableOpacity>
      {isExpanded && (
        <View style={styles.answerContainer}>
          <Text style={styles.answerText}>{answer}</Text>
        </View>
      )}
    </View>
  );
};

// Safety Tips Tab Component
const SafetyTipsTab = () => {
  return (
    <View style={styles.tabContent}>
      <ScrollablePresentation />
    </View>
  );
};

// Q&A Tab Component
const QATab = () => {
  const [expandedItems, setExpandedItems] = useState({});

  const toggleItem = (itemKey) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setExpandedItems(prev => ({
      ...prev,
      [itemKey]: !prev[itemKey]
    }));
  };

  return (
    <ScrollView style={styles.tabContent} showsVerticalScrollIndicator={false}>
      <View style={styles.faqContent}>
        {faqData.map((category) => (
          <CategorySection
            key={category.id}
            category={category}
            questions={category.questions}
            expandedItems={expandedItems}
            onToggleItem={toggleItem}
          />
        ))}
      </View>
      
      <View style={styles.footer}>
        <Text style={styles.footerText}>
          💡 Remember: When in doubt, contact local wildlife authorities for guidance.
        </Text>
        <Text style={styles.footerText}>
          This information is for educational purposes. Always follow local regulations.
        </Text>
      </View>
    </ScrollView>
  );
};

const CategorySection = ({ category, questions, expandedItems, onToggleItem }) => {
  const [isExpanded, setIsExpanded] = useState(false);

  const toggleCategory = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setIsExpanded(!isExpanded);
  };

  return (
    <View style={styles.categorySection}>
      <TouchableOpacity onPress={toggleCategory} style={styles.categoryHeader}>
        <View style={styles.categoryTitleContainer}>
          <Text style={styles.categoryIcon}>{category.icon}</Text>
          <Text style={styles.categoryTitle}>{category.category}</Text>
        </View>
        <Text style={styles.categoryExpandIcon}>{isExpanded ? '▼' : '▶'}</Text>
      </TouchableOpacity>
      
      {isExpanded && (
        <View style={styles.questionsContainer}>
          {questions.map((item, index) => (
            <FAQItem
              key={index}
              question={item.question}
              answer={item.answer}
              isExpanded={expandedItems[`${category.id}-${index}`]}
              onToggle={() => onToggleItem(`${category.id}-${index}`)}
            />
          ))}
        </View>
      )}
    </View>
  );
};

const VideosTab = () => {
  const videos = [
    {
      id: 1,
      title: "Coyote Education and Safety",
      description: "Learn essential safety tips for encounters with coyotes",
      videoId: "HIm9jVJGHyA"
    },
    {
      id: 2,
      title: "Coyote Awareness",
      description: "Understanding coyote behavior in urban environments",
      videoId: "yyBaMiXVUvs"
    },
    {
      id: 3,
      title: "25 Facts About Coyotes",
      description: "Discover fascinating facts about coyote behavior and characteristics",
      videoId: "3TxZlvnau_Y"
    },
    {
      id: 4,
      title: "Coyotes Safety and Coexistence",
      description: "Learn how to safely coexist with coyotes in your community",
      videoId: "OdOewqXCS-I"
    }
  ];

  const openYouTubeVideo = async (videoId) => {
    const youtubeUrl = `https://www.youtube.com/watch?v=${videoId}`;
    try {
      const supported = await Linking.canOpenURL(youtubeUrl);
      if (supported) {
        await Linking.openURL(youtubeUrl);
      } else {
        console.log(`Cannot open URL: ${youtubeUrl}`);
      }
    } catch (error) {
      console.log(`Error opening YouTube video: ${error}`);
    }
  };

  return (
    <ScrollView style={styles.tabContent} showsVerticalScrollIndicator={false}>
      <View style={styles.videosContainer}>
        {videos.map((video) => (
          <TouchableOpacity
            key={video.id}
            style={styles.videoCard}
            onPress={() => openYouTubeVideo(video.videoId)}
          >
            <View style={styles.videoThumbnail}>
              <Image 
                source={
                  video.id === 1 ? require('../../assets/thumbnail1.png') :
                  video.id === 2 ? require('../../assets/thumbnail2.jpg') :
                  video.id === 3 ? require('../../assets/thumbnail3.jpg') :
                  require('../../assets/thumbnail4.png')
                }
                style={styles.thumbnailImage}
                resizeMode="cover"
              />
              <View style={styles.playOverlay}>
                <Ionicons name="play-circle" size={40} color="#FF0000" />
              </View>
            </View>
            <View style={styles.videoInfo}>
              <Text style={styles.videoTitle}>{video.title}</Text>
              <Text style={styles.videoDescription}>{video.description}</Text>
              <Text style={styles.videoUrl}>youtube.com/watch?v={video.videoId}</Text>
            </View>
          </TouchableOpacity>
        ))}
      </View>
    </ScrollView>
  );
};

export default function SafetyQAScreen({ navigation }) {
  const [activeTab, setActiveTab] = useState(0);

  const tabs = [
    { id: 0, title: 'Useful Info', icon: '' },
    { id: 1, title: 'Videos', icon: '' },
    { id: 2, title: 'FAQ', icon: '' }
  ];

  const renderTabContent = () => {
    switch (activeTab) {
      case 0:
        return <SafetyTipsTab />;
      case 1:
        return <VideosTab />;
      case 2:
        return <QATab />;
      default:
        return <SafetyTipsTab />;
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={sharedStyles.header}>
        <TouchableOpacity
          style={sharedStyles.backButton}
          onPress={() => navigation.navigate('Home')}
        >
          <Ionicons name="chevron-back" size={32} color="#FFFFFF" />
        </TouchableOpacity>
        <View style={sharedStyles.headerTitleContainer}>
          <Image 
            source={require('../../assets/safety tips banner.png')} 
            style={sharedStyles.headerIcon}
            resizeMode="contain"
          />
          <Text style={sharedStyles.headerTitle}>  Safety Tips</Text>
        </View>
        <View style={sharedStyles.placeholder} />
      </View>

      <View style={styles.tabContainer}>
        {tabs.map((tab) => (
          <TouchableOpacity
            key={tab.id}
            style={[
              styles.tab,
              activeTab === tab.id && styles.activeTab
            ]}
            onPress={() => setActiveTab(tab.id)}
          >
            <Text style={[
              styles.tabText,
              activeTab === tab.id && styles.activeTabText
            ]}>
              {tab.title}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <View style={styles.tabContentContainer}>
        {renderTabContent()}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F0E8',
  },
  headerSubtitle: {
    fontSize: 16,
    color: cozyTheme.colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
    fontFamily: cozyTheme.typography.secondary,
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: cozyTheme.colors.surface,
    marginHorizontal: 16,
    borderRadius: 24,
    marginBottom: 8,
    backgroundColor: '#F5F0E8',
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 8,
    alignItems: 'center',
    marginHorizontal: 2,
    position: 'relative',
    minWidth: 80,
  },
  activeTab: {
    borderBottomWidth: 3,
    borderBottomColor: '#2596be',
  },
  tabIcon: {
    fontSize: 20,
    marginBottom: 4,
  },
  tabText: {
    fontSize: 16,
    color: cozyTheme.colors.textSecondary,
    fontWeight: '500',
    fontFamily: cozyTheme.typography.secondary,
    textAlign: 'center',
    numberOfLines: 1,
  },
  activeTabText: {
    fontSize: 16,
    color: '#2596be',
    fontWeight: 'bold',
    fontFamily: cozyTheme.typography.primary,
  },
  tabContentContainer: {
    flex: 1,
  },
  tabContent: {
    flex: 1,
  },
  // Q&A Tab Styles
  faqContent: {
    padding: 16,
  },
  categorySection: {
    backgroundColor: '#fff',
    borderRadius: 12,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
    overflow: 'hidden',
  },
  categoryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 20,
    backgroundColor: '#f8f9fa',
    borderBottomWidth: 1,
    borderBottomColor: '#e1e8ed',
  },
  categoryTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  categoryIcon: {
    fontSize: 24,
    marginRight: 12,
  },
  categoryTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#2c3e50',
  },
  categoryExpandIcon: {
    fontSize: 16,
    color: '#7f8c8d',
    fontWeight: 'bold',
  },
  questionsContainer: {
    backgroundColor: '#fff',
  },
  faqItem: {
    borderBottomWidth: 1,
    borderBottomColor: '#f1f2f6',
  },
  questionContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
  },
  questionText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#2c3e50',
    flex: 1,
    marginRight: 12,
    lineHeight: 22,
  },
  expandIcon: {
    fontSize: 20,
    color: '#3498db',
    fontWeight: 'bold',
  },
  answerContainer: {
    paddingHorizontal: 16,
    paddingBottom: 16,
    backgroundColor: '#f8f9fa',
  },
  answerText: {
    fontSize: 15,
    color: '#34495e',
    lineHeight: 24,
  },
  footer: {
    padding: 20,
    alignItems: 'center',
  },
  footerText: {
    fontSize: 14,
    color: '#7f8c8d',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 8,
  },
  // Video Tab Styles
  videosContainer: {
    padding: 16,
  },
  videoCard: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  videoThumbnail: {
    width: 80,
    height: 80,
    backgroundColor: '#F5F5F5',
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
    position: 'relative',
    overflow: 'hidden',
  },
  thumbnailImage: {
    width: '100%',
    height: '100%',
    borderRadius: 8,
  },
  playOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  videoInfo: {
    flex: 1,
    justifyContent: 'center',
  },
  videoTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333333',
    marginBottom: 4,
  },
  videoDescription: {
    fontSize: 14,
    color: '#666666',
    marginBottom: 8,
    lineHeight: 20,
  },
  videoUrl: {
    fontSize: 12,
    color: '#999999',
    fontFamily: 'monospace',
  },
});

