import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
import {
  Image,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import CozyButton from '../components/CozyButton';
import CozyCard from '../components/CozyCard';
import { cozyTheme } from '../styles/cozyTheme';
import { sharedStyles } from '../styles/sharedStyles';

const quizQuestions = [
  {
    id: 1,
    question: "What should you do if you encounter a coyote?",
    options: [
      "Run away quickly",
      "Make yourself appear large and make noise",
      "Try to pet it",
      "Ignore it completely"
    ],
    correct: 1,
    explanation: "Making yourself appear large and making noise helps deter coyotes. Never run, as this may trigger their chase instinct."
  },
  {
    id: 2,
    question: "When are coyotes most active?",
    options: [
      "During the day",
      "Only at night",
      "Dawn and dusk",
      "They're equally active all day"
    ],
    correct: 2,
    explanation: "Coyotes are crepuscular, meaning they're most active during dawn and dusk hours."
  },
  {
    id: 3,
    question: "What attracts coyotes to residential areas?",
    options: [
      "Loud noises",
      "Food sources like pet food and garbage",
      "Bright lights",
      "Swimming pools"
    ],
    correct: 1,
    explanation: "Food sources are the primary attractant. Always secure garbage, pet food, and fallen fruit."
  },
  {
    id: 4,
    question: "How should you protect your pets from coyotes?",
    options: [
      "Let them roam freely to build confidence",
      "Keep them on leash and supervise outdoor time",
      "Make them wear bells",
      "Train them to fight back"
    ],
    correct: 1,
    explanation: "Always keep pets on leash and supervise them, especially during dawn and dusk when coyotes are most active."
  },
  {
    id: 5,
    question: "What is 'hazing' in relation to coyotes?",
    options: [
      "Feeding them regularly",
      "Using loud noises and gestures to scare them away",
      "Following them to their den",
      "Taking photos of them"
    ],
    correct: 1,
    explanation: "Hazing involves making loud noises, waving arms, and using other deterrent methods to make coyotes afraid of humans."
  },
  {
    id: 6,
    question: "How high should a coyote-proof fence be?",
    options: [
      "3 feet",
      "4 feet",
      "At least 6 feet",
      "8 feet"
    ],
    correct: 2,
    explanation: "Coyote-proof fencing should be at least 6 feet high since coyotes are excellent jumpers. The fence should also extend underground to prevent digging."
  },
  {
    id: 7,
    question: "If a coyote attacks your pet, what should you do first?",
    options: [
      "Chase the coyote",
      "Seek immediate veterinary care for your pet",
      "Wait to see if the pet gets better",
      "Give the pet food and water"
    ],
    correct: 1,
    explanation: "The first priority is to get immediate veterinary care for your pet. Then report the incident to local animal control."
  },
  {
    id: 8,
    question: "How dangerous are coyotes to humans?",
    options: [
      "Extremely dangerous - attacks happen daily",
      "Very dangerous - attacks are common",
      "Attacks on humans are extremely rare",
      "Coyotes never attack humans"
    ],
    correct: 2,
    explanation: "Coyote attacks on humans are extremely rare. Most coyotes naturally fear people, and attacks usually involve rabid animals or protective parents during pupping season."
  },
  {
    id: 9,
    question: "What should you do to protect small pets?",
    options: [
      "Let them roam freely to build confidence",
      "Keep cats indoors and supervise small dogs",
      "Feed them outside to make them stronger",
      "Leave them alone in the yard at night"
    ],
    correct: 1,
    explanation: "Keep cats indoors, especially at night, and supervise small dogs when outside. Walk dogs on leashes during dawn and dusk when coyotes are most active."
  },
  {
    id: 10,
    question: "When should you contact wildlife authorities?",
    options: [
      "Every time you see a coyote",
      "Only if the coyote is in your house",
      "If a coyote shows aggressive behavior or appears sick",
      "Never - handle it yourself"
    ],
    correct: 2,
    explanation: "Contact authorities if a coyote approaches without fear, attacks a person or pet, appears sick or injured, or shows other aggressive or unusual behavior."
  },
  {
    id: 11,
    question: "What is the best way to prevent coyote encounters?",
    options: [
      "Make lots of noise when walking",
      "Remove food sources and secure property",
      "Install bright lights everywhere",
      "Get a bigger dog"
    ],
    correct: 1,
    explanation: "Prevention involves removing attractants like food sources, securing garbage cans, clearing brush, and making your property less appealing to coyotes."
  },
  {
    id: 12,
    question: "What should you do if a coyote follows you?",
    options: [
      "Run as fast as you can",
      "Stop and face the coyote, make yourself large, and back away slowly",
      "Play dead",
      "Throw rocks directly at the coyote"
    ],
    correct: 1,
    explanation: "Stop, face the coyote, make yourself appear large by raising your arms, and back away slowly while maintaining eye contact. Never run."
  },
  {
    id: 13,
    question: "During what season are coyotes most protective?",
    options: [
      "Winter",
      "Spring (pupping season)",
      "Summer",
      "Fall"
    ],
    correct: 1,
    explanation: "Coyotes are most protective during spring pupping season (March-July) when they have pups in dens. They may be more aggressive if you're near their den."
  },
  {
    id: 14,
    question: "What should you do if you see a coyote during the day?",
    options: [
      "Immediately call animal control",
      "It's normal - coyotes can be active during the day",
      "Run away immediately",
      "Approach it to take a photo"
    ],
    correct: 1,
    explanation: "Seeing a coyote during the day is not necessarily a problem. They may be active for various reasons. Only be concerned if the coyote shows aggressive behavior or appears sick."
  },
  {
    id: 15,
    question: "What is a sign that a coyote may be sick or rabid?",
    options: [
      "Being active during the day",
      "Lack of fear of humans, disorientation, or unusual behavior",
      "Being alone",
      "Having a thin appearance"
    ],
    correct: 1,
    explanation: "Signs of a sick or rabid coyote include lack of fear of humans, disorientation, stumbling, excessive drooling, or other unusual behavior. Contact authorities immediately."
  },
  {
    id: 16,
    question: "How can you make your yard less attractive to coyotes?",
    options: [
      "Leave pet food outside",
      "Keep garbage cans uncovered",
      "Remove fallen fruit and secure compost",
      "Leave brush piles for wildlife"
    ],
    correct: 2,
    explanation: "Remove food sources like fallen fruit, secure compost bins, keep garbage cans covered, and clear brush that could provide hiding places."
  },
  {
    id: 17,
    question: "What should you do if you find a coyote den near your home?",
    options: [
      "Destroy it immediately",
      "Contact wildlife authorities for guidance",
      "Feed the coyotes to make them friendly",
      "Ignore it completely"
    ],
    correct: 1,
    explanation: "Contact local wildlife authorities for guidance. They can help determine if the den needs to be relocated and provide safe methods to encourage coyotes to move."
  },
  {
    id: 18,
    question: "What is the typical size of a coyote?",
    options: [
      "Smaller than a house cat",
      "About the size of a medium dog (20-50 lbs)",
      "Larger than a German Shepherd",
      "About the size of a wolf"
    ],
    correct: 1,
    explanation: "Coyotes typically weigh 20-50 pounds, about the size of a medium dog. They're smaller than wolves but larger than foxes."
  },
  {
    id: 19,
    question: "How far can coyotes travel in a day?",
    options: [
      "Less than 1 mile",
      "1-3 miles",
      "Up to 10 miles or more",
      "They stay in one area"
    ],
    correct: 2,
    explanation: "Coyotes can travel up to 10 miles or more in a single day, especially when searching for food or during dispersal of young adults."
  },
  {
    id: 20,
    question: "What should you do if a coyote approaches your pet on a leash?",
    options: [
      "Let your pet defend itself",
      "Pick up small pets, make yourself large, and back away",
      "Unleash your pet to run",
      "Throw your pet's food to distract the coyote"
    ],
    correct: 1,
    explanation: "Pick up small pets immediately, make yourself appear large, make loud noises, and back away slowly. Never leave your pet to fend for itself."
  },
  {
    id: 21,
    question: "What time of year do young coyotes typically leave their parents?",
    options: [
      "Fall (September-November)",
      "Winter (December-February)",
      "Spring (March-May)",
      "Summer (June-August)"
    ],
    correct: 0,
    explanation: "Young coyotes typically disperse from their family group in fall (September-November), which is when you might see more coyote activity as they search for new territories."
  },
  {
    id: 22,
    question: "What should you do if you see a coyote in your neighborhood regularly?",
    options: [
      "Feed it to keep it friendly",
      "Haze it to maintain fear of humans",
      "Ignore it completely",
      "Call animal control every time"
    ],
    correct: 1,
    explanation: "If a coyote becomes too comfortable, use hazing techniques (loud noises, waving arms, throwing objects near but not at it) to maintain its natural fear of humans."
  },
  {
    id: 23,
    question: "What is the primary diet of coyotes?",
    options: [
      "Only small pets",
      "Only garbage",
      "Small mammals, fruits, insects, and occasionally larger prey",
      "Only plants"
    ],
    correct: 2,
    explanation: "Coyotes are omnivores. Their diet includes small mammals (mice, rabbits), fruits, insects, and occasionally larger prey. They adapt their diet based on what's available."
  },
  {
    id: 24,
    question: "How long do coyotes typically live in the wild?",
    options: [
      "1-2 years",
      "3-5 years",
      "6-8 years",
      "10-15 years"
    ],
    correct: 2,
    explanation: "Coyotes typically live 6-8 years in the wild, though they can live longer in areas with less human conflict and good food sources."
  },
  {
    id: 25,
    question: "What should you do if a coyote is in your yard?",
    options: [
      "Approach it slowly",
      "Make loud noises, wave your arms, and encourage it to leave",
      "Leave it alone",
      "Take photos quietly"
    ],
    correct: 1,
    explanation: "Make loud noises, wave your arms, throw objects near (not at) the coyote, and encourage it to leave. This maintains their fear of humans."
  },
  {
    id: 26,
    question: "Can coyotes climb fences?",
    options: [
      "No, they cannot climb at all",
      "Yes, they are excellent climbers",
      "Only chain-link fences",
      "Only wooden fences"
    ],
    correct: 1,
    explanation: "Yes, coyotes are excellent climbers and can scale many types of fences. A coyote-proof fence should be at least 6 feet high and may need a roller or overhang at the top."
  },
  {
    id: 27,
    question: "What should you do if you're walking and see a coyote ahead?",
    options: [
      "Continue walking straight toward it",
      "Change your route or wait for it to leave",
      "Run past it quickly",
      "Throw food to distract it"
    ],
    correct: 1,
    explanation: "Change your route or wait for the coyote to leave the area. Give it space and avoid direct confrontation when possible."
  },
  {
    id: 28,
    question: "What is the best way to secure garbage from coyotes?",
    options: [
      "Leave bags on the curb",
      "Use wildlife-proof containers with secure lids",
      "Put garbage out the night before pickup",
      "Leave it in open bins"
    ],
    correct: 1,
    explanation: "Use wildlife-proof containers with secure, locking lids. Put garbage out the morning of pickup, not the night before, to reduce attractants."
  },
  {
    id: 29,
    question: "How many pups do coyotes typically have?",
    options: [
      "1-2",
      "3-4",
      "5-7",
      "10-12"
    ],
    correct: 2,
    explanation: "Coyotes typically have litters of 5-7 pups, though the number can vary. Both parents help raise the pups."
  },
  {
    id: 30,
    question: "What should you do if a coyote appears injured?",
    options: [
      "Approach to help it",
      "Contact wildlife authorities - do not approach",
      "Leave food and water for it",
      "Ignore it"
    ],
    correct: 1,
    explanation: "Never approach an injured coyote. Contact local wildlife authorities or animal control. Injured animals can be unpredictable and may need professional care."
  }
];

// Function to randomly select a subset of questions
const getRandomQuestions = (questions, count = 5) => {
  const shuffled = [...questions].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, Math.min(count, questions.length));
};

export default function QuizScreen({ navigation }) {
  // Select random 5 questions from the bank each time the component mounts or resets
  const [selectedQuestions, setSelectedQuestions] = useState(() => getRandomQuestions(quizQuestions, 5));
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState(null);
  const [showExplanation, setShowExplanation] = useState(false);
  const [score, setScore] = useState(0);
  const [quizCompleted, setQuizCompleted] = useState(false);

  const handleAnswerSelect = (answerIndex) => {
    if (showExplanation) return;
    
    setSelectedAnswer(answerIndex);
    setShowExplanation(true);
    
    if (answerIndex === selectedQuestions[currentQuestion].correct) {
      setScore(score + 1);
    }
  };

  const handleNextQuestion = () => {
    if (currentQuestion < selectedQuestions.length - 1) {
      setCurrentQuestion(currentQuestion + 1);
      setSelectedAnswer(null);
      setShowExplanation(false);
    } else {
      setQuizCompleted(true);
    }
  };

  const resetQuiz = () => {
    // Get new random 5 questions for the next attempt
    const newQuestions = getRandomQuestions(quizQuestions, 5);
    setSelectedQuestions(newQuestions);
    setCurrentQuestion(0);
    setSelectedAnswer(null);
    setShowExplanation(false);
    setScore(0);
    setQuizCompleted(false);
  };

  const getScoreMessage = () => {
    const percentage = (score / selectedQuestions.length) * 100;
    if (percentage >= 80) return "🎉 Excellent! You're very knowledgeable about coyotes!";
    if (percentage >= 60) return "👍 Good job! Review the safety tips to improve further.";
    return "📚 Keep learning! Review the safety tips and try again.";
  };

  const getScoreColor = () => {
    const percentage = (score / selectedQuestions.length) * 100;
    if (percentage >= 80) return '#81c784'; // Soft green for excellent
    if (percentage >= 60) return '#ffcc80'; // Soft orange/yellow for good
    return '#ff9a8b'; // Soft red for needs improvement
  };

  const getScorePercentage = () => {
    return (score / selectedQuestions.length) * 100;
  };

  if (quizCompleted) {
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
              source={require('../../assets/test your knowledge banner.png')} 
              style={sharedStyles.headerIcon}
              resizeMode="contain"
            />
            <Text style={sharedStyles.headerTitle}>Test Your Knowledge</Text>
          </View>
          <View style={sharedStyles.placeholder} />
        </View>

        <ScrollView contentContainerStyle={styles.content}>
          <CozyCard variant="primary" padding="large" style={styles.resultCard}>
            <Text style={styles.scoreTitle}>Your Score</Text>
            <View style={styles.scoreContainer}>
              <Svg width={180} height={180} style={styles.scoreRing}>
                {/* Background ring */}
                <Circle
                  cx="90"
                  cy="90"
                  r="70"
                  stroke="#aaa"
                  strokeWidth="16"
                  fill="none"
                />
                {/* Filled ring based on score */}
                <Circle
                  cx="90"
                  cy="90"
                  r="70"
                  stroke={getScoreColor()}
                  strokeWidth="16"
                  fill="none"
                  strokeDasharray={`${2 * Math.PI * 70}`}
                  strokeDashoffset={`${2 * Math.PI * 70 * (1 - getScorePercentage() / 100)}`}
                  strokeLinecap="round"
                  transform="rotate(-90 90 90)"
                />
              </Svg>
              <View style={styles.scoreTextContainer}>
                <Text style={styles.scoreText}>
                  {score} / {selectedQuestions.length}
                </Text>
              </View>
            </View>
            
            <Text style={styles.scoreMessage}>{getScoreMessage()}</Text>
            
            <View>
              <CozyButton
                title="🔄 Try Again"
                onPress={resetQuiz}
                variant="primary"
                size="large"
                style={styles.tryAgainButton}
              />
              <CozyButton
                title="📚 Safety Tips"
                onPress={() => navigation.navigate('SafetyQA')}
                variant="secondary"
                size="large"
                style={styles.safetyTipsButton}
              />
            </View>
          </CozyCard>
        </ScrollView>
      </SafeAreaView>
    );
  }

  const question = selectedQuestions[currentQuestion];

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
            source={require('../../assets/test your knowledge banner.png')} 
            style={sharedStyles.headerIcon}
            resizeMode="contain"
          />
          <Text style={sharedStyles.headerTitle}>Test Your Knowledge</Text>
        </View>
        <View style={sharedStyles.placeholder} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <CozyCard variant="default" padding="large" style={styles.questionCard}>
          <View style={styles.progressContainer}>
            <Text style={styles.progressText}>
              Question {currentQuestion + 1} of {selectedQuestions.length}
            </Text>
            <View style={styles.progressBar}>
              <View 
                style={[
                  styles.progressFill, 
                  { width: `${((currentQuestion + 1) / selectedQuestions.length) * 100}%` }
                ]} 
              />
            </View>
          </View>

          <Text style={styles.questionText}>{question.question}</Text>

          <View style={styles.optionsContainer}>
            {question.options.map((option, index) => {
              let buttonStyle = styles.optionButton;
              let textStyle = styles.optionText;

              if (showExplanation) {
                if (index === question.correct) {
                  buttonStyle = [styles.optionButton, styles.correctOption];
                  textStyle = [styles.optionText, styles.correctOptionText];
                } else if (index === selectedAnswer && index !== question.correct) {
                  buttonStyle = [styles.optionButton, styles.incorrectOption];
                  textStyle = [styles.optionText, styles.incorrectOptionText];
                }
              } else if (selectedAnswer === index) {
                buttonStyle = [styles.optionButton, styles.selectedOption];
              }

              return (
                <TouchableOpacity
                  key={index}
                  style={buttonStyle}
                  onPress={() => handleAnswerSelect(index)}
                  disabled={showExplanation}
                >
                  <Text style={textStyle}>{option}</Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {showExplanation && (
            <View style={styles.explanationCard}>
              <Text style={[
                styles.feedbackLabel, 
                selectedAnswer === question.correct ? styles.correctLabel : styles.incorrectLabel
              ]}>
                {selectedAnswer === question.correct ? 'Correct!' : 'Incorrect'}
              </Text>
              <Text style={styles.explanationText}>
                <Text style={styles.tipLabel}>Tip: </Text>
                {question.explanation}
              </Text>
            </View>
          )}

          {showExplanation && (
            <CozyButton
              title={currentQuestion < selectedQuestions.length - 1 ? "Next Question ➔" : "Finish ➔"}
              onPress={handleNextQuestion}
              variant="primary"
              size="large"
              style={styles.nextButton}
            />
          )}
        </CozyCard>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F0E8',
  },
  content: {
    padding: 20,
    flexGrow: 1,
  },
  questionCard: {
    marginBottom: 20,
    borderWidth: 0,
  },
  progressContainer: {
    marginBottom: 24,
  },
  progressText: {
    fontSize: 16,
    color: cozyTheme.colors.textSecondary,
    textAlign: 'center',
    fontWeight: 600,
    marginBottom: 8,
    fontFamily: cozyTheme.typography.secondary,
  },
  progressBar: {
    height: 8,
    backgroundColor: cozyTheme.colors.surface,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: '#000',
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: cozyTheme.colors.primary,
  },
  questionText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: cozyTheme.colors.textPrimary,
    marginBottom: 24,
    lineHeight: 28,
    fontFamily: cozyTheme.typography.primary,
  },
  optionButton: {
    backgroundColor: cozyTheme.colors.surface,
    padding: 16,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: cozyTheme.colors.textLight,
    marginBottom: 12,
  },
  selectedOption: {
    borderColor: cozyTheme.colors.primary,
    backgroundColor: cozyTheme.colors.primaryLight,
  },
  correctOption: {
    borderColor: '#27ae60',
    backgroundColor: '#d5f4e6',
  },
  incorrectOption: {
    borderColor: '#e74c3c',
    backgroundColor: '#fdeaea',
  },
  optionText: {
    fontSize: 16,
    color: cozyTheme.colors.textPrimary,
    fontFamily: cozyTheme.typography.secondary,
  },
  correctOptionText: {
    color: '#27ae60',
    fontWeight: 'bold',
  },
  incorrectOptionText: {
    color: '#e74c3c',
    fontWeight: 'bold',
  },
  explanationCard: {
    padding: 16,
    backgroundColor: 'transparent',
  },
  feedbackLabel: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  correctLabel: {
    color: '#27ae60',
  },
  incorrectLabel: {
    color: '#e74c3c',
  },
  tipLabel: {
    fontWeight: 'bold',
    color: cozyTheme.colors.textPrimary,
  },
  explanationText: {
    fontSize: 16,
    color: cozyTheme.colors.textPrimary,
    lineHeight: 22,
    fontFamily: cozyTheme.typography.secondary,
  },
  nextButton: {
    borderWidth: 0,
    backgroundColor: "transparent",
  },
  resultCard: {
    alignItems: 'center',
    borderWidth: 0,
    backgroundColor: '#FFFFFF',
  },
  scoreTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: cozyTheme.colors.textSecondary,
    marginBottom: 16,
    fontFamily: cozyTheme.typography.primary,
  },
  scoreText: {
    fontSize: 48,
    fontWeight: 'bold',
    fontFamily: cozyTheme.typography.primary,
    color: cozyTheme.colors.textSecondary,
    textAlign: 'center',
  },
  scoreMessage: {
    fontSize: 20,
    color: cozyTheme.colors.textSecondary,
    textAlign: 'center',
    marginBottom: 36,
    lineHeight: 24,
    fontFamily: cozyTheme.typography.secondary,
  },
  tryAgainButton: {
    borderWidth: 2,
    borderColor: "#ffcc00",
    borderRadius: 16,
    marginBottom: 20,
  },
  safetyTipsButton: {
    borderWidth: 2,
    borderRadius: 16,
    borderColor: '#27ae60',
  },
  scoreContainer: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    width: 180,
    height: 180,
  },
  scoreRing: {
    position: 'absolute',
  },
  scoreTextContainer: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
    width: 180,
    height: 180,
  },
});


