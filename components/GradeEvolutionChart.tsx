// Fix: Implement the GradeEvolutionChart component to render grade data.
import React, { useState, useRef } from 'react';
import { Subject, Grade } from '../types';

export interface ChartPoint {
  grade: Grade;
  x: number;
  y: number;
  isPlanned: boolean;
}

export interface ChartSeries {
  subject: Subject;
  points: ChartPoint[];
}

interface GradeEvolutionChartProps {
  data: ChartSeries[];
  maxX: number;
  chartScale: 10 | 20;
  t: any;
}

const GradeEvolutionChart: React.FC<GradeEvolutionChartProps> = ({ data, maxX, chartScale, t }) => {
    const [tooltip, setTooltip] = useState<{
        visible: boolean;
        content: React.ReactNode;
        x: number;
        y: number;
    } | null>(null);

    const svgRef = useRef<SVGSVGElement>(null);

    // Chart dimensions
    const width = 500;
    const height = 300;
    const padding = { top: 20, right: 20, bottom: 50, left: 40 };

    const chartWidth = width - padding.left - padding.right;
    const chartHeight = height - padding.top - padding.bottom;
    
    // Scaling functions
    // Handle maxX=1 case to avoid division by zero and have a single point rendered correctly.
    const effectiveMaxX = maxX > 1 ? maxX - 1 : 1;
    const xScale = (x: number) => padding.left + (x / effectiveMaxX) * chartWidth;
    const yScale = (y: number) => padding.top + chartHeight - (Math.max(0, Math.min(y, chartScale)) / chartScale) * chartHeight;

    const handleMouseLeave = () => {
        setTooltip(null);
    };

    return (
        <div className="relative" onMouseLeave={handleMouseLeave}>
            <svg ref={svgRef} viewBox={`0 0 ${width} ${height}`} className="w-full h-auto text-slate-500 dark:text-slate-400">
                {/* Y-axis labels and grid lines */}
                {[...Array(chartScale + 1)].map((_, i) => {
                    const step = chartScale === 20 ? 2 : (chartScale === 10 ? 2 : 1);
                    if (i % step === 0) {
                        const y = yScale(i);
                        return (
                            <g key={`y-axis-${i}`}>
                                <line x1={padding.left} y1={y} x2={width - padding.right} y2={y} className="stroke-slate-200 dark:stroke-slate-700" />
                                <text x={padding.left - 8} y={y + 4} textAnchor="end" fontSize="10" className="fill-current">{i}</text>
                            </g>
                        );
                    }
                    return null;
                })}

                {/* X-axis labels */}
                {maxX > 0 && [...Array(maxX)].map((_, i) => {
                    const x = xScale(i);
                    return (
                        <text key={`x-axis-${i}`} x={x} y={height - padding.bottom + 15} textAnchor="middle" fontSize="10" className="fill-current">
                            {t.gradeNumberShort}{i + 1}
                        </text>
                    );
                })}

                {/* Data series (lines and points) */}
                {data.map(({ subject, points }) => {
                    const pathData = points
                        .map((p, i) => `${i === 0 ? 'M' : 'L'} ${xScale(p.x)} ${yScale(p.y)}`)
                        .join(' ');
                    
                    return (
                        <g key={subject.id}>
                            <path d={pathData} fill="none" stroke={subject.color} strokeWidth="2" />
                            {points.map((p, i) => (
                                <circle
                                    key={`${subject.id}-${i}`}
                                    cx={xScale(p.x)}
                                    cy={yScale(p.y)}
                                    r="5"
                                    stroke={subject.color}
                                    strokeWidth="2"
                                    strokeDasharray={p.isPlanned ? "2 2" : "none"}
                                    fill={p.isPlanned ? 'white' : subject.color}
                                    className={p.isPlanned ? 'dark:fill-slate-800' : ''}
                                    style={{ cursor: 'pointer' }}
                                    onMouseEnter={(e) => {
                                        const svg = svgRef.current;
                                        if (!svg) return;
                                        const rect = (e.target as SVGCircleElement).getBoundingClientRect();
                                        const svgRect = svg.getBoundingClientRect();
                                        
                                        const tooltipContent = (
                                            <>
                                                <div className="font-bold" style={{color: subject.color}}>{subject.name}</div>
                                                <div>
                                                  {p.isPlanned ? 
                                                    <span>{t.planned}</span> : 
                                                    <span>{t.gradeInputPlaceholder}: <strong>{p.grade.grade}/{p.grade.maxGrade}</strong></span>
                                                  }
                                                </div>
                                                <div className="text-xs text-slate-500 dark:text-slate-400">{new Date(p.grade.date).toLocaleDateString()}</div>
                                                {p.grade.comment && <div className="text-xs italic mt-1 text-slate-500 dark:text-slate-400">"{p.grade.comment}"</div>}
                                            </>
                                        );
                                        
                                        setTooltip({
                                            visible: true,
                                            content: tooltipContent,
                                            x: rect.left - svgRect.left + rect.width / 2,
                                            y: rect.top - svgRect.top - 8,
                                        });
                                    }}
                                />
                            ))}
                        </g>
                    );
                })}
            </svg>
            {/* Tooltip */}
            {tooltip && tooltip.visible && (
                <div
                    className="absolute p-2 text-sm bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-md shadow-lg pointer-events-none z-10"
                    style={{
                        left: tooltip.x,
                        top: tooltip.y,
                        transform: 'translate(-50%, -100%)',
                    }}
                >
                    {tooltip.content}
                </div>
            )}
        </div>
    );
};

export default GradeEvolutionChart;
