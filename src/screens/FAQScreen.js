import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
import {
    LayoutAnimation,
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

const quizQuestions = [
  {
    id: 1,
    question: "What should you do if you encounter a coyote?",
    options: [
      "Run away as fast as possible",
      "Stay calm, make yourself large, and back away slowly",
      "Approach it to get a better look",
      "Play dead on the ground"
    ],
    correctAnswer: 1,
    explanation: "Never run from a coyote as it triggers their chase instinct. Instead, stay calm, make yourself appear large, and back away slowly while facing the animal."
  },
  {
    id: 2,
    question: "When are coyotes most active?",
    options: [
      "Only at night",
      "Only during the day",
      "During dawn and dusk",
      "They are equally active all day"
    ],
    correctAnswer: 2,
    explanation: "Coyotes are crepuscular, meaning they are most active during dawn and dusk hours, though they can also be active at night."
  },
  {
    id: 3,
    question: "What is 'hazing' in relation to coyotes?",
    options: [
      "Feeding coyotes to make them friendly",
      "Scaring coyotes to make them avoid humans",
      "Tracking coyotes with GPS",
      "Building fences to keep coyotes out"
    ],
    correctAnswer: 1,
    explanation: "Hazing involves making loud noises, throwing objects near (not at) coyotes, and using other intimidation tactics to encourage them to leave the area and maintain their natural fear of humans."
  },
  {
    id: 4,
    question: "How high should a coyote-proof fence be?",
    options: [
      "3 feet",
      "4 feet", 
      "6 feet or higher",
      "Fences don't work against coyotes"
    ],
    correctAnswer: 2,
    explanation: "Coyotes can jump quite high and are excellent climbers. A fence should be at least 6 feet tall, and ideally have a roller bar on top or lean inward at the top."
  },
  {
    id: 5,
    question: "What attracts coyotes to residential areas?",
    options: [
      "Loud noises and bright lights",
      "Pet food, garbage, and small pets",
      "Swimming pools and sprinklers",
      "Cars and bicycles"
    ],
    correctAnswer: 1,
    explanation: "Coyotes are attracted to easy food sources like pet food left outside, unsecured garbage, fallen fruit, and unfortunately, small pets. They also seek water sources and shelter."
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

// Quick Facts Tab Component
const QuickFactsTab = () => {
  return (
    <ScrollView style={styles.tabContent} showsVerticalScrollIndicator={false}>
      <View style={styles.presentationContainer}>
        <Text style={styles.presentationTitle}>🎯 Coyotes In Your Community</Text>
        <Text style={styles.presentationSubtitle}>
          OC Animal Care - Essential Safety Information
        </Text>
        
        <View style={styles.webviewContainer}>
          <ScrollablePresentation />
        </View>
      </View>
    </ScrollView>
  );
};

// Quiz Tab Component  
const QuizTab = () => {
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState({});
  const [showResults, setShowResults] = useState(false);
  const [score, setScore] = useState(0);

  const handleAnswerSelect = (questionId, answerIndex) => {
    setSelectedAnswers(prev => ({
      ...prev,
      [questionId]: answerIndex
    }));
  };

  const calculateScore = () => {
    let correctAnswers = 0;
    quizQuestions.forEach(question => {
      if (selectedAnswers[question.id] === question.correctAnswer) {
        correctAnswers++;
      }
    });
    return correctAnswers;
  };

  const submitQuiz = () => {
    const finalScore = calculateScore();
    setScore(finalScore);
    setShowResults(true);
  };

  const resetQuiz = () => {
    setCurrentQuestion(0);
    setSelectedAnswers({});
    setShowResults(false);
    setScore(0);
  };

  if (showResults) {
    const percentage = Math.round((score / quizQuestions.length) * 100);
    return (
      <ScrollView style={styles.tabContent} contentContainerStyle={styles.resultsContainer}>
        <View style={styles.resultsCard}>
          <Text style={styles.resultsTitle}>🎉 Quiz Complete!</Text>
          <Text style={styles.scoreText}>
            You scored {score} out of {quizQuestions.length}
          </Text>
          <Text style={styles.percentageText}>{percentage}%</Text>
          
          <View style={styles.scoreMessage}>
            {percentage >= 80 ? (
              <Text style={styles.excellentText}>
                🌟 Excellent! You're well-prepared for coyote encounters.
              </Text>
            ) : percentage >= 60 ? (
              <Text style={styles.goodText}>
                👍 Good job! Review the areas you missed to improve your knowledge.
              </Text>
            ) : (
              <Text style={styles.needsWorkText}>
                📚 Consider reviewing the FAQ section to better understand coyote safety.
              </Text>
            )}
          </View>

          <TouchableOpacity style={styles.retakeButton} onPress={resetQuiz}>
            <Text style={styles.retakeButtonText}>Take Quiz Again</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    );
  }

  const question = quizQuestions[currentQuestion];
  const isLastQuestion = currentQuestion === quizQuestions.length - 1;
  const canProceed = selectedAnswers[question.id] !== undefined;

  return (
    <ScrollView style={styles.tabContent} contentContainerStyle={styles.quizContainer}>
      <View style={styles.quizCard}>
        <View style={styles.progressContainer}>
          <Text style={styles.progressText}>
            Question {currentQuestion + 1} of {quizQuestions.length}
          </Text>
          <View style={styles.progressBar}>
            <View 
              style={[
                styles.progressFill, 
                { width: `${((currentQuestion + 1) / quizQuestions.length) * 100}%` }
              ]} 
            />
          </View>
        </View>

        <Text style={styles.quizQuestion}>{question.question}</Text>

        <View style={styles.optionsContainer}>
          {question.options.map((option, index) => (
            <TouchableOpacity
              key={index}
              style={[
                styles.optionButton,
                selectedAnswers[question.id] === index && styles.selectedOption
              ]}
              onPress={() => handleAnswerSelect(question.id, index)}
            >
              <Text style={[
                styles.optionText,
                selectedAnswers[question.id] === index && styles.selectedOptionText
              ]}>
                {option}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <View style={styles.quizNavigation}>
          {currentQuestion > 0 && (
            <TouchableOpacity 
              style={styles.navButton} 
              onPress={() => setCurrentQuestion(currentQuestion - 1)}
            >
              <Text style={styles.navButtonText}>← Previous</Text>
            </TouchableOpacity>
          )}
          
          <TouchableOpacity
            style={[styles.navButton, styles.primaryNavButton, !canProceed && styles.disabledNavButton]}
            onPress={() => {
              if (isLastQuestion) {
                submitQuiz();
              } else {
                setCurrentQuestion(currentQuestion + 1);
              }
            }}
            disabled={!canProceed}
          >
            <Text style={[styles.navButtonText, styles.primaryNavButtonText]}>
              {isLastQuestion ? 'Submit Quiz' : 'Next →'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </ScrollView>
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

export default function FAQScreen({ navigation }) {
  const [activeTab, setActiveTab] = useState(0);

  const tabs = [
    { id: 0, title: 'Quick Facts', icon: '🎯' },
    { id: 1, title: 'Q&A', icon: '❓' },
    { id: 2, title: 'Test Your Knowledge', icon: '🧠' }
  ];

  const renderTabContent = () => {
    switch (activeTab) {
      case 0:
        return <QuickFactsTab />;
      case 1:
        return <QATab />;
      case 2:
        return <QuizTab />;
      default:
        return <QATab />;
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.navigate('Home')}
          >
            <Ionicons name="chevron-back" size={24} color="#000000" />
          </TouchableOpacity>
          <View style={styles.headerTitleContainer}>
            <Text style={styles.headerTitle}>🐺 Coyote Safety Guide</Text>
          </View>
          <View style={styles.placeholder} />
        </View>
        <Text style={styles.headerSubtitle}>
          Essential information for coyote encounters and safety
        </Text>
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
            <Text style={styles.tabIcon}>{tab.icon}</Text>
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
    backgroundColor: cozyTheme.colors.background,
  },
  header: {
    backgroundColor: '#BCD8EC',
    paddingTop: 24,
    paddingBottom: 20,
    paddingHorizontal: 24,
    marginHorizontal: 16,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    alignItems: 'center',
    ...cozyTheme.shadows.soft,
  },
  headerTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
    marginBottom: 8,
  },
  placeholder: {
    width: 40, // Same width as home button for centering
  },
  headerTitleContainer: {
    flex: 1,
    alignItems: 'center',
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: cozyTheme.colors.textPrimary,
    textAlign: 'center',
    fontFamily: cozyTheme.typography.primary,
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
    marginTop: 16,
    borderRadius: 24,
    padding: 8,
    borderWidth: 2,
    borderColor: '#000',
    ...cozyTheme.shadows.soft,
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 12,
    alignItems: 'center',
    borderRadius: 20,
    marginHorizontal: 2,
  },
  activeTab: {
    backgroundColor: cozyTheme.colors.secondary,
    ...cozyTheme.shadows.soft,
  },
  tabIcon: {
    fontSize: 20,
    marginBottom: 4,
  },
  tabText: {
    fontSize: 12,
    color: cozyTheme.colors.textSecondary,
    fontWeight: '500',
    fontFamily: cozyTheme.typography.secondary,
  },
  activeTabText: {
    color: cozyTheme.colors.textPrimary,
    fontWeight: 'bold',
    fontFamily: cozyTheme.typography.primary,
  },
  tabContentContainer: {
    flex: 1,
  },
  tabContent: {
    flex: 1,
  },
  // Quick Facts Tab Styles
  presentationContainer: {
    padding: 16,
    flex: 1,
  },
  presentationTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2c3e50',
    textAlign: 'center',
    marginBottom: 8,
  },
  presentationSubtitle: {
    fontSize: 16,
    color: '#7f8c8d',
    textAlign: 'center',
    marginBottom: 20,
    lineHeight: 22,
  },
  webviewContainer: {
    flex: 1,
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: '#fff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  webview: {
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
  // Quiz Tab Styles
  quizContainer: {
    padding: 16,
  },
  quizCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 6,
  },
  progressContainer: {
    marginBottom: 24,
  },
  progressText: {
    fontSize: 16,
    color: '#7f8c8d',
    textAlign: 'center',
    marginBottom: 12,
    fontWeight: '500',
  },
  progressBar: {
    height: 6,
    backgroundColor: '#e1e8ed',
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#3498db',
    borderRadius: 3,
  },
  quizQuestion: {
    fontSize: 20,
    fontWeight: '600',
    color: '#2c3e50',
    marginBottom: 24,
    lineHeight: 28,
    textAlign: 'center',
  },
  optionsContainer: {
    marginBottom: 32,
  },
  optionButton: {
    backgroundColor: '#f8f9fa',
    borderWidth: 2,
    borderColor: '#e1e8ed',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  selectedOption: {
    backgroundColor: '#e3f2fd',
    borderColor: '#3498db',
  },
  optionText: {
    fontSize: 16,
    color: '#2c3e50',
    lineHeight: 22,
  },
  selectedOptionText: {
    color: '#3498db',
    fontWeight: '600',
  },
  quizNavigation: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  navButton: {
    backgroundColor: '#e1e8ed',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 25,
  },
  primaryNavButton: {
    backgroundColor: '#3498db',
  },
  disabledNavButton: {
    backgroundColor: '#bdc3c7',
    opacity: 0.6,
  },
  navButtonText: {
    fontSize: 16,
    color: '#2c3e50',
    fontWeight: '600',
  },
  primaryNavButtonText: {
    color: '#fff',
  },
  // Quiz Results Styles
  resultsContainer: {
    padding: 16,
  },
  resultsCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 32,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 6,
  },
  resultsTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#2c3e50',
    marginBottom: 16,
    textAlign: 'center',
  },
  scoreText: {
    fontSize: 18,
    color: '#7f8c8d',
    marginBottom: 8,
    textAlign: 'center',
  },
  percentageText: {
    fontSize: 48,
    fontWeight: 'bold',
    color: '#3498db',
    marginBottom: 24,
  },
  scoreMessage: {
    marginBottom: 32,
    paddingHorizontal: 16,
  },
  excellentText: {
    fontSize: 16,
    color: '#27ae60',
    textAlign: 'center',
    lineHeight: 24,
  },
  goodText: {
    fontSize: 16,
    color: '#f39c12',
    textAlign: 'center',
    lineHeight: 24,
  },
  needsWorkText: {
    fontSize: 16,
    color: '#e74c3c',
    textAlign: 'center',
    lineHeight: 24,
  },
  retakeButton: {
    backgroundColor: '#3498db',
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 25,
  },
  retakeButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});















