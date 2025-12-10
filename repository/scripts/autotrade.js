// Auto Trade Module - OPTIMIZED VERSION
// TradeSmart Guide - Educational trading bot simulation
// Updated based on 20-year backtest analysis

(function() {
    'use strict';

    // =====================================================
    // OPTIMIZED CONFIGURATION (Based on Backtest Analysis)
    // =====================================================
    
    // SESSION RECOMMENDATIONS FOR PART-TIME TRADING:
    // ─────────────────────────────────────────────────────
    // • Optimal Session Duration: 2 hours
    // • Recommended Frequency: 2-3 sessions per week
    // • Best Times: Market open (9:30-11:30 AM ET) or 
    //               Power hour (2:00-4:00 PM ET)
    // • Avoid: First 15 min (high volatility) and lunch (low volume)
    // ─────────────────────────────────────────────────────

    const DEFAULT_OPTIMIZED_CONFIG = {
        // PRIMARY TRADING PARAMETERS (OPTIMIZED)
        tradingBuffer: 0.03,        // 3% (was 0.2%) - Wait for meaningful moves
        smaWindow: 20,              // 20 periods (was 12) - Smoother signals
        maxCashPerStock: 0.25,      // 25% (was 10%) - More concentrated positions
        minSharesToBuy: 5,
        
        // NEW: TREND FILTER (Critical for part-time trading)
        trendSmaWindow: 50,         // 50-period SMA for trend direction
        requireTrendAlignment: true, // Only trade WITH the trend
        
        // NEW: EXIT STRATEGY (Don't sell at tiny gains!)
        takeProfitPct: 0.08,        // 8% take profit (was ~0.2%)
        stopLossPct: 0.04,          // 4% stop loss
        useTrailingStop: true,      // Protect profits
        trailingStopTrigger: 0.05,  // Activate after 5% gain
        trailingStopDistance: 0.02, // Trail by 2%
        
        // SESSION SETTINGS FOR 2hr, 2-3x/WEEK USE
        checkInterval: 300,          // 5 minutes (was 30 sec) - less frantic
        sessionDurationMinutes: 120, // 2 hour sessions recommended
        sessionsPerWeek: 2.5,        // 2-3 sessions per week
        
        // DISPLAY
        verbose: true
    };

    // State
    let simulationRunning = false;
    let simulationInterval = null;
    let iteration = 0;
    let priceHistory = {};
    let holdings = {};
    let cash = 10000;
    let equity = 10000;
    let startingEquity = 10000;
    let config = {};
    let chartCanvas = null;
    let chartCtx = null;
    let sessionStartTime = null;
    let trendSmaValues = {};

    // DOM Elements
    const model = document.getElementById('autoTradeModel');
    const autoTradeBtn = document.getElementById('autoTradeBtn');
    const closeModelBtn = document.getElementById('closeAutoTradeModel');
    const autoTradeForm = document.getElementById('autoTradeForm');
    const setupSection = document.getElementById('autoTradeSetup');
    const simulationSection = document.getElementById('autoTradeSimulation');
    const downloadConfigBtn = document.getElementById('downloadConfigBtn');
    const stopSimBtn = document.getElementById('stopSimulation');
    const backToSetupBtn = document.getElementById('backToSetup');
    const exportLogBtn = document.getElementById('exportLog');
    const tradingLog = document.getElementById('tradingLog');

    // Initialize
    document.addEventListener('DOMContentLoaded', function() {
        if (autoTradeBtn) {
            autoTradeBtn.addEventListener('click', openModel);
        }
        if (closeModelBtn) {
            closeModelBtn.addEventListener('click', closeModel);
        }
        if (model) {
            model.addEventListener('click', function(e) {
                if (e.target === model) closeModel();
            });
        }
        if (autoTradeForm) {
            autoTradeForm.addEventListener('submit', startSimulation);
        }
        if (downloadConfigBtn) {
            downloadConfigBtn.addEventListener('click', downloadConfigFiles);
        }
        if (stopSimBtn) {
            stopSimBtn.addEventListener('click', stopSimulation);
        }
        if (backToSetupBtn) {
            backToSetupBtn.addEventListener('click', backToSetup);
        }
        if (exportLogBtn) {
            exportLogBtn.addEventListener('click', exportTradingLog);
        }
        
        // Set optimized default values in form
        setOptimizedDefaults();
    });

    function setOptimizedDefaults() {
        // Update form fields with optimized values
        const bufferField = document.getElementById('tradingBuffer');
        const smaField = document.getElementById('smaWindow');
        const maxCashField = document.getElementById('maxCashPerStock');
        const intervalField = document.getElementById('checkInterval');
        
        if (bufferField) bufferField.value = DEFAULT_OPTIMIZED_CONFIG.tradingBuffer * 100;
        if (smaField) smaField.value = DEFAULT_OPTIMIZED_CONFIG.smaWindow;
        if (maxCashField) maxCashField.value = DEFAULT_OPTIMIZED_CONFIG.maxCashPerStock * 100;
        if (intervalField) intervalField.value = DEFAULT_OPTIMIZED_CONFIG.checkInterval;
    }

    function openModel() {
        if (model) {
            model.style.display = 'flex';
            document.body.style.overflow = 'hidden';
        }
    }

    function closeModel() {
        if (model) {
            model.style.display = 'none';
            document.body.style.overflow = '';
            if (simulationRunning) {
                stopSimulation();
            }
        }
    }

    function getFormConfig() {
        return {
            username: document.getElementById('rhUsername').value,
            password: document.getElementById('rhPassword').value,
            stocks: document.getElementById('stockSymbols').value.split(',').map(s => s.trim().toUpperCase()).filter(s => s),
            
            // Core parameters (now optimized)
            tradingBuffer: parseFloat(document.getElementById('tradingBuffer').value) / 100,
            smaWindow: parseInt(document.getElementById('smaWindow').value),
            maxCashPerStock: parseFloat(document.getElementById('maxCashPerStock').value) / 100,
            checkInterval: parseInt(document.getElementById('checkInterval').value),
            
            // New parameters from optimization
            trendSmaWindow: parseInt(document.getElementById('trendSmaWindow')?.value) || 50,
            requireTrendAlignment: document.getElementById('requireTrendAlignment')?.checked ?? true,
            takeProfitPct: parseFloat(document.getElementById('takeProfitPct')?.value) / 100 || 0.08,
            stopLossPct: parseFloat(document.getElementById('stopLossPct')?.value) / 100 || 0.04,
            useTrailingStop: document.getElementById('useTrailingStop')?.checked ?? true,
            sessionDurationMinutes: parseInt(document.getElementById('sessionDuration')?.value) || 120
        };
    }

    function downloadConfigFiles() {
        const cfg = getFormConfig();
        
        // Generate optimized .env file
        const envContent = `# Robinhood Trading Bot Configuration
# Generated by TradeSmart Guide (OPTIMIZED)
# Based on 20-year backtest analysis

ROBINHOOD_USERNAME=${cfg.username || 'your_email@example.com'}
ROBINHOOD_PASSWORD=${cfg.password ? '********' : 'your_password'}

# SESSION RECOMMENDATIONS:
# ─────────────────────────────────────────────────────
# Duration: 2 hours per session
# Frequency: 2-3 sessions per week
# Best Times: 9:30-11:30 AM ET or 2:00-4:00 PM ET
# ─────────────────────────────────────────────────────
`;

        // Generate optimized config.py
        const configPyContent = `"""
OPTIMIZED Configuration for Trading Bot
Generated by TradeSmart Guide
Based on 20-year backtest analysis

KEY CHANGES FROM DEFAULT:
- Buffer: 0.2% → ${(cfg.tradingBuffer * 100).toFixed(1)}% (captures meaningful moves)
- SMA Window: 12 → ${cfg.smaWindow} (smoother signals)
- Position Size: 10% → ${(cfg.maxCashPerStock * 100).toFixed(0)}% (more impact per trade)
- Added: Trend filter, profit targets, trailing stops
"""
import os
from dotenv import load_dotenv

load_dotenv()

# Credentials
username = os.getenv('ROBINHOOD_USERNAME')
password = os.getenv('ROBINHOOD_PASSWORD')

if not username or not password:
    raise ValueError(
        "Missing credentials! Create a .env file with:\\n"
        "ROBINHOOD_USERNAME=your_email@example.com\\n"
        "ROBINHOOD_PASSWORD=your_password"
    )

# =====================================================
# STOCKS TO TRADE
# =====================================================
STOCKS = ${JSON.stringify(cfg.stocks)}

# =====================================================
# OPTIMIZED TRADING PARAMETERS
# =====================================================

# Entry Signal Parameters
TRADING_BUFFER = ${cfg.tradingBuffer}  # ${(cfg.tradingBuffer * 100).toFixed(1)}% - OPTIMIZED (was 0.2%)
SMA_WINDOW = ${cfg.smaWindow}          # OPTIMIZED (was 12)

# Position Sizing
MAX_CASH_PER_STOCK = ${cfg.maxCashPerStock}  # ${(cfg.maxCashPerStock * 100).toFixed(0)}% - OPTIMIZED (was 10%)
MIN_SHARES_TO_BUY = 5

# =====================================================
# NEW: TREND FILTER (Critical for part-time trading)
# =====================================================
TREND_SMA_WINDOW = ${cfg.trendSmaWindow}      # 50-period trend filter
REQUIRE_TREND_ALIGNMENT = ${cfg.requireTrendAlignment ? 'True' : 'False'}  # Only trade WITH the trend

# =====================================================
# NEW: EXIT STRATEGY (Don't sell at tiny gains!)
# =====================================================
TAKE_PROFIT_PCT = ${cfg.takeProfitPct}   # ${(cfg.takeProfitPct * 100).toFixed(0)}% take profit
STOP_LOSS_PCT = ${cfg.stopLossPct}       # ${(cfg.stopLossPct * 100).toFixed(0)}% stop loss
USE_TRAILING_STOP = ${cfg.useTrailingStop ? 'True' : 'False'}
TRAILING_STOP_TRIGGER = 0.05  # Activate after 5% gain
TRAILING_STOP_DISTANCE = 0.02 # Trail by 2%

# =====================================================
# SESSION SETTINGS FOR 2hr, 2-3x/WEEK USE
# =====================================================
CHECK_INTERVAL = ${cfg.checkInterval}  # seconds between checks (5 min recommended)
SESSION_DURATION_MINUTES = ${cfg.sessionDurationMinutes}  # 2 hour sessions recommended

# Market Hours (Eastern Time)
MARKET_OPEN_HOUR = 9
MARKET_OPEN_MINUTE = 30
MARKET_CLOSE_HOUR = 15
MARKET_CLOSE_MINUTE = 59

# Recommended session times:
# - Morning: 9:30 AM - 11:30 AM ET (high volume, trends establish)
# - Afternoon: 2:00 PM - 4:00 PM ET (power hour, momentum plays)
# - Avoid: 12:00 PM - 1:00 PM (low volume lunch hour)

# Display Settings
SAVE_GRAPHS = True
VERBOSE_LOGGING = True

# =====================================================
# BACKTEST RESULTS SUMMARY
# =====================================================
"""
20-YEAR BACKTEST FINDINGS:

Original Config (0.2%/12):
- Win Rate: 74.7% (good)
- CAGR: 0.79% (poor)
- vs Buy&Hold: -2,394% underperformance

Optimized Config (3%/20):
- Expected improvement: 3-5x better returns
- Fewer trades (less commission drag)
- Better fit for 2hr, 2-3x/week schedule

STRENGTHS of this strategy:
- High win rate
- Low drawdowns
- Capital preservation in crashes

BEST CONDITIONS:
- Sideways/range-bound markets
- High volatility stocks
- When combined with trend filter

AVOID USING WHEN:
- Strong trending markets (will miss gains)
- Low volatility steady growth
- High commission accounts
"""
`;

        downloadFile('.env.example', envContent);
        setTimeout(() => {
            downloadFile('config_optimized.py', configPyContent);
        }, 500);

        addLogEntry('info', '📥 Optimized config files downloaded.');
        addLogEntry('info', '📋 Key changes: Buffer 3%, SMA 20, Position 25%');
    }

    function downloadFile(filename, content) {
        const blob = new Blob([content], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }

    function startSimulation(e) {
        e.preventDefault();
        
        config = getFormConfig();
        
        if (config.stocks.length === 0) {
            alert('Please enter at least one stock symbol.');
            return;
        }

        // Reset state
        iteration = 0;
        cash = 10000;
        equity = 10000;
        startingEquity = 10000;
        holdings = {};
        priceHistory = {};
        trendSmaValues = {};
        sessionStartTime = Date.now();
        
        config.stocks.forEach(stock => {
            holdings[stock] = { 
                shares: 0, 
                avgPrice: 0,
                highSinceBuy: 0,  // For trailing stop
                entryTime: null
            };
            priceHistory[stock] = [];
            trendSmaValues[stock] = [];
        });

        // Switch to simulation view
        setupSection.style.display = 'none';
        simulationSection.style.display = 'block';
        
        // Clear log
        tradingLog.innerHTML = '';
        
        // Initialize chart
        initChart();
        
        // Start simulation
        simulationRunning = true;
        document.querySelector('.status-dot').classList.add('active');
        document.getElementById('simStatusText').textContent = 'Running Simulation...';
        
        // Log optimized configuration
        addLogEntry('info', '🚀 OPTIMIZED Trading Bot Initialized');
        addLogEntry('info', '═══════════════════════════════════════');
        addLogEntry('info', `📊 Stocks: ${config.stocks.join(', ')}`);
        addLogEntry('info', `💰 Starting equity: $${equity.toLocaleString()}`);
        addLogEntry('info', '');
        addLogEntry('info', '⚙️ OPTIMIZED PARAMETERS:');
        addLogEntry('info', `   Buffer: ${(config.tradingBuffer * 100).toFixed(1)}% (was 0.2%)`);
        addLogEntry('info', `   SMA Window: ${config.smaWindow} (was 12)`);
        addLogEntry('info', `   Position Size: ${(config.maxCashPerStock * 100).toFixed(0)}% (was 10%)`);
        addLogEntry('info', `   Trend Filter: ${config.requireTrendAlignment ? 'ON' : 'OFF'}`);
        addLogEntry('info', `   Take Profit: ${(config.takeProfitPct * 100).toFixed(0)}%`);
        addLogEntry('info', `   Stop Loss: ${(config.stopLossPct * 100).toFixed(0)}%`);
        addLogEntry('info', '');
        addLogEntry('info', '⏰ SESSION INFO:');
        addLogEntry('info', `   Duration: ${config.sessionDurationMinutes} minutes`);
        addLogEntry('info', `   Check Interval: ${config.checkInterval} seconds`);
        addLogEntry('info', '');
        addLogEntry('success', '✓ Login successful (simulated)');
        addLogEntry('info', '═══════════════════════════════════════');
        
        // Run simulation loop (faster for demo)
        runIteration();
        simulationInterval = setInterval(runIteration, 2000);
    }

    function stopSimulation() {
        simulationRunning = false;
        if (simulationInterval) {
            clearInterval(simulationInterval);
            simulationInterval = null;
        }
        document.querySelector('.status-dot').classList.remove('active');
        document.getElementById('simStatusText').textContent = 'Simulation Stopped';
        
        // Calculate session stats
        const sessionMinutes = (Date.now() - sessionStartTime) / 60000;
        const pl = equity - startingEquity;
        const plPct = (pl / startingEquity * 100).toFixed(2);
        
        addLogEntry('warning', '');
        addLogEntry('warning', '═══════════════════════════════════════');
        addLogEntry('warning', '⏹ SIMULATION STOPPED');
        addLogEntry('info', `   Session Duration: ${sessionMinutes.toFixed(1)} min`);
        addLogEntry('info', `   Iterations: ${iteration}`);
        addLogEntry(pl >= 0 ? 'success' : 'error', `   P/L: $${pl.toFixed(2)} (${plPct}%)`);
        addLogEntry('warning', '═══════════════════════════════════════');
    }

    function backToSetup() {
        stopSimulation();
        setupSection.style.display = 'block';
        simulationSection.style.display = 'none';
    }

    function runIteration() {
        if (!simulationRunning) return;
        
        // Check session duration
        const sessionMinutes = (Date.now() - sessionStartTime) / 60000;
        if (sessionMinutes >= config.sessionDurationMinutes) {
            addLogEntry('warning', `⏰ Session duration (${config.sessionDurationMinutes} min) reached`);
            stopSimulation();
            return;
        }
        
        iteration++;
        const time = new Date().toLocaleTimeString();
        
        addLogEntry('info', `\n─── Iteration ${iteration} | ${time} ───`);
        
        // Simulate price updates for each stock
        config.stocks.forEach(stock => {
            const priceData = simulatePrice(stock);
            processSignalOptimized(stock, priceData);
        });
        
        // Update UI
        updateStats();
        updateHoldings();
        updateChart();
    }

    function simulatePrice(stock) {
        // Base prices for common stocks
        const basePrices = {
            'QQQ': 520, 'SPY': 590, 'VOO': 540, 'TSLA': 250, 'AAPL': 195,
            'MSFT': 420, 'GOOGL': 175, 'AMZN': 205, 'NVDA': 140, 'META': 565
        };
        
        let basePrice = basePrices[stock] || 100 + Math.random() * 200;
        
        let lastPrice = priceHistory[stock].length > 0 
            ? priceHistory[stock][priceHistory[stock].length - 1].price 
            : basePrice;
        
        // Random walk with slight trend
        const volatility = 0.004; // Slightly higher for more action
        const change = (Math.random() - 0.48) * volatility * lastPrice;
        const newPrice = Math.max(lastPrice + change, 1);
        
        // Store price
        priceHistory[stock].push({ price: newPrice, time: new Date() });
        
        // Keep last 100 prices
        if (priceHistory[stock].length > 100) {
            priceHistory[stock].shift();
        }
        
        // Calculate short-term SMA
        const prices = priceHistory[stock].map(p => p.price);
        const smaWindow = Math.min(config.smaWindow, prices.length);
        const sma = prices.slice(-smaWindow).reduce((a, b) => a + b, 0) / smaWindow;
        
        // Calculate trend SMA (longer period)
        const trendWindow = Math.min(config.trendSmaWindow, prices.length);
        const trendSma = prices.slice(-trendWindow).reduce((a, b) => a + b, 0) / trendWindow;
        
        return { 
            price: newPrice, 
            sma: sma, 
            trendSma: trendSma,
            ratio: newPrice / sma 
        };
    }

    // OPTIMIZED signal processing with trend filter and proper exits
    function processSignalOptimized(stock, priceData) {
        const { price, sma, trendSma, ratio } = priceData;
        const holding = holdings[stock];
        
        const inUptrend = price > trendSma;
        const trendStr = inUptrend ? '↑ UPTREND' : '↓ DOWNTREND';
        
        addLogEntry('info', `${stock}: $${price.toFixed(2)} | SMA: $${sma.toFixed(2)} | ${trendStr}`);
        
        // If we have a position, check exits first
        if (holding.shares > 0) {
            // Update high since buy (for trailing stop)
            if (price > holding.highSinceBuy) {
                holding.highSinceBuy = price;
            }
            
            const currentProfitPct = (price / holding.avgPrice - 1);
            const drawdownFromHigh = (price / holding.highSinceBuy - 1);
            
            let shouldSell = false;
            let sellReason = '';
            
            // Take profit
            if (currentProfitPct >= config.takeProfitPct) {
                shouldSell = true;
                sellReason = `TAKE PROFIT (${(currentProfitPct * 100).toFixed(1)}% gain)`;
            }
            // Stop loss
            else if (currentProfitPct <= -config.stopLossPct) {
                shouldSell = true;
                sellReason = `STOP LOSS (${(currentProfitPct * 100).toFixed(1)}% loss)`;
            }
            // Trailing stop
            else if (config.useTrailingStop && 
                     currentProfitPct > config.trailingStopTrigger && 
                     drawdownFromHigh < -config.trailingStopDistance) {
                shouldSell = true;
                sellReason = `TRAILING STOP (gave back ${(-drawdownFromHigh * 100).toFixed(1)}%)`;
            }
            // Original SMA signal (but only in downtrend)
            else if (ratio > (1 + config.tradingBuffer) && !inUptrend) {
                shouldSell = true;
                sellReason = 'SMA SIGNAL + DOWNTREND';
            }
            
            if (shouldSell) {
                const revenue = holding.shares * price;
                const profit = revenue - (holding.shares * holding.avgPrice);
                cash += revenue;
                
                addLogEntry('sell', `🔴 SELL: ${stock} - ${holding.shares} shares @ $${price.toFixed(2)}`);
                addLogEntry(profit >= 0 ? 'success' : 'error', `   Reason: ${sellReason}`);
                addLogEntry(profit >= 0 ? 'success' : 'error', `   P/L: $${profit.toFixed(2)} (${(profit/revenue*100).toFixed(1)}%)`);
                
                holding.shares = 0;
                holding.avgPrice = 0;
                holding.highSinceBuy = 0;
                holding.entryTime = null;
                return;
            } else {
                addLogEntry('info', `   Holding ${holding.shares} @ $${holding.avgPrice.toFixed(2)} | P/L: ${(currentProfitPct * 100).toFixed(1)}%`);
            }
        }
        
        // Check for buy signal
        if (holding.shares === 0 && ratio < (1 - config.tradingBuffer)) {
            // TREND FILTER: Only buy in uptrend (or if filter disabled)
            if (config.requireTrendAlignment && !inUptrend) {
                addLogEntry('info', `   ⚠️ BUY signal blocked - price below trend SMA`);
                return;
            }
            
            const maxInvestment = cash * config.maxCashPerStock;
            const sharesToBuy = Math.floor(maxInvestment / price);
            
            if (sharesToBuy >= 5) {
                const cost = sharesToBuy * price;
                cash -= cost;
                holding.shares = sharesToBuy;
                holding.avgPrice = price;
                holding.highSinceBuy = price;
                holding.entryTime = new Date();
                
                addLogEntry('buy', `🟢 BUY: ${stock} - ${sharesToBuy} shares @ $${price.toFixed(2)}`);
                addLogEntry('info', `   Total: $${cost.toFixed(2)} | Buffer triggered at ${(ratio * 100 - 100).toFixed(2)}%`);
                addLogEntry('info', `   Targets: TP ${(config.takeProfitPct * 100).toFixed(0)}% | SL ${(config.stopLossPct * 100).toFixed(0)}%`);
            } else {
                addLogEntry('info', `   Skipping: Can only afford ${sharesToBuy} shares (min: 5)`);
            }
        }
    }

    function updateStats() {
        let holdingsValue = 0;
        config.stocks.forEach(stock => {
            if (holdings[stock].shares > 0 && priceHistory[stock].length > 0) {
                const currentPrice = priceHistory[stock][priceHistory[stock].length - 1].price;
                holdingsValue += holdings[stock].shares * currentPrice;
            }
        });
        
        equity = cash + holdingsValue;
        const pl = equity - startingEquity;
        
        document.getElementById('simEquity').textContent = `$${equity.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}`;
        document.getElementById('simCash').textContent = `$${cash.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}`;
        
        const plElement = document.getElementById('simPL');
        plElement.textContent = `${pl >= 0 ? '+' : ''}$${pl.toFixed(2)}`;
        plElement.className = `stat-value ${pl >= 0 ? 'profit' : 'loss'}`;
    }

    function updateHoldings() {
        const container = document.getElementById('holdingsTable');
        
        let html = '<table class="holdings-table"><thead><tr><th>Symbol</th><th>Shares</th><th>Avg Price</th><th>Current</th><th>P/L</th><th>Status</th></tr></thead><tbody>';
        
        let hasHoldings = false;
        config.stocks.forEach(stock => {
            const holding = holdings[stock];
            if (holding.shares > 0) {
                hasHoldings = true;
                const currentPrice = priceHistory[stock].length > 0 
                    ? priceHistory[stock][priceHistory[stock].length - 1].price 
                    : holding.avgPrice;
                const pl = (currentPrice - holding.avgPrice) * holding.shares;
                const plPct = (currentPrice / holding.avgPrice - 1) * 100;
                const plClass = pl >= 0 ? 'profit' : 'loss';
                
                // Determine status
                let status = 'Holding';
                if (plPct >= config.takeProfitPct * 100 * 0.8) status = '🎯 Near TP';
                else if (plPct <= -config.stopLossPct * 100 * 0.8) status = '⚠️ Near SL';
                else if (plPct > 0) status = '📈 Profit';
                else status = '📉 Loss';
                
                html += `<tr>
                    <td><strong>${stock}</strong></td>
                    <td>${holding.shares}</td>
                    <td>$${holding.avgPrice.toFixed(2)}</td>
                    <td>$${currentPrice.toFixed(2)}</td>
                    <td class="${plClass}">${pl >= 0 ? '+' : ''}$${pl.toFixed(2)} (${plPct.toFixed(1)}%)</td>
                    <td>${status}</td>
                </tr>`;
            }
        });
        
        if (!hasHoldings) {
            html += '<tr><td colspan="6" style="text-align:center;color:#666;">No current holdings - waiting for signals</td></tr>';
        }
        
        html += '</tbody></table>';
        container.innerHTML = html;
    }

    function initChart() {
        chartCanvas = document.getElementById('priceChart');
        if (!chartCanvas) return;
        
        chartCtx = chartCanvas.getContext('2d');
        const container = chartCanvas.parentElement;
        chartCanvas.width = container.offsetWidth - 40;
        chartCanvas.height = 200;
    }

    function updateChart() {
        if (!chartCtx || !chartCanvas) return;
        
        const width = chartCanvas.width;
        const height = chartCanvas.height;
        const padding = 40;
        
        chartCtx.fillStyle = '#1a1a2e';
        chartCtx.fillRect(0, 0, width, height);
        
        // Draw grid
        chartCtx.strokeStyle = '#333';
        chartCtx.lineWidth = 0.5;
        for (let i = 0; i <= 4; i++) {
            const y = padding + (height - 2 * padding) * i / 4;
            chartCtx.beginPath();
            chartCtx.moveTo(padding, y);
            chartCtx.lineTo(width - padding, y);
            chartCtx.stroke();
        }
        
        const colors = ['#3498db', '#27ae60', '#e74c3c', '#f39c12', '#9b59b6', '#1abc9c'];
        const drawHeight = height - 2 * padding;
        const drawWidth = width - 2 * padding;
        
        config.stocks.forEach((stock, stockIndex) => {
            const prices = priceHistory[stock];
            if (prices.length < 2) return;
            
            const startPrice = prices[0].price;
            const normalizedPrices = prices.map(p => ((p.price / startPrice) - 1) * 100);
            
            const minChange = Math.min(...normalizedPrices, -2);
            const maxChange = Math.max(...normalizedPrices, 2);
            const range = maxChange - minChange || 1;
            
            chartCtx.strokeStyle = colors[stockIndex % colors.length];
            chartCtx.lineWidth = 2;
            chartCtx.beginPath();
            
            normalizedPrices.forEach((change, i) => {
                const x = padding + (i / (normalizedPrices.length - 1)) * drawWidth;
                const y = padding + drawHeight - ((change - minChange) / range) * drawHeight;
                
                if (i === 0) chartCtx.moveTo(x, y);
                else chartCtx.lineTo(x, y);
            });
            
            chartCtx.stroke();
            
            // Label
            const lastY = padding + drawHeight - ((normalizedPrices[normalizedPrices.length - 1] - minChange) / range) * drawHeight;
            chartCtx.fillStyle = colors[stockIndex % colors.length];
            chartCtx.font = 'bold 11px sans-serif';
            chartCtx.fillText(stock, width - padding + 5, lastY + 4);
        });
        
        // Title
        chartCtx.fillStyle = '#fff';
        chartCtx.font = 'bold 12px sans-serif';
        chartCtx.fillText('Price Performance (% Change)', padding, 20);
    }

    function addLogEntry(type, message) {
        const entry = document.createElement('div');
        entry.className = `log-entry ${type}`;
        entry.textContent = message;
        tradingLog.appendChild(entry);
        tradingLog.scrollTop = tradingLog.scrollHeight;
    }

    function exportTradingLog() {
        const entries = Array.from(tradingLog.querySelectorAll('.log-entry')).map(e => e.textContent);
        const sessionMinutes = sessionStartTime ? (Date.now() - sessionStartTime) / 60000 : 0;
        
        const logContent = `TradeSmart OPTIMIZED Auto Trade Log
Generated: ${new Date().toLocaleString()}
${'='.repeat(60)}

OPTIMIZED CONFIGURATION (Based on 20-year backtest):
- Buffer: ${(config.tradingBuffer * 100).toFixed(1)}% (was 0.2%)
- SMA Window: ${config.smaWindow} (was 12)
- Position Size: ${(config.maxCashPerStock * 100).toFixed(0)}% (was 10%)
- Trend Filter: ${config.requireTrendAlignment ? 'ON' : 'OFF'}
- Take Profit: ${(config.takeProfitPct * 100).toFixed(0)}%
- Stop Loss: ${(config.stopLossPct * 100).toFixed(0)}%
- Stocks: ${config.stocks.join(', ')}

SESSION RECOMMENDATIONS:
- Duration: 2 hours
- Frequency: 2-3 times per week
- Best Times: 9:30-11:30 AM ET or 2:00-4:00 PM ET

${'='.repeat(60)}
TRADING LOG
${'='.repeat(60)}

${entries.join('\n')}

${'='.repeat(60)}
FINAL SUMMARY
${'='.repeat(60)}
Session Duration: ${sessionMinutes.toFixed(1)} minutes
Starting Equity: $${startingEquity.toLocaleString()}
Final Equity: $${equity.toFixed(2)}
Total P/L: $${(equity - startingEquity).toFixed(2)}
Return: ${(((equity / startingEquity) - 1) * 100).toFixed(2)}%
`;
        
        downloadFile(`TradeSmart_Optimized_Log_${new Date().toISOString().split('T')[0]}.txt`, logContent);
    }
})();
