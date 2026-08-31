import React, { useState } from 'react';
import { Alert, View, Text, ScrollView, StyleSheet, TouchableOpacity, Image, TextInput } from 'react-native';
import { colors, spacing } from '../theme';
import { Users, Clock, MapPin, AlertCircle, Calendar, Download, ShieldAlert, ShieldCheck, Activity, FileText, Code2, LockKeyhole, Server, CheckCircle2 } from 'lucide-react-native';
import { dashboardStats, methodsOfEntry } from '../data/mockData';
import { useData } from '../context/DataContext';
import { useLanguage } from '../context/LanguageContext';
import AttendanceTrendChartCard from '../components/AttendanceTrendChartCard';

const StatCard = ({ title, value, icon: Icon, change }) => (
  <View style={styles.statCard}>
    <View style={styles.statCardTop}>
      <Text style={styles.statCardTitle}>{title}</Text>
      <View style={styles.iconContainer}>
        <Icon size={18} color={colors.pink[800]} />
      </View>
    </View>
    <View style={styles.statCardBottom}>
      <Text style={styles.statCardValue}>{value}</Text>
      <Text style={styles.statCardChange}>{change}</Text>
    </View>
  </View>
);

const getMethodColor = percentage => {
  if (percentage <= 25) return colors.danger;
  if (percentage <= 50) return colors.warning;
  if (percentage <= 75) return colors.orange[500];
  return colors.green[500];
};

const FEED_FILTERS = ['All', 'Present', 'Late', 'Absent'];

const getAttendanceTrendData = (attendance, period) => {
  const today = new Date();
  const groups = attendance.reduce((groups, record) => {
    const date = new Date(`${record.date}T00:00:00`);
    let key;
    let label;

    if (period === 'Day') {
      key = record.date;
      label = date.toLocaleDateString('en-US', { weekday: 'short' });
    } else if (period === 'Month') {
      key = `${date.getFullYear()}-${date.getMonth()}`;
      label = date.toLocaleDateString('en-US', { month: 'short' });
    } else {
      const monday = new Date(date);
      monday.setDate(date.getDate() - ((date.getDay() + 6) % 7));
      key = monday.toISOString().split('T')[0];
      label = `Week ${Math.max(1, Math.ceil((today - monday) / (7 * 24 * 60 * 60 * 1000)))}`;
    }

    if (!groups[key]) groups[key] = { label, present: 0, late: 0, absent: 0 };
    if (record.status === 'Late') groups[key].late += 1;
    if (record.status === 'Present') groups[key].present += 1;
    if (record.status === 'Absent') groups[key].absent += 1;
    return groups;
  }, {});

  const periods = period === 'Day' ? 7 : period === 'Month' ? 6 : 5;
  const result = [];
  for (let index = periods - 1; index >= 0; index -= 1) {
    const date = new Date(today);
    if (period === 'Day') date.setDate(today.getDate() - index);
    if (period === 'Month') date.setMonth(today.getMonth() - index);
    if (period === 'Week') date.setDate(today.getDate() - (index * 7));

    let key;
    let label;
    if (period === 'Day') {
      key = date.toISOString().split('T')[0];
      label = date.toLocaleDateString('en-US', { weekday: 'short' });
    } else if (period === 'Month') {
      key = `${date.getFullYear()}-${date.getMonth()}`;
      label = date.toLocaleDateString('en-US', { month: 'short' });
    } else {
      const monday = new Date(date);
      monday.setDate(date.getDate() - ((date.getDay() + 6) % 7));
      key = monday.toISOString().split('T')[0];
      label = `Week ${periods - index}`;
    }
    result.push(groups[key] || { label, present: 0, late: 0, absent: 0 });
  }
  return result;
};

const AdminDashboard = () => {
  const { attendance, adminNotifs } = useData();
  const { t } = useLanguage();
  const [selectedPeriod, setSelectedPeriod] = useState('Week');
  const [feedFilter, setFeedFilter] = useState('All');
  const [searchText, setSearchText] = useState('');
  const [appliedSearch, setAppliedSearch] = useState('');
  const liveFeed = attendance
    .filter(record => feedFilter === 'All' || record.status === feedFilter)
    .filter(record => {
      const query = appliedSearch.trim().toLowerCase();
      if (!query) return true;
      return [record.name, record.department, record.status, record.location]
        .some(value => value?.toLowerCase().includes(query));
    })
    .slice(0, 5);
  const verifiedRecords = attendance.filter(record => record.status === 'Present' || record.status === 'Late').length;
  const verificationAccuracy = attendance.length ? ((verifiedRecords / attendance.length) * 100).toFixed(1) : '0.0';
  const trendData = getAttendanceTrendData(attendance, selectedPeriod);

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>{t('operationalOverview')}</Text>
        <Text style={styles.subtitle}>{t('operationalSubtitle')}</Text>
        
        <View style={styles.actions}>
          <TouchableOpacity 
            style={styles.btnSecondary} 
            onPress={() => setSelectedPeriod(selectedPeriod === 'Day' ? 'Week' : selectedPeriod === 'Week' ? 'Month' : 'Day')}
          >
            <Calendar size={16} color={colors.slate[700]} />
            <Text style={styles.btnSecondaryText}>
              {selectedPeriod === 'Day' ? 'Today' : selectedPeriod === 'Week' ? 'Last 7 Days' : 'Last 30 Days'}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.btnPrimary}>
            <Download size={16} color={colors.white} />
            <Text style={styles.btnPrimaryText}>{t('exportData')}</Text>
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.metricsGrid}>
        <StatCard title={t('totalEmployees')} value={dashboardStats.totalEmployees.value} icon={Users} change={dashboardStats.totalEmployees.change} />
        <StatCard title={t('averageAttendance')} value={dashboardStats.avgAttendance.value} icon={Clock} change={dashboardStats.avgAttendance.change} />
        <StatCard title={t('activeLocations')} value={dashboardStats.activeLocations.value} icon={MapPin} change={dashboardStats.activeLocations.change} />
        <StatCard title={t('pendingAlerts')} value={dashboardStats.pendingAlerts.value} icon={AlertCircle} change={dashboardStats.pendingAlerts.change} />
      </View>

      <View style={styles.analyticsRow}>
        <AttendanceTrendChartCard
          data={trendData}
          selectedPeriod={selectedPeriod}
          onPeriodChange={setSelectedPeriod}
        />
        <View style={styles.methodCard}>
          <Text style={styles.sectionTitle}>{t('methodOfEntry')}</Text>
          {methodsOfEntry.map((item, idx) => (
            <View key={idx} style={styles.progressRow}>
              <View style={styles.progressLabel}>
                <Text style={styles.progressText}>{item.method}</Text>
                <Text style={styles.progressValue}>{item.percentage}%</Text>
              </View>
              <View style={styles.progressBarBg}>
                <View style={[styles.progressBarFill, { width: `${item.percentage}%`, backgroundColor: getMethodColor(item.percentage) }]} />
              </View>
            </View>
          ))}
        </View>
      </View>

      <View style={styles.securityCard}>
        <View style={styles.securityHeader}>
          <View>
            <Text style={styles.sectionTitle}>{t('securityInsights')}</Text>
            <Text style={styles.securitySubtitle}>{t('securitySubtitle')}</Text>
          </View>
          <ShieldCheck size={24} color={colors.green[600]} />
        </View>
        <View style={styles.insightRow}>
          <View style={[styles.insightIcon, styles.alertIcon]}><ShieldAlert size={18} color={colors.danger} /></View>
          <View style={styles.insightInfo}>
            <Text style={styles.insightTitle}>{t('securityAlerts')}</Text>
            <Text style={styles.insightDescription}>{t('unreadAlerts')}</Text>
          </View>
          <Text style={styles.insightValue}>{adminNotifs.filter(notification => !notification.read).length}</Text>
        </View>
        <View style={styles.insightRow}>
          <View style={[styles.insightIcon, styles.activityIcon]}><Activity size={18} color={colors.orange[600]} /></View>
          <View style={styles.insightInfo}>
            <Text style={styles.insightTitle}>{t('lateCheckIns')}</Text>
            <Text style={styles.insightDescription}>{t('lateRecords')}</Text>
          </View>
          <Text style={styles.insightValue}>{attendance.filter(record => record.status === 'Late').length}</Text>
        </View>
        <View style={styles.insightRow}>
          <View style={[styles.insightIcon, styles.verifiedIcon]}><ShieldCheck size={18} color={colors.green[600]} /></View>
          <View style={styles.insightInfo}>
            <Text style={styles.insightTitle}>{t('verifiedAttendance')}</Text>
            <Text style={styles.insightDescription}>{t('verifiedRecords')}</Text>
          </View>
          <Text style={styles.insightValue}>{attendance.filter(record => record.status === 'Present').length}</Text>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>{t('liveFeed')}</Text>
        <View style={styles.feedSearchRow}>
          <TextInput
            style={styles.feedSearchInput}
            value={searchText}
            onChangeText={setSearchText}
            placeholder={t('searchAttendance')}
            placeholderTextColor={colors.slate[400]}
            autoCapitalize="none"
            returnKeyType="search"
            onSubmitEditing={() => setAppliedSearch(searchText)}
          />
          <TouchableOpacity style={styles.feedFilterButton} onPress={() => setAppliedSearch(searchText)}>
            <Text style={styles.feedFilterButtonText}>{t('filter')}</Text>
          </TouchableOpacity>
        </View>
        <View style={styles.feedHeader}>
          <View style={styles.feedFilters}>
            {FEED_FILTERS.map(filter => (
              <TouchableOpacity
                key={filter}
                style={[styles.feedFilter, feedFilter === filter && styles.feedFilterActive]}
                onPress={() => setFeedFilter(filter)}
                accessibilityRole="button"
                accessibilityState={{ selected: feedFilter === filter }}
              >
                <Text style={[styles.feedFilterText, feedFilter === filter && styles.feedFilterTextActive]}>{filter}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
        <View style={styles.listContainer}>
          {liveFeed.map(row => (
            <View key={row.id} style={styles.card}>
              <View style={styles.cardHeader}>
                <Image source={{ uri: row.avatar }} style={styles.avatar} />
                <View style={styles.cardInfo}>
                  <Text style={styles.empName}>{row.name}</Text>
                  <Text style={styles.empDate}>{new Date(`${row.date}T00:00:00`).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}</Text>
                </View>
                <View style={[styles.statusPill, row.status === 'Present' ? styles.presentPill : row.status === 'Late' ? styles.latePill : styles.absentPill]}>
                  <Text style={[styles.statusText, row.status === 'Present' ? styles.presentText : row.status === 'Late' ? styles.lateText : styles.absentText]}>{row.status}</Text>
                </View>
              </View>
              <View style={styles.cardDetails}>
                <View style={styles.detailRow}>
                  <View style={styles.detailItem}>
                    <Clock size={14} color={colors.slate[400]} />
                    <Text style={styles.detailLabel}>In:</Text>
                    <Text style={styles.detailValue}>{row.timestamp}</Text>
                  </View>
                  <View style={styles.detailItem}>
                    <MapPin size={14} color={colors.slate[400]} />
                    <Text style={styles.detailLabel}>Loc:</Text>
                    <Text style={styles.detailValue}>{row.location}</Text>
                  </View>
                </View>
              </View>
            </View>
          ))}
        </View>
        {!liveFeed.length && <Text style={styles.emptyFeedText}>{t('noMatchingAttendance')}</Text>}
      </View>

      <View style={styles.complianceSection}>
        <Text style={styles.sectionTitle}>{t('complianceSnapshot')}</Text>
        <View style={styles.complianceCards}>
          <View style={styles.complianceCard}>
            <View style={[styles.complianceIcon, styles.accuracyIcon]}>
              <ShieldCheck size={20} color={colors.green[600]} />
            </View>
            <Text style={styles.complianceLabel}>{t('verificationAccuracy')}</Text>
            <Text style={[styles.complianceValue, styles.accuracyValue]}>{verificationAccuracy}%</Text>
            <Text style={styles.complianceHint}>{t('verifiedAttendanceRecords')}</Text>
          </View>
          <View style={styles.complianceCard}>
            <View style={[styles.complianceIcon, styles.responseIcon]}>
              <Clock size={20} color={colors.orange[600]} />
            </View>
            <Text style={styles.complianceLabel}>{t('averageResponse')}</Text>
            <Text style={[styles.complianceValue, styles.responseValue]}>1.8s</Text>
            <Text style={styles.complianceHint}>{t('averageVerification')}</Text>
          </View>
        </View>
      </View>

      <View style={styles.insightActionsSection}>
        <Text style={styles.sectionTitle}>{t('deeperInsight')}</Text>
        <TouchableOpacity style={styles.insightActionButton} onPress={() => Alert.alert('Report Builder', 'Report Builder is ready to be connected.') }>
          <FileText size={19} color={colors.white} />
          <Text style={styles.insightActionText}>{t('reportBuilder')}</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.insightActionButton} onPress={() => Alert.alert('API Documentation', 'API documentation is ready to be connected.') }>
          <Code2 size={19} color={colors.white} />
          <Text style={styles.insightActionText}>{t('apiDocumentation')}</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.operationsFooter}>
        <Text style={styles.operationsTitle}>{t('operations')}</Text>
        <Text style={styles.operationsSubtitle}>{t('professionalStandards')}</Text>
        <View style={styles.securityLinks}>
          <TouchableOpacity style={styles.securityLink} onPress={() => Alert.alert('Security Policy', 'Security policy information is available to authorized administrators.')}>
            <LockKeyhole size={16} color={colors.slate[300]} />
            <Text style={styles.securityLinkText}>{t('securityPolicy')}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.securityLink} onPress={() => Alert.alert('Security Standards', 'Security standards information is available to authorized administrators.')}>
            <ShieldCheck size={16} color={colors.slate[300]} />
            <Text style={styles.securityLinkText}>{t('securityStandards')}</Text>
          </TouchableOpacity>
          <View style={styles.securityLink}>
            <Server size={16} color={colors.green[300]} />
            <Text style={styles.securityLinkText}>{t('systemHealth')}</Text>
            <CheckCircle2 size={14} color={colors.green[300]} />
          </View>
        </View>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.slate[50],
  },
  topBar: {
    height: 64,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    backgroundColor: colors.white,
    borderBottomWidth: 1,
    borderBottomColor: colors.slate[200],
    zIndex: 20,
  },
  logo: {
    width: 42,
    height: 42,
    resizeMode: 'contain',
  },
  container: {
    flex: 1,
    backgroundColor: colors.slate[50],
  },
  header: {
    padding: spacing.md,
    backgroundColor: colors.slate[100],
    borderBottomWidth: 1,
    borderBottomColor: colors.slate[200],
  },
  headerTools: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    gap: spacing.md,
  },
  notificationButton: {
    width: 36,
    height: 36,
    justifyContent: 'center',
    alignItems: 'center',
  },
  notificationBadge: {
    position: 'absolute',
    top: 0,
    right: 0,
    minWidth: 17,
    height: 17,
    paddingHorizontal: 4,
    borderRadius: 9,
    backgroundColor: colors.danger,
    justifyContent: 'center',
    alignItems: 'center',
  },
  notificationCount: {
    color: colors.white,
    fontSize: 10,
    fontWeight: 'bold',
  },
  profileButton: {
    borderRadius: 20,
    borderWidth: 2,
    borderColor: colors.white,
  },
  profileAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.slate[200],
  },
  profileMenu: {
    position: 'absolute',
    zIndex: 10,
    top: 62,
    right: spacing.md,
    width: 250,
    backgroundColor: colors.white,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.slate[200],
    paddingVertical: spacing.sm,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.14,
    shadowRadius: 10,
    elevation: 6,
  },
  profileMenuHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    gap: spacing.sm,
  },
  menuAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.slate[200],
  },
  menuTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.slate[900],
  },
  menuEmail: {
    fontSize: 12,
    color: colors.slate[500],
    marginTop: 2,
  },
  menuDivider: {
    height: 1,
    backgroundColor: colors.slate[200],
    marginVertical: spacing.xs,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: 11,
  },
  menuItemText: {
    fontSize: 14,
    color: colors.slate[700],
  },
  signOutText: {
    fontSize: 14,
    color: colors.danger,
    fontWeight: '600',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.slate[900],
  },
  subtitle: {
    fontSize: 14,
    color: colors.slate[500],
    marginTop: spacing.xs,
    marginBottom: spacing.md,
  },
  actions: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  btnSecondary: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.slate[200],
    borderRadius: 8,
    paddingVertical: 10,
    gap: 8,
  },
  btnSecondaryText: {
    color: colors.slate[700],
    fontWeight: '600',
  },
  btnPrimary: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.pink[800],
    borderRadius: 8,
    paddingVertical: 10,
    gap: 8,
  },
  btnPrimaryText: {
    color: colors.white,
    fontWeight: '600',
  },
  metricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    padding: spacing.md,
  },
  analyticsRow: {
    flexDirection: 'column',
    marginHorizontal: spacing.md,
    marginBottom: spacing.md,
  },
  methodCard: {
    width: '100%',
    backgroundColor: colors.white,
    padding: spacing.md,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.slate[200],
  },
  securityCard: {
    width: 'auto',
    marginHorizontal: spacing.md,
    marginBottom: spacing.md,
    backgroundColor: colors.white,
    padding: spacing.md,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.slate[200],
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 7,
    elevation: 2,
  },
  securityHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: spacing.sm,
  },
  securitySubtitle: {
    fontSize: 12,
    color: colors.slate[500],
    marginTop: -spacing.sm,
    marginBottom: spacing.sm,
  },
  insightRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.slate[100],
  },
  insightIcon: {
    width: 34,
    height: 34,
    borderRadius: 17,
    justifyContent: 'center',
    alignItems: 'center',
  },
  alertIcon: { backgroundColor: '#fef2f2' },
  activityIcon: { backgroundColor: colors.orange[50] },
  verifiedIcon: { backgroundColor: colors.green[50] },
  insightInfo: { flex: 1, marginLeft: spacing.sm },
  insightTitle: { fontSize: 14, fontWeight: '600', color: colors.slate[800] },
  insightDescription: { fontSize: 12, color: colors.slate[500], marginTop: 2 },
  insightValue: { fontSize: 18, fontWeight: '700', color: colors.slate[900], marginLeft: spacing.sm },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.sm,
  },
  iconContainer: {
    backgroundColor: colors.slate[50],
    padding: 8,
    borderRadius: 8,
  },
  changeText: {
    fontSize: 12,
    color: colors.green[700],
    backgroundColor: colors.green[50],
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    overflow: 'hidden',
  },
  cardTitle: {
    fontSize: 13,
    color: colors.slate[500],
  },
  cardValue: {
    fontSize: 22,
    fontWeight: 'bold',
    color: colors.slate[900],
    marginTop: 4,
  },
  section: {
    backgroundColor: colors.white,
    margin: spacing.md,
    padding: spacing.md,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.slate[200],
  },
  complianceSection: {
    marginHorizontal: spacing.md,
    marginBottom: spacing.md,
  },
  complianceCards: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  complianceCard: {
    flex: 1,
    backgroundColor: colors.white,
    padding: spacing.md,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.slate[200],
  },
  complianceIcon: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.sm,
  },
  accuracyIcon: { backgroundColor: colors.green[50] },
  responseIcon: { backgroundColor: colors.orange[50] },
  complianceLabel: {
    fontSize: 12,
    color: colors.slate[500],
    fontWeight: '600',
  },
  complianceValue: {
    fontSize: 24,
    fontWeight: '700',
    marginTop: spacing.xs,
  },
  accuracyValue: { color: colors.green[600] },
  responseValue: { color: colors.orange[600] },
  complianceHint: {
    fontSize: 11,
    color: colors.slate[400],
    marginTop: spacing.xs,
  },
  insightActionsSection: {
    marginHorizontal: spacing.md,
    marginBottom: spacing.lg,
  },
  insightActionButton: {
    width: '100%',
    minHeight: 46,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    backgroundColor: colors.pink[800],
    borderRadius: 8,
    marginBottom: spacing.sm,
    paddingHorizontal: spacing.md,
  },
  insightActionText: {
    color: colors.white,
    fontSize: 14,
    fontWeight: '700',
  },
  operationsFooter: {
    backgroundColor: colors.white,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.lg,
    borderTopWidth: 1,
    borderTopColor: colors.slate[200],
  },
  operationsTitle: {
    color: colors.slate[900],
    fontSize: 16,
    fontWeight: '700',
  },
  operationsSubtitle: {
    color: colors.slate[500],
    fontSize: 12,
    marginTop: spacing.xs,
    marginBottom: spacing.md,
  },
  securityLinks: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  securityLink: {
    flex: 1,
    minHeight: 36,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.slate[200],
    paddingTop: spacing.sm,
  },
  securityLinkText: {
    flex: 1,
    color: colors.slate[400],
    fontSize: 11,
    fontWeight: '600',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.slate[900],
    marginBottom: spacing.md,
  },
  feedSearchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  feedSearchInput: {
    flex: 3,
    height: 42,
    borderWidth: 1,
    borderColor: colors.slate[300],
    borderRadius: 8,
    paddingHorizontal: spacing.md,
    backgroundColor: colors.slate[50],
    color: colors.slate[900],
    fontSize: 14,
  },
  feedFilterButton: {
    flex: 1,
    height: 42,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 8,
    backgroundColor: colors.pink[800],
  },
  feedFilterButtonText: {
    color: colors.white,
    fontSize: 14,
    fontWeight: '700',
  },
  feedHeader: {
    marginBottom: spacing.xs,
  },
  feedFilters: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
    marginBottom: spacing.sm,
  },
  feedFilter: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 14,
    backgroundColor: colors.slate[100],
  },
  feedFilterActive: {
    backgroundColor: colors.pink[800],
  },
  feedFilterText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.slate[600],
  },
  feedFilterTextActive: {
    color: colors.white,
  },
  emptyFeedText: {
    fontSize: 13,
    color: colors.slate[500],
    paddingVertical: spacing.md,
  },
  progressRow: {
    marginBottom: spacing.md,
  },
  progressLabel: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  progressText: {
    fontSize: 14,
    color: colors.slate[700],
    fontWeight: '500',
  },
  progressValue: {
    fontSize: 14,
    fontWeight: 'bold',
    color: colors.slate[900],
  },
  progressBarBg: {
    height: 8,
    backgroundColor: colors.slate[100],
    borderRadius: 4,
  },
  progressBarFill: {
    height: 8,
    borderRadius: 4,
  },
  statCard: {
    width: '48%',
    marginBottom: spacing.sm,
    backgroundColor: colors.white,
    padding: spacing.md,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.slate[200],
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 8,
    elevation: 2,
  },
  statCardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.sm,
  },
  statCardTitle: {
    fontSize: 13,
    color: colors.slate[500],
    fontWeight: '500',
    flex: 1,
    paddingRight: 8,
  },
  statCardBottom: {
    flexDirection: 'column',
    alignItems: 'flex-start',
  },
  statCardValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.slate[900],
  },
  statCardChange: {
    fontSize: 12,
    color: colors.green[700],
    backgroundColor: colors.green[50],
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    marginTop: 4,
    overflow: 'hidden',
  },
  listContainer: {
    gap: spacing.md,
  },
  card: {
    backgroundColor: colors.white,
    borderRadius: 16,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.slate[200],
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 8,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.slate[100],
    marginRight: spacing.md,
  },
  cardInfo: {
    flex: 1,
  },
  empName: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.slate[900],
  },
  empDate: {
    fontSize: 13,
    color: colors.slate[500],
    marginTop: 2,
  },
  statusPill: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  presentPill: {
    backgroundColor: '#ECFDF5',
  },
  latePill: {
    backgroundColor: '#FFFBEB',
  },
  absentPill: {
    backgroundColor: '#FEF2F2',
  },
  statusText: {
    fontSize: 11,
    fontWeight: '700',
  },
  presentText: {
    color: '#059669',
  },
  lateText: {
    color: '#D97706',
  },
  absentText: {
    color: '#DC2626',
  },
  cardDetails: {
    backgroundColor: colors.slate[50],
    borderRadius: 12,
    padding: spacing.md,
    gap: 10,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flex: 1,
  },
  detailLabel: {
    fontSize: 13,
    color: colors.slate[500],
  },
  detailValue: {
    fontSize: 13,
    color: colors.slate[800],
    fontWeight: '500',
  },
});

export default AdminDashboard;
