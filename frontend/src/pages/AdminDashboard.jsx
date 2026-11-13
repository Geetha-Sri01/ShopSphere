import React, { useState, useEffect } from 'react';
import { 
  Activity, Database, Radio, Server, RefreshCw, ShoppingCart, 
  Package, DollarSign, CheckCircle2, AlertCircle, Clock, Copy, 
  Terminal, ShieldCheck, ChevronRight, Layers, FileText
} from 'lucide-react';
import { fetchAdminStats, triggerResetData } from '../api/api';

export default function AdminDashboard({ onReturnToStore }) {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [resetting, setResetting] = useState(false);
  const [activeTab, setActiveTab] = useState('overview'); // overview, kafka, orders, inventory, aivenGuide
  const [copiedEnv, setCopiedEnv] = useState(false);
  const [notification, setNotification] = useState(null);

  const loadStats = async (isManual = false) => {
    if (isManual) setRefreshing(true);
    try {
      const data = await fetchAdminStats();
      setStats(data);
    } catch (err) {
      console.error('Failed to load admin stats:', err);
    } finally {
      setLoading(false);
      if (isManual) setRefreshing(false);
    }
  };

  useEffect(() => {
    loadStats();
    // Auto-poll telemetry logs every 5 seconds
    const interval = setInterval(() => {
      loadStats();
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  const handleResetData = async () => {
    if (!window.confirm('Are you sure you want to reset all demo stock back to original quantities and refresh telemetry?')) {
      return;
    }
    setResetting(true);
    try {
      const res = await triggerResetData();
      setNotification(res.message || 'Demo data successfully reset!');
      setTimeout(() => setNotification(null), 4000);
      await loadStats();
    } catch (err) {
      alert('Failed to reset data: ' + err.message);
    } finally {
      setResetting(false);
    }
  };

  const copyEnvSnippet = () => {
    const snippet = `# Aiven Cloud Credentials Configuration
DATABASE_URL=postgres://avnadmin:YOUR_PASSWORD@your-pg-service.aivencloud.com:18826/defaultdb?sslmode=require
KAFKA_BROKERS=your-kafka-service.aivencloud.com:18828
KAFKA_CA_CERT_PATH=./certs/ca.pem
KAFKA_ACCESS_CERT_PATH=./certs/service.cert
KAFKA_ACCESS_KEY_PATH=./certs/service.key
OPENSEARCH_NODE=https://avnadmin:YOUR_PASSWORD@your-opensearch-service.aivencloud.com:18830`;
    navigator.clipboard.writeText(snippet);
    setCopiedEnv(true);
    setTimeout(() => setCopiedEnv(false), 2500);
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-24 flex flex-col items-center justify-center space-y-4">
        <Activity className="w-10 h-10 text-indigo-600 animate-spin" />
        <p className="text-sm font-semibold text-slate-600">Loading Aiven Telemetry & Services...</p>
      </div>
    );
  }

  const { metrics, services, recentOrders = [], kafkaEventLogs = [] } = stats || {};

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      
      {/* Dashboard Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between pb-6 border-b border-slate-200 gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
              Aiven Architecture & Demo Telemetry
            </h1>
            <span className="text-xs font-bold bg-indigo-100 text-indigo-800 px-2.5 py-0.5 rounded-full border border-indigo-200">
              Live Monitor
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Real-time health, row-locking transactions, Kafka consumer events, and OpenSearch index sync.
          </p>
        </div>

        {/* Action Controls */}
        <div className="flex items-center space-x-3">
          <button
            onClick={() => loadStats(true)}
            disabled={refreshing}
            className="flex items-center space-x-1.5 px-3.5 py-2 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 rounded-xl text-xs font-bold transition-all shadow-2xs"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin text-indigo-600' : ''}`} />
            <span>Refresh</span>
          </button>

          <button
            onClick={handleResetData}
            disabled={resetting}
            className="flex items-center space-x-1.5 px-3.5 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-xl text-xs font-bold transition-all shadow-2xs"
          >
            <span>{resetting ? 'Resetting...' : 'Reset Demo Stock'}</span>
          </button>

          <button
            onClick={onReturnToStore}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-sm transition-all"
          >
            Back to Store
          </button>
        </div>
      </div>

      {/* Notification Toast */}
      {notification && (
        <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 text-xs font-bold flex items-center space-x-2 animate-fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          <span>{notification}</span>
        </div>
      )}

      {/* Real Aiven Service Status Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        
        {/* 1. Aiven PostgreSQL */}
        <div className={`p-5 rounded-2xl border transition-all ${
          services?.postgresql?.connected
            ? 'bg-white border-emerald-200 shadow-sm'
            : 'bg-white border-amber-200 shadow-sm'
        }`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2.5">
              <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${
                services?.postgresql?.connected ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-50 text-amber-600'
              }`}>
                <Database className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-sm font-black text-slate-900">Aiven PostgreSQL</h4>
                <div className="text-[11px] text-slate-500">ACID Relational Storage</div>
              </div>
            </div>
            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${
              services?.postgresql?.connected
                ? 'bg-emerald-100 text-emerald-800'
                : 'bg-amber-100 text-amber-800'
            }`}>
              {services?.postgresql?.connected ? 'Connected' : 'Fallback Mode'}
            </span>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100 text-xs space-y-1">
            {services?.postgresql?.connected ? (
              <>
                <div className="flex justify-between text-slate-600">
                  <span>Latency:</span>
                  <span className="font-bold text-slate-900">{services.postgresql.latencyMs} ms</span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>Database:</span>
                  <span className="font-mono text-[11px] text-slate-800">{services.postgresql.database}</span>
                </div>
              </>
            ) : (
              <p className="text-[11px] text-slate-500 leading-snug">
                {services?.postgresql?.error || 'Awaiting DATABASE_URL in .env. Local transactional fallback active.'}
              </p>
            )}
          </div>
        </div>

        {/* 2. Aiven Apache Kafka */}
        <div className={`p-5 rounded-2xl border transition-all ${
          services?.kafka?.connected
            ? 'bg-white border-purple-200 shadow-sm'
            : 'bg-white border-indigo-200 shadow-sm'
        }`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2.5">
              <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${
                services?.kafka?.connected ? 'bg-purple-50 text-purple-600' : 'bg-indigo-50 text-indigo-600'
              }`}>
                <Radio className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-sm font-black text-slate-900">Aiven Apache Kafka</h4>
                <div className="text-[11px] text-slate-500">Event Stream Backbone</div>
              </div>
            </div>
            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${
              services?.kafka?.connected
                ? 'bg-purple-100 text-purple-800'
                : 'bg-indigo-100 text-indigo-800'
            }`}>
              {services?.kafka?.connected ? 'Broker Active' : 'Simulated Stream'}
            </span>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100 text-xs space-y-1">
            {services?.kafka?.connected ? (
              <>
                <div className="flex justify-between text-slate-600">
                  <span>Latency:</span>
                  <span className="font-bold text-slate-900">{services.kafka.latencyMs} ms</span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>Topic:</span>
                  <span className="font-mono text-[11px] text-slate-800 font-bold">{services.kafka.topic}</span>
                </div>
                {services.kafka.clusterId && (
                  <div className="flex justify-between text-slate-600">
                    <span>Cluster ID:</span>
                    <span className="font-mono text-[11px] text-slate-800">{services.kafka.clusterId.slice(0, 12)}...</span>
                  </div>
                )}
                <div className="flex justify-between text-slate-600">
                  <span>Brokers:</span>
                  <span className="font-semibold text-slate-800">{services.kafka.brokersCount || 1} node(s) active</span>
                </div>
              </>
            ) : (
              <p className="text-[11px] text-slate-500 leading-snug">
                {services?.kafka?.error || 'Awaiting KAFKA_BROKERS in .env. Local simulated stream active.'}
              </p>
            )}
          </div>
        </div>

        {/* 3. Aiven OpenSearch */}
        <div className={`p-5 rounded-2xl border transition-all ${
          services?.opensearch?.connected
            ? 'bg-white border-emerald-200 shadow-sm'
            : 'bg-white border-blue-200 shadow-sm'
        }`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2.5">
              <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${
                services?.opensearch?.connected ? 'bg-emerald-50 text-emerald-600' : 'bg-blue-50 text-blue-600'
              }`}>
                <Server className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-sm font-black text-slate-900">Aiven OpenSearch</h4>
                <div className="text-[11px] text-slate-500">Typo & Fuzzy Search</div>
              </div>
            </div>
            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${
              services?.opensearch?.connected
                ? 'bg-emerald-100 text-emerald-800'
                : 'bg-blue-100 text-blue-800'
            }`}>
              {services?.opensearch?.connected ? `Cluster ${services.opensearch.status ? services.opensearch.status.toUpperCase() : 'ACTIVE'}` : 'Fuzzy Fallback'}
            </span>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100 text-xs space-y-1">
            {services?.opensearch?.connected ? (
              <>
                <div className="flex justify-between text-slate-600">
                  <span>Latency:</span>
                  <span className="font-bold text-slate-900">{services.opensearch.latencyMs} ms</span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>Index:</span>
                  <span className="font-mono text-[11px] text-slate-800 font-bold">{services.opensearch.indexName} ({services.opensearch.documentCount} docs)</span>
                </div>
                {services.opensearch.clusterName && (
                  <div className="flex justify-between text-slate-600">
                    <span>Cluster:</span>
                    <span className="font-mono text-[11px] text-slate-800">{services.opensearch.clusterName}</span>
                  </div>
                )}
                <div className="flex justify-between text-slate-600">
                  <span>Status:</span>
                  <span className="font-bold text-emerald-600 uppercase text-[10px]">{services.opensearch.status || 'GREEN'}</span>
                </div>
              </>
            ) : (
              <p className="text-[11px] text-slate-500 leading-snug">
                {services?.opensearch?.error || 'Awaiting OPENSEARCH_NODE in backend/.env. Local fuzzy fallback active.'}
              </p>
            )}
          </div>
        </div>

      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Total Products</span>
            <Package className="w-4 h-4 text-indigo-600" />
          </div>
          <div className="text-2xl font-black text-slate-900">{metrics?.totalProducts || 0}</div>
          <div className="text-[11px] text-slate-500 mt-1">Across 5 Indian retail categories</div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Orders Recorded</span>
            <ShoppingCart className="w-4 h-4 text-purple-600" />
          </div>
          <div className="text-2xl font-black text-slate-900">{metrics?.totalOrders || 0}</div>
          <div className="text-[11px] text-slate-500 mt-1">Processed with row-level locks</div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Available Stock</span>
            <Layers className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-black text-slate-900">{metrics?.availableStock || 0}</div>
          <div className="text-[11px] text-slate-500 mt-1">Units remaining in inventory</div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Total Revenue</span>
            <DollarSign className="w-4 h-4 text-amber-600" />
          </div>
          <div className="text-2xl font-black text-slate-900">
            ₹{(metrics?.totalRevenue || 0).toLocaleString('en-IN')}
          </div>
          <div className="text-[11px] text-slate-500 mt-1">Gross Indian Rupee turnover</div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="border-b border-slate-200 flex space-x-6 text-xs font-bold">
        {[
          { id: 'overview', label: 'Kafka Event Telemetry Stream', icon: Radio },
          { id: 'orders', label: `Recent Orders (${recentOrders.length})`, icon: ShoppingCart },
          { id: 'aivenGuide', label: 'Aiven Services Setup Guide', icon: FileText }
        ].map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`pb-3 flex items-center space-x-2 border-b-2 transition-all ${
                activeTab === tab.id
                  ? 'border-indigo-600 text-indigo-600'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Tab Content 1: Kafka Event Telemetry Stream */}
      {activeTab === 'overview' && (
        <div className="bg-slate-900 text-slate-100 rounded-3xl p-6 shadow-xl border border-slate-800 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <div className="flex items-center space-x-2">
              <Terminal className="w-5 h-5 text-purple-400" />
              <h3 className="text-sm font-mono font-bold text-white">
                Live Kafka Stream Feed (Topic: {services?.kafka?.topic || 'order_placed'})
              </h3>
            </div>
            <span className="text-[11px] text-slate-400 font-mono">
              Auto-polling every 5s • {kafkaEventLogs.length} events logged
            </span>
          </div>

          {kafkaEventLogs.length === 0 ? (
            <div className="py-12 text-center text-slate-500 font-mono text-xs">
              No Kafka events recorded yet. Place an order in the store to trigger an order_placed event!
            </div>
          ) : (
            <div className="divide-y divide-slate-800 font-mono text-xs max-h-96 overflow-y-auto pr-2 space-y-2">
              {kafkaEventLogs.map((log) => (
                <div key={log.id} className="pt-2.5 pb-2.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="flex items-center space-x-3">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                      log.type === 'PRODUCED'
                        ? 'bg-indigo-900/80 text-indigo-300 border border-indigo-700'
                        : log.type === 'CONSUMED'
                        ? 'bg-purple-900/80 text-purple-300 border border-purple-700'
                        : log.type === 'INVENTORY_UPDATED'
                        ? 'bg-emerald-900/80 text-emerald-300 border border-emerald-700'
                        : log.type === 'OPENSEARCH_SYNCED'
                        ? 'bg-blue-900/80 text-blue-300 border border-blue-700'
                        : 'bg-slate-800 text-slate-300'
                    }`}>
                      {log.type}
                    </span>

                    <span className="text-white font-bold">{log.orderId}</span>
                    <span className="text-slate-500 text-[11px]">
                      Part: {log.partition} • Off: {log.offset}
                    </span>
                  </div>

                  <div className="flex items-center space-x-4 text-[11px]">
                    <span className="text-emerald-400 font-semibold">{log.status}</span>
                    <span className="text-slate-500">{new Date(log.timestamp).toLocaleTimeString()}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Tab Content 2: Recent Orders Table */}
      {activeTab === 'orders' && (
        <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-xs">
          <div className="p-5 border-b border-slate-100 flex items-center justify-between">
            <h3 className="text-base font-bold text-slate-900">Recorded Customer Orders</h3>
            <span className="text-xs text-slate-500">Row-locked transactions in PostgreSQL</span>
          </div>

          {recentOrders.length === 0 ? (
            <div className="py-12 text-center text-slate-400 text-xs">
              No orders placed yet. Head over to the store and complete a checkout!
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-500 font-semibold uppercase tracking-wider border-b border-slate-200">
                  <tr>
                    <th className="py-3 px-4">Order ID</th>
                    <th className="py-3 px-4">Customer</th>
                    <th className="py-3 px-4">City</th>
                    <th className="py-3 px-4">Total Amount</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4">Kafka Status</th>
                    <th className="py-3 px-4">Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {recentOrders.map((ord) => (
                    <tr key={ord.id} className="hover:bg-slate-50 transition-colors">
                      <td className="py-3.5 px-4 font-mono font-bold text-indigo-700">{ord.id}</td>
                      <td className="py-3.5 px-4">
                        <div className="font-bold text-slate-900">{ord.customer_name}</div>
                        <div className="text-slate-400 text-[11px]">{ord.customer_email}</div>
                      </td>
                      <td className="py-3.5 px-4 text-slate-600">{ord.city || 'India'}</td>
                      <td className="py-3.5 px-4 font-bold text-slate-900">
                        ₹{Number(ord.total_amount).toLocaleString('en-IN')}
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="bg-emerald-50 text-emerald-700 font-bold px-2 py-0.5 rounded-full text-[10px]">
                          {ord.status || 'CONFIRMED'}
                        </span>
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="bg-purple-50 text-purple-700 font-bold px-2 py-0.5 rounded-full text-[10px]">
                          {ord.kafka_status || 'PROCESSED'}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-slate-400 text-[11px]">
                        {new Date(ord.created_at).toLocaleDateString()} {new Date(ord.created_at).toLocaleTimeString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Tab Content 3: Aiven Connection Guide */}
      {activeTab === 'aivenGuide' && (
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-xs space-y-6">
          <div className="flex items-center justify-between pb-4 border-b border-slate-100">
            <div>
              <h3 className="text-lg font-black text-slate-900">How to Connect Your Aiven Cloud Services</h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Zero code modifications required. Simply paste your Aiven credentials into <code className="bg-slate-100 px-1.5 py-0.5 rounded text-indigo-700">backend/.env</code>.
              </p>
            </div>
            <button
              onClick={copyEnvSnippet}
              className="flex items-center space-x-1.5 px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 rounded-xl text-xs font-bold transition-all"
            >
              <Copy className="w-3.5 h-3.5" />
              <span>{copiedEnv ? 'Copied!' : 'Copy Template'}</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-xs">
            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-2">
              <div className="flex items-center space-x-2 font-bold text-slate-800">
                <Database className="w-4 h-4 text-indigo-600" />
                <span>1. Aiven PostgreSQL</span>
              </div>
              <p className="text-slate-600 leading-relaxed">
                From Aiven Console &gt; PostgreSQL &gt; Overview, copy the <strong>Service URI</strong>. Set it as <code className="bg-white px-1 rounded text-indigo-700">DATABASE_URL</code>. Run <code className="bg-white px-1 rounded">npm run seed</code> to create schema & seed 16 products.
              </p>
            </div>

            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-2">
              <div className="flex items-center space-x-2 font-bold text-slate-800">
                <Radio className="w-4 h-4 text-purple-600" />
                <span>2. Aiven Apache Kafka</span>
              </div>
              <p className="text-slate-600 leading-relaxed">
                Copy <strong>Service URI</strong> to <code className="bg-white px-1 rounded text-purple-700">KAFKA_BROKERS</code>. Download <code className="bg-white px-1 rounded">ca.pem</code>, <code className="bg-white px-1 rounded">service.cert</code>, <code className="bg-white px-1 rounded">service.key</code> to <code className="bg-white px-1 rounded">backend/certs/</code>.
              </p>
            </div>

            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-2">
              <div className="flex items-center space-x-2 font-bold text-slate-800">
                <Server className="w-4 h-4 text-emerald-600" />
                <span>3. Aiven OpenSearch</span>
              </div>
              <p className="text-slate-600 leading-relaxed">
                Copy <strong>Service URI</strong> to <code className="bg-white px-1 rounded text-emerald-700">OPENSEARCH_NODE</code>. Run <code className="bg-white px-1 rounded">npm run sync-search</code> to create index with typo-tolerant ngram mapping.
              </p>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
