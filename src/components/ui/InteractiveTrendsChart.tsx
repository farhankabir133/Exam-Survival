import React, { useEffect, useRef, useState, useMemo } from 'react';
import * as d3 from 'd3';
import { SessionRecord } from '../../utils/sessionHistory.js';
import { SubjectType } from '../../types.js';
import { Search, RotateCcw, Calendar, TrendingUp } from 'lucide-react';

interface InteractiveTrendsChartProps {
  sessions: SessionRecord[];
  theme: 'Light' | 'Dark';
}

export function InteractiveTrendsChart({ sessions, theme }: InteractiveTrendsChartProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);

  // Filter state for overlaying subject-specific accuracy markers
  const [selectedSubjectFilter, setSelectedSubjectFilter] = useState<SubjectType | 'All'>('All');
  
  // Interactive zoom states
  const [zoomRange, setZoomRange] = useState<[Date, Date] | null>(null);

  // Theme-aware colors
  const isDark = theme === 'Dark';
  const textColor = isDark ? '#94a3b8' : '#334155';
  const gridColor = isDark ? '#1e293b' : '#e2e8f0';
  const scoreLineColor = isDark ? '#22d3ee' : '#0891b2'; // Cyan
  const streakLineColor = isDark ? '#fbbf24' : '#b45309'; // Amber/Gold
  const axisColor = isDark ? '#475569' : '#94a3b8';

  // Constants mapping of subjects to colors
  const SUBJECT_COLORS: Record<SubjectType, string> = {
    'Bangla': '#ec4899',
    'English': '#3b82f6',
    'Mathematics': '#10b981',
    'ICT': '#a855f7',
    'Bangladesh Affairs': '#f59e0b',
    'International Affairs': '#06b6d4',
    'General Science': '#84cc16',
    'Mental Ability': '#ef4444'
  };

  // Memoize sorted parsed session data
  const chartData = useMemo(() => {
    if (!sessions || sessions.length === 0) return [];
    
    return sessions
      .map((s, idx) => {
        const date = new Date(s.timestamp);
        
        // Let's compute a simple formula representing overall accuracy for that session:
        // Starting accuracy is 100%, each error subtracts some relative points.
        const totalPossibleScored = s.totalScore > 0 ? Math.ceil(s.totalScore / 10) : 5;
        const errsCount = s.errors?.length || 0;
        const computedAccuracy = Math.max(10, Math.round((1 - (errsCount / (totalPossibleScored + errsCount))) * 100));

        // Group errors by subject in this session
        const subjectErrors: Record<string, number> = {};
        s.errors?.forEach(err => {
          subjectErrors[err.subject] = (subjectErrors[err.subject] || 0) + 1;
        });

        return {
          id: s.id,
          date,
          label: s.sessionLabel,
          totalScore: s.totalScore,
          maxStreak: s.maxStreak,
          accuracy: computedAccuracy,
          errors: s.errors,
          subjectErrors,
          index: idx
        };
      })
      .sort((a, b) => a.date.getTime() - b.date.getTime());
  }, [sessions]);

  // Handle auto-fit on window resizing
  const [dimensions, setDimensions] = useState({ width: 600, height: 350 });

  useEffect(() => {
    if (!containerRef.current) return;
    
    const resizeObserver = new ResizeObserver((entries) => {
      for (let entry of entries) {
        const { width } = entry.contentRect;
        setDimensions({
          width: Math.max(width, 320),
          height: 350
        });
      }
    });

    resizeObserver.observe(containerRef.current);
    return () => resizeObserver.disconnect();
  }, []);

  // Quick Zoom Helper Presets
  const setQuickZoom = (type: 'all' | 'last5' | 'highScore') => {
    if (chartData.length < 2) return;
    
    if (type === 'all') {
      setZoomRange(null);
    } else if (type === 'last5') {
      const sorted = [...chartData].sort((a, b) => b.date.getTime() - a.date.getTime());
      const cutoffIdx = Math.min(5, sorted.length - 1);
      const minDate = sorted[cutoffIdx].date;
      const maxDate = sorted[0].date;
      // cushion/pad
      setZoomRange([new Date(minDate.getTime() - 12 * 60 * 60 * 1000), new Date(maxDate.getTime() + 12 * 60 * 60 * 1000)]);
    } else if (type === 'highScore') {
      // Find session with maximum score
      const best = [...chartData].sort((a, b) => b.totalScore - a.totalScore)[0];
      if (best) {
        const minDate = new Date(best.date.getTime() - 36 * 60 * 60 * 1000);
        const maxDate = new Date(best.date.getTime() + 36 * 60 * 60 * 1000);
        setZoomRange([minDate, maxDate]);
      }
    }
  };

  // Main D3 Rendering Logic
  useEffect(() => {
    if (!svgRef.current || chartData.length === 0) return;

    // Clear previous elements
    d3.select(svgRef.current).selectAll('*').remove();

    const { width, height } = dimensions;
    const margin = { top: 20, right: 45, bottom: 85, left: 45 };
    const chartWidth = width - margin.left - margin.right;
    const chartHeight = height - margin.top - margin.bottom;

    const svg = d3.select(svgRef.current)
      .attr('width', width)
      .attr('height', height);

    // Filter data based on active zoom range
    const visibleData = zoomRange
      ? chartData.filter(d => d.date.getTime() >= zoomRange[0].getTime() && d.date.getTime() <= zoomRange[1].getTime())
      : chartData;

    if (visibleData.length === 0) {
      // Draw an empty boundary message
      svg.append('text')
        .attr('x', width / 2)
        .attr('y', height / 2)
        .attr('text-anchor', 'middle')
        .attr('fill', textColor)
        .style('font-family', 'monospace')
        .style('font-size', '11px')
        .text('[ NO HISTORIC RUNS FOUND IN THIS VIEW RANGE ]');
      return;
    }

    // 1. Create Scales
    const fallbackXMin = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const fallbackXMax = new Date();

    const xExtent = d3.extent(visibleData, d => d.date);
    const xMin = xExtent[0] || fallbackXMin;
    const xMax = xExtent[1] || fallbackXMax;

    // Add padding to dates so points are not on margins
    const paddedXMin = new Date(xMin.getTime() - (zoomRange ? 1 : 24) * 60 * 60 * 1000);
    const paddedXMax = new Date(xMax.getTime() + (zoomRange ? 1 : 24) * 60 * 60 * 1000);

    const xScale = d3.scaleTime()
      .domain([paddedXMin, paddedXMax])
      .range([margin.left, width - margin.right]);

    const yScoreScale = d3.scaleLinear()
      .domain([0, d3.max(chartData, d => d.totalScore) || 500])
      .nice()
      .range([height - margin.bottom, margin.top]);

    const yStreakScale = d3.scaleLinear()
      .domain([0, Math.max(5, d3.max(chartData, d => d.maxStreak) || 12)])
      .nice()
      .range([height - margin.bottom, margin.top]);

    // Graph clipping path to prevent overflowing lines outside graph borders when zoomed
    svg.append('defs')
      .append('clipPath')
      .attr('id', 'chart-clip')
      .append('rect')
      .attr('x', margin.left)
      .attr('y', margin.top)
      .attr('width', chartWidth)
      .attr('height', chartHeight);

    // 2. Draw Grids & Panels
    const mainGroup = svg.append('g');

    // Horizontal gridlines
    const yGrid = d3.axisLeft(yScoreScale)
      .tickSize(-chartWidth)
      .tickFormat(() => '') as any;

    mainGroup.append('g')
      .attr('class', 'grid')
      .attr('transform', `translate(${margin.left}, 0)`)
      .attr('stroke', gridColor)
      .attr('stroke-width', 0.5)
      .attr('stroke-dasharray', '2,2')
      .call(yGrid)
      .call(g => g.select('.domain').remove());

    // 3. Draw Scales Axes
    const xAxis = d3.axisBottom(xScale)
      .ticks(Math.min(visibleData.length, 6))
      .tickFormat((d) => d3.timeFormat('%m/%d %H:%M')(d as Date));

    const yAxisScore = d3.axisLeft(yScoreScale).ticks(5);
    const yAxisStreak = d3.axisRight(yStreakScale).ticks(5);

    // Append X-Axis
    mainGroup.append('g')
      .attr('transform', `translate(0, ${height - margin.bottom})`)
      .attr('color', axisColor)
      .style('font-family', 'monospace')
      .style('font-size', '9px')
      .call(xAxis);

    // Append Left Y-Axis (Aspirant Score)
    mainGroup.append('g')
      .attr('transform', `translate(${margin.left}, 0)`)
      .attr('color', scoreLineColor)
      .style('font-family', 'monospace')
      .style('font-size', '9px')
      .call(yAxisScore)
      .append('text')
      .attr('x', -margin.left + 8)
      .attr('y', margin.top - 8)
      .attr('fill', scoreLineColor)
      .attr('text-anchor', 'start')
      .style('font-weight', 'bold')
      .text('Score (pts)');

    // Append Right Y-Axis (Highest Streak)
    mainGroup.append('g')
      .attr('transform', `translate(${width - margin.right}, 0)`)
      .attr('color', streakLineColor)
      .style('font-family', 'monospace')
      .style('font-size', '9px')
      .call(yAxisStreak)
      .append('text')
      .attr('x', margin.right - 8)
      .attr('y', margin.top - 8)
      .attr('fill', streakLineColor)
      .attr('text-anchor', 'end')
      .style('font-weight', 'bold')
      .text('Streak');

    // 4. Draw Lines inside Clip Path
    const lineGroup = svg.append('g').attr('clip-path', 'url(#chart-clip)');

    const scoreLine = d3.line<any>()
      .x(d => xScale(d.date))
      .y(d => yScoreScale(d.totalScore))
      .curve(d3.curveMonotoneX);

    const streakLine = d3.line<any>()
      .x(d => xScale(d.date))
      .y(d => yStreakScale(d.maxStreak))
      .curve(d3.curveMonotoneX);

    // Plot Score Path
    lineGroup.append('path')
      .datum(visibleData)
      .attr('fill', 'none')
      .attr('stroke', scoreLineColor)
      .attr('stroke-width', 3)
      .attr('stroke-linecap', 'round')
      .attr('d', scoreLine);

    // Plot Streak Path
    lineGroup.append('path')
      .datum(visibleData)
      .attr('fill', 'none')
      .attr('stroke', streakLineColor)
      .attr('stroke-width', 2.5)
      .attr('stroke-dasharray', '4,2')
      .attr('stroke-linecap', 'round')
      .attr('d', streakLine);

    // 5. Draw Interactive Markers, Nodes & Subject Highlights
    const interactiveOverlay = svg.append('g').attr('clip-path', 'url(#chart-clip)');

    // Overlay indicators indicating errors/streaks at each node
    visibleData.forEach((d) => {
      // Node center coordinate
      const cx = xScale(d.date);
      const cyScore = yScoreScale(d.totalScore);
      const cyStreak = yStreakScale(d.maxStreak);

      // Verify if current subject filter has mistakes in this session
      let hasTargetError = false;
      let targetErrColor = '#ffffff';

      if (selectedSubjectFilter !== 'All') {
        const errorCountInSession = d.subjectErrors[selectedSubjectFilter] || 0;
        if (errorCountInSession > 0) {
          hasTargetError = true;
          targetErrColor = SUBJECT_COLORS[selectedSubjectFilter] || '#ff0055';
        }
      }

      // Base marker circles for Score Line
      const scoreCircle = interactiveOverlay.append('circle')
        .attr('cx', cx)
        .attr('cy', cyScore)
        .attr('r', hasTargetError ? 7 : 4.5)
        .attr('fill', hasTargetError ? targetErrColor : (isDark ? '#020617' : '#ffffff'))
        .attr('stroke', hasTargetError ? '#ffffff' : scoreLineColor)
        .attr('stroke-width', hasTargetError ? 2 : 2)
        .style('cursor', 'pointer');

      // Base marker circles for Streak Line
      const streakCircle = interactiveOverlay.append('circle')
        .attr('cx', cx)
        .attr('cy', cyStreak)
        .attr('r', 4)
        .attr('fill', isDark ? '#020617' : '#ffffff')
        .attr('stroke', streakLineColor)
        .attr('stroke-width', 2)
        .style('cursor', 'pointer');

      // If subject mode filter is active and errors exist, add an overlay indicator pulsing or smaller tag
      if (hasTargetError) {
        interactiveOverlay.append('circle')
          .attr('cx', cx)
          .attr('cy', cyScore)
          .attr('r', 11)
          .attr('fill', 'none')
          .attr('stroke', targetErrColor)
          .attr('stroke-width', 1.5)
          .attr('stroke-dasharray', '2,2')
          .style('opacity', 0.85);
      }

      // Tooltip HTML content setup dynamically attached to node points
      const tooltip = d3.select('#d3-interactive-tooltip');
      const showTooltip = (event: any) => {
        const errorsList = d.errors && d.errors.length > 0 
          ? d.errors.map(err => `<li class="flex items-center gap-1.5"><span class="w-1.5 h-1.5 rounded-full" style="background:${SUBJECT_COLORS[err.subject] || '#888'}"></span><span>${err.subject} (${err.errorType})</span></li>`).join('')
          : '<li class="text-emerald-400">Perfect Streak - No errors recorded!</li>';

        tooltip.transition().duration(100).style('opacity', 0.95);
        tooltip.html(`
          <div class="space-y-1.5">
            <div class="flex items-center justify-between border-b pb-1 mb-1 border-slate-800">
              <span class="font-extrabold text-[#22d3ee]">${d.label}</span>
              <span class="text-[9px] text-slate-500">${d.date.toLocaleDateString()}</span>
            </div>
            <div class="grid grid-cols-2 gap-x-4 gap-y-0.5">
              <span>Score: <strong class="text-white">${d.totalScore} pts</strong></span>
              <span>Streak: <strong class="text-amber-400">${d.maxStreak}</strong></span>
              <span>Accuracy: <strong class="text-emerald-400">${d.accuracy}%</strong></span>
            </div>
            <div class="pt-1">
              <p class="text-[9px] font-bold text-slate-400 uppercase tracking-wider pb-0.5">Error Record:</p>
              <ul class="space-y-0.5 text-[10px] text-slate-300 max-h-[80px] overflow-y-auto">
                ${errorsList}
              </ul>
            </div>
          </div>
        `)
        .style('left', (event.pageX + 15) + 'px')
        .style('top', (event.pageY - 30) + 'px');
      };

      const hideTooltip = () => {
        tooltip.transition().duration(200).style('opacity', 0);
      };

      scoreCircle.on('mouseover', showTooltip).on('mouseout', hideTooltip);
      streakCircle.on('mouseover', showTooltip).on('mouseout', hideTooltip);
    });

    // 6. Draw the Timeline Zoom Brush at the bottom of the SVG
    const brushAreaHeight = 30;
    const brushY = height - margin.bottom + 35;

    // Brush Scales
    const fallbackXBrushExtent = d3.extent(chartData, d => d.date);
    const xBrushExtentMin = fallbackXBrushExtent[0] || fallbackXMin;
    const xBrushExtentMax = fallbackXBrushExtent[1] || fallbackXMax;
    
    // Add extra margin for the brush timeline as well
    const paddedBrushMin = new Date(xBrushExtentMin.getTime() - 24 * 60 * 60 * 1000);
    const paddedBrushMax = new Date(xBrushExtentMax.getTime() + 24 * 60 * 60 * 1000);

    const xBrushScale = d3.scaleTime()
      .domain([paddedBrushMin, paddedBrushMax])
      .range([margin.left, width - margin.right]);

    const yBrushScale = d3.scaleLinear()
      .domain([0, d3.max(chartData, d => d.totalScore) || 500])
      .range([brushAreaHeight, 0]);

    const brushGroup = svg.append('g')
      .attr('transform', `translate(0, ${brushY})`);

    // Draw little baseline background for brush mini-charts
    brushGroup.append('rect')
      .attr('x', margin.left)
      .attr('y', 0)
      .attr('width', chartWidth)
      .attr('height', brushAreaHeight)
      .attr('fill', isDark ? 'rgba(15, 23, 42, 0.4)' : '#f1f5f9')
      .attr('stroke', gridColor)
      .attr('stroke-width', 0.5)
      .attr('rx', 4);

    // Draw a small micro-line of cumulative scores for brushing visualization
    const brushLine = d3.line<any>()
      .x(d => xBrushScale(d.date))
      .y(d => yBrushScale(d.totalScore))
      .curve(d3.curveMonotoneX);

    brushGroup.append('path')
      .datum(chartData)
      .attr('fill', 'none')
      .attr('stroke', isDark ? 'rgba(34, 211, 238, 0.3)' : 'rgba(8, 145, 178, 0.35)')
      .attr('stroke-width', 1.5)
      .attr('d', brushLine);

    // Draw a little horizontal timelines Axis under the brush
    const brushAxis = d3.axisBottom(xBrushScale)
      .ticks(Math.min(chartData.length, 4))
      .tickFormat((d) => d3.timeFormat('%m/%d')(d as Date));

    brushGroup.append('g')
      .attr('transform', `translate(0, ${brushAreaHeight})`)
      .attr('color', axisColor)
      .style('font-family', 'monospace')
      .style('font-size', '8px')
      .call(brushAxis);

    // Define Brush component
    const brush = d3.brushX()
      .extent([[margin.left, 0], [width - margin.right, brushAreaHeight]])
      .on('brush end', brushed);

    // Add Brush logic g container
    const brushG = brushGroup.append('g')
      .attr('class', 'brush')
      .call(brush);

    // Position default brush handles based on active zoomRange
    if (zoomRange) {
      const x0 = xBrushScale(zoomRange[0]);
      const x1 = xBrushScale(zoomRange[1]);
      brushG.call(brush.move, [x0, x1]);
    } else {
      // Default to highlighting the full range on initial loading
      brushG.call(brush.move, [margin.left, width - margin.right]);
    }

    // Brush Handler Callback
    function brushed(event: any) {
      const selection = event.selection;
      if (!selection) return;

      const [x0, x1] = selection;
      const dateZoomMin = xBrushScale.invert(x0);
      const dateZoomMax = xBrushScale.invert(x1);

      // Check if user has triggered a meaningful drag, then update zoom range state
      // (avoid dynamic state loops by only updating on source visual interactions)
      if (event.sourceEvent) {
        setZoomRange([dateZoomMin, dateZoomMax]);
      }
    }

  }, [chartData, dimensions, zoomRange, selectedSubjectFilter, theme]);

  return (
    <div ref={containerRef} className="w-full space-y-4">
      
      {/* Control overlay section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 font-mono text-xs">
        
        {/* Quick presets & Zoom actions */}
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="text-[10px] text-slate-500 uppercase font-bold pr-1 tracking-wider flex items-center gap-1">
            <Search className="w-3 h-3 text-cyan-400" /> Date Focus:
          </span>
          
          <button
            onClick={() => setQuickZoom('all')}
            className={`px-2.5 py-1 rounded-lg border text-[10px] font-bold transition flex items-center gap-1 ${
              !zoomRange
                ? 'bg-cyan-500 text-slate-950 border-cyan-500 font-extrabold'
                : 'bg-slate-950/40 text-slate-400 border-slate-900 hover:text-slate-200 hover:border-slate-800'
            }`}
          >
            <Calendar className="w-3.5 h-3.5" /> Full Scope
          </button>

          <button
            onClick={() => setQuickZoom('last5')}
            className={`px-2.5 py-1 rounded-lg border text-[10px] font-bold transition flex items-center gap-1 ${
              zoomRange && zoomRange[1].getTime() - zoomRange[0].getTime() < 6 * 24 * 60 * 60 * 1000
                ? 'bg-cyan-500 text-slate-950 border-cyan-500 font-extrabold'
                : 'bg-slate-950/40 text-slate-400 border-slate-900 hover:text-slate-200 hover:border-slate-800'
            }`}
          >
            Last 5 runs
          </button>

          <button
            onClick={() => setQuickZoom('highScore')}
            className="px-2.5 py-1 rounded-lg border border-slate-900 bg-slate-950/40 text-slate-400 hover:text-amber-400 hover:border-amber-500/30 text-[10px] font-bold transition flex items-center gap-1"
          >
            <TrendingUp className="w-3.5 h-3.5" /> Best Match Zoom
          </button>

          {zoomRange && (
            <button
              onClick={() => setZoomRange(null)}
              className="p-1 px-2 rounded-lg bg-red-950/30 border border-red-500/20 text-red-400 hover:bg-red-900/40 text-[10px] transition"
              title="Reset Zoom"
            >
              <RotateCcw className="w-3 h-3" />
            </button>
          )}
        </div>

        {/* Subject accuracy overlay toggle */}
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="text-[10px] text-slate-500 uppercase font-bold pr-1 tracking-wider">
            🚨 Error Highlight:
          </span>
          <select
            value={selectedSubjectFilter}
            onChange={(e) => setSelectedSubjectFilter(e.target.value as any)}
            className="bg-slate-950 border border-slate-900 rounded-lg py-1 px-2 text-[10px] font-bold text-slate-300 focus:outline-none focus:border-cyan-500 hover:border-slate-800 transition max-w-[150px]"
          >
            <option value="All">⚠️ [ No Subject Overlay ]</option>
            {Object.keys(SUBJECT_COLORS).map(s => (
              <option key={s} value={s}>
                🎯 {s}
              </option>
            ))}
          </select>
        </div>

      </div>

      {/* SVG Canvas Area */}
      <div className="relative bg-slate-950/30 border border-slate-900 rounded-xl p-2 select-none overflow-visible">
        
        {/* Dynamic Canvas element */}
        <svg ref={svgRef} className="w-full h-[350px] overflow-visible"></svg>

        {/* Legend block floating custom info */}
        <div className="absolute top-2.5 right-6 flex items-center gap-3 text-[9px] font-mono font-bold uppercase tracking-wider text-slate-500">
          <div className="flex items-center gap-1 text-cyan-400">
            <span className="w-2.5 h-0.5 bg-cyan-400 inline-block"></span>
            Aspirant Score
          </div>
          <div className="flex items-center gap-1 text-amber-500">
            <span className="w-2.5 h-0.5 bg-amber-500 inline-block border-t border-dashed"></span>
            Highest Streak
          </div>
        </div>

        {/* Tips info */}
        <div className="absolute bottom-1 right-3 text-[8px] font-mono text-slate-500">
          * Drag boundaries in mini timeline below chart to zoom
        </div>

      </div>

      {/* Shared Absolute Tooltip overlay node */}
      <div 
        id="d3-interactive-tooltip" 
        className="pointer-events-none absolute z-50 rounded-xl bg-slate-950/95 border border-slate-800 p-3 shadow-2xl opacity-0 transition-opacity duration-150 text-xs font-mono text-slate-300 max-w-[260px]"
        style={{ left: 0, top: 0 }}
      >
        Tooltip
      </div>

    </div>
  );
}
