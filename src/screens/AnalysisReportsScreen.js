import { Ionicons } from '@expo/vector-icons';
import { collection, onSnapshot } from 'firebase/firestore';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Dimensions,
  Image,
  Platform,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  UIManager,
  View
} from 'react-native';
import {
  BarChart,
  LineChart,
  PieChart
} from 'react-native-chart-kit';
import CozyButton from '../components/CozyButton';
import CozyCard from '../components/CozyCard';
import { db } from '../lib/firebase';
import { cozyTheme } from '../styles/cozyTheme';
import { sharedStyles } from '../styles/sharedStyles';

// Enable LayoutAnimation on Android
if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

const screenWidth = Dimensions.get('window').width;

// Chart configuration
const chartConfig = {
  backgroundColor: cozyTheme.colors.surface,
  backgroundGradientFrom: cozyTheme.colors.surface,
  backgroundGradientTo: cozyTheme.colors.surface,
  decimalPlaces: 0,
  color: (opacity = 1) => `rgba(74, 144, 226, ${opacity})`,
  labelColor: (opacity = 1) => cozyTheme.colors.textPrimary,
  style: {
    borderRadius: 16,
  },
  propsForDots: {
    r: '6',
    strokeWidth: '2',
    stroke: cozyTheme.colors.primary,
  },
  propsForBackgroundLines: {
    strokeDasharray: '',
    stroke: cozyTheme.colors.textLight,
    strokeWidth: 1,
  },
};

export default function AnalysisReportsScreen({ navigation }) {
  const [sightings, setSightings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [generatingReport, setGeneratingReport] = useState(false);
  const [reportType, setReportType] = useState(null);
  const [reportData, setReportData] = useState(null);
  const [expandedReport, setExpandedReport] = useState(null);

  useEffect(() => {
    // Listen for real-time updates to coyote sightings
    const unsubscribe = onSnapshot(
      collection(db, 'coyoteSightings'), 
      (snapshot) => {
        const now = new Date();
        const sightingsList = snapshot.docs
          .map(doc => ({
            id: doc.id,
            ...doc.data()
          }))
          .filter(sighting => sighting.approved !== false)
          .filter(sighting => !(sighting.timestamp?.toDate && sighting.timestamp.toDate() > now));
        setSightings(sightingsList);
        setLoading(false);
        console.log('Sightings loaded for analysis:', sightingsList.length);
      },
      (error) => {
        console.error('Error fetching sightings:', error);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, []);

  const generateReport = async (type) => {
    if (sightings.length === 0) {
      Alert.alert('No Data', 'No sighting data available for analysis.');
      return;
    }

    setGeneratingReport(true);
    setReportType(type);
    
    try {
      // Simulate analysis - in a real app, this would call analysis API
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      let report;
      switch (type) {
        case 'temporal':
          report = generateTemporalAnalysis();
          break;
        case 'geographic':
          report = generateGeographicAnalysis();
          break;
        case 'behavioral':
          report = generateBehavioralAnalysis();
          break;
        case 'trends':
          report = generateTrendAnalysis();
          break;
        default:
          report = generateOverviewReport();
      }
      
      setReportData(report);
    } catch (error) {
      console.error('Report generation error:', error);
      Alert.alert('Error', 'Failed to generate report. Please try again.');
    } finally {
      setGeneratingReport(false);
    }
  };

  const generateTemporalAnalysis = () => {
    const hourCounts = {};
    const dayCounts = {};
    
    sightings.forEach(sighting => {
      if (sighting.timestamp) {
        const date = sighting.timestamp.toDate ? sighting.timestamp.toDate() : new Date(sighting.timestamp);
        const hour = date.getHours();
        const day = date.toLocaleDateString('en-US', { weekday: 'long' });
        
        hourCounts[hour] = (hourCounts[hour] || 0) + 1;
        dayCounts[day] = (dayCounts[day] || 0) + 1;
      }
    });

    const peakHour = Object.keys(hourCounts).reduce((a, b) => hourCounts[a] > hourCounts[b] ? a : b);
    const peakDay = Object.keys(dayCounts).reduce((a, b) => dayCounts[a] > dayCounts[b] ? a : b);

    return {
      title: '⏰ Time and Behavior Patterns',
      summary: `Analysis of ${sightings.length} coyote sightings over time`,
      insights: [
        `Peak activity hour: ${peakHour}:00 (${hourCounts[peakHour]} sightings)`,
        `Most active day: ${peakDay} (${dayCounts[peakDay]} sightings)`,
        `Dawn/Dusk pattern: ${calculateCrepuscularActivity()}% of sightings occur during dawn/dusk hours`,
        `Night activity: ${calculateNightActivity()}% of sightings occur between 10 PM - 6 AM`
      ],
      recommendations: [
        'Increase vigilance during peak hours',
        'Secure pets during high-activity periods',
        'Consider motion-activated lighting for dawn/dusk hours'
      ],
      chartData: {
        hourly: hourCounts,
        daily: dayCounts
      }
    };
  };

  // Helper function to determine neighborhood from coordinates using closest match
  const getNeighborhoodName = (lat, lon) => {
    // Define neighborhood centers
    const neighborhoods = [
      { name: 'Tustin Legacy', lat: 33.705, lon: -117.837 },
      { name: 'Columbus Square', lat: 33.7225, lon: -117.840 },
      { name: 'Columbus Tustin', lat: 33.718, lon: -117.820 },
      { name: 'Tustin Ranch', lat: 33.720, lon: -117.815 },
      { name: 'Quail Hill', lat: 33.670, lon: -117.810 },
      { name: 'Woodbridge', lat: 33.670, lon: -117.790 },
      { name: 'Northwood', lat: 33.698, lon: -117.800 },
      { name: 'University Park', lat: 33.650, lon: -117.840 },
      { name: 'Turtle Rock', lat: 33.690, lon: -117.850 },
      { name: 'Portola Springs', lat: 33.730, lon: -117.790 },
      { name: 'Orchard Hills', lat: 33.710, lon: -117.770 },
      { name: 'Irvine Spectrum', lat: 33.650, lon: -117.745 },
      { name: 'Eastwood', lat: 33.685, lon: -117.770 },
      { name: 'Westpark', lat: 33.685, lon: -117.820 }
    ];
    
    // Find closest neighborhood
    let closestNeighborhood = 'Other Area';
    let minDistance = Infinity;
    
    neighborhoods.forEach(neighborhood => {
      const distance = Math.sqrt(
        Math.pow(lat - neighborhood.lat, 2) + Math.pow(lon - neighborhood.lon, 2)
      );
      if (distance < minDistance) {
        minDistance = distance;
        closestNeighborhood = neighborhood.name;
      }
    });
    
    return closestNeighborhood;
  };

  const generateGeographicAnalysis = () => {
    // Group by neighborhood names
    const neighborhoodGroups = {};
    
    sightings.forEach(sighting => {
      if (sighting.latitude && sighting.longitude) {
        const neighborhood = getNeighborhoodName(sighting.latitude, sighting.longitude);
        neighborhoodGroups[neighborhood] = (neighborhoodGroups[neighborhood] || 0) + 1;
      }
    });

    const hotspot = Object.keys(neighborhoodGroups).reduce((a, b) => 
      neighborhoodGroups[a] > neighborhoodGroups[b] ? a : b, 'Unknown'
    );

    // Calculate geographic spread (max distance between any two points)
    const spread = calculateGeographicSpread();

    return {
      title: '🗺️ Geographic Distribution Analysis',
      summary: `Spatial analysis of ${sightings.length} coyote sightings across neighborhoods`,
      insights: [
        `Primary hotspot: ${hotspot} (${neighborhoodGroups[hotspot] || 0} sightings)`,
        `Total neighborhoods affected: ${Object.keys(neighborhoodGroups).length} areas`,
        `Geographic spread: ${spread} miles`,
        `Average per neighborhood: ${(sightings.length / Object.keys(neighborhoodGroups).length).toFixed(1)} sightings`
      ],
      recommendations: [
        `Focus monitoring efforts in ${hotspot} area`,
        'Implement targeted deterrent measures in high-activity neighborhoods',
        'Coordinate with local wildlife management for hotspot areas',
        'Increase community awareness in affected neighborhoods'
      ],
      chartData: {
        neighborhoods: neighborhoodGroups
      }
    };
  };

  const generateBehavioralAnalysis = () => {
    const riskCounts = { red: 0, yellow: 0, green: 0 };
    
    // Calculate monthly average aggression (green=1, yellow=2, red=3)
    const monthlyAggression = {};
    sightings.forEach(sighting => {
      if (sighting.timestamp && sighting.sightingCategory) {
        const date = sighting.timestamp.toDate ? sighting.timestamp.toDate() : new Date(sighting.timestamp);
        const yearMonth = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
        const monthLabel = date.toLocaleDateString('en-US', { year: 'numeric', month: 'short' });
        
        if (!monthlyAggression[yearMonth]) {
          monthlyAggression[yearMonth] = { 
            label: monthLabel, 
            totalScore: 0, 
            count: 0,
            key: yearMonth,
            red: 0,
            yellow: 0,
            green: 0
          };
        }
        
        const category = sighting.sightingCategory.toLowerCase();
        let score = 1; // green
        if (category === 'yellow') score = 2;
        if (category === 'red') score = 3;
        
        monthlyAggression[yearMonth].totalScore += score;
        monthlyAggression[yearMonth].count += 1;
        monthlyAggression[yearMonth][category]++;
        
        // Count totals
        if (['red', 'yellow', 'green'].includes(category)) {
          riskCounts[category]++;
        }
      }
    });
    
    // Calculate averages and sort chronologically
    const monthlyAggressionArray = Object.values(monthlyAggression).map(month => ({
      ...month,
      averageScore: month.count > 0 ? month.totalScore / month.count : 0
    })).sort((a, b) => a.key.localeCompare(b.key));

    // Calculate overall aggression index
    const totalScore = monthlyAggressionArray.reduce((sum, m) => sum + m.totalScore, 0);
    const totalCount = monthlyAggressionArray.reduce((sum, m) => sum + m.count, 0);
    const overallAggressionIndex = totalCount > 0 ? totalScore / totalCount : 0;
    
    // Determine trend from first half to second half
    const midPoint = Math.floor(monthlyAggressionArray.length / 2);
    const firstHalf = monthlyAggressionArray.slice(0, midPoint);
    const secondHalf = monthlyAggressionArray.slice(midPoint);
    
    const firstHalfAvg = firstHalf.length > 0 ? 
      firstHalf.reduce((sum, m) => sum + m.averageScore, 0) / firstHalf.length : 0;
    const secondHalfAvg = secondHalf.length > 0 ? 
      secondHalf.reduce((sum, m) => sum + m.averageScore, 0) / secondHalf.length : 0;
    
    const aggressionChange = firstHalfAvg > 0 ? ((secondHalfAvg - firstHalfAvg) / firstHalfAvg) * 100 : 0;
    
    // Find peak and lowest aggression months
    const peakMonth = monthlyAggressionArray.length > 0 ?
      monthlyAggressionArray.reduce((max, m) => m.averageScore > max.averageScore ? m : max, monthlyAggressionArray[0]) : null;
    const lowestMonth = monthlyAggressionArray.length > 0 ?
      monthlyAggressionArray.reduce((min, m) => m.averageScore < min.averageScore ? m : min, monthlyAggressionArray[0]) : null;
    
    let trendDescription = '';
    if (aggressionChange > 15) {
      trendDescription = '⚠️ INCREASING AGGRESSION';
    } else if (aggressionChange < -15) {
      trendDescription = '✅ DECREASING AGGRESSION';
    } else {
      trendDescription = '📊 STABLE AGGRESSION LEVELS';
    }
    
    const redPercentage = ((riskCounts.red / sightings.length) * 100).toFixed(1);
    const yellowPercentage = ((riskCounts.yellow / sightings.length) * 100).toFixed(1);
    const greenPercentage = ((riskCounts.green / sightings.length) * 100).toFixed(1);

    return {
      title: '🐺 Aggression Index Analysis',
      summary: `Analyzing aggression patterns across ${sightings.length} sightings`,
      insights: [
        `Overall Aggression Index: ${overallAggressionIndex.toFixed(2)} / 3.00 (${overallAggressionIndex < 1.5 ? 'Low' : overallAggressionIndex < 2.5 ? 'Moderate' : 'High'})`,
        `Trend: ${trendDescription} (${aggressionChange > 0 ? '+' : ''}${aggressionChange.toFixed(1)}% change)`,
        `Peak aggression: ${peakMonth ? `${peakMonth.label} (${peakMonth.averageScore.toFixed(2)})` : 'N/A'}`,
        `Lowest aggression: ${lowestMonth ? `${lowestMonth.label} (${lowestMonth.averageScore.toFixed(2)})` : 'N/A'}`,
        `Risk breakdown: ${redPercentage}% High Risk (Red), ${yellowPercentage}% Medium Risk (Yellow), ${greenPercentage}% Low Risk (Green)`,
        `Total high-risk encounters: ${riskCounts.red} out of ${sightings.length} sightings`
      ],
      recommendations: [
        aggressionChange > 15 ? '🚨 URGENT: Aggression levels are rising - implement immediate deterrent measures' : 
          overallAggressionIndex >= 2.0 ? 'High aggression detected - increase monitoring and public awareness' : 'Continue current monitoring protocols',
        peakMonth && peakMonth.averageScore > 2.0 ? `Focus on ${peakMonth.label.split(' ')[0]} - historically high aggression period` : 'Monitor seasonal patterns for early warning signs',
        riskCounts.red > sightings.length * 0.15 ? 'Priority intervention needed - over 15% of encounters are high-risk' : 'Maintain hazing protocols in affected areas',
        'Educate public on recognizing and responding to aggressive coyote behavior'
      ],
      chartData: {
        riskCounts: riskCounts,
        monthlyAggression: monthlyAggressionArray,
        overallIndex: overallAggressionIndex,
        aggressionChange: aggressionChange
      }
    };
  };

  const generateTrendAnalysis = () => {
    const monthData = [];
    
    // Include ALL sightings, not just last 12 months
    sightings.forEach(sighting => {
      if (!sighting.timestamp) return;
      const date = sighting.timestamp.toDate ? sighting.timestamp.toDate() : new Date(sighting.timestamp);
      const yearMonth = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      const monthLabel = date.toLocaleDateString('en-US', { year: 'numeric', month: 'short' });
      
      const existing = monthData.find(m => m.key === yearMonth);
      if (existing) {
        existing.count++;
      } else {
        monthData.push({ key: yearMonth, label: monthLabel, count: 1, date: date });
      }
    });

    // Sort chronologically
    monthData.sort((a, b) => a.key.localeCompare(b.key));

    // Convert to object for backward compatibility
    const monthCounts = {};
    monthData.forEach(m => {
      monthCounts[m.label] = m.count;
    });

    const trend = calculateTrend(monthCounts);
    
    const dataSpan = monthData.length > 0 ? 
      `${monthData[0].label} to ${monthData[monthData.length - 1].label}` : 
      'All time';

    return {
      title: '📈 Seasonal Trends and Patterns',
      summary: `Seasonal patterns of ${sightings.length} sightings (${dataSpan})`,
      insights: [
        `Overall trend: ${trend.direction} (${trend.percentage}% change)`,
        `Peak month: ${trend.peakMonth} (${trend.peakCount} sightings)`,
        `Data period: ${dataSpan}`,
        `Seasonal pattern: ${calculateSeasonalPattern()}`,
        `Population estimate: ${calculatePopulationEstimate()}`
      ],
      recommendations: [
        trend.direction === 'Increasing' ? 'Enhanced monitoring recommended' : 'Continue current monitoring',
        'Seasonal preparation for peak activity periods',
        'Community awareness programs during high-activity seasons'
      ],
      chartData: {
        monthly: monthCounts,
        monthData: monthData, // Sorted data for rendering
        trend: trend
      }
    };
  };

  const generateOverviewReport = () => {
    const riskCounts = {};
    sightings.forEach(s => {
      if (s.sightingCategory) {
        const category = s.sightingCategory.toLowerCase();
        riskCounts[category] = (riskCounts[category] || 0) + 1;
      }
    });
    
    // Calculate unique areas
    const uniqueAreas = new Set(
      sightings
        .filter(s => s.latitude && s.longitude)
        .map(s => `${s.latitude.toFixed(2)},${s.longitude.toFixed(2)}`)
    ).size;
    
    return {
      title: '📊 Comprehensive Overview Report',
      summary: `Complete analysis of ${sightings.length} coyote sightings`,
      insights: [
        `Total sightings analyzed: ${sightings.length}`,
        `Data collection period: ${calculateDataPeriod()}`,
        `Average sightings per month: ${calculateMonthlyAverage()}`,
        `Data quality score: ${calculateDataQuality()}%`,
        `High risk encounters: ${riskCounts['red'] || 0} (${Math.round((riskCounts['red'] || 0) / sightings.length * 100)}%)`,
      ],
      recommendations: [
        'Continue systematic data collection',
        'Implement targeted monitoring in identified hotspots',
        'Regular community education and awareness programs',
        riskCounts['red'] > 0 ? 'Priority response for high-risk encounters' : 'Maintain current monitoring levels'
      ],
      chartData: {
        overview: {
          total: sightings.length,
          recent: sightings.filter(s => isRecent(s)).length,
          areas: uniqueAreas,
          highRisk: riskCounts['red'] || 0,
          mediumRisk: riskCounts['yellow'] || 0,
          lowRisk: riskCounts['green'] || 0
        }
      }
    };
  };

  // Helper functions for calculations
  const calculateCrepuscularActivity = () => {
    const crepuscular = sightings.filter(s => {
      if (!s.timestamp) return false;
      const date = s.timestamp.toDate ? s.timestamp.toDate() : new Date(s.timestamp);
      const hour = date.getHours();
      return (hour >= 5 && hour <= 8) || (hour >= 17 && hour <= 20);
    });
    return Math.round((crepuscular.length / sightings.length) * 100);
  };

  const calculateNightActivity = () => {
    const night = sightings.filter(s => {
      if (!s.timestamp) return false;
      const date = s.timestamp.toDate ? s.timestamp.toDate() : new Date(s.timestamp);
      const hour = date.getHours();
      return hour >= 22 || hour <= 6;
    });
    return Math.round((night.length / sightings.length) * 100);
  };

  const calculateGeographicSpread = () => {
    // Calculate actual distance spread using coordinates
    const coords = sightings
      .filter(s => s.latitude && s.longitude)
      .map(s => ({ lat: s.latitude, lng: s.longitude }));
    
    if (coords.length < 2) return '0.0';
    
    let maxDistance = 0;
    for (let i = 0; i < coords.length; i++) {
      for (let j = i + 1; j < coords.length; j++) {
        const dist = calculateDistance(coords[i], coords[j]);
        if (dist > maxDistance) maxDistance = dist;
      }
    }
    
    return maxDistance.toFixed(1);
  };
  
  const calculateDistance = (point1, point2) => {
    // Haversine formula to calculate distance in miles
    const R = 3959; // Earth's radius in miles
    const dLat = (point2.lat - point1.lat) * Math.PI / 180;
    const dLon = (point2.lng - point1.lng) * Math.PI / 180;
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(point1.lat * Math.PI / 180) * Math.cos(point2.lat * Math.PI / 180) *
      Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  };

  const calculateAggressiveEncounters = () => {
    const aggressive = sightings.filter(s => {
      const desc = (s.description || '').toLowerCase();
      const category = (s.categoryDescription || '').toLowerCase();
      return desc.includes('attack') || desc.includes('aggressive') || 
             desc.includes('bit') || desc.includes('bite') || 
             category.includes('attack') || s.sightingCategory === 'red';
    });
    return Math.round((aggressive.length / sightings.length) * 100);
  };

  const calculateHabituationLevel = () => {
    const habituated = sightings.filter(s => {
      const desc = (s.description || '').toLowerCase();
      const category = (s.categoryDescription || '').toLowerCase();
      return desc.includes('approach') || desc.includes('unafraid') || 
             desc.includes('bold') || desc.includes('followed') ||
             desc.includes('advanced toward') || category.includes('followed') ||
             category.includes('advanced');
    });
    return Math.round((habituated.length / sightings.length) * 100);
  };

  const calculateTrend = (monthCounts) => {
    const months = Object.keys(monthCounts).sort();
    if (months.length < 2) return { direction: 'Insufficient data', percentage: 0 };
    
    const recent = monthCounts[months[months.length - 1]] || 0;
    const previous = monthCounts[months[months.length - 2]] || 0;
    
    const change = previous === 0 ? 0 : ((recent - previous) / previous) * 100;
    const direction = change > 10 ? 'Increasing' : change < -10 ? 'Decreasing' : 'Stable';
    
    const peakMonth = months.reduce((a, b) => monthCounts[a] > monthCounts[b] ? a : b);
    
    return {
      direction,
      percentage: Math.abs(Math.round(change)),
      peakMonth,
      peakCount: monthCounts[peakMonth]
    };
  };

  const calculateSeasonalPattern = () => {
    const seasons = { Spring: 0, Summer: 0, Fall: 0, Winter: 0 };
    sightings.forEach(s => {
      if (!s.timestamp) return;
      const date = s.timestamp.toDate ? s.timestamp.toDate() : new Date(s.timestamp);
      const month = date.getMonth();
      if (month >= 2 && month <= 4) seasons.Spring++;
      else if (month >= 5 && month <= 7) seasons.Summer++;
      else if (month >= 8 && month <= 10) seasons.Fall++;
      else seasons.Winter++;
    });
    
    const peak = Object.keys(seasons).reduce((a, b) => seasons[a] > seasons[b] ? a : b);
    return `Peak in ${peak}`;
  };

  const calculatePopulationEstimate = () => {
    // Simplified population estimate based on sighting frequency
    const uniqueLocations = new Set(sightings.map(s => s.location).filter(Boolean)).size;
    const estimate = Math.round(sightings.length * 0.3 + uniqueLocations * 1.5);
    return `${estimate}-${estimate + 10} individuals`;
  };

  const calculateDataPeriod = () => {
    if (sightings.length === 0) return 'No data';
    const dates = sightings.map(s => {
      if (!s.timestamp) return null;
      return s.timestamp.toDate ? s.timestamp.toDate() : new Date(s.timestamp);
    }).filter(Boolean);
    
    if (dates.length === 0) return 'No valid dates';
    
    const earliest = new Date(Math.min(...dates));
    const latest = new Date(Math.max(...dates));
    const months = Math.round((latest - earliest) / (1000 * 60 * 60 * 24 * 30));
    
    return `${months} months`;
  };

  const calculateMonthlyAverage = () => {
    const period = calculateDataPeriod();
    const months = parseInt(period) || 1;
    return Math.round(sightings.length / months);
  };

  const calculateDataQuality = () => {
    let score = 0;
    let total = 0;
    
    sightings.forEach(s => {
      total += 5; // 5 possible data points
      if (s.timestamp) score++;
      if (s.latitude && s.longitude) score++;
      if (s.description) score++;
      if (s.sightingCategory) score++;
      if (s.healthConcerns) score++;
    });
    
    return total === 0 ? 0 : Math.round((score / total) * 100);
  };

  const isRecent = (sighting) => {
    if (!sighting.timestamp) return false;
    const date = sighting.timestamp.toDate ? sighting.timestamp.toDate() : new Date(sighting.timestamp);
    const monthsAgo = (Date.now() - date.getTime()) / (1000 * 60 * 60 * 24 * 30);
    return monthsAgo <= 3;
  };

  const renderChart = (chartData, reportType) => {
    if (!chartData) return null;

    switch (reportType) {
      case 'temporal':
        return renderTemporalCharts(chartData);
      case 'geographic':
        return renderGeographicChart(chartData);
      case 'behavioral':
        return renderBehavioralCharts(chartData);
      case 'trends':
        return renderTrendChart(chartData);
      case 'overview':
        return renderOverviewChart(chartData);
      default:
        return null;
    }
  };

  const renderTemporalCharts = (chartData) => {
    const { hourly, daily } = chartData;
    
    // Prepare hourly data
    const hourlyLabels = [];
    const hourlyData = [];
    for (let i = 0; i < 24; i++) {
      hourlyLabels.push(`${i}:00`);
      hourlyData.push(hourly[i] || 0);
    }

    // Prepare daily data
    const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
    const dailyData = days.map(day => daily[day] || 0);

    return (
      <View style={styles.chartsContainer}>
        <Text style={styles.chartTitle}>Hourly Activity Pattern</Text>
        <LineChart
          data={{
            labels: hourlyLabels.filter((_, i) => i % 4 === 0), // Show every 4th hour
            datasets: [{
              data: hourlyData.filter((_, i) => i % 4 === 0),
              color: (opacity = 1) => `rgba(74, 144, 226, ${opacity})`,
              strokeWidth: 3,
            }]
          }}
          width={screenWidth - 40}
          height={220}
          chartConfig={chartConfig}
          bezier
          style={styles.chart}
          fromZero={true}
          yAxisInterval={1}
        />

        <Text style={styles.chartTitle}>Daily Activity Pattern</Text>
        <BarChart
          data={{
            labels: days.map(day => day.slice(0, 3)), // Abbreviate day names
            datasets: [{
              data: dailyData
            }]
          }}
          width={screenWidth - 60}
          height={220}
          chartConfig={{
            ...chartConfig,
            barPercentage: 0.5,
            decimalPlaces: 0,
          }}
          style={styles.chart}
          fromZero={true}
          yAxisInterval={1}
        />
      </View>
    );
  };

  const renderGeographicChart = (chartData) => {
    const { neighborhoods } = chartData;
    
    if (!neighborhoods || Object.keys(neighborhoods).length === 0) {
      return (
        <View style={styles.chartsContainer}>
          <Text style={styles.chartTitle}>Geographic Distribution: Hotspots</Text>
          <View style={styles.noDataContainer}>
            <Text style={styles.noDataText}>No geographic data available</Text>
          </View>
        </View>
      );
    }
    
    // Sort neighborhoods by count and get top 8
    const neighborhoodEntries = Object.entries(neighborhoods)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 8);

    const colors = [
      '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7', 
      '#DDA0DD', '#98D8C8', '#F7DC6F'
    ];

    const pieData = neighborhoodEntries.map(([neighborhood, count], index) => ({
      name: '', // Empty name to disable legend
      population: count,
      color: colors[index % colors.length],
      legendFontColor: cozyTheme.colors.textPrimary,
      legendFontSize: 12,
    }));

    return (
      <View style={styles.chartsContainer}>
        <Text style={styles.chartTitle}>Sightings by Neighborhood</Text>
        <View style={styles.pieChartWrapper}>
          <PieChart
            data={pieData}
            width={screenWidth - 80}
            height={280}
            chartConfig={{
              ...chartConfig,
              decimalPlaces: 0,
            }}
            accessor="population"
            backgroundColor="transparent"
            paddingLeft="80"
            hasLegend={false}
            absolute={false}
            style={styles.chart}
          />
        </View>
        <View style={styles.areaLegendContainer}>
          <Text style={styles.sectionTitle}>Distribution by Neighborhood:</Text>
          {neighborhoodEntries.map(([neighborhood, count], index) => {
            const percentage = ((count / sightings.length) * 100).toFixed(0);
            return (
              <View key={index} style={styles.legendRow}>
                <View style={[styles.legendColorBox, { backgroundColor: colors[index % colors.length] }]} />
                <Text style={styles.areaLegendText}>
                  {percentage}% {neighborhood} ({count} sightings)
                </Text>
              </View>
            );
          })}
        </View>
      </View>
    );
  };

  const renderBehavioralCharts = (chartData) => {
    const { riskCounts, monthlyAggression, overallIndex } = chartData;

    return (
      <View style={styles.chartsContainer}>
        {monthlyAggression && monthlyAggression.length > 0 && (
          <>
            <Text style={styles.chartTitle}>Monthly Aggression Index Over Time</Text>
            <LineChart
              data={{
                labels: monthlyAggression.map(m => m.label.split(' ')[0]), // Just month name
                datasets: [{
                  data: monthlyAggression.map(m => m.averageScore),
                  color: (opacity = 1) => {
                    // Calculate overall trend
                    const avgScore = overallIndex || 1.5;
                    if (avgScore >= 2.5) return `rgba(231, 76, 60, ${opacity})`; // Red
                    if (avgScore >= 1.5) return `rgba(241, 196, 15, ${opacity})`; // Yellow
                    return `rgba(46, 204, 113, ${opacity})`; // Green
                  },
                  strokeWidth: 3,
                }],
                legend: ['Aggression Index (1=Low, 2=Medium, 3=High)']
              }}
              width={screenWidth - 40}
              height={240}
              yAxisLabel=""
              yAxisSuffix=""
              chartConfig={{
                ...chartConfig,
                decimalPlaces: 1,
                propsForDots: {
                  r: '5',
                  strokeWidth: '2',
                }
              }}
              bezier
              style={styles.chart}
              fromZero={true}
              segments={3}
            />
          </>
        )}

        {riskCounts && (
          <>
            <Text style={styles.chartTitle}>🚦 Risk Category Distribution</Text>
            <BarChart
              data={{
                labels: ['High Risk\n(Red)', 'Medium Risk\n(Yellow)', 'Low Risk\n(Green)'],
                datasets: [{
                  data: [
                    riskCounts.red || 0,
                    riskCounts.yellow || 0,
                    riskCounts.green || 0
                  ]
                }]
              }}
              width={screenWidth - 40}
              height={220}
              chartConfig={{
                ...chartConfig,
                color: (opacity = 1, index) => {
                  if (index === 0) return `rgba(231, 76, 60, ${opacity})`; // Red
                  if (index === 1) return `rgba(241, 196, 15, ${opacity})`; // Yellow
                  return `rgba(46, 204, 113, ${opacity})`; // Green
                },
              }}
              style={styles.chart}
              fromZero={true}
              yAxisInterval={1}
            />
          </>
        )}

        {monthlyAggression && monthlyAggression.length > 0 && (
          <>
            <Text style={styles.chartTitle}>Monthly Risk Breakdown</Text>
            <View style={styles.stackedChartContainer}>
              {monthlyAggression.slice(-6).map((month, index) => (
                <View key={index} style={styles.monthBarContainer}>
                  <Text style={styles.monthLabel}>{month.label.split(' ')[0]}</Text>
                  <View style={styles.stackedBar}>
                    {month.red > 0 && (
                      <View style={[styles.barSegment, { flex: month.red, backgroundColor: '#e74c3c' }]}>
                        <Text style={styles.barSegmentText}>{month.red}</Text>
                      </View>
                    )}
                    {month.yellow > 0 && (
                      <View style={[styles.barSegment, { flex: month.yellow, backgroundColor: '#f1c40f' }]}>
                        <Text style={styles.barSegmentText}>{month.yellow}</Text>
                      </View>
                    )}
                    {month.green > 0 && (
                      <View style={[styles.barSegment, { flex: month.green, backgroundColor: '#2ecc71' }]}>
                        <Text style={styles.barSegmentText}>{month.green}</Text>
                      </View>
                    )}
                  </View>
                  <Text style={styles.monthTotal}>Index: {month.averageScore.toFixed(2)}</Text>
                </View>
              ))}
            </View>
            <View style={styles.legendContainer}>
              <View style={styles.legendItem}>
                <View style={[styles.legendColor, { backgroundColor: '#e74c3c' }]} />
                <Text style={styles.legendText}>High Risk</Text>
              </View>
              <View style={styles.legendItem}>
                <View style={[styles.legendColor, { backgroundColor: '#f1c40f' }]} />
                <Text style={styles.legendText}>Medium Risk</Text>
              </View>
              <View style={styles.legendItem}>
                <View style={[styles.legendColor, { backgroundColor: '#2ecc71' }]} />
                <Text style={styles.legendText}>Low Risk</Text>
              </View>
            </View>
          </>
        )}
      </View>
    );
  };

  const renderTrendChart = (chartData) => {
    const { monthData, trend } = chartData;
    
    if (!monthData || monthData.length === 0) return null;

    return (
      <View style={styles.chartsContainer}>
        <Text style={styles.chartTitle}>Sighting Trend Over Time</Text>
        <LineChart
          data={{
            labels: monthData.map(m => m.label.split(' ')[0]), // Show just month name (e.g., "Jan")
            datasets: [{
              data: monthData.map(m => m.count),
              color: (opacity = 1) => trend.direction === 'Increasing' 
                ? `rgba(231, 76, 60, ${opacity})` 
                : trend.direction === 'Decreasing'
                ? `rgba(46, 204, 113, ${opacity})`
                : `rgba(74, 144, 226, ${opacity})`,
              strokeWidth: 3,
            }]
          }}
          width={screenWidth - 40}
          height={220}
          chartConfig={chartConfig}
          bezier
          style={styles.chart}
          fromZero={true}
          yAxisInterval={1}
        />
      </View>
    );
  };

  const renderOverviewChart = (chartData) => {
    const { overview } = chartData;
    
    const data = [
      { name: 'Total', population: overview.total, color: '#4ECDC4' },
      { name: 'Recent', population: overview.recent, color: '#FF6B6B' },
      { name: 'Locations', population: overview.areas, color: '#45B7D1' },
    ];

    return (
      <View style={styles.chartsContainer}>
        <Text style={styles.chartTitle}>Data Overview</Text>
        <BarChart
          data={{
            labels: ['Total', 'Recent', 'Locations'],
            datasets: [{
              data: [overview.total, overview.recent, overview.areas]
            }]
          }}
          width={screenWidth - 40}
          height={220}
          chartConfig={chartConfig}
          style={styles.chart}
        />
      </View>
    );
  };

  const renderReport = () => {
    if (!reportData) return null;

    return (
      <>
        <CozyCard variant="primary" padding="large" style={styles.reportCard}>
          <Text style={styles.reportCardTitle}>{reportData.title}</Text>
          <Text style={styles.reportSummary}>{reportData.summary}</Text>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>🔍 Key Insights</Text>
            {reportData.insights.map((insight, index) => (
              <Text key={index} style={styles.insightText}>• {insight}</Text>
            ))}
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>💡 Recommendations</Text>
            {reportData.recommendations.map((rec, index) => (
              <Text key={index} style={styles.insightText}>• {rec}</Text>
            ))}
          </View>
        </CozyCard>

        {/* Charts Section */}
        {reportData.chartData && (
          <CozyCard variant="gentle" padding="medium" style={styles.chartCard}>
            <Text style={styles.chartSectionTitle}>📊 Graphs & Visuals</Text>
            {renderChart(reportData.chartData, reportType)}
          </CozyCard>
        )}

        <CozyButton
          title={<Text style={{ fontSize: 16 }}><Text style={{ fontSize: 14 }}>◀︎</Text>  Back to Reports</Text>}
          onPress={() => {
            setReportData(null);
            setReportType(null);
          }}
          variant="primary"
          size="medium"
          style={styles.newReportButton}
        />
      </>
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={cozyTheme.colors.primary} />
          <Text style={styles.loadingText}>Loading sighting data...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={sharedStyles.header}>
        <TouchableOpacity
          style={sharedStyles.backButton}
          onPress={() => {
            if (reportData) {
              // If viewing a report, go back to report list
              setReportData(null);
              setReportType(null);
            } else {
              // Otherwise go to Home
              navigation.navigate('Home');
            }
          }}
        >
          <Ionicons name="chevron-back" size={32} color="#FFFFFF" />
        </TouchableOpacity>
        <View style={sharedStyles.headerTitleContainer}>
          <Image 
            source={require('../../assets/analysis reports banner.png')} 
            style={sharedStyles.headerIcon}
            resizeMode="contain"
          />
          <Text style={sharedStyles.headerTitle}>Analysis Reports</Text>
        </View>
        <View style={sharedStyles.placeholder} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={styles.headerSubtitle}>
          Insights and reports from coyote sightings data
        </Text>
        
        {!reportData && (
          <>
{/*
            <CozyCard variant="gentle" padding="medium" style={styles.statsCard}>
              <Text style={styles.statsTitle}>📊 Data Overview</Text>
              <View style={styles.statsRow}>
                <Text style={styles.statLabel}>Total Sightings:</Text>
                <Text style={styles.statValue}>-</Text>
              </View>
              <View style={styles.statsRow}>
                <Text style={styles.statLabel}>Recent (30 days):</Text>
                <Text style={styles.statValue}>
                  {sightings.filter(s => isRecent(s)).length}
                </Text>
              </View>
              <View style={styles.statsRow}>
                <Text style={styles.statLabel}>Unique Locations:</Text>
                <Text style={styles.statValue}>
                  {new Set(sightings.map(s => s.location).filter(Boolean)).size}
                </Text>
              </View>
            </CozyCard>
*/}
            <View style={styles.reportTypes}>
              {/* Temporal Analysis */}
              <TouchableOpacity 
                onPress={() => generateReport('temporal')}
                style={styles.reportSection}
                disabled={generatingReport}
              >
                <View style={[styles.reportHeader, { marginTop: -8 }]}>
                  <View style={styles.reportTitleContainer}>
                    <Text style={styles.reportIcon}>⏰</Text>
                    <Text style={styles.reportTitle}>Time and Behavior Patterns</Text>
                  </View>
                  <Text style={styles.reportExpandIcon}>▶</Text>
                </View>
                <View style={styles.reportHeaderTriangle} />
                <View style={styles.reportContent}>
                  <Text style={styles.reportDescription}>
                    Analyze when coyote sightings occur throughout the day and week
                  </Text>
                </View>
              </TouchableOpacity>

              {/* Geographic Distribution */}
              <TouchableOpacity 
                onPress={() => generateReport('geographic')}
                style={styles.reportSection}
                disabled={generatingReport}
              >
                <View style={styles.reportHeader}>
                  <View style={styles.reportTitleContainer}>
                    <Text style={styles.reportIcon}>🗺️</Text>
                    <Text style={styles.reportTitle}>Geographic Distribution: Hotspots</Text>
                  </View>
                  <Text style={styles.reportExpandIcon}>▶</Text>
                </View>
                <View style={styles.reportHeaderTriangle} />
                <View style={styles.reportContent}>
                  <Text style={styles.reportDescription}>
                    View where coyote sightings are concentrated by neighborhood
                  </Text>
                </View>
              </TouchableOpacity>

              {/* Behavioral Patterns */}
              <TouchableOpacity 
                onPress={() => generateReport('behavioral')}
                style={styles.reportSection}
                disabled={generatingReport}
              >
                <View style={styles.reportHeader}>
                  <View style={styles.reportTitleContainer}>
                    <Text style={styles.reportIcon}>🐺</Text>
                    <Text style={styles.reportTitle}>Aggression and Risk Analysis</Text>
                  </View>
                  <Text style={styles.reportExpandIcon}>▶</Text>
                </View>
                <View style={styles.reportHeaderTriangle} />
                <View style={styles.reportContent}>
                  <Text style={styles.reportDescription}>
                    Track aggression levels and risk patterns over time
                  </Text>
                </View>
              </TouchableOpacity>

              {/* Trend Analysis */}
              <TouchableOpacity 
                onPress={() => generateReport('trends')}
                style={styles.reportSection}
                disabled={generatingReport}
              >
                <View style={styles.reportHeader}>
                  <View style={styles.reportTitleContainer}>
                    <Text style={styles.reportIcon}>📈</Text>
                    <Text style={styles.reportTitle}>Seasonal Trends and Patterns</Text>
                  </View>
                  <Text style={styles.reportExpandIcon}>▶</Text>
                </View>
                <View style={styles.reportHeaderTriangle} />
                <View style={styles.reportContent}>
                  <Text style={styles.reportDescription}>
                    Identify seasonal trends and patterns in sighting frequency
                  </Text>
                </View>
              </TouchableOpacity>

              {/* Overview Report */}
            </View>

            {generatingReport && (
              <CozyCard variant="primary" padding="large" style={styles.generatingCard}>
                <ActivityIndicator size="large" color={cozyTheme.colors.primary} />
                <Text style={styles.generatingTitle}>📊 Analysis in Progress</Text>
                <Text style={styles.generatingText}>
                  Analyzing sightings to generate your {reportType} report...
                </Text>
                <Text style={styles.generatingSubtext}>
                  This may take a few moments
                </Text>
              </CozyCard>
            )}
          </>
        )}

        {renderReport()}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F0E8',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: cozyTheme.colors.textSecondary,
    fontFamily: cozyTheme.typography.secondary,
  },
  headerSubtitle: {
    fontSize: 16,
    color: cozyTheme.colors.textPrimary,
    textAlign: 'center',
    fontFamily: cozyTheme.typography.secondary,
    fontStyle: 'italic',
    marginTop: -16,
    marginBottom: 16,
  },
  content: {
    flex: 1,
    padding: 16,
  },
  introCard: {
    marginBottom: 20,
  },
  introTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: cozyTheme.colors.textPrimary,
    marginBottom: 12,
    textAlign: 'center',
    fontFamily: cozyTheme.typography.primary,
  },
  introDescription: {
    fontSize: 16,
    color: cozyTheme.colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
    fontFamily: cozyTheme.typography.secondary,
  },
  statsCard: {
    marginBottom: 20,
  },
  statsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: cozyTheme.colors.textPrimary,
    marginBottom: 12,
    fontFamily: cozyTheme.typography.primary,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  statLabel: {
    fontSize: 16,
    color: cozyTheme.colors.textSecondary,
    fontFamily: cozyTheme.typography.secondary,
  },
  statValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: cozyTheme.colors.textPrimary,
    fontFamily: cozyTheme.typography.primary,
  },
  reportTypesTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: cozyTheme.colors.textPrimary,
    marginBottom: 16,
    textAlign: 'center',
    fontFamily: cozyTheme.typography.primary,
  },
  reportTypes: {
    marginBottom: 20,
    marginTop: 24,
  },
  reportSection: {
    backgroundColor: '#fff',
    marginBottom: 24,
    marginLeft: 18,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
    overflow: 'visible',
  },
  reportHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 10,
    marginLeft: -20, // left overhang
    backgroundColor: cozyTheme.colors.background,
    borderBottomWidth: 1,
    borderColor: '#ccc',
  },
  // Small isosceles right triangle under the left overhang to connect to container
  reportHeaderTriangle: {
    width: 0,
    height: 0,
    borderTopWidth: 20,
    borderLeftWidth: 20,
    borderTopColor: '#ffca00',
    borderLeftColor: 'transparent',
    marginLeft: -20,
    // sit just below the header
    marginTop: -1,
    marginBottom: -10,
  },
  reportTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  reportIcon: {
    fontSize: 24,
    marginRight: 12,
  },
  reportTitle: {
    fontSize: 15,
    fontWeight: '600',
  },
  reportExpandIcon: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  reportContent: {
    paddingHorizontal: 20,
    paddingBottom: 12,
  },
  reportDescription: {
    fontSize: 15,
    color: '#34495e',
    lineHeight: 24,
    marginBottom: 0,
  },
  generateButton: {
    backgroundColor: '#1fc5f5',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 24,
    alignItems: 'center',
    alignSelf: 'flex-start',
    shadowColor: '#1fc5f5',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
  generateButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  generatingCard: {
    alignItems: 'center',
    marginBottom: 20,
  },
  generatingTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: cozyTheme.colors.textPrimary,
    marginTop: 16,
    marginBottom: 8,
    fontFamily: cozyTheme.typography.primary,
  },
  generatingText: {
    fontSize: 16,
    color: cozyTheme.colors.textSecondary,
    textAlign: 'center',
    marginBottom: 4,
    fontFamily: cozyTheme.typography.secondary,
  },
  generatingSubtext: {
    fontSize: 14,
    color: cozyTheme.colors.textLight,
    textAlign: 'center',
    fontFamily: cozyTheme.typography.secondary,
  },
  reportCard: {
    marginTop: 20,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#cccccc',
  },
  reportCardTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: cozyTheme.colors.textPrimary,
    marginBottom: 12,
    textAlign: 'center',
    fontFamily: cozyTheme.typography.primary,
  },
  reportSummary: {
    fontSize: 16,
    color: cozyTheme.colors.textSecondary,
    textAlign: 'center',
    marginBottom: 20,
    fontStyle: 'italic',
    fontFamily: cozyTheme.typography.secondary,
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: cozyTheme.colors.textPrimary,
    marginBottom: 12,
    fontFamily: cozyTheme.typography.primary,
  },
  insightText: {
    fontSize: 15,
    color: cozyTheme.colors.textSecondary,
    marginBottom: 6,
    lineHeight: 20,
    fontFamily: cozyTheme.typography.secondary,
  },
  newReportButton: {
    marginTop: 10,
    alignSelf: 'center',
    paddingVertical: 0,
    backgroundColor: 'transparent',
    borderWidth: 0,
  },
  infoCard: {
    marginBottom: 20,
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: cozyTheme.colors.textPrimary,
    marginBottom: 8,
    fontFamily: cozyTheme.typography.primary,
  },
  infoText: {
    fontSize: 14,
    color: cozyTheme.colors.textSecondary,
    lineHeight: 20,
    fontFamily: cozyTheme.typography.secondary,
  },
  chartCard: {
    marginBottom: 20,
    borderColor: "#cccccc",
    backgroundColor: cozyTheme.colors.accentLight,
  },
  chartSectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: cozyTheme.colors.textPrimary,
    textAlign: 'center',
    fontFamily: cozyTheme.typography.primary,
  },
  chartsContainer: {
    alignItems: 'center',
  },
  pieChartWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  chartTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: cozyTheme.colors.textPrimary,
    marginBottom: 12,
    marginTop: 20,
    textAlign: 'center',
    fontFamily: cozyTheme.typography.primary,
  },
  chart: {
    marginVertical: 8,
    borderRadius: 16,
  },
  areaLegendContainer: {
    marginTop: 12,
    padding: 12,
    backgroundColor: cozyTheme.colors.cardBackground,
    borderRadius: 8,
    width: '100%',
  },
  areaLegendText: {
    fontSize: 13,
    color: cozyTheme.colors.textSecondary,
    marginBottom: 6,
    fontFamily: cozyTheme.typography.secondary,
  },
  legendRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  legendColorBox: {
    width: 16,
    height: 16,
    borderRadius: 4,
    marginRight: 10,
  },
  noDataContainer: {
    padding: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  noDataText: {
    fontSize: 16,
    color: cozyTheme.colors.textSecondary,
    fontFamily: cozyTheme.typography.secondary,
    fontStyle: 'italic',
  },
  stackedChartContainer: {
    width: '100%',
    paddingHorizontal: 10,
    marginTop: 10,
  },
  monthBarContainer: {
    marginBottom: 20,
  },
  monthLabel: {
    fontSize: 14,
    fontWeight: 'bold',
    color: cozyTheme.colors.textPrimary,
    marginBottom: 5,
    fontFamily: cozyTheme.typography.primary,
  },
  stackedBar: {
    flexDirection: 'row',
    height: 40,
    borderRadius: 8,
    overflow: 'hidden',
  },
  barSegment: {
    justifyContent: 'center',
    alignItems: 'center',
    minWidth: 30,
  },
  barSegmentText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 12,
    fontFamily: cozyTheme.typography.primary,
  },
  monthTotal: {
    fontSize: 12,
    color: cozyTheme.colors.textSecondary,
    marginTop: 4,
    fontFamily: cozyTheme.typography.secondary,
  },
  legendContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    flexWrap: 'wrap',
    marginTop: 15,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 10,
    marginVertical: 5,
  },
  legendColor: {
    width: 16,
    height: 16,
    borderRadius: 3,
    marginRight: 6,
  },
  legendText: {
    fontSize: 13,
    color: cozyTheme.colors.textSecondary,
    fontFamily: cozyTheme.typography.secondary,
  },
});
