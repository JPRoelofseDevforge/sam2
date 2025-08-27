import React from 'react';

interface PathologyAlert {
  type: 'normal' | 'warning' | 'critical';
  category: string;
  test: string;
  value: number;
  unit: string;
  reference: string;
  message: string;
}

interface PathologyAlertsProps {
  alerts: PathologyAlert[];
}

export const PathologyAlerts: React.FC<PathologyAlertsProps> = ({ alerts }) => {
  const criticalAlerts = alerts.filter(a => a.type === 'critical');
  const warningAlerts = alerts.filter(a => a.type === 'warning');

  if (criticalAlerts.length === 0 && warningAlerts.length === 0) {
    return null;
  }

  return (
    <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-gray-800/90 to-gray-900/90 backdrop-blur-sm border border-gray-700/50 shadow-2xl">
      {/* Decorative background elements */}
      <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-red-500 via-yellow-500 to-orange-500"></div>
      <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-red-500/10 to-transparent rounded-full"></div>
      <div className="absolute bottom-0 left-0 w-24 h-24 bg-gradient-to-tr from-yellow-500/10 to-transparent rounded-full"></div>

      <div className="relative z-10 p-8">
        <div className="flex items-center gap-3 mb-8">
          <div className="w-12 h-12 bg-gradient-to-r from-red-500 to-yellow-600 rounded-xl flex items-center justify-center shadow-lg">
            <span className="text-2xl">⚠️</span>
          </div>
          <div>
            <h3 className="text-2xl font-bold bg-gradient-to-r from-black to-gray-700 bg-clip-text text-transparent">
              Health Alerts
            </h3>
            <p className="text-gray-400 text-sm">Critical findings requiring attention</p>
          </div>
        </div>

        {/* Critical Alerts */}
        {criticalAlerts.length > 0 && (
          <div className="mb-8">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-8 h-8 bg-gradient-to-r from-red-500 to-red-600 rounded-lg flex items-center justify-center">
                <span className="text-sm">🚨</span>
              </div>
              <h4 className="text-xl font-bold text-red-300">Critical Issues</h4>
              <div className="ml-auto px-3 py-1 bg-red-500/20 border border-red-500/30 rounded-full">
                <span className="text-red-300 font-bold text-sm">{criticalAlerts.length}</span>
              </div>
            </div>

            <div className="space-y-4">
              {criticalAlerts.map((alert, index) => (
                <div key={index} className="group relative overflow-hidden rounded-xl bg-gradient-to-r from-red-500/10 to-red-600/10 border border-red-500/20 hover:border-red-500/40 transition-all duration-300">
                  <div className="absolute inset-0 bg-gradient-to-r from-red-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                  <div className="relative p-6">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-3">
                          <div className="w-10 h-10 bg-gradient-to-r from-red-500 to-red-600 rounded-lg flex items-center justify-center">
                            <span className="text-lg">{alert.category === 'Hormones' ? '🧠' : alert.category === 'Metabolic' ? '⚡' : alert.category === 'Kidney' ? '🫑' : '🩸'}</span>
                          </div>
                          <div>
                            <div className="font-bold text-red-300 text-lg">{alert.test}</div>
                            <div className="text-sm text-gray-400">{alert.category}</div>
                          </div>
                        </div>
                        <div className="text-red-200 leading-relaxed">{alert.message}</div>
                      </div>

                      <div className="text-right flex-shrink-0">
                        <div className="text-2xl font-bold text-red-300 mb-2">{alert.value} <span className="text-sm font-normal text-red-400">{alert.unit}</span></div>
                        <div className="text-xs text-red-400 bg-red-500/10 px-2 py-1 rounded border border-red-500/20">
                          Ref: {alert.reference}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Warning Alerts */}
        {warningAlerts.length > 0 && (
          <div>
            <div className="flex items-center gap-3 mb-6">
              <div className="w-8 h-8 bg-gradient-to-r from-yellow-500 to-yellow-600 rounded-lg flex items-center justify-center">
                <span className="text-sm">⚡</span>
              </div>
              <h4 className="text-xl font-bold text-yellow-300">Warnings</h4>
              <div className="ml-auto px-3 py-1 bg-yellow-500/20 border border-yellow-500/30 rounded-full">
                <span className="text-yellow-300 font-bold text-sm">{warningAlerts.length}</span>
              </div>
            </div>

            <div className="space-y-4">
              {warningAlerts.map((alert, index) => (
                <div key={index} className="group relative overflow-hidden rounded-xl bg-gradient-to-r from-yellow-500/10 to-yellow-600/10 border border-yellow-500/20 hover:border-yellow-500/40 transition-all duration-300">
                  <div className="absolute inset-0 bg-gradient-to-r from-yellow-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                  <div className="relative p-6">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-3">
                          <div className="w-10 h-10 bg-gradient-to-r from-yellow-500 to-yellow-600 rounded-lg flex items-center justify-center">
                            <span className="text-lg">{alert.category === 'Hormones' ? '🧠' : alert.category === 'Metabolic' ? '⚡' : alert.category === 'Kidney' ? '🫑' : '🩸'}</span>
                          </div>
                          <div>
                            <div className="font-bold text-yellow-300 text-lg">{alert.test}</div>
                            <div className="text-sm text-gray-400">{alert.category}</div>
                          </div>
                        </div>
                        <div className="text-yellow-200 leading-relaxed">{alert.message}</div>
                      </div>

                      <div className="text-right flex-shrink-0">
                        <div className="text-2xl font-bold text-yellow-300 mb-2">{alert.value} <span className="text-sm font-normal text-yellow-400">{alert.unit}</span></div>
                        <div className="text-xs text-yellow-400 bg-yellow-500/10 px-2 py-1 rounded border border-yellow-500/20">
                          Ref: {alert.reference}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};