import React, { useState, useEffect } from 'react';
import { TrendingUp, BrainCircuit, RefreshCw, CheckCircle2 } from 'lucide-react';
import { api } from '../services/api';
import Badge from '../components/Badge';

export default function DemandPrediction() {
  const [predictions, setPredictions] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadPredictions = async () => {
    try {
      setLoading(true);
      const data = await api.getDemandPredictions();
      setPredictions(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPredictions();
  }, []);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-black text-black uppercase tracking-tight">Machine Learning Demand Prediction (AI Module)</h2>
          <p className="text-xs font-bold text-black/70 mt-0.5">
            Future forecasting engine utilizing Scikit-learn regression models over historical RFID sale transactions.
          </p>
        </div>
        <button
          onClick={loadPredictions}
          className="flex items-center gap-1.5 px-4 py-2 bg-[#86efac] text-black text-xs font-black uppercase rounded-xl border-2 border-black shadow-[3px_3px_0px_0px_#000] hover:translate-x-0.5 hover:translate-y-0.5 transition"
        >
          <RefreshCw className={`h-4 w-4 stroke-[2.5] ${loading ? 'animate-spin' : ''}`} />
          Retrain & Forecast
        </button>
      </div>

      {/* Architecture Notice (Electric Yellow, NO purple/blue) */}
      <div className="p-5 bg-[#fef08a] border-3 border-black text-black rounded-2xl shadow-[6px_6px_0px_0px_#000] flex items-start gap-4">
        <div className="p-3 bg-black text-white rounded-xl border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,0.5)]">
          <BrainCircuit className="h-6 w-6 stroke-[2.5]" />
        </div>
        <div className="text-xs space-y-1">
          <p className="font-black text-sm uppercase">Scikit-Learn Predictive Intelligence</p>
          <p className="font-bold leading-relaxed text-black/80">
            As specified in the system design, this ML module operates on historical SALE transactions. Medicines requiring higher observation periods cleanly report <b>"Not enough historical sales data"</b> until at least 5 verified sales are logged.
          </p>
        </div>
      </div>

      {/* Prediction Table */}
      <div className="bg-white rounded-xl border-2 border-black shadow-[4px_4px_0px_0px_#000] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-[#fde047] border-b-2 border-black text-black font-black uppercase text-[10px] tracking-wider">
                <th className="py-3 px-4">Medicine Item</th>
                <th className="py-3 px-4">Current Stock</th>
                <th className="py-3 px-4">Predicted 30-Day Demand</th>
                <th className="py-3 px-4">Suggested Reorder Qty</th>
                <th className="py-3 px-4">Model Status</th>
                <th className="py-3 px-4">Diagnostics / Notes</th>
              </tr>
            </thead>
            <tbody className="divide-y-2 divide-black/10 text-black">
              {loading && predictions.length === 0 ? (
                <tr>
                  <td colSpan="6" className="text-center py-12 text-black font-black">
                    <RefreshCw className="h-5 w-5 animate-spin mx-auto mb-2 text-black" />
                    RUNNING REGRESSION ALGORITHMS...
                  </td>
                </tr>
              ) : predictions.length === 0 ? (
                <tr>
                  <td colSpan="6" className="text-center py-12 text-black/70 font-bold">
                    No medicine catalog data available.
                  </td>
                </tr>
              ) : (
                predictions.map((p) => {
                  const isTrained = p.model_status === "TRAINED";

                  return (
                    <tr key={p.medicine_id} className="hover:bg-[#fff9db] transition-colors">
                      <td className="py-3.5 px-4 font-black text-black text-xs">
                        {p.medicine_name}
                      </td>
                      <td className="py-3.5 px-4 font-black text-black text-sm">
                        {p.current_stock} units
                      </td>
                      <td className="py-3.5 px-4 font-mono font-bold">
                        {isTrained ? (
                          <span className="text-black bg-[#86efac] px-2.5 py-1 rounded-md border-2 border-black shadow-[1px_1px_0px_0px_#000] font-black inline-block">
                            ~{p.predicted_demand_30d} units
                          </span>
                        ) : (
                          <span className="text-black/50 font-bold">—</span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 font-mono font-black text-sm">
                        {p.suggested_reorder_qty > 0 ? (
                          <span className="text-black bg-[#fed7aa] px-2 py-0.5 rounded border border-black inline-block">
                            +{p.suggested_reorder_qty} units
                          </span>
                        ) : (
                          <span className="text-black/50 font-bold">Sufficient</span>
                        )}
                      </td>
                      <td className="py-3.5 px-4">
                        <Badge
                          status={isTrained ? "SAFE" : "WARNING"}
                          text={isTrained ? "MODEL TRAINED" : "INSUFFICIENT DATA"}
                          size="sm"
                        />
                      </td>
                      <td className="py-3.5 px-4 text-xs font-mono font-bold">
                        {isTrained ? (
                          <span className="text-black font-black flex items-center gap-1">
                            <CheckCircle2 className="h-4 w-4 stroke-[3]" /> High Confidence Forecast
                          </span>
                        ) : (
                          <span className="text-black/60 italic font-bold">
                            Not enough historical sales data
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
