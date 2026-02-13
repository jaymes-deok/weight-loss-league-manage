
import React, { useState, useEffect, useMemo } from 'react';
import { 
  Users, 
  Trophy, 
  TrendingUp, 
  Search, 
  ChevronDown, 
  ChevronUp, 
  Target, 
  Scale, 
  Calendar,
  Zap,
  AlertCircle,
  CheckCircle,
  RefreshCw,
  HelpCircle,
  Info,
  ArrowRight,
  Sparkles,
  Award,
  Edit2,
  Save,
  X,
  Trash2,
  UserMinus,
  ShieldCheck,
  Eraser,
  PlusCircle,
  Settings,
  PieChart,
  MessageSquare,
  Lock,
  LayoutDashboard,
  Filter,
  Copy,
  FileText,
  Globe,
  ExternalLink,
  Database,
  Link2,
  Terminal,
  AlertTriangle,
  Key,
  Clock,
  CircleCheck,
  MoveRight,
  Medal,
  Dna
} from 'lucide-react';
import { Player, Team, WeightEntry, TeamAdjustment } from './types';
import { mergeCsvData } from './utils/parser';
import { calculatePlayerStats } from './utils/scoring';
import { parseAdjustmentsCSV, getTeamAdjustments, getTeamAdjustmentTotal } from './utils/adjustments';
import { TEAM_CAP, DEFAULT_CSV_URL, MILESTONES, GAME_WEEKS_DATES } from './constants';
import { StatsCard } from './components/StatsCard';

const PASSKEY = "wcw";

const TeamSparkline: React.FC<{ data: number[], forecast: number }> = ({ data, forecast }) => {
  const points = [...data];
  const maxVal = Math.max(...points, forecast, 10);
  const width = 400;
  const height = 140;
  const padding = 40;
  
  const getX = (i: number) => (i * (width - padding * 2)) / (points.length) + padding;
  const getY = (v: number) => height - padding - ((v / maxVal) * (height - padding * 2));

  const pathD = points.map((v, i) => `${i === 0 ? 'M' : 'L'} ${getX(i)} ${getY(v)}`).join(' ');
  const lastX = getX(points.length - 1);
  const lastY = getY(points[points.length - 1]);
  const forecastX = getX(points.length);
  const forecastY = getY(forecast);

  return (
    <div className="relative w-full h-[180px] mt-4">
      <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-full overflow-visible">
        <line x1={lastX} y1={lastY} x2={forecastX} y2={forecastY} stroke="#10b981" strokeWidth="3" strokeDasharray="6,4" />
        <path d={pathD} fill="none" stroke="#4f46e5" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
        {points.map((v, i) => (
          <g key={i}>
            <circle cx={getX(i)} cy={getY(v)} r="4" fill="#4f46e5" />
            <text x={getX(i)} y={getY(v) - 10} textAnchor="middle" fontSize="10" fontWeight="900" fill="#4f46e5">{v}</text>
          </g>
        ))}
        <circle cx={forecastX} cy={forecastY} r="5" fill="#10b981" />
        <text x={forecastX} y={forecastY} textAnchor="middle" fontSize="11" fontWeight="900" fill="#047857" dy="-12">{forecast}</text>
      </svg>
      <div className="absolute bottom-2 left-0 right-0 flex justify-between px-2">
        <span className="text-[8px] font-black text-slate-300 uppercase tracking-widest">W1 Start</span>
        <span className="text-[8px] font-black text-emerald-500 uppercase tracking-widest">Forecast Target</span>
      </div>
    </div>
  );
};

interface EnhancedTeam extends Team {
  weeklyPointsTrend: number[];
  avgBonusPerWeek: number;
}

type TeamSubView = 'season' | 'actual' | 'forecast';

const App: React.FC = () => {
  const [players, setPlayers] = useState<Player[]>([]);
  const [weekDates, setWeekDates] = useState<Record<number, string>>(GAME_WEEKS_DATES);
  const totalPossibleWeeks = useMemo(() => Object.keys(weekDates).length, [weekDates]);

  const [currentWeek, setCurrentWeek] = useState<number>(() => {
    const today = new Date();
    const currentYear = today.getFullYear();
    const pastWeeks = Object.entries(GAME_WEEKS_DATES)
      .filter(([_, dateStr]) => {
        let d = new Date(`${dateStr} ${currentYear}`);
        if (d.getMonth() < 3 && today.getMonth() > 8) d.setFullYear(currentYear + 1);
        if (d.getMonth() > 8 && today.getMonth() < 3) d.setFullYear(currentYear - 1);
        return d <= today;
      })
      .map(([week]) => parseInt(week));
    return pastWeeks.length > 0 ? Math.max(...pastWeeks) : 1;
  });

  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [teamFilter, setTeamFilter] = useState('All Teams');
  const [expandedPlayerId, setExpandedPlayerId] = useState<string | null>(null);
  const [expandedTeamId, setExpandedTeamId] = useState<string | null>(null);
  const [teamSubView, setTeamSubView] = useState<TeamSubView>('season');
  const [activeTab, setActiveTab] = useState<'dashboard' | 'players'>('dashboard');
  const [showConfig, setShowConfig] = useState(false);
  const [configSubTab, setConfigSubTab] = useState<'sync' | 'adjustments' | 'withdrawn'>('sync');
  
  const [authModal, setAuthModal] = useState<{ isOpen: boolean; actionName: string; onConfirm: () => void } | null>(null);
  const [passkeyInput, setPasskeyInput] = useState('');

  const [csvUrl, setCsvUrl] = useState<string>(DEFAULT_CSV_URL);
  const [urlInput, setUrlInput] = useState(csvUrl);
  const [adjustmentsUrl, setAdjustmentsUrl] = useState<string>("");
  const [adjustmentsUrlInput, setAdjustmentsUrlInput] = useState("");
  const [teamAdjustments, setTeamAdjustments] = useState<TeamAdjustment[]>([]);
  const [withdrawnUrl, setWithdrawnUrl] = useState<string>("");
  const [withdrawnUrlInput, setWithdrawnUrlInput] = useState("");
  const [withdrawnPlayers, setWithdrawnPlayers] = useState<Player[]>([]);
  const [editingWeight, setEditingWeight] = useState<{playerId: string, week: number, value: string} | null>(null);


  

  const triggerAuth = (actionName: string, onConfirm: () => void) => {
    setPasskeyInput('');
    setAuthModal({ isOpen: true, actionName, onConfirm });
  };

  const handleAuthConfirm = () => {
    if (passkeyInput === PASSKEY) {
      const callback = authModal?.onConfirm;
      setAuthModal(null);
      if (callback) callback();
    } else {
      alert("❌ Access Denied.");
    }
  };

  const fetchData = async (url: string) => {
    if (!url) return;
    try {
      setLoading(true);
      const response = await fetch(url);
      if (!response.ok) throw new Error(`HTTP Error: ${response.status}`);
      const csvText = await response.text();
      const mergedPlayers = mergeCsvData(players, csvText, weekDates);
      setPlayers(mergedPlayers);
    } catch (err: any) {
      console.error('Sync failed', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchAdjustments = async (url: string) => {
    if (!url) return;
    try {
      const response = await fetch(url);
      if (!response.ok) throw new Error(`HTTP Error: ${response.status}`);
      const csvText = await response.text();
      const adjustments = parseAdjustmentsCSV(csvText);
      setTeamAdjustments(adjustments);
    } catch (err: any) {
      console.error('Adjustments sync failed', err);
    }
  };

  const fetchWithdrawn = async (url: string) => {
    if (!url) return;
    try {
      const response = await fetch(url);
      if (!response.ok) throw new Error(`HTTP Error: ${response.status}`);
      const csvText = await response.text();
      const parsedWithdrawn = mergeCsvData([], csvText, weekDates);
      setWithdrawnPlayers(parsedWithdrawn);
    } catch (err: any) {
      console.error('Withdrawn players sync failed', err);
    }
  };


  const getCsvString = () => {
    const headers = ["Rank", "Name", "Team"];
    for(let i=1; i<=totalPossibleWeeks; i++) {
        headers.push(`Week ${i}`, `Goal ${i}`);
    }
    const rows = players.map((p, idx) => {
        const row = [idx + 1, p.name, p.team];
        p.weights.forEach(w => {
            row.push(w.weight !== null ? w.weight : "");
            row.push("");
        });
        return row.join(",");
    });
    return [headers.join(","), ...rows].join("\n");
  };

  const playersWithWeekStats = useMemo(() => {
    return players.map(p => ({
      ...p,
      stats: calculatePlayerStats(p.name, p.team, p.weights.map(w => w.weight), currentWeek)
    }));
  }, [players, currentWeek]);

  const teams = useMemo(() => {
    const teamMap: Record<string, Player[]> = {};
    playersWithWeekStats.forEach(p => {
      if (!teamMap[p.team]) teamMap[p.team] = [];
      teamMap[p.team].push(p);
    });

    return Object.entries(teamMap).map(([name, teamPlayers]): EnhancedTeam => {
      const sortedBySeasonActual = [...teamPlayers].sort((a, b) => b.stats.actualPoints - a.stats.actualPoints);
      const top10Season = sortedBySeasonActual.slice(0, TEAM_CAP);
      const top10Actual = top10Season.reduce((sum, p) => sum + p.stats.actualPoints, 0);
      
      const sortedByWeekActual = [...teamPlayers].sort((a, b) => b.stats.latestWeekPoints - a.stats.latestWeekPoints);
      const top10Latest = sortedByWeekActual.slice(0, TEAM_CAP).reduce((sum, p) => sum + p.stats.latestWeekPoints, 0);

      const top10Forecast = top10Season.reduce((sum, p) => sum + p.stats.forecastPoints, 0);

      // Calculate aggregated yield of all players with weight data for current week
      const playersWithCurrentWeekData = teamPlayers.filter(player => {
        const currentWeekIndex = currentWeek - 1;
        return currentWeekIndex < player.weights.length && player.weights[currentWeekIndex].weight !== null;
      });
      const allPlayersLatestYield = playersWithCurrentWeekData.reduce((sum, p) => sum + p.stats.latestWeekPoints, 0);

      // Add manual adjustments for current week
      const currentWeekAdjustment = getTeamAdjustmentTotal(teamAdjustments, name, currentWeek);
      const adjustedTop10Latest = top10Latest + currentWeekAdjustment;
      const adjustedTop10Actual = top10Actual + currentWeekAdjustment;
      const adjustedAllPlayersLatestYield = allPlayersLatestYield + currentWeekAdjustment;

      const weeklyPointsTrend = Array.from({ length: currentWeek }, (_, weekIdx) => {
        const weekNumber = weekIdx + 1;
        const sortedByThatWeek = [...teamPlayers].sort((a, b) => {
          const statsA = calculatePlayerStats(a.name, a.team, a.weights.map(w => w.weight), weekNumber);
          const statsB = calculatePlayerStats(b.name, b.team, a.weights.map(w => w.weight), weekNumber);
          return statsB.latestWeekPoints - statsA.latestWeekPoints;
        });
        
        const weekPlayerPoints = sortedByThatWeek.slice(0, TEAM_CAP).reduce((sum, p) => {
          const stats = calculatePlayerStats(p.name, p.team, p.weights.map(w => w.weight), weekNumber);
          return sum + stats.latestWeekPoints;
        }, 0);
        
        // Add adjustments for this week
        const weekAdjustment = getTeamAdjustmentTotal(teamAdjustments, name, weekNumber);
        return weekPlayerPoints + weekAdjustment;
      });

      return {
        name,
        players: teamPlayers,
        top10Actual: adjustedTop10Actual,
        top10Latest: adjustedTop10Latest,
        top10Forecast,
        allPlayersLatest: adjustedAllPlayersLatestYield,
        weeklyPointsTrend,
        avgBonusPerWeek: currentWeek > 0 ? adjustedTop10Actual / currentWeek : 0,
        totalWeightLoss: teamPlayers.reduce((sum, p) => sum + p.stats.weightLossKg, 0)
      };
    }).sort((a, b) => b.top10Actual - a.top10Actual);
  }, [playersWithWeekStats, currentWeek, teamAdjustments]);

  const topWeightLossTeams = useMemo(() => {
    return [...teams].sort((a, b) => b.totalWeightLoss - a.totalWeightLoss).slice(0, 5);
  }, [teams]);

  const topWeightLossIndividuals = useMemo(() => {
    return [...playersWithWeekStats].sort((a, b) => b.stats.weightLossKg - a.stats.weightLossKg).slice(0, 5);
  }, [playersWithWeekStats]);

  const uniqueTeams = useMemo(() => {
    const set = new Set(players.map(p => p.team));
    return Array.from(set).sort();
  }, [players]);

  const filteredTeams = useMemo(() => {
    return teams.filter(t => {
      const matchesSearch = t.name.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesTeam = teamFilter === 'All Teams' || t.name === teamFilter;
      return matchesSearch && matchesTeam;
    });
  }, [teams, searchTerm, teamFilter]);

  const filteredPlayers = useMemo(() => {
    return playersWithWeekStats.filter(p => {
      const matchesSearch = p.name.toLowerCase().includes(searchTerm.toLowerCase()) || p.team.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesTeam = teamFilter === 'All Teams' || p.team === teamFilter;
      return matchesSearch && matchesTeam;
    }).sort((a, b) => b.stats.actualPoints - a.stats.actualPoints);
  }, [playersWithWeekStats, searchTerm, teamFilter]);

  const handleUpdateCsv = () => {
    triggerAuth("Update Data Source", () => {
      setCsvUrl(urlInput);
      fetchData(urlInput);
      setShowConfig(false);
    });
  };

  const handleUpdateAdjustments = () => {
    triggerAuth("Update Adjustments", () => {
      setAdjustmentsUrl(adjustmentsUrlInput);
      fetchAdjustments(adjustmentsUrlInput);
    });
  };

  const handleUpdateWithdrawn = () => {
    triggerAuth("Update Withdrawn Players", () => {
      setWithdrawnUrl(withdrawnUrlInput);
      fetchWithdrawn(withdrawnUrlInput);
    });
  };

  const handleWeightSave = (playerId: string, weekIndex: number, val: string) => {
    triggerAuth("Manual Weight Edit", () => {
      const num = val === '' ? null : parseFloat(val);
      setPlayers(current => current.map(p => {
        if (p.id !== playerId) return p;
        const newWeights = [...p.weights];
        newWeights[weekIndex] = { ...newWeights[weekIndex], weight: num };
        return { ...p, weights: newWeights };
      }));
      setEditingWeight(null);
    });
  };

  const handleDeletePlayer = (playerId: string, playerName: string) => {
    triggerAuth(`Delete Player ${playerName}`, () => {
      setPlayers(current => current.filter(p => p.id !== playerId));
    });
  };

  return (
    <div className="min-h-screen pb-20 bg-slate-50 text-slate-900 font-sans selection:bg-indigo-100 antialiased">
      {authModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
          <div className="bg-white w-full max-w-sm rounded-[2rem] shadow-2xl p-8 border border-slate-100">
            <div className="flex flex-col items-center text-center mb-6">
              <div className="w-16 h-16 bg-indigo-50 text-indigo-600 rounded-full flex items-center justify-center mb-4"><Lock size={28} /></div>
              <h2 className="text-xl font-black text-slate-900 leading-tight">Admin Authorization</h2>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-2">{authModal.actionName}</p>
            </div>
            <div className="space-y-4">
              <input autoFocus type="password" placeholder="Passkey" value={passkeyInput} onChange={(e) => setPasskeyInput(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleAuthConfirm()} className="w-full px-4 py-4 bg-slate-50 border-2 border-transparent focus:border-indigo-600 focus:bg-white rounded-2xl outline-none text-center font-black tracking-[0.5em] transition-all" />
              <div className="flex gap-3">
                <button onClick={() => setAuthModal(null)} className="flex-1 px-4 py-3 bg-slate-100 text-slate-600 rounded-xl text-xs font-black uppercase">Cancel</button>
                <button onClick={handleAuthConfirm} className="flex-1 px-4 py-3 bg-indigo-600 text-white rounded-xl text-xs font-black uppercase">Confirm</button>
              </div>
            </div>
          </div>
        </div>
      )}

      <header className="bg-white/80 border-b border-slate-200 sticky top-0 z-30 shadow-sm backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center text-white shadow-lg"><Trophy size={24} /></div>
            <div>
              <h1 className="text-xl font-black text-slate-900 tracking-tight leading-none">Fit5 Tracker</h1>
              <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest mt-1">League Dashboard v5.9</p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex items-center gap-2 bg-indigo-50 border border-indigo-100 px-3 py-1.5 rounded-xl">
              <Calendar size={14} className="text-indigo-600" />
              <select value={currentWeek} onChange={(e) => setCurrentWeek(parseInt(e.target.value))} className="bg-transparent text-xs font-black text-indigo-700 outline-none cursor-pointer">
                {Array.from({ length: totalPossibleWeeks }, (_, i) => i + 1).map(w => <option key={w} value={w}>Week {w}</option>)}
              </select>
            </div>
            <div className="flex items-center gap-2 bg-slate-100 p-1 rounded-xl">
              <button onClick={() => setActiveTab('dashboard')} className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-xs font-black uppercase tracking-widest transition-all ${activeTab === 'dashboard' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>Dashboard</button>
              <button onClick={() => setActiveTab('players')} className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-xs font-black uppercase tracking-widest transition-all ${activeTab === 'players' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>Leaderboard</button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-8">
        <div className="mb-8 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <button onClick={() => setShowConfig(!showConfig)} className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold border transition-all ${showConfig ? 'bg-indigo-600 border-indigo-600 text-white shadow-lg' : 'bg-white border-slate-200 text-slate-600'}`}><Settings size={16} /> Cloud Config</button>
            <button onClick={() => fetchData(csvUrl)} disabled={loading} className="flex items-center gap-2 px-4 py-2.5 bg-white border border-slate-200 text-slate-600 hover:border-emerald-300 rounded-xl text-xs font-bold transition-all disabled:opacity-50"><RefreshCw size={16} className={loading ? 'animate-spin' : ''} /> Sync Cloud</button>
          </div>
          <div className="hidden sm:flex items-center gap-2 px-4 py-2 bg-indigo-50 text-indigo-600 rounded-xl border border-indigo-100">
             <Info size={14} />
             <span className="text-[10px] font-black uppercase tracking-widest">Biometric Engine v2.0 Active</span>
          </div>
        </div>

        {showConfig && (
          <div className="mb-8 bg-white rounded-[2.5rem] border-2 border-indigo-100 shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300">
            <div className="flex border-b border-indigo-50 bg-slate-50/50">
                <button onClick={() => setConfigSubTab('sync')} className={`flex-1 py-4 text-[10px] font-black uppercase tracking-[0.2em] transition-all ${configSubTab === 'sync' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:bg-slate-50'}`}>Data Source</button>
                <button onClick={() => setConfigSubTab('adjustments')} className={`flex-1 py-4 text-[10px] font-black uppercase tracking-[0.2em] transition-all ${configSubTab === 'adjustments' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:bg-slate-50'}`}>Team Adjustments</button>
                <button onClick={() => setConfigSubTab('withdrawn')} className={`flex-1 py-4 text-[10px] font-black uppercase tracking-[0.2em] transition-all ${configSubTab === 'withdrawn' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:bg-slate-50'}`}>Withdrawn Players</button>
            </div>
            <div className="p-8">
              {configSubTab === 'sync' && (
                <div className="space-y-4">
                  <input type="text" value={urlInput} onChange={(e) => setUrlInput(e.target.value)} className="w-full px-4 py-4 bg-slate-50 border-2 border-slate-100 rounded-2xl text-sm font-bold" />
                  <button onClick={handleUpdateCsv} className="w-full py-4 bg-indigo-600 text-white rounded-2xl text-sm font-black">Update Source</button>
                </div>
              )}
              {configSubTab === 'adjustments' && (
                <div className="space-y-4">
                  <input type="text" value={adjustmentsUrlInput} onChange={(e) => setAdjustmentsUrlInput(e.target.value)} placeholder="Adjustments CSV URL" className="w-full px-4 py-4 bg-slate-50 border-2 border-slate-100 rounded-2xl text-sm font-bold" />
                  <button onClick={handleUpdateAdjustments} className="w-full py-4 bg-indigo-600 text-white rounded-2xl text-sm font-black">Load Adjustments</button>
                </div>
              )}
              {configSubTab === 'withdrawn' && (
                <div className="space-y-4">
                  <input type="text" value={withdrawnUrlInput} onChange={(e) => setWithdrawnUrlInput(e.target.value)} placeholder="Withdrawn Players CSV URL" className="w-full px-4 py-4 bg-slate-50 border-2 border-slate-100 rounded-2xl text-sm font-bold" />
                  <button onClick={handleUpdateWithdrawn} className="w-full py-4 bg-indigo-600 text-white rounded-2xl text-sm font-black">Load Withdrawn Players</button>
                </div>
              )}
            </div>
          </div>
        )}

        <div className="mb-10 flex flex-col md:flex-row gap-4 items-center justify-between bg-white p-5 rounded-[2.5rem] shadow-sm border border-slate-100">
           <div className="flex flex-1 flex-col md:flex-row gap-4 w-full">
              <div className="relative flex-1">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                <input type="text" placeholder={`Filter ${activeTab === 'dashboard' ? 'squads' : 'athletes'}...`} value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full pl-12 pr-6 py-4 bg-slate-50 border-transparent focus:bg-white focus:ring-2 focus:ring-indigo-600 rounded-2xl text-sm font-semibold outline-none transition-all" />
              </div>
              <div className="relative min-w-[220px]">
                <select value={teamFilter} onChange={(e) => setTeamFilter(e.target.value)} className="w-full pl-6 pr-10 py-4 bg-slate-50 border-transparent focus:bg-white focus:ring-2 focus:ring-indigo-600 rounded-2xl text-sm font-bold appearance-none outline-none cursor-pointer transition-all">
                  {['All Teams', ...uniqueTeams.filter(t => t !== 'All Teams')].map(t => <option key={t} value={t}>{t}</option>)}
                </select>
                <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={16} />
              </div>
           </div>
        </div>

        {activeTab === 'dashboard' ? (
          <div className="space-y-12">
            <section className="animate-in fade-in duration-700 slide-in-from-bottom-4">
               <div className="flex items-center justify-between mb-6 px-2">
                  <div className="flex items-center gap-3">
                     <div className="w-10 h-10 bg-emerald-100 text-emerald-600 rounded-xl flex items-center justify-center"><Scale size={20} /></div>
                     <div>
                        <h2 className="text-xl font-black text-slate-900 tracking-tight">Squad Weight Loss Leaderboard</h2>
                        <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest mt-0.5">Aggregate KG Lost - Season To Date</p>
                     </div>
                  </div>
               </div>
               
               <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                  {topWeightLossTeams.map((t, i) => (
                    <div key={t.name} className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm relative overflow-hidden group hover:border-emerald-200 transition-all">
                       <div className="relative z-10">
                          <span className="text-[9px] font-black text-slate-300 uppercase tracking-widest">RANK #{i+1}</span>
                          <h4 className="text-sm font-black text-slate-900 mt-1 mb-3 truncate">{t.name}</h4>
                          <div className="flex items-baseline gap-1">
                             <span className="text-3xl font-black text-emerald-600">{t.totalWeightLoss.toFixed(1)}</span>
                             <span className="text-[10px] font-black text-slate-300 uppercase">KG</span>
                          </div>
                       </div>
                    </div>
                  ))}
               </div>
            </section>

            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-8 animate-in fade-in duration-700 items-start">
              {filteredTeams.map((team) => {
                const idx = teams.findIndex(t => t.name === team.name);
                const isExpanded = expandedTeamId === team.name;
                
                let playersToShow = [];
                let viewTitle = "";
                if (teamSubView === 'actual') {
                  // Show all players with weight data for current week
                  playersToShow = [...team.players].filter(player => {
                    const currentWeekIndex = currentWeek - 1;
                    return currentWeekIndex < player.weights.length && player.weights[currentWeekIndex].weight !== null;
                  }).sort((a,b) => b.stats.latestWeekPoints - a.stats.latestWeekPoints);
                  viewTitle = `W${currentWeek} All Players Yield (${playersToShow.length} with weight data)`;
                } else if (teamSubView === 'forecast') {
                  playersToShow = [...team.players].sort((a,b) => b.stats.forecastPoints - a.stats.forecastPoints).slice(0, 10);
                  viewTitle = `W${currentWeek + 1} Top 10 Potential`;
                } else {
                  playersToShow = [...team.players].sort((a,b) => b.stats.actualPoints - a.stats.actualPoints).slice(0, 10);
                  viewTitle = "Season Top 10 Athletes (Net Goals)";
                }

                return (
                  <div key={team.name} className={`bg-white rounded-[3rem] border transition-all duration-500 overflow-hidden ${isExpanded ? 'xl:col-span-3 lg:col-span-2 border-indigo-100 shadow-2xl scale-[1.01] z-10' : 'border-slate-100 shadow-sm hover:border-indigo-200'}`}>
                    <div className={`p-10 ${isExpanded ? 'flex flex-col xl:flex-row gap-12' : ''}`}>
                      <div className={isExpanded ? 'xl:w-1/3' : 'w-full'}>
                        <div className="flex items-center justify-between mb-8">
                          <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest">RANK #{idx + 1}</span>
                          <div onClick={() => { if(isExpanded) setTeamSubView('season'); }} className={`px-4 py-2 rounded-full text-[9px] font-black uppercase tracking-wider border flex items-center gap-1.5 cursor-pointer transition-all ${teamSubView === 'season' && isExpanded ? 'bg-indigo-600 text-white border-indigo-600 shadow-md' : 'bg-indigo-50 text-indigo-600 border-indigo-100'}`}>
                            <Medal size={12} /> {team.top10Actual} SEASON NET
                          </div>
                        </div>

                        <h3 className="text-3xl font-black text-slate-900 leading-tight mb-2">{team.name}</h3>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-10">{team.players.length} SQUAD MEMBERS</p>

                        <div className="bg-indigo-50/30 rounded-[2.5rem] border border-indigo-100/50 p-8 mb-8 group cursor-pointer" onClick={() => { setExpandedTeamId(isExpanded ? null : team.name); setTeamSubView('season'); }}>
                          <div className="flex justify-between items-end mb-4">
                            <div>
                              <p className="text-[10px] font-black text-indigo-400 uppercase tracking-widest mb-1">Squad Net Yield</p>
                              <div className="flex items-baseline gap-2">
                                 <span className="text-4xl font-black text-indigo-600">{team.top10Actual}</span>
                                 <span className="text-xs font-black text-indigo-400 uppercase">PTS</span>
                              </div>
                            </div>
                          </div>
                          <TeamSparkline data={team.weeklyPointsTrend} forecast={team.top10Forecast} />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                          <div onClick={() => { if(isExpanded) setTeamSubView('actual'); else { setExpandedTeamId(team.name); setTeamSubView('actual'); } }} className={`cursor-pointer border-[3px] rounded-[2rem] p-6 text-center transition-all hover:scale-105 ${teamSubView === 'actual' && isExpanded ? 'bg-emerald-600 border-emerald-400 text-white shadow-xl shadow-emerald-100' : 'bg-emerald-50 border-emerald-100 shadow-sm shadow-emerald-50'}`}>
                            <p className={`text-[9px] font-black uppercase tracking-widest mb-2 ${teamSubView === 'actual' && isExpanded ? 'text-emerald-100' : 'text-emerald-600'}`}>W{currentWeek} Net Yield</p>
                            <span className="text-2xl font-black">{teamSubView === 'actual' && isExpanded ? (team.allPlayersLatest > 0 ? `+${team.allPlayersLatest}` : team.allPlayersLatest) : (team.top10Latest > 0 ? `+${team.top10Latest}` : team.top10Latest)}</span>
                          </div>
                          <div onClick={() => { if(isExpanded) setTeamSubView('forecast'); else { setExpandedTeamId(team.name); setTeamSubView('forecast'); } }} className={`cursor-pointer border-[3px] rounded-[2rem] p-6 text-center transition-all hover:scale-105 ${teamSubView === 'forecast' && isExpanded ? 'bg-indigo-600 border-indigo-400 text-white shadow-xl shadow-indigo-100' : 'bg-indigo-50/50 border-indigo-100 shadow-sm shadow-indigo-50'}`}>
                            <p className={`text-[9px] font-black uppercase tracking-widest mb-2 ${teamSubView === 'forecast' && isExpanded ? 'text-indigo-100' : 'text-indigo-600'}`}>W{currentWeek + 1} Potential</p>
                            <span className="text-2xl font-black">+{team.top10Forecast}</span>
                          </div>
                        </div>
                      </div>

                      {isExpanded && (
                        <div className="flex-1 mt-8 xl:mt-0 animate-in fade-in slide-in-from-right-8 duration-500">
                          <div className="border-t xl:border-t-0 xl:border-l border-slate-100 pt-8 xl:pt-0 xl:pl-12">
                            <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-8">{viewTitle}</h4>
                            <div className="overflow-x-auto">
                              <table className="w-full">
                                <thead>
                                  <tr className="border-b border-slate-100">
                                    <th className="text-left py-3 text-[9px] font-black text-slate-400 uppercase tracking-widest">Athlete</th>
                                    <th className="text-right py-3 text-[9px] font-black text-slate-400 uppercase tracking-widest">Actual (W{currentWeek})</th>
                                    <th className="text-right py-3 text-[9px] font-black text-slate-400 uppercase tracking-widest">Forecast (W{currentWeek+1})</th>
                                    <th className="text-right py-3 text-[9px] font-black text-slate-400 uppercase tracking-widest">Season</th>
                                  </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-50">
                                  {playersToShow.map(p => {
                                    const currentWeekEntry = p.weights[currentWeek - 1];
                                    return (
                                      <tr key={p.id} className="hover:bg-slate-50/50 transition-colors group">
                                        <td className="py-4">
                                          <div className="flex items-center gap-3">
                                            <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-[10px] font-black ${p.stats.latestWeekPoints > 0 ? 'bg-emerald-50 text-emerald-600' : p.stats.latestWeekPoints < 0 ? 'bg-rose-50 text-rose-600' : 'bg-slate-100 text-slate-500'}`}>{p.name.charAt(0)}</div>
                                            <span className="text-xs font-bold text-slate-700">{p.name}</span>
                                          </div>
                                        </td>
                                        <td className="py-4 text-right">
                                          <div className="flex flex-col items-end">
                                            <span className={`text-xs font-black ${p.stats.latestWeekPoints > 0 ? 'text-emerald-600' : p.stats.latestWeekPoints < 0 ? 'text-rose-500' : 'text-slate-300'}`}>
                                              {p.stats.latestWeekPoints > 0 ? `+${p.stats.latestWeekPoints}` : p.stats.latestWeekPoints}
                                            </span>
                                            {currentWeekEntry?.pointBreakdown && (
                                              <span className="text-[8px] font-black text-slate-300 uppercase tracking-tighter leading-none mt-1">
                                                {currentWeekEntry.pointBreakdown}
                                              </span>
                                            )}
                                          </div>
                                        </td>
                                        <td className="py-4 text-right">
                                          <div className="flex flex-col items-end">
                                            <span className={`text-xs font-black ${p.stats.forecastPoints > 0 ? 'text-indigo-500' : 'text-slate-300'}`}>+{p.stats.forecastPoints}</span>
                                            {p.stats.forecastReasons.length > 0 && (
                                              <span className="text-[8px] font-black text-slate-300 uppercase tracking-tighter leading-none mt-1">
                                                {p.stats.forecastReasons[0].split(':')[0]}
                                              </span>
                                            )}
                                          </div>
                                        </td>
                                        <td className="py-4 text-right"><span className="text-xs font-black text-slate-900">{p.stats.actualPoints}</span></td>
                                      </tr>
                                    );
                                  })}
                                </tbody>
                              </table>
                            </div>
                          </div>
                          
                          {/* Team Adjustments Table */}
                          <div className="border-t border-slate-100 pt-8">
                            <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-6">Manual Adjustments</h4>
                            {(() => {
                              const currentWeekAdjustments = getTeamAdjustments(teamAdjustments, team.name, currentWeek);
                              const adjustmentTotal = getTeamAdjustmentTotal(teamAdjustments, team.name, currentWeek);
                              
                              if (currentWeekAdjustments.length === 0) {
                                return (
                                  <div className="text-center py-8 bg-slate-50 rounded-xl">
                                    <p className="text-xs font-black text-slate-400 uppercase tracking-widest">No Manual Adjustments for Week {currentWeek}</p>
                                  </div>
                                );
                              }
                              
                              return (
                                <div className="space-y-4">
                                  <div className="bg-emerald-50 border border-emerald-100 rounded-xl p-4">
                                    <div className="flex justify-between items-center">
                                      <span className="text-xs font-black text-emerald-700 uppercase tracking-widest">Week {currentWeek} Total Adjustment</span>
                                      <span className={`text-lg font-black ${adjustmentTotal >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                                        {adjustmentTotal >= 0 ? '+' : ''}{adjustmentTotal}
                                      </span>
                                    </div>
                                  </div>
                                  <div className="overflow-x-auto">
                                    <table className="w-full">
                                      <thead>
                                        <tr className="border-b border-slate-100">
                                          <th className="text-left py-3 text-[9px] font-black text-slate-400 uppercase tracking-widest">Week</th>
                                          <th className="text-left py-3 text-[9px] font-black text-slate-400 uppercase tracking-widest">Goals</th>
                                          <th className="text-left py-3 text-[9px] font-black text-slate-400 uppercase tracking-widest">Remarks</th>
                                        </tr>
                                      </thead>
                                      <tbody className="divide-y divide-slate-50">
                                        {currentWeekAdjustments.map((adj, idx) => (
                                          <tr key={idx} className="hover:bg-slate-50/50 transition-colors">
                                            <td className="py-3">
                                              <span className="text-xs font-black text-slate-700">{adj.weekNumber}</span>
                                            </td>
                                            <td className="py-3">
                                              <span className={`text-xs font-black ${adj.goals >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                                                {adj.goals >= 0 ? '+' : ''}{adj.goals}
                                              </span>
                                            </td>
                                            <td className="py-3">
                                              <span className="text-xs font-black text-slate-600">{adj.remarks}</span>
                                            </td>
                                          </tr>
                                        ))}
                                      </tbody>
                                    </table>
                                  </div>
                                </div>
                              );
                            })()}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ) : (
          <section className="space-y-12 animate-in fade-in duration-500">
             <section className="animate-in fade-in duration-700 slide-in-from-bottom-4">
               <div className="flex items-center gap-3 mb-6 px-2">
                  <div className="w-10 h-10 bg-indigo-100 text-indigo-600 rounded-xl flex items-center justify-center"><Dna size={20} /></div>
                  <div>
                     <h2 className="text-xl font-black text-slate-900 tracking-tight">Top 5 Individual Weight Loss</h2>
                     <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest mt-0.5">Absolute KG Reduction</p>
                  </div>
               </div>
               <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                  {topWeightLossIndividuals.map((p, i) => (
                    <div key={p.id} className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm relative group hover:border-indigo-200 transition-all">
                       <span className="text-[9px] font-black text-slate-300 uppercase tracking-widest">RANK #{i+1}</span>
                       <h4 className="text-sm font-black text-slate-900 mt-1 truncate">{p.name}</h4>
                       <p className="text-[8px] font-black text-slate-400 uppercase mb-3 truncate">{p.team}</p>
                       <div className="flex items-baseline gap-1">
                          <span className="text-3xl font-black text-indigo-600">{p.stats.weightLossKg.toFixed(1)}</span>
                          <span className="text-[10px] font-black text-slate-300 uppercase">KG</span>
                       </div>
                    </div>
                  ))}
               </div>
            </section>

            <div className="space-y-4">
              {filteredPlayers.map((player) => {
                const isExpanded = expandedPlayerId === player.id;
                const stats = player.stats;
                const nextHatCount = 3 - (stats.newLowCount % 3);

                return (
                  <div key={player.id} className={`bg-white rounded-[2.5rem] border transition-all duration-300 ${isExpanded ? 'border-indigo-100 shadow-xl' : 'border-slate-100 shadow-sm hover:border-slate-200'}`}>
                    <div className="px-8 py-6 flex flex-wrap items-center gap-6 cursor-pointer" onClick={() => setExpandedPlayerId(isExpanded ? null : player.id)}>
                      <div className="flex items-center gap-4 flex-1 min-w-[280px]">
                         <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-xl font-black shrink-0 transition-colors ${isExpanded ? 'bg-indigo-600 text-white shadow-lg' : 'bg-slate-100 text-slate-400'}`}>{player.name.charAt(0)}</div>
                         <div>
                           <h4 className="text-lg font-black text-slate-900 leading-tight truncate">{player.name}</h4>
                           <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mt-1">{player.team}</p>
                         </div>
                      </div>

                      <div className="flex items-center gap-6 md:gap-10 px-4 shrink-0">
                         <div className="flex flex-col items-center">
                            <p className="text-[8px] font-black text-slate-300 uppercase tracking-widest mb-1">Start</p>
                            <span className="text-xs font-black text-slate-400">{stats.startWeight?.toFixed(1) || '--'}</span>
                         </div>
                         <div className="flex flex-col items-center">
                            <p className="text-[8px] font-black text-emerald-300 uppercase tracking-widest mb-1">Low</p>
                            <span className="text-xs font-black text-emerald-600">{stats.allTimeLow?.toFixed(1) || '--'}</span>
                         </div>
                         <div className="flex flex-col items-center border-l border-slate-100 pl-6 md:pl-10">
                            <p className="text-[8px] font-black text-indigo-300 uppercase tracking-widest mb-1">Now</p>
                            <span className="text-xl font-black text-indigo-600">{stats.currentWeight?.toFixed(1) || '--'}</span>
                         </div>
                      </div>

                      <div className="flex items-center gap-6 md:gap-10 px-4 border-l border-slate-100 shrink-0">
                         <div className="flex flex-col items-center">
                            <p className="text-[8px] font-black text-emerald-400 uppercase tracking-widest mb-1">W{currentWeek} Yield</p>
                            <span className={`text-xl font-black ${stats.latestWeekPoints > 0 ? 'text-emerald-600' : stats.latestWeekPoints < 0 ? 'text-rose-500' : 'text-slate-300'}`}>
                               {stats.latestWeekPoints > 0 ? `+${stats.latestWeekPoints}` : stats.latestWeekPoints}
                            </span>
                         </div>
                         <div className="flex flex-col items-center">
                            <p className="text-[8px] font-black text-indigo-400 uppercase tracking-widest mb-1">Potential</p>
                            <span className={`text-xl font-black ${stats.forecastPoints > 0 ? 'text-indigo-500' : 'text-slate-300'}`}>
                               +{stats.forecastPoints}
                            </span>
                         </div>
                      </div>

                      <div className="hidden xl:flex flex-col gap-1 w-48 shrink-0 border-l border-slate-100 pl-6">
                        <div className="bg-slate-100 h-2 rounded-full overflow-hidden">
                           <div className="h-full bg-indigo-500 rounded-full transition-all duration-500" style={{ width: `${((3 - nextHatCount) / 3) * 100}%` }} />
                        </div>
                        <div className="flex justify-between items-center text-[9px] font-black text-slate-300 uppercase">
                           <span>Hat-trick Track</span>
                           <span className="text-slate-600">{3 - nextHatCount}/3 Left</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-3 shrink-0 ml-auto">
                        <div className="text-slate-300 ml-2">{isExpanded ? <ChevronUp size={24} /> : <ChevronDown size={24} />}</div>
                      </div>
                    </div>

                    {isExpanded && (
                      <div className="border-t border-slate-100 px-8 pb-10 pt-8 animate-in slide-in-from-top-4 duration-500">
                        <div className="flex items-center justify-between mb-8">
                           <div className="flex items-center gap-3 text-slate-400">
                              <Clock size={18} />
                              <h5 className="text-[11px] font-black uppercase tracking-[0.2em]">Full Yield History</h5>
                           </div>
                           <button onClick={() => handleDeletePlayer(player.id, player.name)} className="px-5 py-2.5 bg-rose-50 text-rose-500 hover:bg-rose-500 hover:text-white rounded-2xl text-[10px] font-black uppercase tracking-[0.1em] flex items-center gap-2 transition-all">
                              <UserMinus size={14} /> Remove Athlete
                           </button>
                        </div>

                        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8 gap-4 mb-12">
                          {player.weights.map((w, wIdx) => {
                            const isPastOrCurrent = wIdx < currentWeek;
                            const hasValue = w.weight !== null && w.weight > 0;
                            const isEditing = editingWeight?.playerId === player.id && editingWeight?.week === w.week;
                            return (
                              <div key={wIdx} className={`p-4 rounded-3xl border-2 transition-all group/cell relative ${hasValue ? 'bg-white border-slate-100 shadow-sm' : 'bg-slate-50 border-dashed border-slate-200 opacity-60'} ${!isPastOrCurrent ? 'opacity-30 grayscale pointer-events-none' : ''}`}>
                                <div className="text-[9px] font-black text-slate-300 uppercase tracking-widest mb-2">W{w.week} - {w.date}</div>
                                {isEditing ? (
                                  <div className="flex flex-col gap-2">
                                    <input autoFocus type="number" step="0.1" value={editingWeight.value} onChange={(e) => setEditingWeight({ ...editingWeight, value: e.target.value })} className="w-full text-lg font-black text-indigo-600 border-b-2 border-indigo-600 outline-none p-1 bg-transparent" />
                                    <div className="flex gap-1 justify-end">
                                      <button onClick={() => setEditingWeight(null)} className="p-1 text-rose-500 rounded"><X size={14} /></button>
                                      <button onClick={() => handleWeightSave(player.id, wIdx, editingWeight.value)} className="p-1 text-emerald-600 rounded"><Save size={14} /></button>
                                    </div>
                                  </div>
                                ) : (
                                  <div className="flex items-baseline justify-between">
                                     <div className="text-xl font-black text-slate-900">{hasValue ? w.weight?.toFixed(1) : '--'}</div>
                                     <button onClick={() => setEditingWeight({ playerId: player.id, week: w.week, value: w.weight?.toString() || '' })} className="opacity-0 group-hover/cell:opacity-100 p-1 text-slate-400 hover:text-indigo-600 transition-all"><Edit2 size={12} /></button>
                                  </div>
                                )}
                                {hasValue && (
                                  <div className={`mt-2 text-[9px] font-black px-2 py-1 rounded-lg flex items-center gap-1 w-fit ${w.pointsEarned > 0 ? 'bg-emerald-50 text-emerald-600' : w.pointsEarned < 0 ? 'bg-rose-50 text-rose-600' : 'bg-slate-100 text-slate-400'}`}>
                                     <Zap size={10} /> {w.pointsEarned > 0 ? `+${w.pointsEarned}` : w.pointsEarned} Yield
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                           <div className={`p-6 rounded-[2rem] border-2 shadow-sm flex flex-col justify-between ${stats.isPenalized ? 'bg-rose-50/50 border-rose-100' : 'bg-slate-50 border-slate-100'}`}>
                              <h6 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mb-4">Engine v2.0 Status</h6>
                              <div className="mt-auto">
                                 <span className="text-[10px] font-black text-slate-400 uppercase block mb-1">Weekly Net Yield</span>
                                 <span className={`text-2xl font-black ${stats.latestWeekPoints > 0 ? 'text-emerald-600' : stats.latestWeekPoints < 0 ? 'text-rose-600' : 'text-slate-400'}`}>
                                    {stats.latestWeekPoints > 0 ? `+${stats.latestWeekPoints}` : stats.latestWeekPoints} Net Goals
                                 </span>
                              </div>
                           </div>

                           <div className="p-6 rounded-[2rem] bg-emerald-50/50 border-2 border-emerald-100 shadow-sm">
                              <h6 className="text-[10px] font-black text-emerald-600 uppercase tracking-[0.2em] mb-4">Target Forecast</h6>
                              <div className="space-y-2">
                                 {stats.forecastReasons.map((reason, ridx) => (
                                   <div key={ridx} className="bg-white px-3 py-2 rounded-xl border border-emerald-100 flex items-center gap-2">
                                     <Sparkles size={14} className="text-emerald-500" />
                                     <span className="text-[10px] font-black text-emerald-800">{reason}</span>
                                   </div>
                                 ))}
                              </div>
                           </div>

                           <div className="p-6 rounded-[2rem] bg-slate-50 border-2 border-slate-100 shadow-sm">
                              <h6 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-4">Unlocked Brackets</h6>
                              <div className="flex flex-wrap gap-2">
                                 {stats.milestonesReached.length > 0 ? stats.milestonesReached.map(m => (
                                   <span key={m} className="px-3 py-1.5 bg-indigo-600 text-white rounded-xl text-[9px] font-black uppercase tracking-wider">{m} Loss</span>
                                 )) : <p className="text-[10px] font-black text-slate-300 italic">No milestones yet.</p>}
                              </div>
                           </div>

                           <div className="p-6 rounded-[2rem] bg-slate-50 border-2 border-slate-100 shadow-sm space-y-3">
                              <h6 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-2">Metrics</h6>
                              <div className="flex justify-between items-center text-[11px] font-black">
                                 <span className="text-slate-400 uppercase">Start WT</span>
                                 <span className="text-slate-900">{stats.startWeight?.toFixed(1)}kg</span>
                              </div>
                              <div className="flex justify-between items-center text-[11px] font-black">
                                 <span className="text-slate-400 uppercase">Season Low</span>
                                 <span className="text-emerald-600">{stats.allTimeLow?.toFixed(1)}kg</span>
                              </div>
                              <div className="flex justify-between items-center text-[11px] font-black">
                                 <span className="text-slate-400 uppercase">Successes</span>
                                 <span className="text-indigo-600">{stats.newLowCount}</span>
                              </div>
                           </div>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </section>
        )}
        
        {/* Withdrawn Players Section - Always visible */}
        {withdrawnPlayers.length > 0 && (
          <section className="animate-in fade-in duration-700 slide-in-from-bottom-4">
             <div className="flex items-center gap-3 mb-6 px-2">
                <div className="w-10 h-10 bg-rose-100 text-rose-600 rounded-xl flex items-center justify-center"><UserMinus size={20} /></div>
                <div>
                   <h2 className="text-xl font-black text-slate-900 tracking-tight">Withdrawn Players</h2>
                   <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest mt-0.5">Historical Records</p>
                </div>
             </div>
             
             <div className="space-y-4">
               {withdrawnPlayers.map((player) => {
                 const isExpanded = expandedPlayerId === `withdrawn-${player.id}`;
                 const stats = player.stats;

                 return (
                   <div key={`withdrawn-${player.id}`} className={`bg-white rounded-[2.5rem] border transition-all duration-300 opacity-75 ${isExpanded ? 'border-rose-100 shadow-xl' : 'border-slate-100 shadow-sm hover:border-slate-200'}`}>
                     <div className="px-8 py-6 flex flex-wrap items-center gap-6 cursor-pointer" onClick={() => setExpandedPlayerId(isExpanded ? null : `withdrawn-${player.id}`)}>
                       <div className="flex items-center gap-4 flex-1 min-w-[280px]">
                          <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-xl font-black shrink-0 transition-colors ${isExpanded ? 'bg-rose-600 text-white shadow-lg' : 'bg-rose-100 text-rose-600'}`}>{player.name.charAt(0)}</div>
                          <div>
                            <h4 className="text-lg font-black text-slate-900 leading-tight truncate line-through">{player.name}</h4>
                            <p className="text-[10px] font-black text-rose-400 uppercase tracking-[0.2em] mt-1">{player.team} • Withdrawn</p>
                          </div>
                       </div>

                       <div className="flex items-center gap-6 md:gap-10 px-4 shrink-0">
                          <div className="flex flex-col items-center">
                             <p className="text-[8px] font-black text-slate-300 uppercase tracking-widest mb-1">Start</p>
                             <span className="text-xs font-black text-slate-400">{stats.startWeight?.toFixed(1) || '--'}</span>
                          </div>
                          <div className="flex flex-col items-center">
                             <p className="text-[8px] font-black text-emerald-300 uppercase tracking-widest mb-1">Low</p>
                             <span className="text-xs font-black text-emerald-600">{stats.allTimeLow?.toFixed(1) || '--'}</span>
                          </div>
                          <div className="flex flex-col items-center border-l border-slate-100 pl-6 md:pl-10">
                             <p className="text-[8px] font-black text-indigo-300 uppercase tracking-widest mb-1">Final</p>
                             <span className="text-xl font-black text-indigo-600">{stats.currentWeight?.toFixed(1) || '--'}</span>
                          </div>
                       </div>

                       <div className="flex items-center gap-6 md:gap-10 px-4 border-l border-slate-100 shrink-0">
                          <div className="flex flex-col items-center">
                             <p className="text-[8px] font-black text-emerald-400 uppercase tracking-widest mb-1">Total Yield</p>
                             <span className="text-xl font-black text-emerald-600">
                                {stats.actualPoints > 0 ? `+${stats.actualPoints}` : stats.actualPoints}
                             </span>
                          </div>
                          <div className="flex flex-col items-center">
                             <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1">Weight Loss</p>
                             <span className="text-xl font-black text-slate-600">{stats.weightLossKg.toFixed(1)}kg</span>
                          </div>
                       </div>
                     </div>

                     {isExpanded && (
                       <div className="border-t border-slate-100 px-8 py-6 animate-in fade-in slide-in-from-top-4 duration-300">
                         <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="p-6 rounded-[2rem] bg-slate-50 border-2 border-slate-100 shadow-sm space-y-3">
                               <h6 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-2">Career Summary</h6>
                               <div className="space-y-2">
                                 <div className="flex justify-between items-center text-[11px] font-black">
                                    <span className="text-slate-400 uppercase">Success Count</span>
                                    <span className="text-slate-700">{stats.newLowCount} New Lows</span>
                                 </div>
                                 <div className="flex justify-between items-center text-[11px] font-black">
                                    <span className="text-slate-400 uppercase">Weight Loss</span>
                                    <span className="text-emerald-600">{stats.weightLossKg.toFixed(1)}kg ({stats.weightLossPercent.toFixed(1)}%)</span>
                                 </div>
                                 <div className="flex justify-between items-center text-[11px] font-black">
                                    <span className="text-slate-400 uppercase">Total Points</span>
                                    <span className="text-indigo-600">{stats.actualPoints} Goals</span>
                                 </div>
                               </div>
                            </div>

                            <div className="p-6 rounded-[2rem] bg-slate-50 border-2 border-slate-100 shadow-sm">
                               <h6 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-4">Milestones Achieved</h6>
                               <div className="flex flex-wrap gap-2">
                                 {stats.milestonesReached.length > 0 ? stats.milestonesReached.map(m => (
                                   <span key={m} className="px-3 py-1.5 bg-indigo-600 text-white rounded-xl text-[9px] font-black uppercase tracking-wider">{m}</span>
                                 )) : <p className="text-[10px] font-black text-slate-300 italic">No milestones achieved.</p>}
                               </div>
                            </div>
                         </div>
                       </div>
                     )}
                   </div>
                 );
               })}
             </div>
          </section>
        )}
      </main>
    </div>
  );
};

export default App;
