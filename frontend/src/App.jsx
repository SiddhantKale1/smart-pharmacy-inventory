import React, { useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import SimulatorModal from './components/SimulatorModal';

// Pages
import Dashboard from './pages/Dashboard';
import Inventory from './pages/Inventory';
import Medicines from './pages/Medicines';
import Batches from './pages/Batches';
import RfidManagement from './pages/RfidManagement';
import RfidAssign from './pages/RfidAssign';
import RfidPrint from './pages/RfidPrint';
import SalesTerminal from './pages/SalesTerminal';
import Transactions from './pages/Transactions';
import Alerts from './pages/Alerts';
import SensorsClimate from './pages/SensorsClimate';
import Thingspeak from './pages/Thingspeak';
import Suppliers from './pages/Suppliers';
import EmailImport from './pages/EmailImport';
import InvoicesReview from './pages/InvoicesReview';
import DemandPrediction from './pages/DemandPrediction';
import Settings from './pages/Settings';

export default function App() {
  const [isSimulatorOpen, setIsSimulatorOpen] = useState(false);

  return (
    <BrowserRouter>
      <div className="flex h-screen bg-slate-50 overflow-hidden font-sans">
        {/* Navigation Sidebar */}
        <Sidebar />

        {/* Content Area */}
        <div className="flex-1 flex flex-col min-w-0 h-screen overflow-hidden">
          {/* Top Bar with Live Telemetry and Simulator trigger */}
          <Header onOpenSimulator={() => setIsSimulatorOpen(true)} />

          {/* Scrollable Page View */}
          <main className="flex-1 overflow-y-auto p-6 md:p-8 bg-slate-50/60">
            <Routes>
              <Route path="/" element={<Navigate to="/dashboard" replace />} />
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/inventory" element={<Inventory />} />
              <Route path="/medicines" element={<Medicines />} />
              <Route path="/batches" element={<Batches />} />
              <Route path="/rfid" element={<RfidManagement />} />
              <Route path="/rfid/assign" element={<RfidAssign />} />
              <Route path="/rfid/print" element={<RfidPrint />} />
              <Route path="/sales" element={<SalesTerminal />} />
              <Route path="/transactions" element={<Transactions />} />
              <Route path="/alerts" element={<Alerts />} />
              <Route path="/sensors" element={<SensorsClimate />} />
              <Route path="/thingspeak" element={<Thingspeak />} />
              <Route path="/suppliers" element={<Suppliers />} />
              <Route path="/email-import" element={<EmailImport />} />
              <Route path="/invoices" element={<InvoicesReview />} />
              <Route path="/ml" element={<DemandPrediction />} />
              <Route path="/settings" element={<Settings onOpenSimulator={() => setIsSimulatorOpen(true)} />} />
              <Route path="*" element={<Navigate to="/dashboard" replace />} />
            </Routes>
          </main>
        </div>

        {/* Floating / Interactive Hardware Simulator Drawer */}
        <SimulatorModal
          isOpen={isSimulatorOpen}
          onClose={() => setIsSimulatorOpen(false)}
          onActionCompleted={() => {
            // Trigger refresh event or state if needed
          }}
        />
      </div>
    </BrowserRouter>
  );
}
