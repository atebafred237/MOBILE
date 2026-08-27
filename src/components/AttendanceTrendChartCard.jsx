import React, { useState } from 'react';
import { Text, TouchableOpacity, View, StyleSheet, PanResponder } from 'react-native';
import Svg, { Circle, Line, Path, Polyline, Text as SvgText } from 'react-native-svg';
import { colors, spacing } from '../theme';

const PERIODS = ['Day', 'Week', 'Month'];
const CHART_WIDTH = 560;
const CHART_HEIGHT = 220;
const PLOT_LEFT = 30;
const PLOT_RIGHT = 12;
const PLOT_TOP = 12;
const PLOT_BOTTOM = 30;

const getPoints = (values, maxValue) => {
  const plotWidth = CHART_WIDTH - PLOT_LEFT - PLOT_RIGHT;
  const plotHeight = CHART_HEIGHT - PLOT_TOP - PLOT_BOTTOM;
  const step = values.length > 1 ? plotWidth / (values.length - 1) : plotWidth;

  return values.map((value, index) => ({
    x: PLOT_LEFT + index * step,
    y: PLOT_TOP + plotHeight - (value / maxValue) * plotHeight,
  }));
};

const pointsToString = points => points.map(point => `${point.x},${point.y}`).join(' ');

const AttendanceTrendChartCard = ({ data = [], selectedPeriod = 'Week', onPeriodChange = () => {} }) => {
  const [activePoint, setActivePoint] = useState(null);
  const [tooltipPosition, setTooltipPosition] = useState({ x: 8, y: 4 });
  const [chartWidth, setChartWidth] = useState(CHART_WIDTH);
  const labels = data.map(item => item.label || item.day || '');
  const presentValues = data.map(item => Number(item.present) || 0);
  const lateValues = data.map(item => Number(item.late) || 0);
  const absentValues = data.map(item => Number(item.absent) || 0);
  const maxValue = Math.max(...presentValues, ...lateValues, ...absentValues, 1) * 1.15;
  const presentPoints = getPoints(presentValues, maxValue);
  const latePoints = getPoints(lateValues, maxValue);
  const absentPoints = getPoints(absentValues, maxValue);
  const baseline = CHART_HEIGHT - PLOT_BOTTOM;
  const areaPath = presentPoints.length
    ? `M ${presentPoints[0].x} ${baseline} L ${pointsToString(presentPoints)} L ${presentPoints[presentPoints.length - 1].x} ${baseline} Z`
    : '';
  const selectPoint = (touchX, touchY) => {
    if (!data.length) return;
    const chartX = (touchX / Math.max(chartWidth, 1)) * CHART_WIDTH;
    const nearestIndex = presentPoints.reduce((closestIndex, point, index) => (
      Math.abs(point.x - chartX) < Math.abs(presentPoints[closestIndex].x - chartX) ? index : closestIndex
    ), 0);
    setActivePoint(nearestIndex);
    setTooltipPosition({
      x: Math.min(Math.max(touchX - 58, 4), Math.max(chartWidth - 132, 4)),
      y: Math.min(Math.max(touchY - 82, 4), CHART_HEIGHT - 70),
    });
  };
  const chartResponder = PanResponder.create({
    onStartShouldSetPanResponder: () => true,
    onMoveShouldSetPanResponder: () => true,
    onPanResponderGrant: event => selectPoint(event.nativeEvent.locationX, event.nativeEvent.locationY),
    onPanResponderMove: event => selectPoint(event.nativeEvent.locationX, event.nativeEvent.locationY),
  });

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <View style={styles.heading}>
          <Text style={styles.title}>Weekly Attendance Trends</Text>
          <Text style={styles.subtitle}>Daily breakdown of check-in volume and status</Text>
        </View>
        <View style={styles.segmentedControl}>
          {PERIODS.map(period => (
            <TouchableOpacity
              key={period}
              style={[styles.segment, selectedPeriod === period && styles.segmentSelected]}
              onPress={() => onPeriodChange(period)}
              accessibilityRole="button"
              accessibilityState={{ selected: selectedPeriod === period }}
            >
              <Text style={[styles.segmentText, selectedPeriod === period && styles.segmentTextSelected]}>{period}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <View
        style={styles.chartContainer}
        onLayout={event => setChartWidth(event.nativeEvent.layout.width)}
        {...chartResponder.panHandlers}
      >
        <Svg width="100%" height={CHART_HEIGHT} viewBox={`0 0 ${CHART_WIDTH} ${CHART_HEIGHT}`}>
          {[0, 1, 2, 3].map(index => {
            const y = PLOT_TOP + ((CHART_HEIGHT - PLOT_TOP - PLOT_BOTTOM) / 3) * index;
            return <Line key={index} x1={PLOT_LEFT} x2={CHART_WIDTH - PLOT_RIGHT} y1={y} y2={y} stroke={colors.slate[200]} strokeWidth="1" />;
          })}
          {areaPath ? <Path d={areaPath} fill="#d1fae5" opacity="0.7" /> : null}
          {presentPoints.length ? <Polyline points={pointsToString(presentPoints)} fill="none" stroke="#10b981" strokeWidth="3" strokeLinejoin="round" strokeLinecap="round" /> : null}
          {latePoints.length ? <Polyline points={pointsToString(latePoints)} fill="none" stroke="#f59e0b" strokeWidth="2.5" strokeLinejoin="round" strokeLinecap="round" /> : null}
          {absentPoints.length ? <Polyline points={pointsToString(absentPoints)} fill="none" stroke="#ef4444" strokeWidth="2.5" strokeLinejoin="round" strokeLinecap="round" /> : null}
          {presentPoints.map((point, index) => (
            <Circle
              key={`present-${index}`}
              cx={point.x}
              cy={point.y}
              r={activePoint === index ? 5 : 3}
              fill="#10b981"
              stroke={colors.white}
              strokeWidth="2"
              onPress={() => { setActivePoint(index); setTooltipPosition({ x: Math.min(Math.max((point.x / CHART_WIDTH) * chartWidth - 58, 4), Math.max(chartWidth - 132, 4)), y: 4 }); }}
            />
          ))}
          {latePoints.map((point, index) => (
            <Circle
              key={`late-${index}`}
              cx={point.x}
              cy={point.y}
              r={activePoint === index ? 5 : 3}
              fill="#f59e0b"
              stroke={colors.white}
              strokeWidth="2"
              onPress={() => { setActivePoint(index); setTooltipPosition({ x: Math.min(Math.max((point.x / CHART_WIDTH) * chartWidth - 58, 4), Math.max(chartWidth - 132, 4)), y: 4 }); }}
            />
          ))}
          {absentPoints.map((point, index) => (
            <Circle
              key={`absent-${index}`}
              cx={point.x}
              cy={point.y}
              r={activePoint === index ? 5 : 3}
              fill="#ef4444"
              stroke={colors.white}
              strokeWidth="2"
              onPress={() => { setActivePoint(index); setTooltipPosition({ x: Math.min(Math.max((point.x / CHART_WIDTH) * chartWidth - 58, 4), Math.max(chartWidth - 132, 4)), y: 4 }); }}
            />
          ))}
          {labels.map((label, index) => (
            <SvgText key={`label-${index}`} x={presentPoints[index]?.x || 0} y={CHART_HEIGHT - 8} fill="#64748b" fontSize="11" textAnchor="middle">{label}</SvgText>
          ))}
        </Svg>
        {activePoint !== null && data[activePoint] ? (
          <View style={[styles.tooltip, { left: tooltipPosition.x, top: tooltipPosition.y }]} pointerEvents="none">
            <Text style={styles.tooltipDay}>{data[activePoint].label || data[activePoint].day}</Text>
            <Text style={[styles.tooltipValue, styles.presentValue]}>Present: {data[activePoint].present}</Text>
            <Text style={[styles.tooltipValue, styles.lateValue]}>Late: {data[activePoint].late}</Text>
            <Text style={[styles.tooltipValue, styles.absentValue]}>Absent: {data[activePoint].absent}</Text>
          </View>
        ) : null}
      </View>

      <View style={styles.legend}>
        <View style={styles.legendItem}><View style={[styles.legendDot, styles.presentDot]} /><Text style={styles.legendText}>Present</Text></View>
        <View style={styles.legendItem}><View style={[styles.legendDot, styles.lateDot]} /><Text style={styles.legendText}>Late</Text></View>
        <View style={styles.legendItem}><View style={[styles.legendDot, styles.absentDot]} /><Text style={styles.legendText}>Absent</Text></View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    width: '100%',
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 16,
    padding: spacing.md,
    shadowColor: '#0f172a',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  heading: { flex: 1 },
  title: { fontSize: 16, fontWeight: '700', color: '#0f172a' },
  subtitle: { fontSize: 12, color: '#64748b', marginTop: 4 },
  segmentedControl: {
    flexDirection: 'row',
    padding: 3,
    borderRadius: 8,
    backgroundColor: '#f1f5f9',
  },
  segment: { paddingHorizontal: 9, paddingVertical: 6, borderRadius: 6 },
  segmentSelected: { backgroundColor: '#ffffff', shadowColor: '#0f172a', shadowOpacity: 0.08, shadowRadius: 3, elevation: 1 },
  segmentText: { fontSize: 11, color: '#64748b', fontWeight: '600' },
  segmentTextSelected: { color: '#0f172a' },
  chartContainer: { height: CHART_HEIGHT, position: 'relative' },
  tooltip: { position: 'absolute', backgroundColor: '#ffffff', paddingHorizontal: 9, paddingVertical: 7, borderRadius: 6, borderWidth: 1, borderColor: '#e2e8f0', shadowColor: '#0f172a', shadowOpacity: 0.1, shadowRadius: 4, elevation: 2 },
  tooltipDay: { fontSize: 12, fontWeight: '700', color: '#0f172a', marginBottom: 2 },
  tooltipValue: { fontSize: 11, color: '#64748b', lineHeight: 16 },
  presentValue: { color: '#10b981', fontWeight: '600' },
  lateValue: { color: '#f59e0b', fontWeight: '600' },
  absentValue: { color: '#ef4444', fontWeight: '600' },
  legend: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, marginTop: spacing.xs },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  legendDot: { width: 8, height: 8, borderRadius: 4 },
  presentDot: { backgroundColor: '#10b981' },
  lateDot: { backgroundColor: '#f59e0b' },
  absentDot: { backgroundColor: '#ef4444' },
  legendText: { fontSize: 12, color: '#64748b' },
});

export default AttendanceTrendChartCard;
