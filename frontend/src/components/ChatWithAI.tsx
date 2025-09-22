import React, { useState, useRef, useEffect } from 'react';
import { Athlete, BiometricData, GeneticProfile } from '../types';
import { chatAIService } from '../services/dataService';

interface ChatWithAIProps {
  athlete: Athlete;
  biometricData: BiometricData[];
  geneticProfiles: GeneticProfile[];
}

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

export const ChatWithAI: React.FC<ChatWithAIProps> = ({
  athlete,
  biometricData,
  geneticProfiles
}) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [useOfflineMode, setUseOfflineMode] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Debug logging
  console.log('🔍 ChatWithAI Debug:', {
    athlete,
    biometricDataCount: biometricData.length,
    geneticProfilesCount: geneticProfiles.length,
    biometricDataSample: biometricData.slice(0, 2),
    geneticProfilesSample: geneticProfiles.slice(0, 2)
  });

  // Debug: Check if biometric data has the expected fields
  if (biometricData.length > 0) {
    const firstRecord = biometricData[0];
    console.log('🔍 First biometric record fields:', Object.keys(firstRecord));
    console.log('🔍 First biometric record values:', firstRecord);
    console.log('🔍 HRV value:', firstRecord.hrv_night, 'Type:', typeof firstRecord.hrv_night);
    console.log('🔍 Resting HR value:', firstRecord.resting_hr, 'Type:', typeof firstRecord.resting_hr);
    console.log('🔍 Sleep duration value:', firstRecord.sleep_duration_h, 'Type:', typeof firstRecord.sleep_duration_h);
  }

  // Check if we have real biometric data
  const hasRealBiometricData = biometricData.length > 0 && biometricData.some(data =>
    data.hrv_night && data.hrv_night > 0
  );

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Prepare athlete context for AI using real data from tabs
  const prepareAthleteContext = () => {
    // Get last 7 days of biometric data (or all available if less than 7)
    const last7DaysData = biometricData.slice(-7);

    const geneticDict = geneticProfiles.reduce((acc, profile) => {
      acc[profile.gene] = profile.genotype;
      return acc;
    }, {} as Record<string, string>);

    // Use only real data from the tabs - no mock data
    const context = {
      name: athlete.name,
      sport: athlete.sport,
      age: athlete.age,
      team: athlete.team,
      biometricHistory: last7DaysData.map(data => ({
        HrvNight: data.hrv_night,
        RestingHr: data.resting_hr,
        DeepSleepPct: data.deep_sleep_pct,
        RemSleepPct: data.rem_sleep_pct,
        SleepDurationH: data.sleep_duration_h,
        Spo2Night: data.spo2_night,
        TrainingLoadPct: data.training_load_pct,
        Date: data.date
      })),
      latestBiometrics: last7DaysData[last7DaysData.length - 1] ? {
        HrvNight: last7DaysData[last7DaysData.length - 1].hrv_night,
        RestingHr: last7DaysData[last7DaysData.length - 1].resting_hr,
        DeepSleepPct: last7DaysData[last7DaysData.length - 1].deep_sleep_pct,
        RemSleepPct: last7DaysData[last7DaysData.length - 1].rem_sleep_pct,
        SleepDurationH: last7DaysData[last7DaysData.length - 1].sleep_duration_h,
        Spo2Night: last7DaysData[last7DaysData.length - 1].spo2_night,
        TrainingLoadPct: last7DaysData[last7DaysData.length - 1].training_load_pct,
        Date: last7DaysData[last7DaysData.length - 1].date
      } : null,
      geneticProfile: geneticDict,
      totalBiometricRecords: biometricData.length,
      totalGeneticMarkers: geneticProfiles.length
    };

    console.log('🔍 ChatWithAI Context Debug:', {
      context,
      last7DaysDataCount: last7DaysData.length,
      latestBiometrics: context.latestBiometrics,
      biometricHistorySample: context.biometricHistory.slice(0, 2),
      hasRealData: last7DaysData.length > 0
    });

    // Debug: Check if context has null values
    if (context.latestBiometrics) {
      console.log('🔍 Latest biometrics values:');
      console.log('  HRV:', context.latestBiometrics.HrvNight);
      console.log('  Resting HR:', context.latestBiometrics.RestingHr);
      console.log('  Sleep Duration:', context.latestBiometrics.SleepDurationH);
      console.log('  Deep Sleep %:', context.latestBiometrics.DeepSleepPct);
      console.log('  REM Sleep %:', context.latestBiometrics.RemSleepPct);
      console.log('  SpO2:', context.latestBiometrics.Spo2Night);
      console.log('  Training Load %:', context.latestBiometrics.TrainingLoadPct);
    }

    return context;
  };

  const sendMessage = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input.trim(),
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    // Use offline mode if selected or if API fails
    if (useOfflineMode) {
      const context = prepareAthleteContext();
      const offlineResponse = generateOfflineResponse(input, context);

      const aiMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: offlineResponse,
        timestamp: new Date()
      };
      setMessages(prev => [...prev, aiMessage]);
      setIsLoading(false);
      return;
    }

    try {
      const context = prepareAthleteContext();

      // Call backend API with context data
      const result = await chatAIService.askAI(userMessage.content, context);

      const aiMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: result.response,
        timestamp: new Date()
      };

      setMessages(prev => [...prev, aiMessage]);
    } catch (error) {
      console.error('Error calling OpenRouter API:', error);

      // Use offline mode if API fails
      const context = prepareAthleteContext();
      const offlineResponse = generateOfflineResponse(input, context);

      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: `${offlineResponse}\n\n⚠️ **AI Service Unavailable** - Using intelligent offline analysis based on ${athlete.name}'s actual biometric and genetic data. (Online mode available in Azure production deployment)`,
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  // Offline AI response generator
  const generateOfflineResponse = (userInput: string, context: any): string => {
    const input = userInput.toLowerCase();

    if (input.includes('training') || input.includes('workout') || input.includes('exercise')) {
      const trainingLoad = context.latestBiometrics?.TrainingLoadPct || 0;
      if (trainingLoad > 85) {
        return `Based on ${athlete.name}'s current training load (${trainingLoad}%), I recommend focusing on recovery today. Consider light technique work or active recovery sessions. High-intensity training might lead to overtraining given the current load.`;
      } else {
        return `${athlete.name} shows moderate training load (${trainingLoad}%). This is a good day for quality training sessions. Focus on sport-specific skills and maintain good form.`;
      }
    }

    if (input.includes('sleep') || input.includes('rest')) {
      const sleepHours = context.latestBiometrics?.SleepDurationH || 0;
      const deepSleep = context.latestBiometrics?.DeepSleepPct || 0;
      return `Sleep analysis for ${athlete.name}: ${sleepHours} hours total with ${deepSleep}% deep sleep. ${sleepHours >= 7 ? 'Good sleep duration - recovery should be optimal.' : 'Sleep duration is below recommended 7+ hours. Consider adjusting bedtime routine.'} Deep sleep percentage is ${deepSleep > 20 ? 'excellent' : 'moderate'}.`;
    }

    if (input.includes('recovery') || input.includes('hrv') || input.includes('heart rate')) {
      const hrv = context.latestBiometrics?.HrvNight || 0;
      const restingHR = context.latestBiometrics?.RestingHr || 0;
      return `Recovery status for ${athlete.name}: HRV at ${hrv}ms and resting HR at ${restingHR}bpm. ${hrv > 50 ? 'Good recovery capacity detected.' : 'Recovery may need attention.'} ${restingHR < 60 ? 'Resting heart rate is optimal.' : 'Resting heart rate is elevated - monitor stress levels.'}`;
    }

    if (input.includes('nutrition') || input.includes('diet') || input.includes('food')) {
      return `For ${athlete.name}'s ${athlete.sport} training, focus on: adequate protein (1.6-2.2g/kg body weight), complex carbohydrates for sustained energy, and proper hydration. Consider their genetic profile for personalized nutrition strategies.`;
    }

    return `I can help you analyze ${athlete.name}'s performance data including training load, sleep quality, recovery status, and nutrition recommendations. Ask me about specific aspects like "How is the training load today?" or "What does the sleep data show?"`;
  };

  return (
    <div className="flex flex-col h-[600px] bg-white rounded-lg shadow-sm border border-gray-200">
      {/* Header */}
      <div className="p-4 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-purple-50">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
            <span className="text-2xl">🤖</span>
            AI Assistant for {athlete.name}
          </h3>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setUseOfflineMode(!useOfflineMode)}
              className={`px-3 py-1 text-xs rounded-full transition-colors ${
                useOfflineMode
                  ? 'bg-green-100 text-green-700 border border-green-300'
                  : 'bg-blue-100 text-blue-700 border border-blue-300'
              }`}
            >
              {useOfflineMode ? '📱 Offline' : '🌐 Azure'}
            </button>
          </div>
        </div>
        <p className="text-sm text-gray-600">
          {useOfflineMode
            ? '📱 AI Assistant using intelligent analysis of athlete data'
            : '🌐 AI service available in Azure production deployment'
          }
          {hasRealBiometricData && (
            <span className="block text-xs text-green-600 mt-1">
              ✅ Connected to real biometric data from Current Metrics, Sleep Metrics, and other tabs
            </span>
          )}
          {!hasRealBiometricData && (
            <span className="block text-xs text-yellow-600 mt-1">
              ⚠️ No biometric data available - check Current Metrics tab for data
            </span>
          )}
        </p>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            <div className="text-4xl mb-3">🤖</div>
            <p className="font-medium mb-2">AI Assistant for {athlete.name}</p>
            <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-4">
              <p className="text-sm text-green-800 font-medium mb-2">🤖 AI Assistant Active</p>
              <p className="text-xs text-green-700">
                Connected to AI service with access to {athlete.name}'s biometric data from Current Metrics, Sleep Metrics, and other tabs.
              </p>
            </div>
            <div className="text-sm space-y-1">
              <p className="font-medium">Ask me about:</p>
              <ul className="text-xs text-gray-400 space-y-1">
                <li>• Training recommendations based on current load</li>
                <li>• Sleep analysis and recovery status</li>
                <li>• HRV and heart rate trends</li>
                <li>• Nutrition advice for {athlete.sport}</li>
                <li>• Performance optimization strategies</li>
              </ul>
            </div>
            <p className="text-xs text-gray-400 mt-3">
              💡 Try: "How is the training load today?" or "What does the sleep data show?"
            </p>
          </div>
        )}

        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-[80%] p-3 rounded-lg ${
                message.role === 'user'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-900'
              }`}
            >
              <p className="text-sm whitespace-pre-wrap">{message.content}</p>
              <p className={`text-xs mt-2 ${
                message.role === 'user' ? 'text-blue-100' : 'text-gray-500'
              }`}>
                {message.timestamp.toLocaleTimeString()}
              </p>
            </div>
          </div>
        ))}

        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-gray-100 p-3 rounded-lg">
              <div className="flex items-center gap-2">
                <div className="flex space-x-1">
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                </div>
                <span className="text-sm text-gray-600">AI is thinking...</span>
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="p-4 border-t border-gray-200">
        <div className="flex gap-2">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Ask about training, recovery, nutrition..."
            className="flex-1 p-3 border border-gray-300 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 bg-white"
            rows={2}
            disabled={isLoading}
          />
          <button
            onClick={sendMessage}
            disabled={!input.trim() || isLoading}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors duration-200 flex items-center gap-2"
          >
            <span>Send</span>
            <span>📤</span>
          </button>
        </div>
      </div>
    </div>
  );
};