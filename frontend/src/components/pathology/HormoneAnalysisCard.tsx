import React from 'react';
import { BloodResults } from '../../types';

interface HormoneAnalysis {
  cortisolTestosteroneRatio: number;
  cortisolStatus: string;
  testosteroneStatus: string;
  hormonalBalance: string;
  balanceMessage: string;
  cortisol: number;
  testosterone: number;
}

interface HormoneAnalysisCardProps {
  hormoneAnalysis: HormoneAnalysis;
}

export const HormoneAnalysisCard: React.FC<HormoneAnalysisCardProps> = ({
  hormoneAnalysis
}) => {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'high': return 'bg-gradient-to-r from-red-500 to-red-600 text-white shadow-red-500/25';
      case 'low': return 'bg-gradient-to-r from-yellow-500 to-yellow-600 text-white shadow-yellow-500/25';
      default: return 'bg-gradient-to-r from-green-500 to-green-600 text-white shadow-green-500/25';
    }
  };

  const getBalanceColor = (balance: string) => {
    switch (balance) {
      case 'balanced': return 'bg-gradient-to-r from-green-500/20 to-emerald-500/20 border border-green-500/30 shadow-green-500/10';
      case 'catabolic': return 'bg-gradient-to-r from-red-500/20 to-red-600/20 border border-red-500/30 shadow-red-500/10';
      default: return 'bg-gradient-to-r from-blue-500/20 to-blue-600/20 border border-blue-500/30 shadow-blue-500/10';
    }
  };

  const getBalanceIcon = (balance: string) => {
    switch (balance) {
      case 'balanced': return '⚖️';
      case 'catabolic': return '📉';
      default: return '📈';
    }
  };

  return (
    <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-gray-800/90 to-gray-900/90 backdrop-blur-sm border border-gray-700/50 shadow-2xl">
      {/* Decorative background elements */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-blue-500/10 to-transparent rounded-full"></div>
      <div className="absolute bottom-0 left-0 w-24 h-24 bg-gradient-to-tr from-purple-500/10 to-transparent rounded-full"></div>

      <div className="relative z-10 p-8">
        <div className="flex items-center gap-3 mb-8">
          <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
            <span className="text-2xl">⚖️</span>
          </div>
          <div>
            <h3 className="text-2xl font-bold bg-gradient-to-r from-black to-gray-700 bg-clip-text text-transparent">
              Hormonal Balance Analysis
            </h3>
            <p className="text-gray-400 text-sm">Cortisol vs Testosterone Assessment</p>
          </div>
        </div>

        <div className="grid lg:grid-cols-2 gap-8 mb-8">
          {/* Hormone Values */}
          <div className="space-y-6">
            {/* Cortisol Card */}
            <div className="group relative overflow-hidden rounded-xl bg-gradient-to-r from-blue-500/10 to-blue-600/10 border border-blue-500/20 hover:border-blue-500/40 transition-all duration-300">
              <div className="absolute inset-0 bg-gradient-to-r from-blue-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              <div className="relative p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-blue-600 rounded-lg flex items-center justify-center">
                      <span className="text-lg">🧠</span>
                    </div>
                    <div>
                      <div className="text-sm font-medium text-blue-300">Cortisol</div>
                      <div className="text-xs text-gray-400">Stress Hormone</div>
                    </div>
                  </div>
                  <div className={`px-3 py-1 rounded-full text-xs font-bold shadow-lg ${getStatusColor(hormoneAnalysis.cortisolStatus)}`}>
                    {hormoneAnalysis.cortisolStatus.toUpperCase()}
                  </div>
                </div>
                <div className="text-3xl font-bold text-white mb-2">{hormoneAnalysis.cortisol} <span className="text-sm font-normal text-gray-400">nmol/L</span></div>
                <div className="text-xs text-gray-500">Reference: 150-550 nmol/L</div>
              </div>
            </div>

            {/* Testosterone Card */}
            <div className="group relative overflow-hidden rounded-xl bg-gradient-to-r from-purple-500/10 to-purple-600/10 border border-purple-500/20 hover:border-purple-500/40 transition-all duration-300">
              <div className="absolute inset-0 bg-gradient-to-r from-purple-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              <div className="relative p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gradient-to-r from-purple-500 to-purple-600 rounded-lg flex items-center justify-center">
                      <span className="text-lg">💪</span>
                    </div>
                    <div>
                      <div className="text-sm font-medium text-purple-300">Testosterone</div>
                      <div className="text-xs text-gray-400">Anabolic Hormone</div>
                    </div>
                  </div>
                  <div className={`px-3 py-1 rounded-full text-xs font-bold shadow-lg ${getStatusColor(hormoneAnalysis.testosteroneStatus)}`}>
                    {hormoneAnalysis.testosteroneStatus.toUpperCase()}
                  </div>
                </div>
                <div className="text-3xl font-bold text-white mb-2">{hormoneAnalysis.testosterone} <span className="text-sm font-normal text-gray-400">nmol/L</span></div>
                <div className="text-xs text-gray-500">Reference: 10-35 nmol/L</div>
              </div>
            </div>
          </div>

          {/* Ratio Analysis */}
          <div className="space-y-6">
            {/* Ratio Card */}
            <div className="group relative overflow-hidden rounded-xl bg-gradient-to-br from-gray-700/50 to-gray-800/50 border border-gray-600/50 hover:border-gray-500/70 transition-all duration-300">
              <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              <div className="relative p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 bg-gradient-to-r from-gray-600 to-gray-700 rounded-lg flex items-center justify-center">
                    <span className="text-lg">📊</span>
                  </div>
                  <div>
                    <div className="text-sm font-medium text-gray-300">Hormone Ratio</div>
                    <div className="text-xs text-gray-400">Cortisol:Testosterone</div>
                  </div>
                </div>
                <div className="text-4xl font-bold bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent mb-2">
                  {(hormoneAnalysis.cortisolTestosteroneRatio * 100).toFixed(1)}:1
                </div>
                <div className="text-xs text-gray-500">Ideal range: 1.0-5.0:1 (0.01-0.05 ratio)</div>
              </div>
            </div>

            {/* Balance Status Card */}
            <div className={`group relative overflow-hidden rounded-xl border transition-all duration-300 ${getBalanceColor(hormoneAnalysis.hormonalBalance)}`}>
              <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              <div className="relative p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 bg-gradient-to-r from-gray-600 to-gray-700 rounded-lg flex items-center justify-center">
                    <span className="text-lg">{getBalanceIcon(hormoneAnalysis.hormonalBalance)}</span>
                  </div>
                  <div>
                    <div className="text-sm font-medium text-gray-300">Hormonal Balance</div>
                    <div className="text-xs text-gray-400">Current Status</div>
                  </div>
                </div>
                <div className="text-xl font-bold text-white mb-2 capitalize">{hormoneAnalysis.hormonalBalance}</div>
                <div className="text-sm text-gray-300">{hormoneAnalysis.balanceMessage}</div>
              </div>
            </div>
          </div>
        </div>

        {/* Clinical Insights */}
        <div className="relative overflow-hidden rounded-xl bg-gradient-to-r from-gray-800/50 to-gray-900/50 border border-gray-700/50">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500"></div>
          <div className="p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                <span className="text-lg">🔬</span>
              </div>
              <h4 className="text-lg font-bold text-white">Clinical Insights</h4>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              <div className="space-y-3">
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                  <strong className="text-blue-300 font-medium">Performance Impact:</strong>
                </div>
                <ul className="text-gray-300 space-y-2 text-sm">
                  {hormoneAnalysis.cortisolTestosteroneRatio > 0.05 && (
                    <>
                      <li className="flex items-start gap-2">
                        <span className="text-red-400 mt-0.5">•</span>
                        <span>Increased muscle protein breakdown</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-red-400 mt-0.5">•</span>
                        <span>Reduced recovery capacity</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-red-400 mt-0.5">•</span>
                        <span>Higher injury risk</span>
                      </li>
                    </>
                  )}
                  {hormoneAnalysis.cortisolTestosteroneRatio < 0.01 && (
                    <>
                      <li className="flex items-start gap-2">
                        <span className="text-green-400 mt-0.5">•</span>
                        <span>Enhanced muscle protein synthesis</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-green-400 mt-0.5">•</span>
                        <span>Improved recovery and adaptation</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-green-400 mt-0.5">•</span>
                        <span>Optimal anabolic environment</span>
                      </li>
                    </>
                  )}
                  {hormoneAnalysis.cortisolTestosteroneRatio >= 0.01 && hormoneAnalysis.cortisolTestosteroneRatio <= 0.05 && (
                    <>
                      <li className="flex items-start gap-2">
                        <span className="text-green-400 mt-0.5">•</span>
                        <span>Balanced hormonal environment</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-green-400 mt-0.5">•</span>
                        <span>Optimal recovery and performance</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-green-400 mt-0.5">•</span>
                        <span>Sustainable training capacity</span>
                      </li>
                    </>
                  )}
                </ul>
              </div>

              <div className="space-y-3">
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                  <strong className="text-purple-300 font-medium">Recommendations:</strong>
                </div>
                <ul className="text-gray-300 space-y-2 text-sm">
                  {hormoneAnalysis.cortisolTestosteroneRatio > 0.05 && (
                    <>
                      <li className="flex items-start gap-2">
                        <span className="text-blue-400 mt-0.5">•</span>
                        <span>Implement stress management techniques</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-blue-400 mt-0.5">•</span>
                        <span>Review training intensity and volume</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-blue-400 mt-0.5">•</span>
                        <span>Ensure adequate sleep (8-9 hours)</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-blue-400 mt-0.5">•</span>
                        <span>Consider magnesium supplementation</span>
                      </li>
                    </>
                  )}
                  {hormoneAnalysis.cortisolTestosteroneRatio < 0.01 && (
                    <>
                      <li className="flex items-start gap-2">
                        <span className="text-green-400 mt-0.5">•</span>
                        <span>Maintain current training regimen</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-green-400 mt-0.5">•</span>
                        <span>Ensure adequate protein intake</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-green-400 mt-0.5">•</span>
                        <span>Monitor for overtraining signs</span>
                      </li>
                    </>
                  )}
                  {hormoneAnalysis.cortisolTestosteroneRatio >= 0.01 && hormoneAnalysis.cortisolTestosteroneRatio <= 0.05 && (
                    <>
                      <li className="flex items-start gap-2">
                        <span className="text-green-400 mt-0.5">•</span>
                        <span>Continue current protocols</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-green-400 mt-0.5">•</span>
                        <span>Regular monitoring recommended</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-green-400 mt-0.5">•</span>
                        <span>Optimize nutrition and recovery</span>
                      </li>
                    </>
                  )}
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};