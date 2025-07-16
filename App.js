import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TextInput,
  TouchableOpacity,
  SafeAreaView,
  ScrollView,
  Modal,
  Alert,
  Platform,
  Image,
  Dimensions,
  Linking,
  FlatList,
  ActivityIndicator,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as ImagePicker from 'expo-image-picker';
import { LineChart } from 'react-native-chart-kit';
import { Calendar } from 'react-native-calendars';
import { Ionicons } from '@expo/vector-icons';
import Svg, { Circle } from 'react-native-svg';
import DropDownPicker from 'react-native-dropdown-picker';

// --- ICONS ---
const TrashIcon = () => <Ionicons name="trash-outline" size={22} color="#333" />;
const WeightIcon = () => <Ionicons name="scale-outline" size={30} color="#6b7280" />;
const TaskIcon = () => <Ionicons name="checkmark-done-outline" size={24} color="#6b7280" />;
const WorkoutIcon = () => <Ionicons name="barbell-outline" size={30} color="#6b7280" />;
const PhotoIcon = () => <Ionicons name="camera-outline" size={30} color="#6b7280" />;
const MapIcon = () => <Ionicons name="map-outline" size={30} color="#6b7280" />;
const PlanIcon = () => <Ionicons name="calendar-outline" size={24} color="#6b7280" />;
const ChallengeIcon = () => <Ionicons name="flame-outline" size={30} color="#6b7280" />;
const PRIcon = () => <Ionicons name="trophy-outline" size={30} color="#6b7280" />;
const CloseIcon = () => <Ionicons name="close-circle" size={26} color="white" />;
const BackIcon = () => <Ionicons name="arrow-back-outline" size={24} color="#007aff" />;
const CheckboxIcon = ({checked}) => <Ionicons name={checked ? "checkbox" : "square-outline"} size={24} color="#007aff" />;
const GreenCheckIcon = () => <Ionicons name="checkmark-circle" size={30} color="#34C759" />;
const CalculatorIcon = () => <Ionicons name="calculator-outline" size={22} color="#6b7280" />;

// --- MOCK USER DATABASE & HELPERS ---
const MOCK_USERS = {
    'chris': { username: 'chris', thirtyDayChallengeData: { startDate: '2025-07-10', '2025-07-11': { user: { score: 45, workoutCompleted: true, hydration: true, steps: true } } } },
    'alex': { username: 'alex', role: 'coach', specialty: 'Strength & Conditioning', thirtyDayChallengeData: { startDate: '2025-07-09', '2025-07-10': { user: { score: 35, workoutCompleted: true, hydration: true } }, '2025-07-11': { user: { score: 10, steps: true } } } },
    'sam': { username: 'sam', role: 'coach', specialty: 'Nutrition & HIIT', thirtyDayChallengeData: { startDate: '2025-07-11', '2025-07-11': { user: { score: 25, workoutCompleted: true } } } },
    'jordan': { username: 'jordan', role: 'client', thirtyDayChallengeData: { startDate: '2025-07-08' } },
};

const WORKOUT_PLANS = {
  "The Foundation PPL Split": {
    duration: "6 Weeks",
    description: "A classic Push/Pull/Legs split to build strength and muscle.",
    schedule: [
      { day: 'Day 1', name: 'Push Power (Chest Focus)' }, 
      { day: 'Day 2', name: 'Pull Strength (Back Width)' }, 
      { day: 'Day 3', name: 'Leg Foundation (Squat Day)' }, 
      { day: 'Day 4', name: 'Rest' }, 
      { day: 'Day 5', name: 'Push Hypertrophy (Shoulder Focus)' }, 
      { day: 'Day 6', name: 'Pull Density (Back Thickness)' }, 
      { day: 'Day 7', name: 'Leg Power (Hinge Day)' },
    ]
  },
  "The Body Sculptor Split": {
    duration: "Ongoing",
    description: "Classic bodybuilding split focusing on one major muscle group per day.",
    schedule: [
      { day: 'Day 1', name: 'Chest Builder' },
      { day: 'Day 2', name: 'Back Dominance' },
      { day: 'Day 3', name: 'Shoulder Builder' },
      { day: 'Day 4', name: 'The Engine Builder (Legs)' },
      { day: 'Day 5', name: 'Arms & Abs Finisher' },
      { day: 'Day 6', name: 'Rest' },
      { day: 'Day 7', name: 'Rest' },
    ]
  },
  "The Power Block Upper/Lower": {
    duration: "4 Days/Week",
    description: "A strength-focused split dividing training between upper and lower body days.",
    schedule: [
      { day: 'Day 1', name: 'Upper Body Strength' },
      { day: 'Day 2', name: 'Lower Body Power' },
      { day: 'Day 3', name: 'Rest' },
      { day: 'Day 4', name: 'Upper Body Hypertrophy' },
      { day: 'Day 5', name: 'Lower Body Strength' },
      { day: 'Day 6', name: 'Rest' },
      { day: 'Day 7', name: 'Rest' },
    ]
  },
  "Cardio Foundation": {
    duration: "3 Days/Week",
    description: "A plan to build cardiovascular endurance and core strength.",
    schedule: [
      { day: 'Day 1', name: 'Steady-State & Core' },
      { day: 'Day 2', name: 'Rest' },
      { day: 'Day 3', name: 'Active Recovery & Abs' },
      { day: 'Day 4', name: 'Rest' },
      { day: 'Day 5', name: 'Endurance & Core' },
      { day: 'Day 6', name: 'Rest' },
      { day: 'Day 7', name: 'Rest' },
    ]
  },
  "Metabolic Shock HIIT": {
    duration: "3 Days/Week",
    description: "High-Intensity Interval Training for maximum efficiency and calorie burn.",
    schedule: [
        { day: 'Day 1', name: 'Full Body Blast' },
        { day: 'Day 2', name: 'Rest' },
        { day: 'Day 3', name: 'Athletic Surge' },
        { day: 'Day 4', name: 'Rest' },
        { day: 'Day 5', name: 'Metabolic Finisher' },
        { day: 'Day 6', name: 'Rest' },
        { day: 'Day 7', name: 'Rest' },
    ]
  },
};

const WORKOUT_ROUTINES = {
  // Foundation PPL Routines
  'Push Power (Chest Focus)': [{ type: 'single', exercise: 'Bench Press (Barbell)' }, { type: 'single', exercise: 'Overhead Press (Dumbbell)' }, { type: 'single', exercise: 'Incline Dumbbell Press' }, { type: 'superset', exercises: ['Tricep Pushdowns (Rope)', 'Lateral Raises (Dumbbell)'] }],
  'Pull Strength (Back Width)': [{ type: 'single', exercise: 'Deadlifts' }, { type: 'single', exercise: 'Pull-ups' }, { type: 'single', exercise: 'Bent Over Rows (Barbell)' }, { type: 'superset', exercises: ['Face Pulls', 'Barbell Curls'] }],
  'Leg Foundation (Squat Day)': [{ type: 'single', exercise: 'Squats (Barbell)' }, { type: 'single', exercise: 'Romanian Deadlifts' }, { type: 'single', exercise: 'Leg Press' }, { type: 'superset', exercises: ['Leg Curls (Machine)', 'Calf Raises'] }],
  'Push Hypertrophy (Shoulder Focus)': [{ type: 'single', exercise: 'Incline Bench Press (Barbell)' }, { type: 'single', exercise: 'Seated Dumbbell Shoulder Press' }, { type: 'single', exercise: 'Dips (Weighted)' }, { type: 'superset', exercises: ['Skull Crushers', 'Front Raises (Dumbbell)'] }],
  'Pull Density (Back Thickness)': [{ type: 'single', exercise: 'T-Bar Rows' }, { type: 'single', exercise: 'Chin-ups' }, { type: 'single', exercise: 'Dumbbell Rows' }, { type: 'superset', exercises: ['Preacher Curls', 'Reverse Pec-Deck'] }],
  'Leg Power (Hinge Day)': [{ type: 'single', exercise: 'Front Squats' }, { type: 'single', exercise: 'Glute Ham Raise' }, { type: 'single', 'exercise': 'Bulgarian Split Squats' }, { type: 'superset', exercises: ['Leg Extensions (Machine)', 'Seated Calf Raises'] }],

  // Body Sculptor Split Routines
  'Chest Builder': [{ type: 'single', exercise: 'Incline Dumbbell Press' }, { type: 'single', exercise: 'Bench Press (Barbell)' }, { type: 'single', exercise: 'Dumbbell Flyes' }, { type: 'single', exercise: 'Push-ups' }],
  'Back Dominance': [{ type: 'single', exercise: 'Pull-ups' }, { type: 'single', exercise: 'Bent Over Rows (Barbell)' }, { type: 'single', exercise: 'Lat Pulldowns' }, { type: 'single', exercise: 'T-Bar Rows' }],
  'Shoulder Builder': [{ type: 'single', exercise: 'Overhead Press (Dumbbell)' }, { type: 'single', exercise: 'Arnold Press' }, { type: 'superset', exercises: ['Lateral Raises (Dumbbell)', 'Front Raises (Dumbbell)'] }, { type: 'single', exercise: 'Face Pulls' }],
  'The Engine Builder (Legs)': [{ type: 'single', exercise: 'Squats (Barbell)' }, { type: 'single', exercise: 'Leg Press' }, { type: 'single', exercise: 'Romanian Deadlifts' }, { type: 'superset', exercises: ['Leg Extensions (Machine)', 'Leg Curls (Machine)'] }, { type: 'single', exercise: 'Calf Raises' }],
  'Arms & Abs Finisher': [{ type: 'superset', exercises: ['Barbell Curls', 'Skull Crushers'] }, { type: 'superset', exercises: ['Hammer Curls', 'Tricep Pushdowns (Rope)'] }, { type: 'single', exercise: 'Plank' }, { type: 'single', exercise: 'Leg Raises' }],
  
  // Power Block Upper/Lower Routines
  'Upper Body Strength': [{ type: 'single', exercise: 'Bench Press (Barbell)' }, { type: 'single', exercise: 'Dumbbell Rows' }, { type: 'single', exercise: 'Seated Dumbbell Shoulder Press' }, { type: 'superset', exercises: ['Lat Pulldowns', 'Lateral Raises (Dumbbell)'] }, { type: 'single', exercise: 'Bicep Curls (Dumbbell)' }],
  'Lower Body Power': [{ type: 'single', exercise: 'Squats (Barbell)' }, { type: 'single', exercise: 'Romanian Deadlifts' }, { type: 'single', exercise: 'Goblet Squat' }, { type: 'superset', exercises: ['Leg Curls (Machine)', 'Calf Raises'] }],
  'Upper Body Hypertrophy': [{ type: 'single', exercise: 'Pull-ups' }, { type: 'single', exercise: 'Incline Dumbbell Press' }, { type: 'single', exercise: 'Seated Cable Rows' }, { type: 'superset', exercises: ['Overhead Press (Dumbbell)', 'Face Pulls'] }, { type: 'single', exercise: 'Tricep Pushdowns (Rope)' }],
  'Lower Body Strength': [{ type: 'single', exercise: 'Deadlifts' }, { type: 'single', exercise: 'Leg Press' }, { type: 'single', exercise: 'Lunges (Dumbbell)' }, { type: 'superset', exercises: ['Leg Extensions (Machine)', 'Hip Thrusts'] }],

  // Cardio Foundation Routines
  'Steady-State & Core': [{ type: 'cardio', exercise: 'Treadmill Incline Walk' }, { type: 'cardio', exercise: 'Elliptical Trainer' }, { type: 'single', exercise: 'Plank' }, { type: 'single', exercise: 'Crunches' }],
  'Active Recovery & Abs': [{ type: 'cardio', exercise: 'Stationary Bike' }, { type: 'cardio', exercise: 'Rowing Machine' }, { type: 'single', exercise: 'Leg Raises' }, { type: 'single', exercise: 'Russian Twists' }],
  'Endurance & Core': [{ type: 'cardio', exercise: 'Stair Master' }, { type: 'cardio', exercise: 'Treadmill Jog' }, { type: 'single', exercise: 'Side Plank (Left)' }, { type: 'single', exercise: 'Side Plank (Right)' }],
  
  // Metabolic Shock HIIT Routines
  'Full Body Blast': [{ type: 'hiit', exercise: 'Treadmill Sprints' }, { type: 'hiit', exercise: 'Burpees' }, { type: 'hiit', exercise: 'Kettlebell Swings' }, { type: 'hiit', exercise: 'Mountain Climbers' }],
  'Athletic Surge': [{ type: 'hiit', exercise: 'Assault Bike Sprints' }, { type: 'hiit', exercise: 'Box Jumps' }, { type: 'hiit', exercise: 'Battle Ropes' }, { type: 'hiit', exercise: 'Jumping Jacks' }],
  'Metabolic Finisher': [{ type: 'hiit', exercise: 'Rowing Sprints' }, { type: 'hiit', exercise: 'Squat Jumps' }, { type: 'hiit', exercise: 'High Knees' }, { type: 'hiit', exercise: 'Burpees' }],
};

const allWorkoutObjects = Object.values(WORKOUT_ROUTINES).flat();
const allExerciseNames = allWorkoutObjects.flatMap(item =>
    item.type === 'single' ? item.exercise : item.exercises
);
const ALL_EXERCISES = [...new Set(allExerciseNames)].sort();

const WEIGHT_COMPARISONS = [ { name: 'a Large Cat', weight: 15 }, { name: 'a Car Tire', weight: 25 }, { name: 'a 5-gallon Water Jug', weight: 40 }, { name: 'an Irish Setter', weight: 70 }, { name: 'a Baby Elephant', weight: 200 }, { name: 'a Refrigerator', weight: 300 }, { name: 'a Vending Machine', weight: 650 }, { name: 'a Grand Piano', weight: 1200 }, { name: 'a Small Car', weight: 2800 }, { name: 'a Giraffe', weight: 4200 }, { name: 'a School Bus', weight: 25000 }, ];

const getWeightComparison = (totalVolume) => {
    if (totalVolume <= 0) return '';
    const comparison = WEIGHT_COMPARISONS.reduce((prev, curr) => (curr.weight <= totalVolume && curr.weight > prev.weight) ? curr : prev);
    return `That's like lifting ${comparison.name}!`;
};
const getTodayString = () => {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
};
const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good Morning!";
    if (hour < 18) return "Good Afternoon!";
    return "Good Evening!";
};

const findBestSet = (sets) => {
    if (!sets || sets.length === 0) return { reps: 0, weight: 0 };
    return sets.reduce((best, current) => {
        const currentWeight = parseFloat(current.weight) || 0;
        const bestWeight = parseFloat(best.weight) || 0;
        const currentReps = parseInt(current.reps, 10) || 0;
        const bestReps = parseInt(best.reps, 10) || 0;

        if (currentWeight > bestWeight) return current;
        if (currentWeight === bestWeight && currentReps > bestReps) return current;
        return best;
    }, { reps: 0, weight: 0 });
};

// --- Splash Screen Component ---
const SplashScreen = () => (
    <View style={styles.splashContainer}>
        <Image source={require('./assets/logo.png')} style={styles.splashLogo} />
        <ActivityIndicator size="large" color="#FFFFFF" />
    </View>
);

// --- Modals ---
const PlateCalculatorModal = ({ visible, onClose, onCalculate }) => {
    const plates = [45, 25, 10, 5, 2.5];
    const [plateCounts, setPlateCounts] = useState({ 45: 0, 25: 0, 10: 0, 5: 0, 2.5: 0 });

    const calculateTotal = () => {
        const standardBarbell = 45;
        const totalPlateWeight = plates.reduce((sum, plate) => sum + (plateCounts[plate] * plate * 2), 0);
        return standardBarbell + totalPlateWeight;
    };

    const handleDone = () => {
        onCalculate(calculateTotal());
        onClose();
    };
    
    const resetCalculator = () => setPlateCounts({ 45: 0, 25: 0, 10: 0, 5: 0, 2.5: 0 });

    return (
        <Modal animationType="fade" transparent={true} visible={visible} onRequestClose={onClose}>
            <View style={styles.modalOverlay}>
                <View style={styles.plateCalculatorContainer}>
                    <Text style={styles.modalTitle}>Plate Calculator</Text>
                    <Text style={styles.totalWeightText}>{calculateTotal()} lbs</Text>
                    <Text style={styles.plateSubtext}>(45 lb barbell + plates per side)</Text>
                    {plates.map(plate => (
                        <View key={plate} style={styles.plateRow}>
                            <Text style={styles.plateLabel}>{plate} lbs</Text>
                            <View style={styles.plateControls}>
                                <TouchableOpacity onPress={() => setPlateCounts(p => ({...p, [plate]: Math.max(0, p[plate] - 1)}))} style={styles.plateButton}><Ionicons name="remove-circle" size={32} color="#ff3b30" /></TouchableOpacity>
                                <Text style={styles.plateCount}>{plateCounts[plate]}</Text>
                                <TouchableOpacity onPress={() => setPlateCounts(p => ({...p, [plate]: p[plate] + 1}))} style={styles.plateButton}><Ionicons name="add-circle" size={32} color="#34C759" /></TouchableOpacity>
                            </View>
                        </View>
                    ))}
                    <View style={styles.calculatorActions}>
                       <TouchableOpacity onPress={resetCalculator}><Text style={styles.closeButtonText}>Reset</Text></TouchableOpacity>
                       <TouchableOpacity style={styles.logButton} onPress={handleDone}><Text style={styles.buttonTextStyle}>Done</Text></TouchableOpacity>
                    </View>
                </View>
            </View>
        </Modal>
    );
};


const FortyDaySurgeModal = ({ visible, onClose, surgeData, onUpdateSurgeData }) => {
    const today = useMemo(() => getTodayString(), []);
    const tasks = useMemo(() => [
        { key: 'pushups', label: '50 Pushups' },
        { key: 'walk', label: '2 Miles Walked/Ran' },
        { key: 'noAlcohol', label: 'Alcohol-Free' },
        { key: 'diet', label: 'Dietary Eating' },
        { key: 'workout', label: '90-Minute Workout' },
    ], []);

    const startDate = surgeData?.startDate;
    const daysData = useMemo(() => {
        if (!startDate) return [];
        return Array.from({ length: 40 }, (_, i) => {
            const dayDate = new Date(startDate);
            dayDate.setDate(dayDate.getDate() + i);
            const dateString = `${dayDate.getFullYear()}-${String(dayDate.getMonth() + 1).padStart(2, '0')}-${String(dayDate.getDate()).padStart(2, '0')}`;
            
            const dayProgress = surgeData[dateString] || {};
            const isComplete = tasks.every(task => dayProgress[task.key]);

            return { id: i + 1, date: dateString, isComplete };
        });
    }, [startDate, surgeData, tasks]);

    const handleToggleTask = (taskKey) => {
        const todayProgress = surgeData[today] || {};
        const newProgress = { ...todayProgress, [taskKey]: !todayProgress[taskKey] };
        onUpdateSurgeData({ ...surgeData, [today]: newProgress });
    };
    
    const handleStartChallenge = () => {
        Alert.alert("Start 40 Day Surge?", "This will set today as Day 1 of your challenge.", [
            { text: "Cancel", style: "cancel" },
            { text: "Start Now", onPress: () => onUpdateSurgeData({ startDate: today }) }
        ]);
    };
    
    const ListHeader = () => (
        <>
            <View style={styles.subHeaderContainer}><Text style={styles.subHeader}>Today's Tasks</Text></View>
            {tasks.map(task => (
                <TouchableOpacity key={task.key} style={styles.taskItem} onPress={() => handleToggleTask(task.key)}>
                    <Text style={styles.taskName}>{task.label}</Text>
                    <CheckboxIcon checked={surgeData[today]?.[task.key] || false} />
                </TouchableOpacity>
            ))}
            <View style={styles.subHeaderContainer}><Text style={styles.subHeader}>Challenge Progress</Text></View>
        </>
    );

    return (
        <Modal animationType="slide" visible={visible} onRequestClose={onClose}>
            <SafeAreaView style={styles.modalScreenContainer}>
                <View style={styles.modalScreenHeader}>
                    <Text style={styles.modalScreenTitle}>40 Day Surge</Text>
                    <TouchableOpacity onPress={onClose}><Text style={styles.closeButtonText}>Close</Text></TouchableOpacity>
                </View>
                {!startDate ? (
                    <View style={{alignItems: 'center', marginVertical: 40, paddingHorizontal: 20}}>
                        <Text style={styles.noDataText}>Start your 40 day high-intensity challenge to build discipline.</Text>
                        <TouchableOpacity style={[styles.logButton, {marginTop: 20}]} onPress={handleStartChallenge}>
                            <Text style={styles.buttonTextStyle}>Start 40 Day Surge</Text>
                        </TouchableOpacity>
                    </View>
                ) : (
                    <FlatList
                        ListHeaderComponent={ListHeader}
                        data={daysData}
                        keyExtractor={item => item.id.toString()}
                        numColumns={5}
                        contentContainerStyle={{ paddingHorizontal: 20 }}
                        renderItem={({ item }) => (
                            <View style={[styles.daySquare, item.isComplete && styles.daySquareComplete]}>
                                {item.isComplete ? <GreenCheckIcon /> : <Text style={styles.daySquareText}>{item.id}</Text>}
                            </View>
                        )}
                    />
                )}
            </SafeAreaView>
        </Modal>
    );
};


const ChallengeModal = ({ visible, onClose, challengeData, onUpdateChallengeData }) => {
    const [friendUsername, setFriendUsername] = useState(challengeData.friendUsername || '');
    const [searchQuery, setSearchQuery] = useState('');

    const today = useMemo(() => getTodayString(), []);
    const tasks = useMemo(() => [
        { key: 'hydration', label: '8 Glasses of Water', points: 10 },
        { key: 'steps', label: '10,000 Steps', points: 10 },
    ], []);

    const startDate = challengeData?.startDate;
    const friendData = friendUsername ? MOCK_USERS[friendUsername.toLowerCase()]?.thirtyDayChallengeData : null;

    const handleToggleTask = (taskKey, points) => {
        const todayData = challengeData[today] || { user: {}, friend: { score: 0 } };
        const wasCompleted = todayData.user?.[taskKey];
        const currentScore = todayData.user?.score || 0;
        const newUserData = {
            ...todayData.user,
            [taskKey]: !wasCompleted,
            score: wasCompleted ? currentScore - points : currentScore + points,
        };

        onUpdateChallengeData({ ...challengeData, [today]: { ...todayData, user: newUserData } });
    };

    const handleStartChallenge = () => {
        Alert.alert("Start 30-Day Challenge?", "This will set today as Day 1.", [
            { text: "Cancel", style: "cancel" },
            { text: "Start Now", onPress: () => onUpdateChallengeData({ startDate: today, friendUsername: '' }) }
        ]);
    };
    
    const handleSelectFriend = (username) => {
        setFriendUsername(username);
        setSearchQuery('');
        onUpdateChallengeData({ ...challengeData, friendUsername: username });
    };

    const { daysData, userTotalScore, friendTotalScore } = useMemo(() => {
        if (!startDate) return { daysData: [], userTotalScore: 0, friendTotalScore: 0 };
        let userTotal = 0; let friendTotal = 0;
        const data = Array.from({ length: 30 }, (_, i) => {
            const dayDate = new Date(startDate);
            dayDate.setDate(dayDate.getDate() + i);
            const dateString = `${dayDate.getFullYear()}-${String(dayDate.getMonth() + 1).padStart(2, '0')}-${String(dayDate.getDate()).padStart(2, '0')}`;
            
            const dayProgress = challengeData[dateString]?.user;
            userTotal += dayProgress?.score || 0;
            
            if (friendData) {
                const friendDayProgress = friendData[dateString]?.user;
                friendTotal += friendDayProgress?.score || 0;
            }

            let status = 'none';
            if (dayProgress?.workoutCompleted && dayProgress?.hydration && dayProgress?.steps) status = 'perfect';
            else if (dayProgress?.score > 0) status = 'partial';

            return { id: i + 1, status };
        });
        return { daysData: data, userTotalScore: userTotal, friendTotalScore: friendTotal };
    }, [startDate, challengeData, friendData]);

    const workoutCompletedToday = challengeData[today]?.user?.workoutCompleted;
    
    const searchResults = useMemo(() => {
        if (!searchQuery) return [];
        return Object.keys(MOCK_USERS).filter(username => username.toLowerCase().includes(searchQuery.toLowerCase()));
    }, [searchQuery]);

    return (
        <Modal animationType="slide" visible={visible} onRequestClose={onClose}>
            <SafeAreaView style={styles.modalScreenContainer}>
                <View style={styles.modalScreenHeader}><Text style={styles.modalScreenTitle}>30-Day Challenge</Text><TouchableOpacity onPress={onClose}><Text style={styles.closeButtonText}>Close</Text></TouchableOpacity></View>
                    {!startDate ? (
                        <View style={{alignItems: 'center', marginVertical: 40, paddingHorizontal: 20}}>
                            <Text style={styles.noDataText}>Start your 30-day challenge to build healthy habits.</Text>
                            <TouchableOpacity style={[styles.logButton, {marginTop: 20}]} onPress={handleStartChallenge}><Text style={styles.buttonTextStyle}>Start Challenge</Text></TouchableOpacity>
                        </View>
                    ) : (
                    <ScrollView contentContainerStyle={styles.scrollContent}>
                        <View style={styles.challengeCard}>
                            <View style={styles.challengeHeader}><Text style={styles.challengeTitle}>You vs. {friendUsername || '???'}</Text></View>
                            <View style={styles.challengeScores}>
                                <View style={styles.scoreBox}><Text style={styles.scoreLabel}>Your Score</Text><Text style={styles.scoreValue}>{userTotalScore}</Text></View>
                                <View style={styles.scoreBox}><Text style={styles.scoreLabel}>Friend's Score</Text><Text style={styles.scoreValue}>{friendTotalScore}</Text></View>
                            </View>
                            <View style={styles.challengeProgress}><View style={[styles.progressBar, { backgroundColor: '#4f46e5', width: `${(userTotalScore / (userTotalScore + friendTotalScore || 1)) * 100}%` }]} /><View style={[styles.progressBar, { backgroundColor: '#d1d5db', width: `${(friendTotalScore / (userTotalScore + friendTotalScore || 1)) * 100}%` }]} /></View>
                        </View>

                        <View style={styles.subHeaderContainer}><Text style={styles.subHeader}>Find a Friend</Text></View>
                        <TextInput style={styles.input} placeholder="Search by username..." value={searchQuery} onChangeText={setSearchQuery} />
                        {searchResults.map(username => (
                            <TouchableOpacity key={username} style={styles.searchResultItem} onPress={() => handleSelectFriend(username)}>
                                <Text style={styles.searchResultText}>{username}</Text>
                            </TouchableOpacity>
                        ))}


                        <View style={styles.subHeaderContainer}><Text style={styles.subHeader}>Today's Tasks</Text></View>
                            <View style={styles.taskItem}>
                            <Text style={styles.taskName}>Complete a Workout (25pts)</Text>
                            <CheckboxIcon checked={workoutCompletedToday || false} />
                        </View>
                        {tasks.map(task => (
                            <TouchableOpacity key={task.key} style={styles.taskItem} onPress={() => handleToggleTask(task.key, task.points)}>
                                <Text style={styles.taskName}>{task.label} ({task.points}pts)</Text>
                                <CheckboxIcon checked={challengeData[today]?.user?.[task.key] || false} />
                            </TouchableOpacity>
                        ))}
                        
                        <View style={styles.subHeaderContainer}><Text style={styles.subHeader}>Challenge Progress</Text></View>
                        <FlatList
                            data={daysData}
                            keyExtractor={item => item.id.toString()}
                            numColumns={6}
                            contentContainerStyle={{ alignItems: 'center' }}
                            renderItem={({ item }) => (
                                <View style={[styles.daySquareSmall, styles[`daySquare_${item.status}`]]}>
                                    <Text style={styles.daySquareTextSmall}>{item.id}</Text>
                                </View>
                            )}
                        />
                    </ScrollView>
                    )}
            </SafeAreaView>
        </Modal>
    );
};

const LocationInput = React.memo(({ location, setLocation, gymLocations }) => {
    const [open, setOpen] = useState(false);
    const [items, setItems] = useState([]);

    useEffect(() => {
        setItems(gymLocations.map(gym => ({label: gym, value: gym})));
    }, [gymLocations]);

    return (
        <View style={styles.locationContainer}>
            <Text style={styles.subHeader}>Location</Text>
            <DropDownPicker
                open={open}
                value={location}
                items={items}
                setOpen={setOpen}
                setValue={setLocation}
                setItems={setItems}
                searchable={true}
                addCustomItem={true}
                placeholder="Select or type a new location"
                searchPlaceholder="Search or type to add..."
                listMode="MODAL"
                style={styles.dropdown}
                containerStyle={{height: 60}}
                zIndex={3000}
                zIndexInverse={1000}
            />
        </View>
    );
});

const ExerciseDetailInputs = React.memo(({ exercise, exerciseDetails, currentWorkouts, updateSet, addSet, toggleSetComplete, openPlateCalculator }) => {
    const lastWorkoutForExercise = useMemo(() => 
        currentWorkouts.find(w => w.detailedLog && w.detailedLog[exercise]), 
    [currentWorkouts, exercise]);
    
    let lastPerformanceString = 'No previous data';
    if(lastWorkoutForExercise) {
        const lastBestSet = findBestSet(lastWorkoutForExercise.detailedLog[exercise]);
        lastPerformanceString = `Last best: ${lastBestSet.reps} reps at ${lastBestSet.weight} lbs`;
    }

    return (
    <View style={styles.exerciseDetailContainer}>
        <View style={styles.exerciseHeader}><Text style={styles.exerciseText}>{exercise}</Text><Text style={styles.lastWorkoutText}>{lastPerformanceString}</Text></View>
        {(exerciseDetails[exercise] || []).map((set, setIndex) => (
            <View key={setIndex} style={[styles.setRow, set.completed && styles.setRowCompleted]}>
                <TouchableOpacity onPress={() => toggleSetComplete(exercise, setIndex)}>
                    <Ionicons name={set.completed ? "checkmark-circle" : "ellipse-outline"} size={28} color={set.completed ? "#34C759" : "#c7c7cc"} />
                </TouchableOpacity>
                <Text style={styles.setLabel}>Set {setIndex + 1}</Text>
                <TextInput style={styles.setInput} placeholder="Reps" keyboardType="numeric" value={String(set.reps)} onChangeText={(val) => updateSet(exercise, setIndex, 'reps', val)} />
                <Text>x</Text>
                <TextInput style={styles.setInput} placeholder="lbs" keyboardType="numeric" value={String(set.weight)} onChangeText={(val) => updateSet(exercise, setIndex, 'weight', val)} />
                <TouchableOpacity onPress={() => openPlateCalculator(exercise, setIndex)}><CalculatorIcon /></TouchableOpacity>
            </View>
        ))}
        <TouchableOpacity style={styles.addSetButton} onPress={() => addSet(exercise)}><Text style={styles.addSetButtonText}>+ Add Set</Text></TouchableOpacity>
    </View>
    );
});

const AddWorkoutFlowModal = ({ visible, onClose, currentWorkouts, onUpdateWorkouts, customWorkouts, onUpdateCustomWorkouts, gymLocations, onUpdateGymLocations, preselectedWorkout, onReturnToPlans, thirtyDayChallengeData, onUpdateThirtyDayChallengeData }) => {
  const [view, setView] = useState('list');
  const [selectedWorkoutName, setSelectedWorkoutName] = useState(null);
  const [customWorkoutName, setCustomWorkoutName] = useState('');
  const [selectedExercises, setSelectedExercises] = useState([]);
  const [location, setLocation] = useState(null);
  const [exerciseDetails, setExerciseDetails] = useState({});
  const [timer, setTimer] = useState(0);
  const [plateCalcVisible, setPlateCalcVisible] = useState(false);
  const [activeSetForCalc, setActiveSetForCalc] = useState({ exercise: null, setIndex: null });

  const mergedWorkoutData = useMemo(() => ({...WORKOUT_ROUTINES, ...customWorkouts}), [customWorkouts]);

  useEffect(() => {
    let interval;
    if (timer > 0) {
        interval = setInterval(() => {
            setTimer(prev => prev - 1);
        }, 1000);
    }
    return () => clearInterval(interval);
  }, [timer]);

  const resetStateAndClose = useCallback(() => {
    setView('list'); setSelectedWorkoutName(null); setCustomWorkoutName(''); setSelectedExercises([]); setLocation(null); setExerciseDetails({}); setTimer(0);
    onClose();
  }, [onClose]);

  useEffect(() => {
    if (visible && preselectedWorkout) {
        setView('detail');
        setSelectedWorkoutName(preselectedWorkout.name);
        const exercisesInRoutine = mergedWorkoutData[preselectedWorkout.name];
        if (exercisesInRoutine) {
            const initialDetails = {};
            exercisesInRoutine.forEach(item => {
                const exercises = item.type === 'single' ? [item.exercise] : item.exercises;
                exercises.forEach(ex => {
                    const lastWorkout = currentWorkouts.find(w => w.detailedLog && w.detailedLog[ex]);
                    const lastSet = lastWorkout ? findBestSet(lastWorkout.detailedLog[ex]) : { reps: '', weight: '' };
                    initialDetails[ex] = [{ reps: lastSet.reps, weight: lastSet.weight, completed: false }];
                });
            });
            setExerciseDetails(initialDetails);
        }
    } else if (!visible) {
        resetStateAndClose();
    }
  }, [visible, preselectedWorkout, mergedWorkoutData, currentWorkouts, resetStateAndClose]);
  
  const handleGoBack = () => {
    if (view === 'detail' || view === 'custom') {
      if (onReturnToPlans) { onReturnToPlans(); } 
      else { setView('list'); }
    } else {
      resetStateAndClose();
    }
  };
    
  const handleLogWorkout = async (workoutNameToLog, exercises = []) => {
    if (!workoutNameToLog.trim()) { Alert.alert("Error", "Workout name cannot be empty."); return; }
    let totalVolume = 0; const detailedLog = {}; let newRecords = [];
    const exercisesToLog = exercises.flatMap(item => item.type === 'single' ? item.exercise : item.exercises);

    exercisesToLog.forEach(ex => {
        const currentSets = exerciseDetails[ex] || [];
        detailedLog[ex] = currentSets.map(({reps, weight, completed}) => ({reps, weight, completed}));
        
        const completedSets = currentSets.filter(s => s.completed);
        if(completedSets.length > 0) {
            const lastWorkout = currentWorkouts.find(w => w.detailedLog && w.detailedLog[ex]);
            const lastBestSet = lastWorkout ? findBestSet(lastWorkout.detailedLog[ex]) : { reps: 0, weight: 0 };
            const currentBestSet = findBestSet(completedSets);

            const lastWeight = parseFloat(lastBestSet.weight) || 0;
            const currentWeight = parseFloat(currentBestSet.weight) || 0;
            const lastReps = parseInt(lastBestSet.reps, 10) || 0;
            const currentReps = parseInt(currentBestSet.reps, 10) || 0;
            
            if (currentWeight > lastWeight || (currentWeight === lastWeight && currentReps > lastReps)) {
                newRecords.push(`${ex}: ${currentReps} reps at ${currentWeight} lbs`);
            }

            completedSets.forEach(set => {
                const reps = parseInt(set.reps, 10); const weight = parseFloat(set.weight);
                if (!isNaN(reps) && !isNaN(weight)) { totalVolume += reps * weight; }
            });
        }
    });

    const newWorkout = { id: Date.now().toString(), name: workoutNameToLog, date: new Date().toLocaleDateString(), exercises: exercisesToLog, location: location, totalVolume: totalVolume, detailedLog: detailedLog };
    onUpdateWorkouts([newWorkout, ...currentWorkouts]);
    if (location && !gymLocations.includes(location)) { onUpdateGymLocations([...gymLocations, location]); }
    
    if (thirtyDayChallengeData?.startDate) {
        const today = getTodayString();
        const todayData = thirtyDayChallengeData[today] || { user: { score: 0 }, friend: { score: 0 } };
        if (!todayData.user.workoutCompleted) {
            const newUserData = { ...todayData.user, score: (todayData.user.score || 0) + 25, workoutCompleted: true };
            onUpdateThirtyDayChallengeData({ ...thirtyDayChallengeData, [today]: { ...todayData, user: newUserData }});
        }
    }
    
    let alertMessage = `You lifted a total of ${totalVolume.toLocaleString()} lbs. ${getWeightComparison(totalVolume)}`;
    if (newRecords.length > 0) {
        alertMessage += `\n\n🎉 New Personal Records:\n- ${newRecords.join('\n- ')}`;
    }
    Alert.alert("Workout Logged!", alertMessage);

    resetStateAndClose();
  };

  const handleSaveCustomWorkout = () => {
    if (!customWorkoutName.trim()) { Alert.alert("Error", "Please enter a name for your custom workout."); return; }
    if (selectedExercises.length === 0) { Alert.alert("Error", "Please add at least one exercise to your custom workout."); return; }

    const newCustomWorkout = {
        [customWorkoutName]: selectedExercises.map(e => ({ type: 'single', exercise: e }))
    };

    onUpdateCustomWorkouts({ ...customWorkouts, ...newCustomWorkout });
    Alert.alert("Success", `Workout "${customWorkoutName}" has been saved as a template.`);
    setView('list');
  };
  
  const updateSet = (exercise, setIndex, field, value) => {
    setExerciseDetails(prev => {
        const newSets = [...(prev[exercise] || [])];
        if(newSets[setIndex]){
          newSets[setIndex] = { ...newSets[setIndex], [field]: value };
          return { ...prev, [exercise]: newSets };
        }
        return prev;
    });
  };

  const addSet = (exercise) => {
    setExerciseDetails(prev => {
        const sets = prev[exercise] || [];
        const lastSet = sets.length > 0 ? sets[sets.length - 1] : { reps: '', weight: '' };
        return {
            ...prev,
            [exercise]: [...sets, { reps: lastSet.reps, weight: lastSet.weight, completed: false }]
        };
    });
  };

  const toggleSetComplete = (exercise, setIndex) => {
    if(exerciseDetails[exercise] && exerciseDetails[exercise][setIndex]) {
      updateSet(exercise, setIndex, 'completed', !exerciseDetails[exercise][setIndex].completed);
      setTimer(90);
    }
  };
  
  const toggleExercise = (exercise) => { setSelectedExercises(prev => prev.includes(exercise) ? prev.filter(e => e !== exercise) : [...prev, exercise]); };
  
  const openPlateCalculator = (exercise, setIndex) => {
    setActiveSetForCalc({ exercise, setIndex });
    setPlateCalcVisible(true);
  };
  
  const handleWeightCalculated = (totalWeight) => {
    const { exercise, setIndex } = activeSetForCalc;
    if (exercise !== null && setIndex !== null) {
        updateSet(exercise, setIndex, 'weight', String(totalWeight));
    }
    setPlateCalcVisible(false);
  };
  
  const RestTimerDisplay = () => {
    if (timer <= 0) return null;
    const minutes = Math.floor(timer / 60);
    const seconds = timer % 60;
    return (
        <View style={styles.timerContainer}>
            <Text style={styles.timerText}>REST: {minutes}:{seconds < 10 ? '0' : ''}{seconds}</Text>
        </View>
    );
  };

  return (
    <Modal animationType="slide" visible={visible} onRequestClose={resetStateAndClose}>
      <PlateCalculatorModal visible={plateCalcVisible} onClose={() => setPlateCalcVisible(false)} onCalculate={handleWeightCalculated} />
      <SafeAreaView style={styles.modalScreenContainer}>
        <View style={styles.modalScreenHeader}>
          {view !== 'list' && (<TouchableOpacity onPress={handleGoBack} style={styles.backButton}><BackIcon /></TouchableOpacity>)}
          <Text style={styles.modalScreenTitle}>{view === 'list' ? 'Choose Workout' : view === 'custom' ? 'Build Workout' : selectedWorkoutName}</Text>
          <TouchableOpacity onPress={resetStateAndClose}><Text style={styles.closeButtonText}>Cancel</Text></TouchableOpacity>
        </View>
        <RestTimerDisplay />
        <View style={{flex: 1}}>
        {view === 'list' ? (
          <ScrollView contentContainerStyle={styles.scrollContent}>
            <TouchableOpacity style={styles.workoutItem} onPress={() => setView('custom')}><Text style={styles.workoutName}>Create Custom Workout</Text><Ionicons name="add-outline" size={24} color="#007aff" /></TouchableOpacity>
            {Object.keys(mergedWorkoutData).map(name => (<TouchableOpacity key={name} style={styles.workoutItem} onPress={() => { setSelectedWorkoutName(name); setView('detail'); }}><Text style={styles.workoutName}>{name}</Text><Ionicons name="chevron-forward-outline" size={22} color="#c7c7cc" /></TouchableOpacity>))}
          </ScrollView>
        ) : view === 'detail' ? (
          <ScrollView contentContainerStyle={styles.scrollContent} nestedScrollEnabled={true}>
            <LocationInput location={location} setLocation={setLocation} gymLocations={gymLocations} />
            <View style={styles.subHeaderContainer}><Text style={styles.subHeader}>Exercises</Text></View>
            {mergedWorkoutData[selectedWorkoutName]?.map((item, index) => item.type === 'superset' ? (<View key={index} style={styles.supersetContainer}><Text style={styles.supersetLabel}>SUPERSET</Text>{item.exercises.map((ex, i) => <ExerciseDetailInputs key={i} exercise={ex} currentWorkouts={currentWorkouts} exerciseDetails={exerciseDetails} updateSet={updateSet} addSet={addSet} toggleSetComplete={toggleSetComplete} openPlateCalculator={openPlateCalculator} />)}</View>) : (<ExerciseDetailInputs key={index} exercise={item.exercise} currentWorkouts={currentWorkouts} exerciseDetails={exerciseDetails} updateSet={updateSet} addSet={addSet} toggleSetComplete={toggleSetComplete} openPlateCalculator={openPlateCalculator} />))}
            <TouchableOpacity style={styles.logButton} onPress={() => handleLogWorkout(selectedWorkoutName, mergedWorkoutData[selectedWorkoutName])}><Text style={styles.buttonTextStyle}>Log this Workout</Text></TouchableOpacity>
          </ScrollView>
        ) : ( // custom view
          <ScrollView contentContainerStyle={styles.scrollContent} nestedScrollEnabled={true}>
            <TextInput style={styles.input} placeholder="Custom Workout Name" value={customWorkoutName} onChangeText={setCustomWorkoutName} />
            <LocationInput location={location} setLocation={setLocation} gymLocations={gymLocations} />
            <View style={styles.subHeaderContainer}><Text style={styles.subHeader}>Selected Exercises</Text></View>
            {selectedExercises.length > 0 ? selectedExercises.map(ex => <ExerciseDetailInputs key={ex} exercise={ex} currentWorkouts={currentWorkouts} exerciseDetails={exerciseDetails} updateSet={updateSet} addSet={addSet} toggleSetComplete={toggleSetComplete} openPlateCalculator={openPlateCalculator} />) : <Text style={styles.noDataText}>No exercises selected yet.</Text>}
            <View style={styles.customWorkoutActions}>
                <TouchableOpacity style={styles.saveTemplateButton} onPress={handleSaveCustomWorkout}><Text style={styles.saveTemplateButtonText}>Save as Template</Text></TouchableOpacity>
                <TouchableOpacity style={styles.logButton} onPress={() => handleLogWorkout(customWorkoutName, selectedExercises.map(e => ({type: 'single', exercise: e})))}><Text style={styles.buttonTextStyle}>Log Workout</Text></TouchableOpacity>
            </View>
            <View style={styles.subHeaderContainer}><Text style={styles.subHeader}>Choose From Master List</Text></View>
            {ALL_EXERCISES.map(exercise => (<TouchableOpacity key={exercise} style={styles.exerciseSelectItem} onPress={() => toggleExercise(exercise)}><CheckboxIcon checked={selectedExercises.includes(exercise)} /><Text style={styles.exerciseSelectText}>{exercise}</Text></TouchableOpacity>))}
          </ScrollView>
        )}
        </View>
      </SafeAreaView>
    </Modal>
  );
};

const WorkoutPlansModal = ({ visible, onClose, onSelectWorkout }) => {
    const [view, setView] = useState('list');
    const [selectedPlan, setSelectedPlan] = useState(null);
    const handleGoBack = () => { if (view === 'planDetail') { setView('list'); setSelectedPlan(null); } else { onClose(); } };
    useEffect(() => { if (!visible) { setView('list'); setSelectedPlan(null); }}, [visible]);

    return (
        <Modal animationType="slide" visible={visible} onRequestClose={handleGoBack}>
            <SafeAreaView style={styles.modalScreenContainer}>
                <View style={styles.modalScreenHeader}><TouchableOpacity onPress={handleGoBack} style={styles.backButton}><BackIcon /></TouchableOpacity><Text style={styles.modalScreenTitle}>{view === 'list' ? 'Workout Plans' : selectedPlan?.duration}</Text><TouchableOpacity onPress={onClose}><Text style={styles.closeButtonText}>Close</Text></TouchableOpacity></View>
                <ScrollView contentContainerStyle={styles.scrollContent}>
                    {view === 'list' ? ( Object.entries(WORKOUT_PLANS).map(([name, plan]) => (<TouchableOpacity key={name} style={styles.workoutItem} onPress={() => { setSelectedPlan(plan); setView('planDetail'); }}><View><Text style={styles.workoutName}>{name}</Text><Text style={styles.workoutInfo}>{plan.description}</Text></View><Ionicons name="chevron-forward" size={22} color="#c7c7cc" /></TouchableOpacity>))) 
                    : ( selectedPlan?.schedule.map((day, dayIndex) => (
                        <View key={dayIndex} style={styles.dayItemContainer}>
                            {dayIndex % 7 === 0 && <Text style={styles.weekTitle}>Week {Math.floor(dayIndex / 7) + 1}</Text>}
                            <TouchableOpacity style={styles.dayItem} onPress={() => day.name !== 'Rest' && onSelectWorkout({ name: day.name })} disabled={day.name === 'Rest'}>
                                <Text style={styles.dayName}>{day.day}: {day.name}</Text>{day.name !== 'Rest' && <Ionicons name="chevron-forward" size={20} color="#c7c7cc" />}
                            </TouchableOpacity>
                        </View>
                    )))}
                </ScrollView>
            </SafeAreaView>
        </Modal>
    );
};

const WorkoutHubModal = ({ visible, onClose, currentWorkouts, onUpdateWorkouts, customWorkouts, onUpdateCustomWorkouts, gymLocations, onUpdateGymLocations, thirtyDayChallengeData, onUpdateThirtyDayChallengeData }) => {
    const [addWorkoutModalVisible, setAddWorkoutModalVisible] = useState(false);
    const [plansModalVisible, setPlansModalVisible] = useState(false);
    const [historyModalVisible, setHistoryModalVisible] = useState(false);
    const [preselectedWorkout, setPreselectedWorkout] = useState(null);

    const handleSelectWorkoutFromPlan = useCallback((workout) => {
        setPreselectedWorkout(workout);
        setPlansModalVisible(false);
        setAddWorkoutModalVisible(true);
    }, []);

    const handleReturnToPlans = useCallback(() => {
        setAddWorkoutModalVisible(false);
        setPlansModalVisible(true);
    }, []);
    
    const openAddWorkout = () => { setPreselectedWorkout(null); setAddWorkoutModalVisible(true); };

    return (
        <Modal animationType="slide" visible={visible} onRequestClose={onClose}>
            <SafeAreaView style={styles.modalScreenContainer}>
                <View style={styles.modalScreenHeader}><Text style={styles.modalScreenTitle}>Workout Hub</Text><TouchableOpacity onPress={onClose}><Text style={styles.closeButtonText}>Done</Text></TouchableOpacity></View>
                <ScrollView contentContainerStyle={styles.scrollContent}>
                    <TouchableOpacity style={styles.fullWidthCard} onPress={() => setPlansModalVisible(true)}><PlanIcon /><Text style={styles.fullWidthCardText}>Workout Plans</Text><Ionicons name="chevron-forward" size={24} color="#c7c7cc" /></TouchableOpacity>
                    <TouchableOpacity style={styles.fullWidthCard} onPress={openAddWorkout}><Ionicons name="add-outline" size={24} color="#6b7280" /><Text style={styles.fullWidthCardText}>Start New Workout</Text><Ionicons name="chevron-forward" size={24} color="#c7c7cc" /></TouchableOpacity>
                    <TouchableOpacity style={styles.fullWidthCard} onPress={() => setHistoryModalVisible(true)}><WorkoutIcon /><Text style={styles.fullWidthCardText}>Workout History</Text><Ionicons name="chevron-forward" size={24} color="#c7c7cc" /></TouchableOpacity>
                </ScrollView>
            </SafeAreaView>
            <WorkoutPlansModal visible={plansModalVisible} onClose={() => setPlansModalVisible(false)} onSelectWorkout={handleSelectWorkoutFromPlan} />
            <WorkoutHistoryModal visible={historyModalVisible} onClose={() => setHistoryModalVisible(false)} currentWorkouts={currentWorkouts} onUpdateWorkouts={onUpdateWorkouts} />
            <AddWorkoutFlowModal 
                visible={addWorkoutModalVisible} 
                onClose={() => setAddWorkoutModalVisible(false)} 
                currentWorkouts={currentWorkouts} 
                onUpdateWorkouts={onUpdateWorkouts} 
                customWorkouts={customWorkouts}
                onUpdateCustomWorkouts={onUpdateCustomWorkouts}
                gymLocations={gymLocations} 
                onUpdateGymLocations={onUpdateGymLocations} 
                preselectedWorkout={preselectedWorkout} 
                onReturnToPlans={handleReturnToPlans} 
                thirtyDayChallengeData={thirtyDayChallengeData}
                onUpdateThirtyDayChallengeData={onUpdateThirtyDayChallengeData}
            />
        </Modal>
    );
};

const WorkoutHistoryModal = ({ visible, onClose, currentWorkouts, onUpdateWorkouts }) => {
    const [expandedWorkoutId, setExpandedWorkoutId] = useState(null);
    const handleDeleteWorkout = (id) => { Alert.alert("Delete Workout", "Are you sure?", [{ text: "Cancel", style: "cancel" }, { text: "OK", onPress: () => onUpdateWorkouts(currentWorkouts.filter(w => w.id !== id)) }]); };
    return (
        <Modal animationType="slide" visible={visible} onRequestClose={onClose}>
            <SafeAreaView style={styles.modalScreenContainer}>
                <View style={styles.modalScreenHeader}><Text style={styles.modalScreenTitle}>Workout History</Text><TouchableOpacity onPress={onClose}><Text style={styles.closeButtonText}>Done</Text></TouchableOpacity></View>
                <ScrollView contentContainerStyle={styles.scrollContent}>
                    {currentWorkouts.length === 0 ? (<Text style={styles.noDataText}>No workouts logged yet.</Text>) : (currentWorkouts.map(workout => (
                        <View key={workout.id}>
                            <TouchableOpacity style={styles.workoutItem} onPress={() => setExpandedWorkoutId(expandedWorkoutId === workout.id ? null : workout.id)}>
                                <View style={styles.workoutDetails}><Text style={styles.workoutName}>{workout.name}</Text><Text style={styles.workoutInfo}>{workout.date} {workout.location ? `- ${workout.location}` : ''}</Text>{workout.totalVolume > 0 && <Text style={styles.workoutInfo}>Volume: {workout.totalVolume.toLocaleString()} lbs</Text>}</View>
                                <TouchableOpacity onPress={() => handleDeleteWorkout(workout.id)}><TrashIcon /></TouchableOpacity>
                            </TouchableOpacity>
                            {expandedWorkoutId === workout.id && (<View style={styles.exerciseHistoryContainer}>{workout.detailedLog ? Object.entries(workout.detailedLog).map(([ex, sets], i) => (<View key={i}><Text style={styles.exerciseHistoryText}>• {ex}</Text>{sets.map((set, setIndex) => (<Text key={setIndex} style={styles.exerciseSetDetail}>  Set {setIndex + 1}: {set.reps} reps x {set.weight} lbs</Text>))}</View>)) : workout.exercises.map((ex, i) => <Text key={i} style={styles.exerciseHistoryText}>• {ex}</Text>)}</View>)}
                        </View>
                    )))}
                </ScrollView>
            </SafeAreaView>
        </Modal>
    );
};

const DailyTasksModal = ({ visible, onClose, allTasks, onUpdateTasks, medications, onUpdateMedications, workouts }) => {
    const [medModalVisible, setMedModalVisible] = useState(false);
    const todayString = getTodayString();
    const todayTasks = useMemo(() => allTasks[todayString] || { steps: { goal: 10000, current: 0, done: false }, water: { goal: 128, current: 0, done: false }, meds_taken: [], workout: { done: false } }, [allTasks, todayString]);
    const todayDayIndex = new Date().getDay();
    const daysOfWeek = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
    const todayMeds = useMemo(() => medications.filter(med => med.days[todayDayIndex]), [medications, todayDayIndex]);
    const allMedsTaken = useMemo(() => todayMeds.length > 0 && todayMeds.every(med => todayTasks.meds_taken?.includes(med.id)), [todayMeds, todayTasks.meds_taken]);

    useEffect(() => {
        const workoutDoneToday = workouts.some(w => w.date === new Date().toLocaleDateString());
        if (workoutDoneToday && !todayTasks.workout.done) {
            const newTodayTasks = { ...todayTasks, workout: { ...todayTasks.workout, done: true } };
            onUpdateTasks({ ...allTasks, [todayString]: newTodayTasks });
        }
    }, [workouts, todayTasks, allTasks, onUpdateTasks, todayString]);

    const handleToggleTask = (taskKey) => { const newTodayTasks = { ...todayTasks, [taskKey]: { ...todayTasks[taskKey], done: !todayTasks[taskKey].done } }; onUpdateTasks({ ...allTasks, [todayString]: newTodayTasks }); };
    const handleAddWater = () => { const newWater = (todayTasks.water.current || 0) + 8; onUpdateTasks({ ...allTasks, [todayString]: { ...todayTasks, water: { ...todayTasks.water, current: newWater, done: newWater >= todayTasks.water.goal } } }); };
    
    return (
        <Modal animationType="slide" visible={visible} onRequestClose={onClose}>
            <SafeAreaView style={styles.modalScreenContainer}>
                <View style={styles.modalScreenHeader}><Text style={styles.modalScreenTitle}>Daily Tasks</Text><TouchableOpacity onPress={onClose}><Text style={styles.closeButtonText}>Done</Text></TouchableOpacity></View>
                <ScrollView contentContainerStyle={styles.scrollContent}>
                    <TouchableOpacity style={styles.taskItem} onPress={() => handleToggleTask('steps')}><View style={styles.taskDetails}><Text style={styles.taskName}>Steps</Text><Text style={styles.taskInfo}>Goal: {todayTasks.steps.goal.toLocaleString()} steps</Text></View><CheckboxIcon checked={todayTasks.steps.done} /></TouchableOpacity>
                    <TouchableOpacity style={styles.taskItem} onPress={handleAddWater}><View style={styles.taskDetails}><Text style={styles.taskName}>Water Intake</Text><Text style={styles.taskInfo}>{todayTasks.water.current} of {todayTasks.water.goal} oz</Text></View><CheckboxIcon checked={todayTasks.water.done} /></TouchableOpacity>
                    <TouchableOpacity style={styles.taskItem} onPress={() => setMedModalVisible(true)}><View style={styles.taskDetails}><Text style={styles.taskName}>Medications/Supplements</Text><Text style={styles.taskInfo}>{todayMeds.length > 0 ? `${todayMeds.length} scheduled` : 'No items for today'}</Text></View><CheckboxIcon checked={allMedsTaken || todayMeds.length === 0} /></TouchableOpacity>
                    <TouchableOpacity style={styles.taskItem} onPress={() => handleToggleTask('workout')}><View style={styles.taskDetails}><Text style={styles.taskName}>Workout</Text><Text style={styles.taskInfo}>Log a session for today</Text></View><CheckboxIcon checked={todayTasks.workout.done} /></TouchableOpacity>
                </ScrollView>
            </SafeAreaView>
            <MedicationModal visible={medModalVisible} onClose={() => setMedModalVisible(false)} allTasks={allTasks} onUpdateTasks={onUpdateTasks} medications={medications} onUpdateMedications={onUpdateMedications} daysOfWeek={daysOfWeek}/>
        </Modal>
    );
};

const MedicationModal = ({ visible, onClose, allTasks, onUpdateTasks, medications, onUpdateMedications, daysOfWeek }) => {
    const [medName, setMedName] = useState('');
    const [selectedDays, setSelectedDays] = useState(new Array(7).fill(false));
    const todayString = getTodayString();
    const todayDayIndex = new Date().getDay();
    const todayTasks = useMemo(() => allTasks[todayString] || { meds_taken: [] }, [allTasks, todayString]);
    const medsTakenToday = todayTasks.meds_taken || [];
    const todayMeds = useMemo(() => medications.filter(med => med.days[todayDayIndex]), [medications, todayDayIndex]);

    const handleAddMedication = () => { if (!medName.trim()) { Alert.alert("Error", "Item name cannot be empty."); return; } onUpdateMedications([...medications, { id: Date.now().toString(), name: medName.trim(), days: selectedDays }]); setMedName(''); setSelectedDays(new Array(7).fill(false)); };
    const toggleDay = (index) => { const newDays = [...selectedDays]; newDays[index] = !newDays[index]; setSelectedDays(newDays); };
    const deleteMedication = (id) => { Alert.alert("Delete Item", "Are you sure?", [{ text: "Cancel", style: "cancel" }, { text: "OK", onPress: () => onUpdateMedications(medications.filter(med => med.id !== id)) }]); };
    const toggleMedTaken = (medId) => { const newMedsTaken = medsTakenToday.includes(medId) ? medsTakenToday.filter(id => id !== medId) : [...medsTakenToday, medId]; onUpdateTasks({ ...allTasks, [todayString]: { ...todayTasks, meds_taken: newMedsTaken } }); };

    return (
        <Modal animationType="slide" visible={visible} onRequestClose={onClose}>
            <SafeAreaView style={styles.modalScreenContainer}>
                <View style={styles.modalScreenHeader}><Text style={styles.modalScreenTitle}>Medications</Text><TouchableOpacity onPress={onClose}><Text style={styles.closeButtonText}>Done</Text></TouchableOpacity></View>
                <ScrollView contentContainerStyle={styles.scrollContent}>
                    <View style={styles.subHeaderContainer}><Text style={styles.subHeader}>Today's Items</Text></View>
                    {todayMeds.length > 0 ? todayMeds.map(med => (<TouchableOpacity key={med.id} style={styles.taskItem} onPress={() => toggleMedTaken(med.id)}><Text style={styles.taskName}>{med.name}</Text><CheckboxIcon checked={medsTakenToday.includes(med.id)} /></TouchableOpacity>)) : <Text style={styles.noDataText}>Nothing scheduled for today.</Text>}
                    <View style={styles.subHeaderContainer}><Text style={styles.subHeader}>Manage All Items</Text></View>
                    <TextInput style={styles.input} placeholder="New Item Name" value={medName} onChangeText={setMedName} />
                    <View style={styles.daysContainer}>{daysOfWeek.map((day, index) => (<TouchableOpacity key={`${day}-${index}`} style={[styles.dayButton, selectedDays[index] && styles.dayButtonSelected]} onPress={() => toggleDay(index)}><Text style={[styles.dayButtonText, selectedDays[index] && styles.dayButtonTextSelected]}>{day}</Text></TouchableOpacity>))}</View>
                    <TouchableOpacity style={styles.logButton} onPress={handleAddMedication}><Text style={styles.buttonTextStyle}>Add New Item</Text></TouchableOpacity>
                    {medications.map(med => (<View key={med.id} style={styles.medicationItem}><Text style={styles.medicationName}>{med.name} ({med.days.map((d, i) => d ? daysOfWeek[i] : '').filter(Boolean).join(', ')})</Text><TouchableOpacity onPress={() => deleteMedication(med.id)}><TrashIcon /></TouchableOpacity></View>))}
                </ScrollView>
            </SafeAreaView>
        </Modal>
    );
};

const WeightTrackerModal = ({ visible, onClose, currentWeightData, onUpdateWeight }) => {
    const [newWeight, setNewWeight] = useState('');
    const handleAddWeight = () => { if (!newWeight.trim() || isNaN(parseFloat(newWeight))) { Alert.alert('Invalid Input'); return; } onUpdateWeight([...currentWeightData, { date: new Date().toLocaleDateString('en-US', {month: '2-digit', day: '2-digit'}), weight: parseFloat(newWeight) }]); setNewWeight(''); };
    const chartData = { labels: currentWeightData.map(e => e.date), datasets: [{ data: currentWeightData.length > 0 ? currentWeightData.map(e => e.weight) : [0] }] };
    return (
        <Modal animationType="slide" visible={visible} onRequestClose={onClose}>
            <SafeAreaView style={styles.modalScreenContainer}>
                <View style={styles.modalScreenHeader}><Text style={styles.modalScreenTitle}>Weight Tracker</Text><TouchableOpacity onPress={onClose}><Text style={styles.closeButtonText}>Done</Text></TouchableOpacity></View>
                <ScrollView contentContainerStyle={styles.scrollContent}>
                    {currentWeightData.length > 0 ? (<LineChart data={chartData} width={Dimensions.get('window').width - 40} height={220} chartConfig={{ backgroundColor: '#fff', backgroundGradientFrom: '#fff', backgroundGradientTo: '#fff', decimalPlaces: 1, color: (opacity = 1) => `rgba(0,0,0, ${opacity})`, propsForDots: { r: '6', strokeWidth: '2', stroke: '#007aff' } }} bezier style={{ marginVertical: 8, borderRadius: 16 }} />) : (<Text style={styles.noDataText}>No weight logged yet.</Text>)}
                    <TextInput style={styles.input} placeholder={`Enter today's weight (lbs)`} keyboardType="numeric" value={newWeight} onChangeText={setNewWeight} />
                    <TouchableOpacity style={styles.logButton} onPress={handleAddWeight}><Text style={styles.buttonTextStyle}>Log Weight</Text></TouchableOpacity>
                </ScrollView>
            </SafeAreaView>
        </Modal>
    );
};

// --- Main App Component ---
export default function App() {
  const [isLoading, setIsLoading] = useState(true);
  const [workouts, setWorkouts] = useState([]);
  const [weightData, setWeightData] = useState([]);
  const [customWorkouts, setCustomWorkouts] = useState({});
  const [tasks, setTasks] = useState({});
  const [medications, setMedications] = useState([]);
  const [gymLocations, setGymLocations] = useState([]);
  const [images, setImages] = useState([]);
  const [fortyDaySurgeData, setFortyDaySurgeData] = useState({});
  const [thirtyDayChallengeData, setThirtyDayChallengeData] = useState({});

  const [workoutHubVisible, setWorkoutHubVisible] = useState(false);
  const [photosModalVisible, setPhotosModalVisible] = useState(false);
  const [weightModalVisible, setWeightModalVisible] = useState(false);
  const [tasksModalVisible, setTasksModalVisible] = useState(false);
  const [challengeCenterVisible, setChallengeCenterVisible] = useState(false);
  const [challengeModalVisible, setChallengeModalVisible] = useState(false);
  const [fortyDaySurgeVisible, setFortyDaySurgeVisible] = useState(false);

  useEffect(() => {
    const loadAllData = async () => {
      try {
        const keys = ['workouts', 'weight_data', 'custom_workouts', 'daily_tasks', 'medications', 'gym_locations', 'progress_pics', 'forty_day_surge_data', 'thirty_day_challenge_data'];
        const dataPairs = await AsyncStorage.multiGet(keys);
        const parsedData = dataPairs.reduce((acc, [key, value]) => { acc[key] = value ? JSON.parse(value) : null; return acc; }, {});
        
        setWorkouts(parsedData.workouts || []);
        setWeightData(parsedData.weight_data || []);
        setCustomWorkouts(parsedData.custom_workouts || {});
        setTasks(parsedData.daily_tasks || {});
        setMedications(parsedData.medications || []);
        setGymLocations(parsedData.gym_locations || []);
        setImages(parsedData.progress_pics || []);
        setFortyDaySurgeData(parsedData.forty_day_surge_data || {});
        setThirtyDayChallengeData(parsedData.thirty_day_challenge_data || {});

      } catch (error) { console.error('Failed to load data from storage.', error); }
      finally {
        setTimeout(() => setIsLoading(false), 3000);
      }
    };
    loadAllData();
  }, []);

  const createUpdateHandler = (setter, key) => useCallback(async (data) => {
    try { setter(data); await AsyncStorage.setItem(key, JSON.stringify(data)); }
    catch (e) { console.error(`Failed to save ${key}.`, e); Alert.alert('Save Error', `Could not save your ${key.replace(/_/g, ' ')}.`); }
  }, []);

  const handleUpdateWorkouts = createUpdateHandler(setWorkouts, 'workouts');
  const handleUpdateWeight = createUpdateHandler(setWeightData, 'weight_data');
  const handleUpdateCustomWorkouts = createUpdateHandler(setCustomWorkouts, 'custom_workouts');
  const handleUpdateTasks = createUpdateHandler(setTasks, 'daily_tasks');
  const handleUpdateMedications = createUpdateHandler(setMedications, 'medications');
  const handleUpdateGymLocations = createUpdateHandler(setGymLocations, 'gym_locations');
  const handleUpdateImages = createUpdateHandler(setImages, 'progress_pics');
  const handleUpdateFortyDaySurgeData = createUpdateHandler(setFortyDaySurgeData, 'forty_day_surge_data');
  const handleUpdateThirtyDayChallengeData = createUpdateHandler(setThirtyDayChallengeData, 'thirty_day_challenge_data');
  
  const handleOpenMaps = () => {
    const query = "gyms near me";
    const url = Platform.select({ ios: `maps:?q=${query}`, android: `geo:0,0?q=${query}` });
    Linking.canOpenURL(url).then(supported => { if (!supported) { Alert.alert("Error", "Could not open maps application."); } else { return Linking.openURL(url); } }).catch(err => console.error('An error occurred', err));
  };
  
    const latestWeight = weightData.length > 0 ? weightData[weightData.length - 1].weight : 'N/A';

    const todayString = getTodayString();
    const todayTasks = tasks[todayString] || {
        steps: { goal: 10000, current: 0, done: false },
        water: { goal: 128, current: 0, done: false },
        meds_taken: [],
        workout: { done: false }
    };
    const todayDayIndex = new Date().getDay();
    const todayMeds = medications.filter(med => med.days[todayDayIndex]);
    const allMedsTaken = todayMeds.length > 0 && todayMeds.every(med => (todayTasks.meds_taken || []).includes(med.id));

    let completedTasks = 0;
    if (todayTasks.steps?.done) completedTasks++;
    if (todayTasks.water?.done) completedTasks++;
    if (todayTasks.workout?.done) completedTasks++;
    if (allMedsTaken || todayMeds.length === 0) completedTasks++;

    const totalTasks = 4;
    const progressPercent = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;

    const workoutsThisWeek = workouts.filter(w => {
        const workoutDate = new Date(w.date);
        const today = new Date();
        const oneWeekAgo = new Date();
        oneWeekAgo.setDate(today.getDate() - 7);
        return workoutDate >= oneWeekAgo && workoutDate <= today;
    }).length;

    const currentStreak = useMemo(() => {
        let streak = 0;
        let date = new Date();
        while (true) {
            const dateString = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
            const dayTasks = tasks[dateString];
            if (!dayTasks) break;

            const dayMeds = medications.filter(med => med.days[new Date(date).getDay()]);
            const allMedsDoneForDay = dayMeds.length === 0 || (dayMeds.every(med => (dayTasks?.meds_taken || []).includes(med.id)));

            const allDoneForDay = dayTasks.steps?.done && dayTasks.water?.done && allMedsDoneForDay && dayTasks.workout?.done;

            if (allDoneForDay) {
                streak++;
                date.setDate(date.getDate() - 1);
            } else {
                break;
            }
        }
        return streak;
    }, [tasks, medications]);
    
    if (isLoading) {
        return <SplashScreen />;
    }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.mainHeader}>
        <View>
          <Text style={styles.mainHeaderText}>{getGreeting()}</Text>
          <Text style={styles.mainHeaderSubtext}>Ready to build for purpose?</Text>
        </View>
      </View>
      <ScrollView contentContainerStyle={styles.dashboard}>
        <TouchableOpacity style={styles.focusCard} onPress={() => setTasksModalVisible(true)}>
            <Image source={require('./assets/logo.png')} style={styles.focusCardLogo} />
            <View style={styles.snapshotRow}>
                <View style={styles.snapshotItem}><Text style={styles.snapshotValue}>{latestWeight} lbs</Text><Text style={styles.snapshotLabel}>Current Weight</Text></View>
                <View style={styles.snapshotItem}><Text style={styles.snapshotValue}>{currentStreak} Days 🔥</Text><Text style={styles.snapshotLabel}>Current Streak</Text></View>
                <View style={styles.snapshotItem}><Text style={styles.snapshotValue}>{workoutsThisWeek}</Text><Text style={styles.snapshotLabel}>Workouts This Week</Text></View>
            </View>
            <View style={styles.progressCircleContainer}>
                <Svg height="100" width="100" viewBox="0 0 36 36"><Circle cx="18" cy="18" r="15.9155" fill="transparent" stroke="rgba(255,255,255,0.3)" strokeWidth="3" /><Circle cx="18" cy="18" r="15.9155" fill="transparent" stroke="white" strokeWidth="3" strokeDasharray={`${progressPercent}, 100`} strokeLinecap="round" transform="rotate(-90 18 18)" /></Svg>
                <View style={styles.progressCircleTextContainer}><Text style={styles.progressCircleText}>{completedTasks}/{totalTasks}</Text><Text style={styles.progressCircleSubText}>Tasks</Text></View>
            </View>
        </TouchableOpacity>

        <TouchableOpacity style={styles.fullWidthCard} onPress={() => setChallengeCenterVisible(true)}>
            <View style={{flex: 1}}>
                <Text style={styles.cardTitle}>Active Challenges</Text>
                <View style={{marginBottom: 10}}>
                    <Text style={styles.challengeSnapshotTitle}>30-Day Challenge</Text>
                    <View style={styles.challengeProgress}>
                        <View style={[styles.progressBar, { backgroundColor: '#4f46e5', width: thirtyDayChallengeData.startDate ? `${((Object.keys(thirtyDayChallengeData).length - 2) / 30) * 100}%` : '0%' }]} />
                         {!thirtyDayChallengeData.startDate && <Text style={styles.ghostText}>Commit to Challenge</Text>}
                    </View>
                </View>
                <View>
                     <Text style={styles.challengeSnapshotTitle}>40 Day Surge</Text>
                    <View style={styles.challengeProgress}>
                        <View style={[styles.progressBar, { backgroundColor: '#ff9500', width: fortyDaySurgeData.startDate ? `${((Object.keys(fortyDaySurgeData).length - 1) / 40) * 100}%` : '0%' }]} />
                        {!fortyDaySurgeData.startDate && <Text style={styles.ghostText}>Commit to Challenge</Text>}
                    </View>
                </View>
            </View>
        </TouchableOpacity>
        
        <View style={styles.gridContainer}>
            <TouchableOpacity style={styles.gridItem} onPress={() => setWorkoutHubVisible(true)}><WorkoutIcon /><Text style={styles.gridItemText}>Workout Hub</Text></TouchableOpacity>
            <TouchableOpacity style={styles.gridItem} onPress={() => setPhotosModalVisible(true)}><PhotoIcon /><Text style={styles.gridItemText}>Progress Pics</Text></TouchableOpacity>
            <TouchableOpacity style={styles.gridItem} onPress={() => setWeightModalVisible(true)}><WeightIcon /><Text style={styles.gridItemText}>Weight Tracker</Text></TouchableOpacity>
            <TouchableOpacity style={[styles.gridItem, styles.gridItemDisabled]} disabled={true}>
                <PRIcon />
                <Text style={styles.gridItemText}>Personal Records</Text>
                <Text style={styles.comingSoonText}>Coming Soon</Text>
            </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Modals */}
      <WorkoutHubModal 
        visible={workoutHubVisible} 
        onClose={() => setWorkoutHubVisible(false)} 
        currentWorkouts={workouts} 
        onUpdateWorkouts={handleUpdateWorkouts} 
        customWorkouts={customWorkouts} 
        onUpdateCustomWorkouts={handleUpdateCustomWorkouts} 
        gymLocations={gymLocations} 
        onUpdateGymLocations={handleUpdateGymLocations}
        thirtyDayChallengeData={thirtyDayChallengeData}
        onUpdateThirtyDayChallengeData={handleUpdateThirtyDayChallengeData}
       />
      <PhotoGalleryModal visible={photosModalVisible} onClose={() => setPhotosModalVisible(false)} currentImages={images} onUpdateImages={handleUpdateImages} />
      <WeightTrackerModal visible={weightModalVisible} onClose={() => setWeightModalVisible(false)} currentWeightData={weightData} onUpdateWeight={handleUpdateWeight} />
      <DailyTasksModal 
        visible={tasksModalVisible} 
        onClose={() => setTasksModalVisible(false)} 
        allTasks={tasks} 
        onUpdateTasks={handleUpdateTasks} 
        medications={medications} 
        onUpdateMedications={handleUpdateMedications} 
        workouts={workouts}
      />
      <ChallengeCenterModal
        visible={challengeCenterVisible}
        onClose={() => setChallengeCenterVisible(false)}
        onOpen30DayChallenge={() => { setChallengeCenterVisible(false); setChallengeModalVisible(true); }}
        onOpen40DaySurge={() => { setChallengeCenterVisible(false); setFortyDaySurgeVisible(true); }}
      />
      <ChallengeModal 
        visible={challengeModalVisible} 
        onClose={() => setChallengeModalVisible(false)} 
        challengeData={thirtyDayChallengeData} 
        onUpdateChallengeData={handleUpdateThirtyDayChallengeData} 
      />
      <FortyDaySurgeModal 
        visible={fortyDaySurgeVisible} 
        onClose={() => setFortyDaySurgeVisible(false)} 
        surgeData={fortyDaySurgeData} 
        onUpdateSurgeData={handleUpdateFortyDaySurgeData} 
      />
    </SafeAreaView>
  );
}

// --- Styles ---
const styles = StyleSheet.create({
 splashContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#000000',
 },
 splashLogo: {
    width: 150,
    height: 150,
    marginBottom: 20,
 },
 container: { flex: 1, backgroundColor: '#f0f2f5' },
 mainHeader: { flexDirection: 'row', alignItems: 'center', padding: 15, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#eee', paddingTop: Platform.OS === 'android' ? 40 : 50 },
 focusCardLogo: {
    width: 60,
    height: 60,
    borderRadius: 30,
    alignSelf: 'center',
    marginBottom: 15,
 },
 mainHeaderText: { fontSize: 22, fontWeight: 'bold', color: '#1c1c1e' },
 mainHeaderSubtext: { fontSize: 14, color: '#8e8e93' },
 dashboard: { padding: 10, paddingBottom: 20 },
 focusCard: { backgroundColor: '#4f46e5', color: 'white', padding: 20, borderRadius: 20, marginBottom: 15, shadowColor: '#4f46e5', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 5, elevation: 8 },
 snapshotRow: { flexDirection: 'row', justifyContent: 'space-around', marginBottom: 15 },
 snapshotItem: { alignItems: 'center' },
 snapshotValue: { fontSize: 18, fontWeight: 'bold', color: 'white' },
 snapshotLabel: { fontSize: 12, color: 'white', opacity: 0.8, marginTop: 4 },
 progressCircleContainer: { alignItems: 'center', justifyContent: 'center', marginTop: 10 },
 progressCircleTextContainer: { position: 'absolute', alignItems: 'center', justifyContent: 'center' },
 progressCircleText: { fontSize: 24, fontWeight: 'bold', color: 'white' },
 progressCircleSubText: { fontSize: 12, color: 'white', opacity: 0.8 },
 fullWidthCard: { backgroundColor: '#fff', padding: 20, borderRadius: 20, marginBottom: 15, flexDirection: 'row', alignItems: 'center' },
 cardTitle: { fontSize: 14, fontWeight: '500', color: '#6b7280', marginBottom: 10, },
 cardMainText: { fontSize: 28, fontWeight: 'bold', color: '#111827', },
 cardTrendText: { fontSize: 12, fontWeight: '600', marginTop: 4, },
 fullWidthCardText: { fontSize: 16, fontWeight: '600', color: '#374151', marginLeft: 15, flex: 1 },
 modalScreenContainer: { flex: 1, backgroundColor: '#f0f2f5' },
 modalScreenHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 15, borderBottomWidth: 1, borderBottomColor: '#ddd', backgroundColor: '#fff' },
 modalScreenTitle: { fontSize: 22, fontWeight: 'bold', flex: 1, textAlign: 'center' },
 closeButtonText: { fontSize: 17, color: '#007aff', fontWeight: '600' },
 backButton: { position: 'absolute', left: 20, zIndex: 1, top: 15 },
 scrollContent: { padding: 20, paddingBottom: 100 },
 workoutItem: { backgroundColor: '#fff', padding: 20, borderRadius: 12, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 15 },
 workoutDetails: { flex: 1 },
 workoutName: { fontSize: 18, fontWeight: '600' },
 workoutInfo: { fontSize: 14, color: '#8e8e93', marginTop: 4 },
 noDataText: { textAlign: 'center', marginTop: 50, fontSize: 16, color: '#8e8e93', paddingHorizontal: 20 },
 newWorkoutButton: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#eef5ff', padding: 20, borderRadius: 12, marginBottom: 20, borderWidth: 1, borderColor: '#007aff' },
 newWorkoutButtonText: { fontSize: 18, fontWeight: '600', color: '#007aff', marginLeft: 10 },
 input: { width: '100%', height: 50, backgroundColor: '#fff', borderColor: '#ddd', borderWidth: 1, borderRadius: 10, paddingHorizontal: 15, marginBottom: 15, fontSize: 16 },
 buttonTextStyle: { color: 'white', fontWeight: 'bold', textAlign: 'center', fontSize: 16 },
 photoGrid: { flexDirection: 'row', flexWrap: 'wrap', padding: 5 },
 photoContainer: { width: '50%', padding: 5, aspectRatio: 1, },
 photoWithBorder: { flex: 1, borderRadius: 10, borderWidth: 1, borderColor: '#d3d3d3', backgroundColor: '#f0f2f5', overflow: 'hidden', },
 photoInBorder: { flex: 1, width: '100%', height: '100%', borderRadius: 10, },
 addPhotoTile: { width: '50%', padding: 5, aspectRatio: 1, justifyContent: 'center', alignItems: 'center', borderWidth: 2, borderColor: '#ddd', borderStyle: 'dashed', borderRadius: 10 },
 addPhotoText: { fontSize: 40, color: '#ccc' },
 addPhotoSubText: { fontSize: 16, color: '#ccc', marginTop: 5 },
 photoDeleteButton: { position: 'absolute', top: 10, right: 10, backgroundColor: 'rgba(0,0,0,0.3)', borderRadius: 15, padding: 2 },
 logButton: { backgroundColor: '#007aff', padding: 15, borderRadius: 10, alignItems: 'center', marginTop: 20, flex: 1 },
 exerciseSelectItem: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', padding: 15, borderRadius: 10, marginBottom: 10 },
 exerciseSelectText: { fontSize: 16, marginLeft: 15 },
 supersetContainer: { backgroundColor: '#fff', borderWidth: 1, borderColor: '#007aff', borderRadius: 10, padding: 15, marginBottom: 10 },
 supersetLabel: { fontSize: 12, fontWeight: 'bold', color: '#007aff', marginBottom: 10, textTransform: 'uppercase' },
 exerciseHistoryContainer: { padding: 15, backgroundColor: '#f9f9f9', borderBottomLeftRadius: 12, borderBottomRightRadius: 12, marginTop: -15, marginBottom: 15 },
 exerciseHistoryText: { fontSize: 14, color: '#555', lineHeight: 22 },
 exerciseSetDetail: { fontSize: 13, color: '#777', marginLeft: 10, lineHeight: 20 },
 taskItem: { backgroundColor: '#fff', padding: 20, borderRadius: 12, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 15 },
 taskDetails: { flex: 1 },
 taskName: { fontSize: 18, fontWeight: '600' },
 taskInfo: { fontSize: 14, color: '#8e8e93', marginTop: 4 },
 medicationItem: { backgroundColor: '#fff', padding: 20, borderRadius: 12, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 15 },
 medicationName: { fontSize: 16, fontWeight: '500', flex: 1, marginRight: 10 },
 daysContainer: { flexDirection: 'row', justifyContent: 'space-around', width: '100%', marginBottom: 20 },
 dayButton: { width: 40, height: 40, borderRadius: 20, justifyContent: 'center', alignItems: 'center', backgroundColor: '#eee' },
 dayButtonSelected: { backgroundColor: '#007aff' },
 dayButtonText: { color: '#000', fontWeight: 'bold' },
 dayButtonTextSelected: { color: '#fff' },
 subHeaderContainer: { paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#ddd', marginBottom: 15 },
 subHeader: { fontSize: 18, fontWeight: 'bold', color: '#333' },
 exerciseDetailContainer: { backgroundColor: '#fff', padding: 15, borderRadius: 12, marginBottom: 10, borderWidth: 1, borderColor: '#eee' },
 exerciseHeader: { borderBottomWidth: 1, borderColor: '#eee', paddingBottom: 10, marginBottom: 10, },
 lastWorkoutText: { fontSize: 12, color: '#6b7280', fontStyle: 'italic' },
 exerciseText: { fontSize: 18, fontWeight: '600' },
 setRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 8, paddingHorizontal: 5, borderRadius: 8 },
 setRowCompleted: { backgroundColor: '#e8f5e9' },
 setLabel: { fontSize: 16, flex: 0.8, color: '#6b7280' },
 setInput: { borderWidth: 1, borderColor: '#ddd', borderRadius: 8, padding: 10, width: 70, textAlign: 'center', marginHorizontal: 5 },
 addSetButton: { backgroundColor: '#eef5ff', padding: 12, borderRadius: 8, alignItems: 'center', marginTop: 10 },
 addSetButtonText: { color: '#007aff', fontWeight: '600', fontSize: 16 },
 weekTitle: { fontSize: 20, fontWeight: 'bold', marginBottom: 10, borderBottomWidth: 1, borderBottomColor: '#eee', paddingBottom: 5 },
 dayItemContainer: { marginBottom: 5 },
 dayItem: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#f0f0f0' },
 dayName: { fontSize: 16 },
 challengeCard: { backgroundColor: '#fff', borderRadius: 20, padding: 20, marginBottom: 15 },
 challengeHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
 challengeTitle: { fontSize: 18, fontWeight: 'bold' },
 challengeDaysLeft: { fontSize: 14, color: '#8e8e93' },
 challengeScores: { flexDirection: 'row', justifyContent: 'space-around', marginVertical: 20 },
 scoreBox: { alignItems: 'center' },
 scoreLabel: { fontSize: 14, color: '#8e8e93' },
 scoreValue: { fontSize: 28, fontWeight: 'bold' },
 challengeProgress: { flexDirection: 'row', height: 10, borderRadius: 5, overflow: 'hidden', backgroundColor: '#e9e9eb', justifyContent: 'center', alignItems: 'center' },
 progressBar: { height: '100%', position: 'absolute', left: 0, top: 0 },
 ghostText: { color: '#a9a9a9', fontSize: 10, fontWeight: 'bold' },
 daySquare: { width: (Dimensions.get('window').width - 80) / 5, height: (Dimensions.get('window').width - 80) / 5, justifyContent: 'center', alignItems: 'center', backgroundColor: '#e9e9eb', margin: 4, borderRadius: 8 },
 daySquareComplete: { backgroundColor: '#e8f5e9' },
 daySquareText: { fontSize: 16, fontWeight: 'bold', color: '#8e8e93' },
 daySquareSmall: { width: (Dimensions.get('window').width - 80) / 6, height: (Dimensions.get('window').width - 80) / 6, justifyContent: 'center', alignItems: 'center', margin: 2, borderRadius: 8 },
 daySquare_none: { backgroundColor: '#e9e9eb' },
 daySquare_partial: { backgroundColor: '#fff59d' },
 daySquare_perfect: { backgroundColor: '#a5d6a7' },
 daySquareTextSmall: { fontSize: 14, fontWeight: 'bold', color: '#8e8e93' },
 locationContainer: { zIndex: 1000, marginBottom: 15 },
 dropdown: { backgroundColor: '#fff', borderColor: '#ddd', borderWidth: 1 },
 timerContainer: { backgroundColor: '#ffc107', padding: 10, alignItems: 'center' },
 timerText: { color: 'white', fontSize: 18, fontWeight: 'bold' },
 modalOverlay: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.5)' },
 plateCalculatorContainer: { width: '90%', backgroundColor: 'white', borderRadius: 20, padding: 20, alignItems: 'center' },
 modalTitle: { fontSize: 22, fontWeight: 'bold', marginBottom: 15 },
 totalWeightText: { fontSize: 48, fontWeight: 'bold', marginBottom: 5, color: '#007aff' },
 plateSubtext: { fontSize: 14, color: '#6b7280', marginBottom: 20 },
 plateRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', width: '100%', marginBottom: 15 },
 plateLabel: { fontSize: 18, fontWeight: '500' },
 plateControls: { flexDirection: 'row', alignItems: 'center' },
 plateButton: { marginHorizontal: 10 },
 plateCount: { fontSize: 24, fontWeight: 'bold', width: 40, textAlign: 'center' },
 calculatorActions: { flexDirection: 'row', justifyContent: 'space-between', width: '100%', marginTop: 20 },
 customWorkoutActions: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 20, gap: 10 },
 saveTemplateButton: { backgroundColor: '#4f46e5', padding: 15, borderRadius: 10, alignItems: 'center', flex: 1 },
 saveTemplateButtonText: { color: 'white', fontWeight: 'bold', fontSize: 16 },
 gridContainer: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },
 gridItem: { backgroundColor: '#fff', width: '48%', aspectRatio: 1, borderRadius: 20, marginBottom: 15, justifyContent: 'center', alignItems: 'center', padding: 15 },
 gridItemDisabled: { backgroundColor: '#f9f9f9', opacity: 0.6 },
 gridItemText: { fontSize: 16, fontWeight: '600', color: '#374151', marginTop: 10, textAlign: 'center' },
 searchResultItem: { backgroundColor: '#fff', padding: 15, borderBottomWidth: 1, borderBottomColor: '#eee' },
 searchResultText: { fontSize: 16 },
 challengeSnapshotTitle: { fontWeight: '600', marginBottom: 5 },
 fullScreenOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.9)',
    justifyContent: 'center',
    alignItems: 'center',
 },
 fullScreenImage: {
    width: '100%',
    height: '80%',
 },
 fullScreenCloseButton: {
    position: 'absolute',
    top: 50,
    right: 20,
    zIndex: 1,
 },
 comingSoonText: {
    position: 'absolute',
    bottom: 15,
    fontSize: 12,
    color: '#8e8e93',
    fontStyle: 'italic',
 }
});