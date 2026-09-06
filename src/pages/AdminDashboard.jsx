
import React, { useState, useEffect } from 'react';
import {
  Alert,
  Animated,
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Image,
  TextInput,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { colors, spacing } from '../theme';
import {
  Users,
  Building2,
  Clock,
  MapPin,
  AlertCircle,
  Calendar,
  Download,
  ShieldAlert,
  ShieldCheck,
  Activity,
  FileText,
  Code2,
  LockKeyhole,
  CheckCircle,
  XCircle,
  HelpCircle,
  Server,
  CheckCircle2,
  Sparkles,
  ArrowRight,
  X,
} from 'lucide-react-native';
import { useData } from '../context/DataContext';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { API_BASE_URL } from '../config';
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

/*
|--------------------------------------------------------------------------
| SAFE DATE HELPERS
|--------------------------------------------------------------------------
*/

const isValidDate = value =>
  value instanceof Date &&
  Number.isFinite(value.getTime());

const parseAttendanceDate = value => {
  if (value === null || value === undefined) {
    return null;
  }

  if (value instanceof Date) {
    return isValidDate(value)
      ? new Date(value.getTime())
      : null;
  }

  const stringValue = String(value).trim();

  if (!stringValue) {
    return null;
  }

  // Reject MySQL-style invalid dates
  if (
    stringValue === '0000-00-00' ||
    stringValue.startsWith('0000-00-00')
  ) {
    return null;
  }

  /*
   * Handle:
   * YYYY-MM-DD
   * YYYY-MM-DD HH:mm:ss
   * YYYY-MM-DDTHH:mm:ss
   *
   * We manually parse the date portion because
   * iOS can behave differently when parsing dates.
   */
  const match =
    /^(\d{4})-(\d{2})-(\d{2})(?:[T\s].*)?$/.exec(
      stringValue
    );

  if (match) {
    const year = Number(match[1]);
    const month = Number(match[2]);
    const day = Number(match[3]);

    if (
      year < 1970 ||
      year > 2100 ||
      month < 1 ||
      month > 12 ||
      day < 1 ||
      day > 31
    ) {
      return null;
    }

    const date = new Date(
      year,
      month - 1,
      day
    );

    if (!isValidDate(date)) {
      return null;
    }

    /*
     * JavaScript automatically changes invalid dates.
     * Example:
     * new Date(2026, 1, 31)
     * becomes March 3.
     *
     * This prevents that.
     */
    if (
      date.getFullYear() !== year ||
      date.getMonth() !== month - 1 ||
      date.getDate() !== day
    ) {
      return null;
    }

    return date;
  }

  /*
   * Fallback for other valid ISO timestamps.
   */
  let normalized = stringValue;

  if (
    normalized.includes(' ') &&
    !normalized.includes('T')
  ) {
    normalized = normalized.replace(' ', 'T');
  }

  try {
    const date = new Date(normalized);

    if (!isValidDate(date)) {
      return null;
    }

    const year = date.getFullYear();

    if (year < 1970 || year > 2100) {
      return null;
    }

    return date;
  } catch (error) {
    console.warn(
      'Date parsing failed:',
      value,
      error
    );

    return null;
  }
};

const formatDateKey = date => {
  if (!isValidDate(date)) {
    return null;
  }

  const year = date.getFullYear();

  const month = String(
    date.getMonth() + 1
  ).padStart(2, '0');

  const day = String(
    date.getDate()
  ).padStart(2, '0');

  return `${year}-${month}-${day}`;
};

const formatAttendanceDate = value => {
  const date = parseAttendanceDate(value);

  if (!date) {
    return 'Unknown date';
  }

  try {
    return date.toLocaleDateString(
      'en-US',
      {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
      }
    );
  } catch (error) {
    console.warn(
      'Date formatting failed:',
      value,
      error
    );

    return 'Unknown date';
  }
};

/*
|--------------------------------------------------------------------------
| METHOD COLOR
|--------------------------------------------------------------------------
*/

const getMethodColor = percentage => {
  if (percentage <= 25) {
    return colors.danger;
  }

  if (percentage <= 50) {
    return colors.warning;
  }

  if (percentage <= 75) {
    return colors.orange[500];
  }

  return colors.green[500];
};

const FEED_FILTERS = [
  'All',
  'Present',
  'Late',
  'Absent',
];

/*
|--------------------------------------------------------------------------
| ATTENDANCE TREND DATA
|--------------------------------------------------------------------------
*/

const getAttendanceTrendData = (
  attendance,
  period
) => {
  const today = new Date();

  const groups = attendance.reduce(
    (groups, record, index) => {
      const date = parseAttendanceDate(
        record?.date
      );

      /*
       * Never allow an invalid attendance date
       * to reach toISOString().
       */
      if (!date) {
        console.warn(
          'Skipping attendance record with invalid date:',
          {
            index,
            id: record?.id,
            name: record?.name,
            date: record?.date,
          }
        );

        return groups;
      }

      let key;
      let label;

      if (period === 'Day') {
        key = formatDateKey(date);

        try {
          label = date.toLocaleDateString(
            'en-US',
            {
              weekday: 'short',
            }
          );
        } catch (error) {
          label = 'Unknown';
        }
      } else if (period === 'Month') {
        key = `${date.getFullYear()}-${date.getMonth()}`;

        try {
          label = date.toLocaleDateString(
            'en-US',
            {
              month: 'short',
            }
          );
        } catch (error) {
          label = 'Unknown';
        }
      } else {
        const monday = new Date(date);

        monday.setDate(
          date.getDate() -
            ((date.getDay() + 6) % 7)
        );

        if (!isValidDate(monday)) {
          return groups;
        }

        key = formatDateKey(monday);

        label = `Week ${Math.max(
          1,
          Math.ceil(
            (today - monday) /
              (7 * 24 * 60 * 60 * 1000)
          )
        )}`;
      }

      if (!key) {
        return groups;
      }

      if (!groups[key]) {
        groups[key] = {
          label,
          present: 0,
          late: 0,
          absent: 0,
        };
      }

      if (record.status === 'Late') {
        groups[key].late += 1;
      }

      if (record.status === 'Present') {
        groups[key].present += 1;
      }

      if (record.status === 'Absent') {
        groups[key].absent += 1;
      }

      return groups;
    },
    {}
  );

  const periods =
    period === 'Day'
      ? 7
      : period === 'Month'
        ? 6
        : 5;

  const result = [];

  for (
    let index = periods - 1;
    index >= 0;
    index -= 1
  ) {
    const date = new Date(today);

    if (period === 'Day') {
      date.setDate(
        today.getDate() - index
      );
    }

    if (period === 'Month') {
      date.setMonth(
        today.getMonth() - index
      );
    }

    if (period === 'Week') {
      date.setDate(
        today.getDate() - index * 7
      );
    }

    if (!isValidDate(date)) {
      continue;
    }

    let key;
    let label;

    if (period === 'Day') {
      key = formatDateKey(date);

      try {
        label = date.toLocaleDateString(
          'en-US',
          {
            weekday: 'short',
          }
        );
      } catch (error) {
        label = 'Unknown';
      }
    } else if (period === 'Month') {
      key = `${date.getFullYear()}-${date.getMonth()}`;

      try {
        label = date.toLocaleDateString(
          'en-US',
          {
            month: 'short',
          }
        );
      } catch (error) {
        label = 'Unknown';
      }
    } else {
      const monday = new Date(date);

      monday.setDate(
        date.getDate() -
          ((date.getDay() + 6) % 7)
      );

      if (!isValidDate(monday)) {
        continue;
      }

      key = formatDateKey(monday);

      label = `Week ${periods - index}`;
    }

    result.push(
      groups[key] || {
        label,
        present: 0,
        late: 0,
        absent: 0,
      }
    );
  }

  return result;
};

/*
|--------------------------------------------------------------------------
| ADMIN DASHBOARD
|--------------------------------------------------------------------------
*/

const ONBOARDING_DISMISS_KEY = 'presenza_admin_onboarding_notification_dismissed';

const AdminDashboard = () => {
  const { attendance, adminNotifs } =
    useData();

  const { user } = useAuth();
  const navigation = useNavigation();

  const { t } = useLanguage();
  const [showSetupNotification, setShowSetupNotification] = useState(false);
  const fadeAnim = React.useRef(new Animated.Value(0)).current;
  const slideAnim = React.useRef(new Animated.Value(-12)).current;

  /*
   * Temporary diagnostic logging.
   * This will help identify the bad record
   * if the backend is returning an invalid date.
   */
  useEffect(() => {
    console.log(
      'DASHBOARD ATTENDANCE:',
      JSON.stringify(
        attendance,
        null,
        2
      )
    );
  }, [attendance]);

  const [selectedPeriod, setSelectedPeriod] =
    useState('Week');

  const [feedFilter, setFeedFilter] =
    useState('All');

  const [searchText, setSearchText] =
    useState('');

  const [appliedSearch, setAppliedSearch] =
    useState('');

  const [overview, setOverview] =
    useState(null);

  const [methods, setMethods] =
    useState(null);

  const [loading, setLoading] =
    useState(true);

  const dismissSetupNotification = async () => {
    await AsyncStorage.setItem(ONBOARDING_DISMISS_KEY, 'true');
    setShowSetupNotification(false);
  };

  const openOrganizationSetup = async () => {
    await AsyncStorage.setItem(ONBOARDING_DISMISS_KEY, 'true');
    setShowSetupNotification(false);

    const parentNavigator = navigation?.getParent ? navigation.getParent() : null;
    if (parentNavigator && typeof parentNavigator.navigate === 'function') {
      parentNavigator.navigate('AdminManagement');
      return;
    }

    navigation.navigate('AdminManagement');
  };

  useEffect(() => {
    const checkSetupNotification = async () => {
      try {
        const dismissed = await AsyncStorage.getItem(ONBOARDING_DISMISS_KEY);
        setShowSetupNotification(!dismissed);
      } catch (error) {
        console.warn('Could not read onboarding notification state:', error);
        setShowSetupNotification(true);
      }
    };

    checkSetupNotification();
  }, []);

  useEffect(() => {
    if (!showSetupNotification) {
      Animated.parallel([
        Animated.timing(fadeAnim, { toValue: 0, duration: 180, useNativeDriver: true }),
        Animated.timing(slideAnim, { toValue: -12, duration: 180, useNativeDriver: true }),
      ]).start();
      return;
    }

    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 220, useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: 0, duration: 220, useNativeDriver: true }),
    ]).start();
  }, [showSetupNotification, fadeAnim, slideAnim]);

  /*
  |--------------------------------------------------------------------------
  | DASHBOARD API
  |--------------------------------------------------------------------------
  */

  useEffect(() => {
    const fetchDashboardData =
      async () => {
        try {
          const headers = {
            Authorization: `Bearer ${user.token}`,
            Accept: 'application/json',
          };

          const [
            overviewRes,
            methodsRes,
          ] = await Promise.all([
            fetch(
              `${API_BASE_URL}/admin/dashboard/overview`,
              {
                headers,
              }
            ),

            fetch(
              `${API_BASE_URL}/admin/dashboard/entry-methods`,
              {
                headers,
              }
            ),
          ]);

          if (overviewRes.ok) {
            const overviewData =
              await overviewRes.json();

            setOverview(overviewData.data);
          }

          if (methodsRes.ok) {
            const methodsData =
              await methodsRes.json();

            const totalMethods =
              methodsData.data.reduce(
                (sum, item) =>
                  sum + item.count,
                0
              );

            const mappedMethods =
              methodsData.data
                .map(item => ({
                  method: item.label,
                  percentage:
                    totalMethods > 0
                      ? Math.round(
                          (item.count /
                            totalMethods) *
                            100
                        )
                      : 0,
                  count: item.count,
                }))
                .sort(
                  (a, b) =>
                    b.percentage -
                    a.percentage
                );

            setMethods(
              mappedMethods
            );
          }
        } catch (err) {
          console.error(
            'Failed to fetch admin dashboard stats:',
            err
          );
        } finally {
          setLoading(false);
        }
      };

    if (user?.token) {
      fetchDashboardData();
    } else {
      setLoading(false);
    }
  }, [user]);

  /*
  |--------------------------------------------------------------------------
  | LIVE FEED
  |--------------------------------------------------------------------------
  */

  const liveFeed = (
    Array.isArray(attendance)
      ? attendance
      : []
  )
    .filter(
      record =>
        feedFilter === 'All' ||
        record.status === feedFilter
    )
    .filter(record => {
      const query =
        appliedSearch
          .trim()
          .toLowerCase();

      if (!query) {
        return true;
      }

      return [
        record.name,
        record.department,
        record.status,
        record.location,
      ].some(value =>
        value
          ?.toLowerCase()
          .includes(query)
      );
    })
    .slice(0, 5);

  /*
  |--------------------------------------------------------------------------
  | SECURITY / COMPLIANCE
  |--------------------------------------------------------------------------
  */

  const safeAttendance =
    Array.isArray(attendance)
      ? attendance
      : [];

  const safeNotifications =
    Array.isArray(adminNotifs)
      ? adminNotifs
      : [];

  const verifiedRecords =
    safeAttendance.filter(
      record =>
        record.status === 'Present' ||
        record.status === 'Late'
    ).length;

  const verificationAccuracy =
    safeAttendance.length
      ? (
          (verifiedRecords /
            safeAttendance.length) *
          100
        ).toFixed(1)
      : '0.0';

  /*
  |--------------------------------------------------------------------------
  | TREND DATA
  |--------------------------------------------------------------------------
  */

  const trendData =
    getAttendanceTrendData(
      safeAttendance,
      selectedPeriod
    );

  /*
  |--------------------------------------------------------------------------
  | LOADING
  |--------------------------------------------------------------------------
  */

  if (loading) {
    return (
      <View
        style={[
          styles.container,
          {
            justifyContent:
              'center',
            alignItems:
              'center',
          },
        ]}
      >
        <ActivityIndicator
          size="large"
          color={
            colors.primary
          }
        />
      </View>
    );
  }

  /*
  |--------------------------------------------------------------------------
  | EXPORT
  |--------------------------------------------------------------------------
  */

  const exportDashboardData =
    async () => {
      if (!user?.token) {
        Alert.alert('Export unavailable', 'Please sign in again before exporting.');
        return;
      }

      try {
        const response = await fetch(`${API_BASE_URL}/admin/reports/export`, {
          headers: {
            Authorization: `Bearer ${user.token}`,
            Accept: 'text/csv',
          },
        });

        if (!response.ok) {
          throw new Error('The attendance export could not be generated.');
        }

        if (Platform.OS === 'web') {
          const blob = await response.blob();
          const url = URL.createObjectURL(blob);
          const link = document.createElement('a');
          link.href = url;
          link.download = 'dashboard-export.csv';
          link.click();
          URL.revokeObjectURL(url);
          return;
        }

        Alert.alert('Export ready', 'The attendance export was generated by the server.');
      } catch (error) {
        Alert.alert('Export failed', error.message || 'Unable to export attendance data.');
      }
      return;
    };

  /*
  |--------------------------------------------------------------------------
  | UI
  |--------------------------------------------------------------------------
  */

  return (
    <View style={styles.containerWrapper}>
      {showSetupNotification && (
        <Animated.View
          pointerEvents="box-none"
          style={[
            styles.setupNotificationOverlay,
            {
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }],
            },
          ]}
        >
          <View style={styles.setupNotificationCard}>
            <View style={styles.setupNotificationHeader}>
              <View style={styles.setupNotificationBadge}>
                <Sparkles size={18} color={colors.white} />
              </View>

              <View style={styles.setupNotificationTitleWrap}>
                <Text style={styles.setupNotificationTitle}>Complete your organisation setup</Text>
                <Text style={styles.setupNotificationSubtitle}>Get your team, departments, and devices ready.</Text>
              </View>

              <TouchableOpacity
                onPress={dismissSetupNotification}
                accessibilityLabel="Dismiss onboarding notification"
                style={styles.setupNotificationCloseButton}
              >
                <X size={16} color={colors.slate[500]} />
              </TouchableOpacity>
            </View>

            <Text style={styles.setupNotificationMessage}>
              Finish onboarding to add departments, employees, kiosks, and attendance settings for a smooth rollout.
            </Text>

            <View style={styles.setupNotificationProgressWrap}>
              <View style={styles.setupNotificationProgressRow}>
                <Text style={styles.setupNotificationProgressLabel}>Setup progress</Text>
                <Text style={styles.setupNotificationProgressValue}>4 of 5 steps</Text>
              </View>

              <View style={styles.setupNotificationProgressBar}>
                <View style={styles.setupNotificationProgressFill} />
              </View>
            </View>

            <View style={styles.setupNotificationActions}>
              <TouchableOpacity style={styles.setupNotificationSecondaryButton} onPress={dismissSetupNotification}>
                <Text style={styles.setupNotificationSecondaryText}>Skip</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.setupNotificationPrimaryButton} onPress={openOrganizationSetup}>
                <Text style={styles.setupNotificationPrimaryText}>Continue setup</Text>
                <ArrowRight size={16} color={colors.white} />
              </TouchableOpacity>
            </View>

            <TouchableOpacity style={styles.setupNotificationSimpleAction} onPress={dismissSetupNotification}>
              <Text style={styles.setupNotificationSimpleText}>Got it</Text>
            </TouchableOpacity>
          </View>
        </Animated.View>
      )}

      <ScrollView
        style={styles.container}
      >
      <View
        style={styles.header}
      >
        <Text
          style={styles.title}
        >
          {t(
            'operationalOverview'
          )}
        </Text>

        <Text
          style={styles.subtitle}
        >
          {t(
            'operationalSubtitle'
          )}
        </Text>

        <View
          style={styles.actions}
        >
          <TouchableOpacity
            style={
              styles.btnSecondary
            }
            onPress={() =>
              setSelectedPeriod(
                selectedPeriod ===
                  'Day'
                  ? 'Week'
                  : selectedPeriod ===
                      'Week'
                    ? 'Month'
                    : 'Day'
              )
            }
          >
            <Calendar
              size={16}
              color={
                colors.slate[700]
              }
            />

            <Text
              style={
                styles.btnSecondaryText
              }
            >
              {selectedPeriod ===
              'Day'
                ? 'Today'
                : selectedPeriod ===
                    'Week'
                  ? 'Last 7 Days'
                  : 'Last 30 Days'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={
              styles.btnPrimary
            }
            onPress={
              exportDashboardData
            }
          >
            <Download
              size={16}
              color={
                colors.white
              }
            />

            <Text
              style={
                styles.btnPrimaryText
              }
            >
              {t(
                'exportData'
              )}
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* METRICS */}

      <View
        style={
          styles.metricsGrid
        }
      >
        <StatCard
          title={t(
            'totalEmployees'
          )}
          value={
            overview?.total_employees ||
            0
          }
          icon={Users}
          change="Current"
        />

        <StatCard
          title="Total Departments"
          value={overview?.total_departments || 0}
          icon={Building2}
          change="Current"
        />

        <StatCard
          title={t(
            'averageAttendance'
          )}
          value={`${overview?.average_attendance || 0}%`}
          icon={Clock}
          change="Monthly Avg"
        />

        <StatCard
          title={t(
            'activeLocations'
          )}
          value={
            overview?.active_locations ||
            0
          }
          icon={MapPin}
          change="Active"
        />

        <StatCard
          title={t(
            'pendingAlerts'
          )}
          value={
            overview?.pending_alerts ||
            0
          }
          icon={
            AlertCircle
          }
          change="Unread"
        />
      </View>

      <View style={styles.dailyStatsSection}>
        <View style={styles.dailyStatsHeader}>
          <Text style={styles.dailyStatsTitle}>Daily attendance</Text>
          <Text style={styles.dailyStatsSubtitle}>Today&apos;s attendance status</Text>
        </View>
        <View style={styles.dailyMetricsGrid}>

        <StatCard
          title="Present today"
          value={overview?.today_attendance?.present || 0}
          icon={CheckCircle}
          change="Today"
        />

        <StatCard
          title="Late today"
          value={overview?.today_attendance?.late || 0}
          icon={Clock}
          change="Today"
        />

        <StatCard
          title="Absent today"
          value={overview?.today_attendance?.absent || 0}
          icon={XCircle}
          change="Today"
        />

        <StatCard
          title="Not yet marked"
          value={overview?.today_attendance?.not_yet_marked || 0}
          icon={HelpCircle}
          change="Today"
        />
        </View>
      </View>

      {/* ANALYTICS */}

      <View
        style={
          styles.analyticsRow
        }
      >
        <AttendanceTrendChartCard
          data={trendData}
          selectedPeriod={
            selectedPeriod
          }
          onPeriodChange={
            setSelectedPeriod
          }
        />

        <View
          style={
            styles.methodCard
          }
        >
          <Text
            style={
              styles.sectionTitle
            }
          >
            {t(
              'methodOfEntry'
            )}
          </Text>

          {(methods || []).map(
            (item, idx) => (
              <View
                key={idx}
                style={
                  styles.progressRow
                }
              >
                <View
                  style={
                    styles.progressLabel
                  }
                >
                  <Text
                    style={
                      styles.progressText
                    }
                  >
                    {
                      item.method
                    }
                  </Text>

                  <Text
                    style={
                      styles.progressValue
                    }
                  >
                    {
                      item.percentage
                    }%
                  </Text>
                </View>

                <View
                  style={
                    styles.progressBarBg
                  }
                >
                  <View
                    style={[
                      styles.progressBarFill,
                      {
                        width: `${item.percentage}%`,
                        backgroundColor:
                          getMethodColor(
                            item.percentage
                          ),
                      },
                    ]}
                  />
                </View>
              </View>
            )
          )}
        </View>
      </View>

      {/* SECURITY */}

      <View
        style={
          styles.securityCard
        }
      >
        <View
          style={
            styles.securityHeader
          }
        >
          <View>
            <Text
              style={
                styles.sectionTitle
              }
            >
              {t(
                'securityInsights'
              )}
            </Text>

            <Text
              style={
                styles.securitySubtitle
              }
            >
              {t(
                'securitySubtitle'
              )}
            </Text>
          </View>

          <ShieldCheck
            size={24}
            color={
              colors.green[600]
            }
          />
        </View>

        <View
          style={styles.insightRow}
        >
          <View
            style={[
              styles.insightIcon,
              styles.alertIcon,
            ]}
          >
            <ShieldAlert
              size={18}
              color={
                colors.danger
              }
            />
          </View>

          <View
            style={
              styles.insightInfo
            }
          >
            <Text
              style={
                styles.insightTitle
              }
            >
              {t(
                'securityAlerts'
              )}
            </Text>

            <Text
              style={
                styles.insightDescription
              }
            >
              {t(
                'unreadAlerts'
              )}
            </Text>
          </View>

          <Text
            style={
              styles.insightValue
            }
          >
            {
              safeNotifications.filter(
                notification =>
                  !notification.read
              ).length
            }
          </Text>
        </View>

        <View
          style={styles.insightRow}
        >
          <View
            style={[
              styles.insightIcon,
              styles.activityIcon,
            ]}
          >
            <Activity
              size={18}
              color={
                colors.orange[600]
              }
            />
          </View>

          <View
            style={
              styles.insightInfo
            }
          >
            <Text
              style={
                styles.insightTitle
              }
            >
              {t(
                'lateCheckIns'
              )}
            </Text>

            <Text
              style={
                styles.insightDescription
              }
            >
              {t(
                'lateRecords'
              )}
            </Text>
          </View>

          <Text
            style={
              styles.insightValue
            }
          >
            {
              safeAttendance.filter(
                record =>
                  record.status ===
                  'Late'
              ).length
            }
          </Text>
        </View>

        <View
          style={styles.insightRow}
        >
          <View
            style={[
              styles.insightIcon,
              styles.verifiedIcon,
            ]}
          >
            <ShieldCheck
              size={18}
              color={
                colors.green[600]
              }
            />
          </View>

          <View
            style={
              styles.insightInfo
            }
          >
            <Text
              style={
                styles.insightTitle
              }
            >
              {t(
                'verifiedAttendance'
              )}
            </Text>

            <Text
              style={
                styles.insightDescription
              }
            >
              {t(
                'verifiedRecords'
              )}
            </Text>
          </View>

          <Text
            style={
              styles.insightValue
            }
          >
            {
              safeAttendance.filter(
                record =>
                  record.status ===
                  'Present'
              ).length
            }
          </Text>
        </View>
      </View>

      {/* LIVE FEED */}

      <View
        style={styles.section}
      >
        <Text
          style={
            styles.sectionTitle
          }
        >
          {t('liveFeed')}
        </Text>

        <View
          style={
            styles.feedSearchRow
          }
        >
          <TextInput
            style={
              styles.feedSearchInput
            }
            value={
              searchText
            }
            onChangeText={
              setSearchText
            }
            placeholder={t(
              'searchAttendance'
            )}
            placeholderTextColor={
              colors.slate[400]
            }
            autoCapitalize="none"
            returnKeyType="search"
            onSubmitEditing={() =>
              setAppliedSearch(
                searchText
              )
            }
          />

          <TouchableOpacity
            style={
              styles.feedFilterButton
            }
            onPress={() =>
              setAppliedSearch(
                searchText
              )
            }
          >
            <Text
              style={
                styles.feedFilterButtonText
              }
            >
              {t('filter')}
            </Text>
          </TouchableOpacity>
        </View>

        <View
          style={styles.feedHeader}
        >
          <View
            style={
              styles.feedFilters
            }
          >
            {FEED_FILTERS.map(
              filter => (
                <TouchableOpacity
                  key={filter}
                  style={[
                    styles.feedFilter,
                    feedFilter ===
                      filter &&
                      styles.feedFilterActive,
                  ]}
                  onPress={() =>
                    setFeedFilter(
                      filter
                    )
                  }
                  accessibilityRole="button"
                  accessibilityState={{
                    selected:
                      feedFilter ===
                      filter,
                  }}
                >
                  <Text
                    style={[
                      styles.feedFilterText,
                      feedFilter ===
                        filter &&
                        styles.feedFilterTextActive,
                    ]}
                  >
                    {filter}
                  </Text>
                </TouchableOpacity>
              )
            )}
          </View>
        </View>

        <View
          style={
            styles.listContainer
          }
        >
          {liveFeed.map(row => (
            <View
              key={row.id}
              style={styles.card}
            >
              <View
                style={
                  styles.cardHeader
                }
              >
                <Image
                  source={{
                    uri:
                      row.avatar ||
                      `https://ui-avatars.com/api/?name=${encodeURIComponent(
                        row.name ||
                          'User'
                      )}&background=1e293b&color=fff&size=150`,
                  }}
                  style={
                    styles.avatar
                  }
                />

                <View
                  style={
                    styles.cardInfo
                  }
                >
                  <Text
                    style={
                      styles.empName
                    }
                  >
                    {row.name}
                  </Text>

                  <Text
                    style={
                      styles.empDate
                    }
                  >
                    {formatAttendanceDate(
                      row?.date
                    )}
                  </Text>
                </View>

                <View
                  style={[
                    styles.statusPill,
                    row.status ===
                      'Present'
                      ? styles.presentPill
                      : row.status ===
                          'Late'
                        ? styles.latePill
                        : styles.absentPill,
                  ]}
                >
                  <Text
                    style={[
                      styles.statusText,
                      row.status ===
                        'Present'
                        ? styles.presentText
                        : row.status ===
                            'Late'
                          ? styles.lateText
                          : styles.absentText,
                    ]}
                  >
                    {
                      row.status
                    }
                  </Text>
                </View>
              </View>

              <View
                style={
                  styles.cardDetails
                }
              >
                <View
                  style={
                    styles.detailRow
                  }
                >
                  <View
                    style={
                      styles.detailItem
                    }
                  >
                    <Clock
                      size={14}
                      color={
                        colors.slate[400]
                      }
                    />

                    <Text
                      style={
                        styles.detailLabel
                      }
                    >
                      In:
                    </Text>

                    <Text
                      style={
                        styles.detailValue
                      }
                    >
                      {
                        row.timestamp
                      }
                    </Text>
                  </View>

                  <View
                    style={
                      styles.detailItem
                    }
                  >
                    <MapPin
                      size={14}
                      color={
                        colors.slate[400]
                      }
                    />

                    <Text
                      style={
                        styles.detailLabel
                      }
                    >
                      Loc:
                    </Text>

                    <Text
                      style={
                        styles.detailValue
                      }
                    >
                      {
                        row.location
                      }
                    </Text>
                  </View>
                </View>
              </View>
            </View>
          ))}
        </View>

        {!liveFeed.length && (
          <Text
            style={
              styles.emptyFeedText
            }
          >
            {t(
              'noMatchingAttendance'
            )}
          </Text>
        )}
      </View>

      {/* COMPLIANCE */}

      <View
        style={
          styles.complianceSection
        }
      >
        <Text
          style={
            styles.sectionTitle
          }
        >
          {t(
            'complianceSnapshot'
          )}
        </Text>

        <View
          style={
            styles.complianceCards
          }
        >
          <View
            style={
              styles.complianceCard
            }
          >
            <View
              style={[
                styles.complianceIcon,
                styles.accuracyIcon,
              ]}
            >
              <ShieldCheck
                size={20}
                color={
                  colors.green[600]
                }
              />
            </View>

            <Text
              style={
                styles.complianceLabel
              }
            >
              {t(
                'verificationAccuracy'
              )}
            </Text>

            <Text
              style={[
                styles.complianceValue,
                styles.accuracyValue,
              ]}
            >
              {
                verificationAccuracy
              }%
            </Text>

            <Text
              style={
                styles.complianceHint
              }
            >
              {t(
                'verifiedAttendanceRecords'
              )}
            </Text>
          </View>

          <View
            style={
              styles.complianceCard
            }
          >
            <View
              style={[
                styles.complianceIcon,
                styles.responseIcon,
              ]}
            >
              <Clock
                size={20}
                color={
                  colors.orange[600]
                }
              />
            </View>

            <Text
              style={
                styles.complianceLabel
              }
            >
              {t(
                'averageResponse'
              )}
            </Text>

            <Text
              style={[
                styles.complianceValue,
                styles.responseValue,
              ]}
            >
              1.8s
            </Text>

            <Text
              style={
                styles.complianceHint
              }
            >
              {t(
                'averageVerification'
              )}
            </Text>
          </View>
        </View>
      </View>

      {/* DEEPER INSIGHTS */}

      <View
        style={
          styles.insightActionsSection
        }
      >
        <Text
          style={
            styles.sectionTitle
          }
        >
          {t(
            'deeperInsight'
          )}
        </Text>

        <TouchableOpacity
          style={
            styles.insightActionButton
          }
          onPress={() =>
            Alert.alert(
              'Report Builder',
              'Report Builder is ready to be connected.'
            )
          }
        >
          <FileText
            size={19}
            color={
              colors.white
            }
          />

          <Text
            style={
              styles.insightActionText
            }
          >
            {t(
              'reportBuilder'
            )}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={
            styles.insightActionButton
          }
          onPress={() =>
            Alert.alert(
              'API Documentation',
              'API documentation is ready to be connected.'
            )
          }
        >
          <Code2
            size={19}
            color={
              colors.white
            }
          />

          <Text
            style={
              styles.insightActionText
            }
          >
            {t(
              'apiDocumentation'
            )}
          </Text>
        </TouchableOpacity>
      </View>

      {/* OPERATIONS */}

      <View
        style={
          styles.operationsFooter
        }
      >
        <Text
          style={
            styles.operationsTitle
          }
        >
          {t('operations')}
        </Text>

        <Text
          style={
            styles.operationsSubtitle
          }
        >
          {t(
            'professionalStandards'
          )}
        </Text>

        <View
          style={
            styles.securityLinks
          }
        >
          <TouchableOpacity
            style={
              styles.securityLink
            }
            onPress={() =>
              Alert.alert(
                'Security Policy',
                'Security policy information is available to authorized administrators.'
              )
            }
          >
            <LockKeyhole
              size={16}
              color={
                colors.slate[300]
              }
            />

            <Text
              style={
                styles.securityLinkText
              }
            >
              {t(
                'securityPolicy'
              )}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={
              styles.securityLink
            }
            onPress={() =>
              Alert.alert(
                'Security Standards',
                'Security standards information is available to authorized administrators.'
              )
            }
          >
            <ShieldCheck
              size={16}
              color={
                colors.slate[300]
              }
            />

            <Text
              style={
                styles.securityLinkText
              }
            >
              {t(
                'securityStandards'
              )}
            </Text>
          </TouchableOpacity>

          <View
            style={
              styles.securityLink
            }
          >
            <Server
              size={16}
              color={
                colors.green[300]
              }
            />

            <Text
              style={
                styles.securityLinkText
              }
            >
              {t(
                'systemHealth'
              )}
            </Text>

            <CheckCircle2
              size={14}
              color={
                colors.green[300]
              }
            />
          </View>
        </View>
      </View>
        </ScrollView>
    </View>
  );
};

/*
|--------------------------------------------------------------------------
| STYLES
|--------------------------------------------------------------------------
*/

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor:
      colors.slate[50],
  },

  topBar: {
    height: 64,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent:
      'space-between',
    paddingHorizontal:
      spacing.md,
    backgroundColor:
      colors.white,
    borderBottomWidth: 1,
    borderBottomColor:
      colors.slate[200],
    zIndex: 20,
  },

  logo: {
    width: 42,
    height: 42,
    resizeMode: 'contain',
  },

  containerWrapper: {
    flex: 1,
    backgroundColor: colors.slate[50],
    position: 'relative',
  },

  container: {
    flex: 1,
    backgroundColor:
      colors.slate[50],
  },

  setupNotificationOverlay: {
    position: 'absolute',
    top: 18,
    right: 16,
    left: 16,
    zIndex: 30,
  },

  setupNotificationCard: {
    backgroundColor: colors.white,
    borderRadius: 20,
    padding: 16,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.18,
    shadowRadius: 18,
    elevation: 12,
    borderWidth: 1,
    borderColor: 'rgba(136, 19, 55, 0.12)',
  },

  setupNotificationHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    marginBottom: 10,
  },

  setupNotificationBadge: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: colors.pink[800],
    alignItems: 'center',
    justifyContent: 'center',
  },

  setupNotificationTitleWrap: {
    flex: 1,
  },

  setupNotificationTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: colors.slate[900],
    letterSpacing: 0.2,
  },

  setupNotificationSubtitle: {
    fontSize: 12,
    color: colors.slate[500],
    marginTop: 2,
  },

  setupNotificationCloseButton: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.slate[100],
  },

  setupNotificationMessage: {
    fontSize: 13,
    lineHeight: 20,
    color: colors.slate[600],
    marginBottom: 14,
  },

  setupNotificationProgressWrap: {
    marginBottom: 14,
  },

  setupNotificationProgressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },

  setupNotificationProgressLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.slate[600],
  },

  setupNotificationProgressValue: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.pink[800],
  },

  setupNotificationProgressBar: {
    height: 8,
    backgroundColor: colors.slate[200],
    borderRadius: 999,
    overflow: 'hidden',
  },

  setupNotificationProgressFill: {
    width: '80%',
    height: '100%',
    backgroundColor: colors.pink[800],
    borderRadius: 999,
  },

  setupNotificationActions: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 8,
  },

  setupNotificationSecondaryButton: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.slate[200],
    backgroundColor: colors.white,
    alignItems: 'center',
    justifyContent: 'center',
  },

  setupNotificationSecondaryText: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.slate[700],
  },

  setupNotificationPrimaryButton: {
    flex: 1.4,
    paddingVertical: 11,
    paddingHorizontal: 12,
    borderRadius: 10,
    backgroundColor: colors.pink[800],
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 6,
  },

  setupNotificationPrimaryText: {
    color: colors.white,
    fontSize: 13,
    fontWeight: '700',
  },

  setupNotificationSimpleAction: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },

  setupNotificationSimpleText: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.pink[800],
  },

  header: {
    padding: spacing.md,
    backgroundColor:
      colors.slate[100],
    borderBottomWidth: 1,
    borderBottomColor:
      colors.slate[200],
  },

  headerTools: {
    flexDirection: 'row',
    justifyContent:
      'flex-end',
    alignItems: 'center',
    gap: spacing.md,
  },

  notificationButton: {
    width: 36,
    height: 36,
    justifyContent:
      'center',
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
    backgroundColor:
      colors.danger,
    justifyContent:
      'center',
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
    borderColor:
      colors.white,
  },

  profileAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor:
      colors.slate[200],
  },

  profileMenu: {
    position: 'absolute',
    zIndex: 10,
    top: 62,
    right: spacing.md,
    width: 250,
    backgroundColor:
      colors.white,
    borderRadius: 10,
    borderWidth: 1,
    borderColor:
      colors.slate[200],
    paddingVertical:
      spacing.sm,
    shadowColor:
      colors.black,
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.14,
    shadowRadius: 10,
    elevation: 6,
  },

  profileMenuHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal:
      spacing.md,
    paddingVertical:
      spacing.sm,
    gap: spacing.sm,
  },

  menuAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor:
      colors.slate[200],
  },

  menuTitle: {
    fontSize: 14,
    fontWeight: '700',
    color:
      colors.slate[900],
  },

  menuEmail: {
    fontSize: 12,
    color:
      colors.slate[500],
    marginTop: 2,
  },

  menuDivider: {
    height: 1,
    backgroundColor:
      colors.slate[200],
    marginVertical:
      spacing.xs,
  },

  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal:
      spacing.md,
    paddingVertical: 11,
  },

  menuItemText: {
    fontSize: 14,
    color:
      colors.slate[700],
  },

  signOutText: {
    fontSize: 14,
    color:
      colors.danger,
    fontWeight: '600',
  },

  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color:
      colors.slate[900],
  },

  subtitle: {
    fontSize: 14,
    color:
      colors.slate[500],
    marginTop: spacing.xs,
    marginBottom:
      spacing.md,
  },

  actions: {
    flexDirection: 'row',
    gap: spacing.sm,
  },

  btnSecondary: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent:
      'center',
    backgroundColor:
      colors.white,
    borderWidth: 1,
    borderColor:
      colors.slate[200],
    borderRadius: 8,
    paddingVertical: 10,
    gap: 8,
  },

  btnSecondaryText: {
    color:
      colors.slate[700],
    fontWeight: '600',
  },

  btnPrimary: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent:
      'center',
    backgroundColor:
      colors.pink[800],
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
    justifyContent:
      'space-between',
    padding: spacing.md,
  },

  dailyStatsSection: {
    marginHorizontal: spacing.md,
    marginBottom: spacing.md,
    backgroundColor: colors.slate[50],
    borderWidth: 1,
    borderColor: colors.slate[200],
    borderRadius: 16,
    paddingTop: spacing.md,
  },

  dailyStatsHeader: {
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.xs,
  },

  dailyStatsTitle: {
    color: colors.slate[900],
    fontSize: 16,
    fontWeight: '800',
  },

  dailyStatsSubtitle: {
    color: colors.slate[500],
    fontSize: 12,
    marginTop: 3,
  },

  dailyMetricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    padding: spacing.md,
  },

  analyticsRow: {
    flexDirection: 'column',
    marginHorizontal:
      spacing.md,
    marginBottom:
      spacing.md,
  },

  methodCard: {
    width: '100%',
    backgroundColor:
      colors.white,
    padding: spacing.md,
    borderRadius: 16,
    borderWidth: 1,
    borderColor:
      colors.slate[200],
  },

  securityCard: {
    width: 'auto',
    marginHorizontal:
      spacing.md,
    marginBottom:
      spacing.md,
    backgroundColor:
      colors.white,
    padding: spacing.md,
    borderRadius: 16,
    borderWidth: 1,
    borderColor:
      colors.slate[200],
    shadowColor:
      colors.black,
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.05,
    shadowRadius: 7,
    elevation: 2,
  },

  securityHeader: {
    flexDirection: 'row',
    alignItems:
      'flex-start',
    justifyContent:
      'space-between',
    marginBottom:
      spacing.sm,
  },

  securitySubtitle: {
    fontSize: 12,
    color:
      colors.slate[500],
    marginTop: -spacing.sm,
    marginBottom:
      spacing.sm,
  },

  insightRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical:
      spacing.sm,
    borderTopWidth: 1,
    borderTopColor:
      colors.slate[100],
  },

  insightIcon: {
    width: 34,
    height: 34,
    borderRadius: 17,
    justifyContent:
      'center',
    alignItems: 'center',
  },

  alertIcon: {
    backgroundColor:
      '#fef2f2',
  },

  activityIcon: {
    backgroundColor:
      colors.orange[50],
  },

  verifiedIcon: {
    backgroundColor:
      colors.green[50],
  },

  insightInfo: {
    flex: 1,
    marginLeft:
      spacing.sm,
  },

  insightTitle: {
    fontSize: 14,
    fontWeight: '600',
    color:
      colors.slate[800],
  },

  insightDescription: {
    fontSize: 12,
    color:
      colors.slate[500],
    marginTop: 2,
  },

  insightValue: {
    fontSize: 18,
    fontWeight: '700',
    color:
      colors.slate[900],
    marginLeft:
      spacing.sm,
  },

  iconContainer: {
    backgroundColor:
      colors.slate[50],
    padding: 8,
    borderRadius: 8,
  },

  changeText: {
    fontSize: 12,
    color:
      colors.green[700],
    backgroundColor:
      colors.green[50],
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    overflow: 'hidden',
  },

  cardTitle: {
    fontSize: 13,
    color:
      colors.slate[500],
  },

  cardValue: {
    fontSize: 22,
    fontWeight: 'bold',
    color:
      colors.slate[900],
    marginTop: 4,
  },

  section: {
    backgroundColor:
      colors.white,
    margin: spacing.md,
    padding: spacing.md,
    borderRadius: 12,
    borderWidth: 1,
    borderColor:
      colors.slate[200],
  },

  complianceSection: {
    marginHorizontal:
      spacing.md,
    marginBottom:
      spacing.md,
  },

  complianceCards: {
    flexDirection: 'row',
    gap: spacing.sm,
  },

  complianceCard: {
    flex: 1,
    backgroundColor:
      colors.white,
    padding: spacing.md,
    borderRadius: 12,
    borderWidth: 1,
    borderColor:
      colors.slate[200],
  },

  complianceIcon: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems:
      'center',
    justifyContent:
      'center',
    marginBottom:
      spacing.sm,
  },

  accuracyIcon: {
    backgroundColor:
      colors.green[50],
  },

  responseIcon: {
    backgroundColor:
      colors.orange[50],
  },

  complianceLabel: {
    fontSize: 12,
    color:
      colors.slate[500],
    fontWeight: '600',
  },

  complianceValue: {
    fontSize: 24,
    fontWeight: '700',
    marginTop:
      spacing.xs,
  },

  accuracyValue: {
    color:
      colors.green[600],
  },

  responseValue: {
    color:
      colors.orange[600],
  },

  complianceHint: {
    fontSize: 11,
    color:
      colors.slate[400],
    marginTop:
      spacing.xs,
  },

  insightActionsSection: {
    marginHorizontal:
      spacing.md,
    marginBottom:
      spacing.lg,
  },

  insightActionButton: {
    width: '100%',
    minHeight: 46,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent:
      'center',
    gap: spacing.sm,
    backgroundColor:
      colors.pink[800],
    borderRadius: 8,
    marginBottom:
      spacing.sm,
    paddingHorizontal:
      spacing.md,
  },

  insightActionText: {
    color: colors.white,
    fontSize: 14,
    fontWeight: '700',
  },

  operationsFooter: {
    backgroundColor:
      colors.white,
    paddingHorizontal:
      spacing.md,
    paddingVertical:
      spacing.lg,
    borderTopWidth: 1,
    borderTopColor:
      colors.slate[200],
  },

  operationsTitle: {
    color:
      colors.slate[900],
    fontSize: 16,
    fontWeight: '700',
  },

  operationsSubtitle: {
    color:
      colors.slate[500],
    fontSize: 12,
    marginTop:
      spacing.xs,
    marginBottom:
      spacing.md,
  },

  securityLinks: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent:
      'space-between',
  },

  securityLink: {
    flex: 1,
    minHeight: 36,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    borderTopWidth: 1,
    borderTopColor:
      colors.slate[200],
    paddingTop:
      spacing.sm,
  },

  securityLinkText: {
    flex: 1,
    color:
      colors.slate[400],
    fontSize: 11,
    fontWeight: '600',
  },

  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color:
      colors.slate[900],
    marginBottom:
      spacing.md,
  },

  feedSearchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom:
      spacing.sm,
  },

  feedSearchInput: {
    flex: 3,
    height: 42,
    borderWidth: 1,
    borderColor:
      colors.slate[300],
    borderRadius: 8,
    paddingHorizontal:
      spacing.md,
    backgroundColor:
      colors.slate[50],
    color:
      colors.slate[900],
    fontSize: 14,
  },

  feedFilterButton: {
    flex: 1,
    height: 42,
    alignItems: 'center',
    justifyContent:
      'center',
    borderRadius: 8,
    backgroundColor:
      colors.pink[800],
  },

  feedFilterButtonText: {
    color: colors.white,
    fontSize: 14,
    fontWeight: '700',
  },

  feedHeader: {
    marginBottom:
      spacing.xs,
  },

  feedFilters: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
    marginBottom:
      spacing.sm,
  },

  feedFilter: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 14,
    backgroundColor:
      colors.slate[100],
  },

  feedFilterActive: {
    backgroundColor:
      colors.pink[800],
  },

  feedFilterText: {
    fontSize: 12,
    fontWeight: '600',
    color:
      colors.slate[600],
  },

  feedFilterTextActive: {
    color: colors.white,
  },

  emptyFeedText: {
    fontSize: 13,
    color:
      colors.slate[500],
    paddingVertical:
      spacing.md,
  },

  progressRow: {
    marginBottom:
      spacing.md,
  },

  progressLabel: {
    flexDirection: 'row',
    justifyContent:
      'space-between',
    marginBottom: 4,
  },

  progressText: {
    fontSize: 14,
    color:
      colors.slate[700],
    fontWeight: '500',
  },

  progressValue: {
    fontSize: 14,
    fontWeight: 'bold',
    color:
      colors.slate[900],
  },

  progressBarBg: {
    height: 8,
    backgroundColor:
      colors.slate[100],
    borderRadius: 4,
  },

  progressBarFill: {
    height: 8,
    borderRadius: 4,
  },

  statCard: {
    width: '48%',
    marginBottom:
      spacing.sm,
    backgroundColor:
      colors.white,
    padding: spacing.md,
    borderRadius: 16,
    borderWidth: 1,
    borderColor:
      colors.slate[200],
    shadowColor:
      colors.black,
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.03,
    shadowRadius: 8,
    elevation: 2,
  },

  statCardTop: {
    flexDirection: 'row',
    justifyContent:
      'space-between',
    alignItems:
      'flex-start',
    marginBottom:
      spacing.sm,
  },

  statCardTitle: {
    fontSize: 13,
    color:
      colors.slate[500],
    fontWeight: '500',
    flex: 1,
    paddingRight: 8,
  },

  statCardBottom: {
    flexDirection: 'column',
    alignItems:
      'flex-start',
  },

  statCardValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color:
      colors.slate[900],
  },

  statCardChange: {
    fontSize: 12,
    color:
      colors.green[700],
    backgroundColor:
      colors.green[50],
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
    backgroundColor:
      colors.white,
    borderRadius: 16,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor:
      colors.slate[200],
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.03,
    shadowRadius: 8,
    elevation: 2,
  },

  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom:
      spacing.md,
  },

  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor:
      colors.slate[100],
    marginRight:
      spacing.md,
  },

  cardInfo: {
    flex: 1,
  },

  empName: {
    fontSize: 15,
    fontWeight: '700',
    color:
      colors.slate[900],
  },

  empDate: {
    fontSize: 13,
    color:
      colors.slate[500],
    marginTop: 2,
  },

  statusPill: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },

  presentPill: {
    backgroundColor:
      '#ECFDF5',
  },

  latePill: {
    backgroundColor:
      '#FFFBEB',
  },

  absentPill: {
    backgroundColor:
      '#FEF2F2',
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
    backgroundColor:
      colors.slate[50],
    borderRadius: 12,
    padding: spacing.md,
    gap: 10,
  },

  detailRow: {
    flexDirection: 'row',
    justifyContent:
      'space-between',
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
    color:
      colors.slate[500],
  },

  detailValue: {
    fontSize: 13,
    color:
      colors.slate[800],
    fontWeight: '500',
  },
});

export default AdminDashboard;

