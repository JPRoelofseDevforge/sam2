import React, { useState, useEffect } from 'react';
import { WeatherImpact } from './WeatherImpact';
import weatherApiService from '../services/weatherApi';

// Mock genetic data for testing
const mockGeneticData = [
  { gene: 'ACTN3', genotype: 'RR' },
  { gene: 'ADRB2', genotype: 'Gly16Gly' },
  { gene: 'CFTR', genotype: 'del508' },
  { gene: 'PPARGC1A', genotype: 'Ser482Ser' },
  { gene: 'ACE', genotype: 'DD' }
];

export const WeatherImpactTest: React.FC = () => {
  const [testScenario, setTestScenario] = useState<string>('normal');
  const [isTestMode, setIsTestMode] = useState(false);

  // Update weather API service test mode when state changes
  useEffect(() => {
    weatherApiService.setTestMode(isTestMode, testScenario);
  }, [isTestMode, testScenario]);

  const testScenarios = [
    { id: 'normal', label: 'Normal Operation', description: 'Component works with real API' },
    { id: 'network-error', label: 'Network Failure', description: 'Simulates network connectivity issues' },
    { id: 'timeout', label: 'API Timeout', description: 'Simulates slow/unresponsive API' },
    { id: 'invalid-response', label: 'Invalid Response', description: 'Simulates malformed API response' },
    { id: 'server-error', label: 'Server Error', description: 'Simulates 5xx server errors' },
  ];

  return (
    <div className="space-y-6">
      <div className="card-enhanced p-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">WeatherImpact Component Test Suite</h2>
        <p className="text-gray-600 mb-4">
          Test the component's behavior under different API failure scenarios.
          Verify that placeholder values are shown and component structure remains intact.
        </p>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Test Scenario
            </label>
            <select
              value={testScenario}
              onChange={(e) => setTestScenario(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {testScenarios.map(scenario => (
                <option key={scenario.id} value={scenario.id}>
                  {scenario.label} - {scenario.description}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              id="test-mode"
              checked={isTestMode}
              onChange={(e) => setIsTestMode(e.target.checked)}
              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <label htmlFor="test-mode" className="text-sm text-gray-700">
              Enable Test Mode (forces selected failure scenario)
            </label>
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h3 className="text-sm font-semibold text-blue-900 mb-2">Testing Instructions:</h3>
            <ul className="text-sm text-blue-800 space-y-1">
              <li>• Select a test scenario from the dropdown</li>
              <li>• Enable test mode to force the failure</li>
              <li>• Observe that the component shows placeholder values (--, Unavailable, etc.)</li>
              <li>• Verify all tabs and sections remain visible</li>
              <li>• Confirm no error messages are displayed to users</li>
            </ul>
          </div>
        </div>
      </div>

      <div className="border-t border-gray-300 pt-6">
        <div className="mb-4">
          <h3 className="text-lg font-semibold text-gray-900">
            Component Under Test - Scenario: {testScenarios.find(s => s.id === testScenario)?.label}
          </h3>
          <p className="text-sm text-gray-600">
            {testScenarios.find(s => s.id === testScenario)?.description}
          </p>
        </div>

        <WeatherImpact
          athleteId="test-athlete-123"
          geneticData={mockGeneticData}
        />
      </div>
    </div>
  );
};