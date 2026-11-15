/**
 * AstraPulse — Astronaut Health Intelligence & Mission Decision Support
 * Team Zenitsu — NASA Space Apps Challenge 2026
 */

import React from 'react';
import { ShellChrome } from './components/ShellChrome';
import { SystemDrawer } from './components/SystemDrawer';
import { MissionProvider, useMission } from './context/MissionContext';
import { AlertCenterScreen } from './screens/AlertCenterScreen';
import { CrewCoreScreen, MissionEntryScreen } from './screens/CrewCoreScreen';
import {
  GroundConsoleScreen,
  SettingsScreen,
} from './screens/GroundAndSettingsScreen';
import { GroundLinkScreen } from './screens/GroundLinkScreen';
import { HabitatScreen } from './screens/HabitatScreen';
import { InsightsScreen } from './screens/InsightsScreen';
import { MeasureLabScreen } from './screens/MeasureLabScreen';
import { MissionCopilotScreen } from './screens/MissionCopilotScreen';
import { Orbital3DSceneScreen } from './screens/Orbital3DSceneScreen';
import { PulseRitualScreen } from './screens/PulseRitualScreen';
import {
  QuestsScreen,
  ReportsScreen,
} from './screens/QuestsAndReportsScreen';
import { WellnessSanctuaryScreen } from './screens/WellnessSanctuaryScreen';

class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean; message: string }
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false, message: '' };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, message: error.message };
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-[#04060C] text-[#F2F6FF] flex items-center justify-center p-6">
          <div className="max-w-md glass-panel rounded-2xl p-6 space-y-3 border border-rose-400/40">
            <h1 className="text-lg font-display font-bold text-[#FF5C93]">
              AstraPulse Telemetry Recovery Mode
            </h1>
            <p className="text-xs text-[#A9B4CC] font-mono-tabular">
              {this.state.message}
            </p>
            <button
              type="button"
              onClick={() => window.location.reload()}
              className="px-4 py-2 rounded-xl bg-[#3DE0FF] text-[#04060C] text-xs font-bold cursor-pointer"
            >
              Reload Crew Core
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

const ScreenRouter: React.FC = () => {
  const { route, selectedBodyRegion, setSelectedBodyRegion } = useMission();

  return (
    <ShellChrome>
      {route === '/enter' && <MissionEntryScreen />}
      {route === '/' && <CrewCoreScreen />}
      {route === '/ritual' && <PulseRitualScreen />}
      {route === '/measure' && <MeasureLabScreen />}
      {route === '/insights' && <InsightsScreen />}
      {route === '/alerts' && <AlertCenterScreen />}
      {route === '/wellness' && <WellnessSanctuaryScreen />}
      {route === '/link' && <GroundLinkScreen />}
      {route === '/habitat' && <HabitatScreen />}
      {route === '/3d' && <Orbital3DSceneScreen />}
      {route === '/copilot' && <MissionCopilotScreen />}
      {route === '/quests' && <QuestsScreen />}
      {route === '/reports' && <ReportsScreen />}
      {route === '/ground' && <GroundConsoleScreen />}
      {route === '/settings' && <SettingsScreen />}

      {/* S3 System Drawer (/system/:id) */}
      <SystemDrawer
        regionId={selectedBodyRegion}
        onClose={() => setSelectedBodyRegion(null)}
      />
    </ShellChrome>
  );
};

export default function App() {
  return (
    <ErrorBoundary>
      <MissionProvider>
        <ScreenRouter />
      </MissionProvider>
    </ErrorBoundary>
  );
}
