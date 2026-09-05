
import React, {
  useState,
  useMemo,
  useEffect,
  useRef,
} from 'react';

import {
  Alert,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  Platform,
  Modal,
} from 'react-native';

import DateTimePicker from '@react-native-community/datetimepicker';

import {
  CalendarDays,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Download,
  Search,
  Clock,
  MapPin,
  Fingerprint,
  X,
  CheckCircle2,
} from 'lucide-react-native';

import { colors, spacing } from '../theme';
import { useData } from '../context/DataContext';
import { useAuth } from '../context/AuthContext';
import { API_BASE_URL } from '../config';


/* =========================================================
   FILTER OPTIONS
========================================================= */

const STATUS_OPTIONS = [
  'All Statuses',
  'Present',
  'Late',
  'Absent',
];

const WEEKDAYS = [
  'All Days',
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
];


/* =========================================================
   SAFE DATE HELPERS
========================================================= */

/**
 * Check whether a Date object is valid.
 */
const isValidDate = value => {
  return (
    value instanceof Date &&
    Number.isFinite(value.getTime())
  );
};


/**
 * Safely parse dates from the Laravel API.
 *
 * Supports:
 * 2026-09-03
 * 2026-09-03 08:30:00
 * 2026-09-03T08:30:00
 * ISO timestamps
 */
const parseSafeDate = value => {
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

  // Reject obviously invalid Laravel/MySQL values
  if (
    stringValue === '0000-00-00' ||
    stringValue.startsWith('0000-00-00')
  ) {
    return null;
  }

  /*
   * YYYY-MM-DD
   */
  const dateOnlyMatch =
    /^(\d{4})-(\d{2})-(\d{2})$/.exec(
      stringValue
    );

  if (dateOnlyMatch) {
    const year = Number(dateOnlyMatch[1]);
    const month = Number(dateOnlyMatch[2]);
    const day = Number(dateOnlyMatch[3]);

    // Protect against unreasonable years
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

    if (
      !isValidDate(date)
    ) {
      return null;
    }

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
   * Laravel/MySQL DATETIME
   *
   * Example:
   * 2026-09-03 08:30:00
   */
  let normalizedValue = stringValue;

  if (
    normalizedValue.includes(' ') &&
    !normalizedValue.includes('T')
  ) {
    normalizedValue =
      normalizedValue.replace(
        ' ',
        'T'
      );
  }

  let date;

  try {
    date = new Date(
      normalizedValue
    );
  } catch (error) {
    console.warn(
      'Date parsing failed:',
      value,
      error
    );

    return null;
  }

  if (!isValidDate(date)) {
    console.warn(
      'Invalid API date:',
      value
    );

    return null;
  }

  // Protect iOS from dates outside a practical range
  const year = date.getFullYear();

  if (
    year < 1970 ||
    year > 2100
  ) {
    console.warn(
      'Date outside supported range:',
      value
    );

    return null;
  }

  return date;
};


/**
 * Convert a date to local YYYY-MM-DD.
 *
 * IMPORTANT:
 * We intentionally do NOT use toISOString()
 * because UTC conversion can change the date.
 */
const toSafeDateString = value => {
  const date = parseSafeDate(value);

  if (!date || isNaN(date.getTime())) {
    return null;
  }

  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');

  return year + '-' + month + '-' + day;
};


/**
 * Get YYYY-MM-DD only.
 */
const getDateOnly = value => {
  return (
    toSafeDateString(value) || ''
  );
};


/**
 * Format a time safely.
 */
const formatTime = value => {
  const date = parseSafeDate(value);

  if (!date || !isValidDate(date)) {
    return '---';
  }

  try {
    return date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
  } catch (error) {
    console.warn('Invalid time formatting:', value, error);
    return '---';
  }
};


/**
 * Format attendance date.
 */
const formatDisplayDate = value => {
  const date = parseSafeDate(value);

  if (!date || !isValidDate(date)) {
    return 'Unknown date';
  }

  try {
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
    });
  } catch (error) {
    console.warn('Invalid display date:', value, error);
    return 'Unknown date';
  }
};


/**
 * Format custom date button.
 */
const formatShortDate = value => {
  const date = parseSafeDate(value);

  if (!date || !isValidDate(date)) {
    return 'Custom';
  }

  try {
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
    });
  } catch (error) {
    console.warn('Invalid short date:', value, error);
    return 'Custom';
  }
};


/**
 * Get weekday name safely.
 */
const getDayName = value => {
  const date = parseSafeDate(value);

  if (!date || !isValidDate(date)) {
    return '';
  }

  try {
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
    });
  } catch (error) {
    console.warn('Invalid weekday date:', value, error);
    return '';
  }
};


/**
 * Create a valid date while preventing:
 *
 * February 31
 * April 31
 * June 31
 * etc.
 */
const createSafeDate = (
  year,
  monthIndex,
  day
) => {
  const maxDays =
    new Date(
      year,
      monthIndex + 1,
      0
    ).getDate();

  const safeDay = Math.min(
    Math.max(day, 1),
    maxDays
  );

  return new Date(
    year,
    monthIndex,
    safeDay
  );
};


/* =========================================================
   DATE SPINNER
========================================================= */

const SpinnerCol = ({
  data,
  selectedValue,
  onChange,
}) => {
  const ITEM_HEIGHT = 44;

  const scrollViewRef =
    useRef(null);

  useEffect(() => {
    const index =
      data.findIndex(
        item =>
          item.value ===
          selectedValue
      );

    if (
      index !== -1 &&
      scrollViewRef.current
    ) {
      setTimeout(() => {
        scrollViewRef.current?.scrollTo({
          y:
            index *
            ITEM_HEIGHT,
          animated: false,
        });
      }, 50);
    }
  }, [
    data,
    selectedValue,
  ]);

  return (
    <View
      style={{
        height:
          ITEM_HEIGHT * 5,
        flex: 1,
        overflow: 'hidden',
      }}
    >
      <ScrollView
        ref={scrollViewRef}
        showsVerticalScrollIndicator={
          false
        }
        snapToInterval={
          ITEM_HEIGHT
        }
        decelerationRate="fast"
        onMomentumScrollEnd={e => {
          const index =
            Math.round(
              e.nativeEvent
                .contentOffset
                .y /
                ITEM_HEIGHT
            );

          if (data[index]) {
            onChange(
              data[index].value
            );
          }
        }}
      >
        <View
          style={{
            height:
              ITEM_HEIGHT * 2,
          }}
        />

        {data.map(item => {
          const isSelected =
            item.value ===
            selectedValue;

          return (
            <View
              key={String(
                item.value
              )}
              style={{
                height:
                  ITEM_HEIGHT,
                justifyContent:
                  'center',
                alignItems:
                  'center',
              }}
            >
              <Text
                style={{
                  fontSize:
                    isSelected
                      ? 20
                      : 16,

                  color:
                    isSelected
                      ? colors
                          .pink[800]
                      : colors
                          .slate[400],

                  fontWeight:
                    isSelected
                      ? '700'
                      : '500',
                }}
              >
                {item.label}
              </Text>
            </View>
          );
        })}

        <View
          style={{
            height:
              ITEM_HEIGHT * 2,
          }}
        />
      </ScrollView>

      <View
        pointerEvents="none"
        style={{
          position:
            'absolute',

          top:
            ITEM_HEIGHT * 2,

          height:
            ITEM_HEIGHT,

          width: '100%',

          borderTopWidth: 1,
          borderBottomWidth: 1,

          borderColor:
            colors.pink[100],
        }}
      />
    </View>
  );
};


/* =========================================================
   MAIN COMPONENT
========================================================= */

const AdminAttendance = () => {
  const {
    attendance: rawAttendance,
  } = useData();
  const { user } = useAuth();


  /* =======================================================
     NORMALIZE ATTENDANCE
  ======================================================= */

  const attendance = useMemo(() => {
    if (
      !Array.isArray(
        rawAttendance
      )
    ) {
      return [];
    }

    return rawAttendance.map(
      (a, index) => {
        console.log(
  'ATTENDANCE RECORD',
  index,
  {
    id: a?.id,
    date: a?.date,
    attendance_date: a?.attendance_date,
    timeIn: a?.timeIn,
    time_in: a?.time_in,
    check_in: a?.check_in,
    timestamp: a?.timestamp,
    timeOut: a?.timeOut,
    time_out: a?.time_out,
    check_out: a?.check_out,
  }
);

        /* -------------------------------------------------
           CHECK-IN
        ------------------------------------------------- */

        const checkInDate =
          parseSafeDate(
            a?.timeIn ??
              a?.time_in ??
              a?.check_in ??
              a?.checkIn ??
              a?.timestamp
          );


        /* -------------------------------------------------
           CHECK-OUT
        ------------------------------------------------- */

        const checkOutDate =
          parseSafeDate(
            a?.timeOut ??
              a?.time_out ??
              a?.check_out ??
              a?.checkOut
          );


        /* -------------------------------------------------
           TOTAL HOURS
        ------------------------------------------------- */

        let totalHours = '0h';

        if (
          checkInDate &&
          checkOutDate
        ) {
          const diffMs =
            checkOutDate.getTime() -
            checkInDate.getTime();

          if (
            Number.isFinite(
              diffMs
            ) &&
            diffMs >= 0
          ) {
            const diffHrs =
              Math.floor(
                diffMs /
                  3600000
              );

            const diffMins =
              Math.floor(
                (diffMs %
                  3600000) /
                  60000
              );

            totalHours =
              `${diffHrs}h ${diffMins}m`;
          }
        }


        /* -------------------------------------------------
           ATTENDANCE DATE
        ------------------------------------------------- */

        const rawDate =
          a?.date ??
          a?.attendance_date ??
          a?.attendanceDate ??
          checkInDate;

        const normalizedDate =
          getDateOnly(rawDate);


        /* -------------------------------------------------
           STATUS
        ------------------------------------------------- */

        const rawStatus =
          a?.status;

        const statusValue =
          rawStatus
            ? String(
                rawStatus
              )
                .charAt(0)
                .toUpperCase() +
              String(
                rawStatus
              )
                .slice(1)
                .toLowerCase()
            : 'Absent';


        /* -------------------------------------------------
           EMPLOYEE NAME
        ------------------------------------------------- */

        const employeeName =
          a?.name ??
          a?.employee_name ??
          a?.employee?.name ??
          a?.employee?.full_name ??
          'Unknown Employee';


        /* -------------------------------------------------
           AVATAR
        ------------------------------------------------- */

        const avatar =
          a?.avatar ??
          a?.profile_image ??
          a?.employee?.avatar ??
          a?.employee
            ?.profile_image ??
          `https://ui-avatars.com/api/?name=${encodeURIComponent(
            employeeName
          )}&background=1e293b&color=fff&size=150`;


        return {
          ...a,

          id:
            a?.id ??
            `attendance-${index}`,

          employeeId:
            a?.employeeId ??
            a?.employee_id ??
            a?.employee?.id ??
            '',

          name:
            employeeName,

          date:
            normalizedDate,

          status:
            statusValue,

          timestamp:
            formatTime(
              checkInDate
            ),

          checkOut:
            formatTime(
              checkOutDate
            ),

          totalHours,

          authMethod:
            a?.method ??
            a?.auth_method ??
            a?.authMethod ??
            'Facial Recognition',

          location:
            a?.location ??
            'Main Office',

          avatar,
        };
      }
    );
  }, [rawAttendance]);


  /* =======================================================
     FILTER STATE
  ======================================================= */

  const [
    status,
    setStatus,
  ] = useState(
    'All Statuses'
  );

  const [
    selectedDay,
    setSelectedDay,
  ] = useState(
    'All Days'
  );

  const [
    customDate,
    setCustomDate,
  ] = useState(null);

  const [
    showDatePicker,
    setShowDatePicker,
  ] = useState(false);

  const [
    tempCustomDate,
    setTempCustomDate,
  ] = useState(
    new Date()
  );

  const [
    searchText,
    setSearchText,
  ] = useState('');

  const [
    appliedSearch,
    setAppliedSearch,
  ] = useState('');

  const [
    openDropdown,
    setOpenDropdown,
  ] = useState(null);

  const [
    currentPage,
    setCurrentPage,
  ] = useState(1);

  const pageSize = 10;


  /* =======================================================
     FILTER ATTENDANCE
  ======================================================= */

  const filteredAttendance =
    useMemo(() => {
      return attendance.filter(
        record => {

          const matchesStatus =
            status ===
              'All Statuses' ||
            record.status ===
              status;


          const dayName =
            getDayName(
              record.date
            );

          const matchesDay =
            selectedDay ===
              'All Days' ||
            dayName ===
              selectedDay;


          const matchesCustomDate =
            !customDate ||
            record.date ===
              customDate;


          const query =
            appliedSearch
              .toLowerCase()
              .trim();


          const matchesSearch =
            !query ||
            [
              record.name,
              record.department,
              record.date,
              record.status,
              record.location,
            ].some(value =>
              String(
                value || ''
              )
                .toLowerCase()
                .includes(
                  query
                )
            );


          return (
            matchesStatus &&
            matchesDay &&
            matchesCustomDate &&
            matchesSearch
          );
        }
      );
    }, [
      attendance,
      status,
      selectedDay,
      customDate,
      appliedSearch,
    ]);


  /* =======================================================
     PAGINATION
  ======================================================= */

  const totalPages =
    Math.max(
      1,
      Math.ceil(
        filteredAttendance.length /
          pageSize
      )
    );

  const paginatedAttendance =
    filteredAttendance.slice(
      (currentPage - 1) *
        pageSize,

      currentPage *
        pageSize
    );


  const applySearch = () => {
    setAppliedSearch(
      searchText.trim()
    );

    setCurrentPage(1);
  };


  const goToPage = page => {
    setCurrentPage(
      Math.min(
        Math.max(
          page,
          1
        ),
        totalPages
      )
    );
  };


  /* =======================================================
     DATE PICKER
  ======================================================= */

  const onDateChange = (
    event,
    date
  ) => {

    if (
      Platform.OS ===
      'android'
    ) {
      setShowDatePicker(
        false
      );
    }

    if (!date) {
      return;
    }

    if (
      !isValidDate(date)
    ) {
      console.warn(
        'Invalid date received from date picker'
      );

      return;
    }

    const dateString =
      toSafeDateString(
        date
      );

    if (!dateString) {
      return;
    }

    setCustomDate(
      dateString
    );

    setSelectedDay(
      'All Days'
    );

    setCurrentPage(1);
  };


  /* =======================================================
     EXPORT
  ======================================================= */

  const exportAttendance = async () => {
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
        link.download = 'attendance-report.csv';
        link.click();
        URL.revokeObjectURL(url);
        return;
      }

      Alert.alert('Export ready', 'The attendance export was generated by the server.');
    } catch (error) {
      Alert.alert('Export failed', error.message || 'Unable to export attendance data.');
    }
  };


  /* =======================================================
     DROPDOWN MODAL
  ======================================================= */

  const renderDropdownModal =
    () => {

      if (!openDropdown) {
        return null;
      }

      const isStatus =
        openDropdown ===
        'status';

      const options =
        isStatus
          ? STATUS_OPTIONS
          : WEEKDAYS;

      const selected =
        isStatus
          ? status
          : selectedDay;

      const onSelect =
        isStatus
          ? setStatus
          : setSelectedDay;

      const title =
        isStatus
          ? 'Select Status'
          : 'Select Day';


      return (
        <Modal
          visible
          transparent
          animationType="fade"
          onRequestClose={() =>
            setOpenDropdown(
              null
            )
          }
        >
          <View
            style={
              styles.modalOverlay
            }
          >

            <TouchableOpacity
              style={
                StyleSheet.absoluteFill
              }
              activeOpacity={1}
              onPress={() =>
                setOpenDropdown(
                  null
                )
              }
            />

            <View
              style={
                styles.modalContent
              }>

              <View
                style={
                  styles.modalHeader
                }>

                <Text
                  style={
                    styles.modalTitle
                  }>
                  {title}
                </Text>

                <TouchableOpacity
                  onPress={() =>
                    setOpenDropdown(
                      null
                    )
                  }>
                  <X
                    size={20}
                    color={
                      colors
                        .slate[400]
                    }
                  />
                </TouchableOpacity>

              </View>


              <ScrollView
                style={{
                  maxHeight: 300,
                }}>

                {options.map(
                  option => (

                    <TouchableOpacity
                      key={option}
                      style={
                        styles.modalOption
                      }
                      onPress={() => {

                        onSelect(
                          option
                        );

                        setOpenDropdown(
                          null
                        );

                        setCurrentPage(
                          1
                        );
                      }}>

                      <Text
                        style={[
                          styles.modalOptionText,

                          selected ===
                            option &&
                            styles.modalOptionTextActive,
                        ]}>
                        {option}
                      </Text>


                      {selected ===
                        option && (
                        <CheckCircle2
                          size={18}
                          color={
                            colors
                              .pink[800]
                          }
                        />
                      )}

                    </TouchableOpacity>
                  )
                )}

              </ScrollView>

            </View>
          </View>
        </Modal>
      );
    };


  /* =======================================================
     CUSTOM DATE SPINNER
  ======================================================= */

  const renderCustomSpinner =
    () => {

      const safeTempDate =
        isValidDate(
          tempCustomDate
        )
          ? tempCustomDate
          : new Date();


      const daysInMonth =
        new Date(
          safeTempDate.getFullYear(),
          safeTempDate.getMonth() +
            1,
          0
        ).getDate();


      const days =
        Array.from(
          {
            length:
              daysInMonth,
          },
          (_, i) => ({
            label: String(
              i + 1
            ),
            value: i + 1,
          })
        );


      const months =
        Array.from(
          {
            length: 12,
          },
          (_, i) => {

            const d =
              new Date(
                2020,
                i,
                1
              );

            return {
              label:
                d.toLocaleString(
                  'default',
                  {
                    month:
                      'short',
                  }
                ),

              value: i,
            };
          }
        );


      const currentYear =
        new Date().getFullYear();


      const years =
        Array.from(
          {
            length: 11,
          },
          (_, i) => {

            const year =
              currentYear -
              5 +
              i;

            return {
              label:
                String(year),

              value:
                year,
            };
          }
        );


      return (
        <Modal
          visible
          transparent
          animationType="fade"
          onRequestClose={() =>
            setShowDatePicker(
              false
            )
          }
        >

          <View
            style={
              styles.modalOverlay
            }>

            <TouchableOpacity
              style={
                StyleSheet.absoluteFill
              }
              activeOpacity={1}
              onPress={() =>
                setShowDatePicker(
                  false
                )
              }
            />


            <View
              style={
                styles.calendarContainer
              }>

              {/* HEADER */}

              <View
                style={[
                  styles.modalHeader,
                  {
                    paddingHorizontal:
                      spacing.lg,

                    borderBottomWidth:
                      0,

                    paddingBottom:
                      0,
                  },
                ]}>

                <Text
                  style={
                    styles.modalTitle
                  }>
                  Choose Date
                </Text>


                <TouchableOpacity
                  onPress={() =>
                    setShowDatePicker(
                      false
                    )
                  }>

                  <X
                    size={20}
                    color={
                      colors
                        .slate[400]
                    }
                  />

                </TouchableOpacity>

              </View>


              {/* SPINNERS */}

              <View
                style={{
                  flexDirection:
                    'row',

                  paddingHorizontal:
                    spacing.md,

                  paddingVertical:
                    spacing.lg,
                }}>

                {/* MONTH */}

                <SpinnerCol
                  data={months}

                  selectedValue={
                    safeTempDate.getMonth()
                  }

                  onChange={val => {

                    const newDate =
                      createSafeDate(
                        safeTempDate.getFullYear(),
                        val,
                        safeTempDate.getDate()
                      );

                    setTempCustomDate(
                      newDate
                    );
                  }}
                />


                {/* DAY */}

                <SpinnerCol
                  data={days}

                  selectedValue={
                    Math.min(
                      safeTempDate.getDate(),
                      daysInMonth
                    )
                  }

                  onChange={val => {

                    const newDate =
                      createSafeDate(
                        safeTempDate.getFullYear(),
                        safeTempDate.getMonth(),
                        val
                      );

                    setTempCustomDate(
                      newDate
                    );
                  }}
                />


                {/* YEAR */}

                <SpinnerCol
                  data={years}

                  selectedValue={
                    safeTempDate.getFullYear()
                  }

                  onChange={val => {

                    const newDate =
                      createSafeDate(
                        val,
                        safeTempDate.getMonth(),
                        safeTempDate.getDate()
                      );

                    setTempCustomDate(
                      newDate
                    );
                  }}
                />

              </View>


              {/* ACTIONS */}

              <View
                style={{
                  flexDirection:
                    'row',

                  borderTopWidth: 1,

                  borderColor:
                    colors
                      .slate[100],
                }}>

                {/* CANCEL */}

                <TouchableOpacity
                  style={{
                    flex: 1,

                    padding:
                      spacing.md,

                    alignItems:
                      'center',
                  }}

                  onPress={() =>
                    setShowDatePicker(
                      false
                    )
                  }>

                  <Text
                    style={{
                      fontSize: 16,

                      color:
                        colors
                          .slate[500],

                      fontWeight:
                        '600',
                    }}>
                    Cancel
                  </Text>

                </TouchableOpacity>


                <View
                  style={{
                    width: 1,

                    backgroundColor:
                      colors
                        .slate[100],
                  }}
                />


                {/* CONFIRM */}

                <TouchableOpacity
                  style={{
                    flex: 1,

                    padding:
                      spacing.md,

                    alignItems:
                      'center',
                  }}

                  onPress={() => {

                    if (
                      !isValidDate(
                        safeTempDate
                      )
                    ) {
                      return;
                    }

                    const dateString =
                      toSafeDateString(
                        safeTempDate
                      );

                    if (
                      !dateString
                    ) {
                      return;
                    }

                    setCustomDate(
                      dateString
                    );

                    setSelectedDay(
                      'All Days'
                    );

                    setCurrentPage(
                      1
                    );

                    setShowDatePicker(
                      false
                    );
                  }}>

                  <Text
                    style={{
                      fontSize: 16,

                      color:
                        colors
                          .pink[800],

                      fontWeight:
                        '700',
                    }}>
                    Confirm
                  </Text>

                </TouchableOpacity>

              </View>

            </View>
          </View>
        </Modal>
      );
    };


  /* =======================================================
     RENDER
  ======================================================= */

  return (
    <View
      style={
        styles.container
      }>

      {/* ===================================================
          SEARCH HEADER
      =================================================== */}

      <View
        style={
          styles.header
        }>

        <View
          style={
            styles.searchContainer
          }>

          <Search
            size={20}
            color={
              colors
                .slate[400]
            }
          />


          <TextInput
            style={
              styles.searchInput
            }

            value={
              searchText
            }

            onChangeText={text => {

              setSearchText(
                text
              );

              if (
                text === ''
              ) {
                setAppliedSearch(
                  ''
                );

                setCurrentPage(
                  1
                );
              }
            }}

            onSubmitEditing={
              applySearch
            }

            placeholder="Search employee, location..."

            placeholderTextColor={
              colors
                .slate[400]
            }

            returnKeyType="search"
          />


          {searchText.length >
            0 && (

            <TouchableOpacity
              style={
                styles.filterBtn
              }

              onPress={
                applySearch
              }>

              <Text
                style={
                  styles.filterBtnText
                }>
                Search
              </Text>

            </TouchableOpacity>

          )}

        </View>
      </View>


      {/* ===================================================
          CONTENT
      =================================================== */}

      <ScrollView
        contentContainerStyle={
          styles.content
        }

        showsVerticalScrollIndicator={
          false
        }>

        {/* SECTION HEADER */}

        <View
          style={
            styles.sectionHeader
          }>

          <Text
            style={
              styles.sectionTitle
            }>

            Attendance Logs (
            {
              filteredAttendance.length
            }
            )

          </Text>


          <TouchableOpacity
            style={
              styles.exportButton
            }

            onPress={
              exportAttendance
            }>

            <Download
              size={16}
              color={
                colors
                  .pink[800]
              }
            />

            <Text
              style={
                styles.exportButtonText
              }>
              Export
            </Text>

          </TouchableOpacity>

        </View>


        {/* =================================================
            FILTERS
        ================================================= */}

        <View
          style={
            styles.filtersRow
          }>

          {/* STATUS */}

          <View
            style={[
              styles.filterWrapper,
              {
                flex: 1,
              },
            ]}>

            <TouchableOpacity
              style={
                styles.dropdownButton
              }

              onPress={() =>
                setOpenDropdown(
                  'status'
                )
              }>

              <Text
                style={
                  styles.dropdownButtonText
                }>
                {status}
              </Text>

              <ChevronDown
                size={14}
                color={
                  colors
                    .slate[600]
                }
              />

            </TouchableOpacity>

          </View>


          {/* DAY */}

          <View
            style={[
              styles.filterWrapper,
              {
                flex: 1,
              },
            ]}>

            <TouchableOpacity
              style={
                styles.dropdownButton
              }

              onPress={() =>
                setOpenDropdown(
                  'day'
                )
              }>

              <Text
                style={
                  styles.dropdownButtonText
                }>
                {selectedDay}
              </Text>

              <ChevronDown
                size={14}
                color={
                  colors
                    .slate[600]
                }
              />

            </TouchableOpacity>

          </View>


          {/* CUSTOM DATE */}

          <View
            style={[
              styles.filterWrapper,
              {
                zIndex: 8,
                flex: 1,
              },
            ]}>

            <TouchableOpacity
              style={[
                styles.dropdownButton,

                customDate && {
                  borderColor:
                    colors
                      .pink[800],

                  backgroundColor:
                    colors
                      .pink[50],
                },
              ]}

              onPress={() => {

                if (
                  customDate
                ) {

                  setCustomDate(
                    null
                  );

                  setCurrentPage(
                    1
                  );

                  return;
                }


                const today =
                  new Date();

                setTempCustomDate(
                  today
                );

                setShowDatePicker(
                  true
                );
              }}>

              <CalendarDays
                size={14}
                color={
                  customDate
                    ? colors
                        .pink[800]
                    : colors
                        .slate[600]
                }
              />


              <Text
                style={[
                  styles.dropdownButtonText,

                  customDate && {
                    color:
                      colors
                        .pink[800],

                    fontWeight:
                      '600',
                  },
                ]}

                numberOfLines={
                  1
                }>

                {customDate
                  ? formatShortDate(
                      customDate
                    )
                  : 'Custom'}

              </Text>


              {customDate && (

                <X
                  size={14}
                  color={
                    colors
                      .pink[800]
                  }
                />

              )}

            </TouchableOpacity>

          </View>

        </View>


        {/* =================================================
            DATE PICKER
        ================================================= */}

        {showDatePicker &&
          (Platform.OS !==
          'android'
            ? renderCustomSpinner()
            : (
              <DateTimePicker
                value={
                  isValidDate(
                    parseSafeDate(
                      customDate
                    )
                  )
                    ? parseSafeDate(
                        customDate
                      )
                    : new Date()
                }

                mode="date"

                display="default"

                onChange={
                  onDateChange
                }
              />
            ))}


        {/* =================================================
            EMPTY STATE
        ================================================= */}

        {!filteredAttendance.length ? (

          <View
            style={
              styles.emptyState
            }>

            <CalendarDays
              size={48}
              color={
                colors
                  .slate[300]
              }
            />

            <Text
              style={
                styles.emptyText
              }>
              No attendance records
              found.
            </Text>

          </View>

        ) : (

          /* =================================================
             ATTENDANCE CARDS
          ================================================= */

          <View
            style={
              styles.listContainer
            }>

            {paginatedAttendance.map(
              record => (

                <View
                  key={
                    String(
                      record.id
                    )
                  }

                  style={
                    styles.card
                  }>

                  {/* CARD HEADER */}

                  <View
                    style={
                      styles.cardHeader
                    }>

                    <Image
                      source={{
                        uri:
                          record.avatar,
                      }}

                      style={
                        styles.avatar
                      }
                    />


                    <View
                      style={
                        styles.cardInfo
                      }>

                      <Text
                        style={
                          styles.empName
                        }>
                        {
                          record.name
                        }
                      </Text>


                      <Text
                        style={
                          styles.empDate
                        }>
                        {
                          formatDisplayDate(
                            record.date
                          )
                        }
                      </Text>

                    </View>


                    {/* STATUS */}

                    <View
                      style={[
                        styles.statusPill,

                        record.status ===
                          'Present'
                          ? styles.presentPill
                          : record.status ===
                            'Late'
                          ? styles.latePill
                          : styles.absentPill,
                      ]}>

                      <Text
                        style={[
                          styles.statusText,

                          record.status ===
                            'Present'
                            ? styles.presentText
                            : record.status ===
                              'Late'
                            ? styles.lateText
                            : styles.absentText,
                        ]}>

                        {
                          record.status
                        }

                      </Text>

                    </View>

                  </View>


                  {/* CARD DETAILS */}

                  <View
                    style={
                      styles.cardDetails
                    }>

                    {/* CHECK IN / OUT */}

                    <View
                      style={
                        styles.detailRow
                      }>

                      <View
                        style={
                          styles.detailItem
                        }>

                        <Clock
                          size={14}
                          color={
                            colors
                              .slate[400]
                          }
                        />

                        <Text
                          style={
                            styles.detailLabel
                          }>
                          In:
                        </Text>

                        <Text
                          style={
                            styles.detailValue
                          }>
                          {
                            record.timestamp
                          }
                        </Text>

                      </View>


                      <View
                        style={
                          styles.detailItem
                        }>

                        <Clock
                          size={14}
                          color={
                            colors
                              .slate[400]
                          }
                        />

                        <Text
                          style={
                            styles.detailLabel
                          }>
                          Out:
                        </Text>

                        <Text
                          style={
                            styles.detailValue
                          }>
                          {
                            record.checkOut ||
                            '---'
                          }
                        </Text>

                      </View>

                    </View>


                    {/* METHOD */}

                    <View
                      style={
                        styles.detailRow
                      }>

                      <View
                        style={
                          styles.detailItem
                        }>

                        <Fingerprint
                          size={14}
                          color={
                            colors
                              .slate[400]
                          }
                        />

                        <Text
                          style={
                            styles.detailLabel
                          }>
                          Method:
                        </Text>

                        <Text
                          style={
                            styles.detailValue
                          }>
                          {
                            record.authMethod
                          }
                        </Text>

                      </View>

                    </View>


                    {/* LOCATION / TOTAL */}

                    <View
                      style={
                        styles.detailRow
                      }>

                      <View
                        style={
                          styles.detailItem
                        }>

                        <MapPin
                          size={14}
                          color={
                            colors
                              .slate[400]
                          }
                        />

                        <Text
                          style={
                            styles.detailLabel
                          }>
                          Location:
                        </Text>

                        <Text
                          style={
                            styles.detailValue
                          }>
                          {
                            record.location
                          }
                        </Text>

                      </View>


                      {record.totalHours && (

                        <View
                          style={
                            styles.detailItem
                          }>

                          <Text
                            style={
                              styles.detailLabel
                            }>
                            Total:
                          </Text>

                          <Text
                            style={[
                              styles.detailValue,
                              {
                                fontWeight:
                                  '700',
                              },
                            ]}>
                            {
                              record.totalHours
                            }
                          </Text>

                        </View>

                      )}

                    </View>

                  </View>

                </View>

              )
            )}

          </View>

        )}


        {/* =================================================
            PAGINATION
        ================================================= */}

        {filteredAttendance.length >
          0 && (

          <View
            style={
              styles.pagination
            }>

            <Text
              style={
                styles.paginationText
              }>
              Page {currentPage} of{' '}
              {totalPages}
            </Text>


            <View
              style={
                styles.paginationActions
              }>

              {/* PREVIOUS */}

              <TouchableOpacity
                style={[
                  styles.paginationButton,

                  currentPage ===
                    1 &&
                    styles.disabledButton,
                ]}

                onPress={() =>
                  goToPage(
                    currentPage -
                      1
                  )
                }

                disabled={
                  currentPage === 1
                }>

                <ChevronLeft
                  size={18}
                  color={
                    currentPage ===
                    1
                      ? colors
                          .slate[300]
                      : colors
                          .slate[700]
                  }
                />

              </TouchableOpacity>


              {/* NEXT */}

              <TouchableOpacity
                style={[
                  styles.paginationButton,

                  currentPage ===
                    totalPages &&
                    styles.disabledButton,
                ]}

                onPress={() =>
                  goToPage(
                    currentPage +
                      1
                  )
                }

                disabled={
                  currentPage ===
                  totalPages
                }>

                <ChevronRight
                  size={18}
                  color={
                    currentPage ===
                    totalPages
                      ? colors
                          .slate[300]
                      : colors
                          .slate[700]
                  }
                />

              </TouchableOpacity>

            </View>

          </View>

        )}

      </ScrollView>


      {/* DROPDOWN */}

      {renderDropdownModal()}

    </View>
  );
};


/* =========================================================
   STYLES
========================================================= */

const styles =
  StyleSheet.create({

    container: {
      flex: 1,
      backgroundColor:
        '#F8FAFC',
    },


    header: {
      backgroundColor:
        colors.white,

      paddingHorizontal:
        spacing.xl,

      paddingVertical:
        spacing.md,

      borderBottomWidth: 1,

      borderBottomColor:
        colors.slate[200],
    },


    searchContainer: {
      flexDirection:
        'row',

      alignItems:
        'center',

      backgroundColor:
        colors.slate[50],

      borderWidth: 1,

      borderColor:
        colors.slate[200],

      borderRadius: 12,

      paddingHorizontal:
        spacing.md,

      height: 48,
    },


    searchInput: {
      flex: 1,

      marginLeft:
        spacing.sm,

      fontSize: 15,

      color:
        colors.slate[900],
    },


    filterBtn: {
      backgroundColor:
        colors.pink[800],

      paddingHorizontal: 12,

      paddingVertical: 6,

      borderRadius: 8,
    },


    filterBtnText: {
      color:
        colors.white,

      fontWeight:
        '600',

      fontSize: 13,
    },


    content: {
      padding:
        spacing.xl,

      paddingBottom: 100,
    },


    sectionHeader: {
      flexDirection:
        'row',

      justifyContent:
        'space-between',

      alignItems:
        'center',

      marginBottom:
        spacing.md,
    },


    sectionTitle: {
      fontSize: 18,

      fontWeight:
        '700',

      color:
        colors.slate[900],
    },


    exportButton: {
      flexDirection:
        'row',

      alignItems:
        'center',

      backgroundColor:
        colors.pink[50],

      paddingHorizontal: 12,

      paddingVertical: 8,

      borderRadius: 8,

      gap: 6,

      borderWidth: 1,

      borderColor:
        colors.pink[200],
    },


    exportButtonText: {
      color:
        colors.pink[800],

      fontWeight:
        '600',

      fontSize: 13,
    },


    filtersRow: {
      flexDirection:
        'row',

      gap: spacing.sm,

      marginBottom:
        spacing.lg,
    },


    filterWrapper: {
      flex: 1,

      position:
        'relative',
    },


    dropdownButton: {
      height: 44,

      flexDirection:
        'row',

      alignItems:
        'center',

      justifyContent:
        'space-between',

      gap: 5,

      borderWidth: 1,

      borderColor:
        colors.slate[200],

      borderRadius: 10,

      paddingHorizontal:
        spacing.md,

      backgroundColor:
        colors.white,
    },


    dropdownButtonText: {
      flex: 1,

      color:
        colors.slate[700],

      fontSize: 13,

      fontWeight:
        '500',
    },


    emptyState: {
      alignItems:
        'center',

      justifyContent:
        'center',

      paddingVertical: 60,
    },


    emptyText: {
      marginTop:
        spacing.md,

      fontSize: 15,

      color:
        colors.slate[500],
    },


    listContainer: {
      gap:
        spacing.md,
    },


    card: {
      backgroundColor:
        colors.white,

      borderRadius: 16,

      padding:
        spacing.lg,

      borderWidth: 1,

      borderColor:
        colors.slate[200],

      shadowColor:
        '#000',

      shadowOffset: {
        width: 0,
        height: 2,
      },

      shadowOpacity:
        0.03,

      shadowRadius:
        8,

      elevation: 2,
    },


    cardHeader: {
      flexDirection:
        'row',

      alignItems:
        'center',

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

      fontWeight:
        '700',

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

      fontWeight:
        '700',
    },


    presentText: {
      color:
        '#059669',
    },


    lateText: {
      color:
        '#D97706',
    },


    absentText: {
      color:
        '#DC2626',
    },


    cardDetails: {
      backgroundColor:
        colors.slate[50],

      borderRadius: 12,

      padding:
        spacing.md,

      gap: 10,
    },


    detailRow: {
      flexDirection:
        'row',

      justifyContent:
        'space-between',

      alignItems:
        'center',
    },


    detailItem: {
      flexDirection:
        'row',

      alignItems:
        'center',

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

      fontWeight:
        '500',
    },


    pagination: {
      flexDirection:
        'row',

      alignItems:
        'center',

      justifyContent:
        'space-between',

      marginTop:
        spacing.xl,

      paddingTop:
        spacing.md,

      borderTopWidth: 1,

      borderTopColor:
        colors.slate[200],
    },


    paginationText: {
      color:
        colors.slate[500],

      fontSize: 13,

      fontWeight:
        '500',
    },


    paginationActions: {
      flexDirection:
        'row',

      gap: spacing.sm,
    },


    paginationButton: {
      width: 36,

      height: 36,

      alignItems:
        'center',

      justifyContent:
        'center',

      borderWidth: 1,

      borderColor:
        colors.slate[300],

      borderRadius: 8,

      backgroundColor:
        colors.white,
    },


    disabledButton: {
      backgroundColor:
        colors.slate[50],

      borderColor:
        colors.slate[200],
    },


    modalOverlay: {
      flex: 1,

      backgroundColor:
        'rgba(0,0,0,0.5)',

      justifyContent:
        'center',

      alignItems:
        'center',

      padding:
        spacing.xl,
    },


    modalContent: {
      backgroundColor:
        colors.white,

      borderRadius: 16,

      width: '100%',

      maxWidth: 320,

      overflow:
        'hidden',
    },


    modalHeader: {
      flexDirection:
        'row',

      justifyContent:
        'space-between',

      alignItems:
        'center',

      padding:
        spacing.lg,

      borderBottomWidth: 1,

      borderBottomColor:
        colors.slate[200],
    },


    modalTitle: {
      fontSize: 16,

      fontWeight:
        '700',

      color:
        colors.slate[900],
    },


    modalOption: {
      flexDirection:
        'row',

      justifyContent:
        'space-between',

      alignItems:
        'center',

      paddingVertical:
        spacing.md,

      paddingHorizontal:
        spacing.lg,

      borderBottomWidth: 1,

      borderBottomColor:
        colors.slate[100],
    },


    modalOptionText: {
      fontSize: 15,

      color:
        colors.slate[700],
    },


    modalOptionTextActive: {
      color:
        colors.pink[800],

      fontWeight:
        '600',
    },


    calendarContainer: {
      backgroundColor:
        colors.white,

      borderRadius: 16,

      width: '100%',

      maxWidth: 340,

      overflow:
        'hidden',
    },
  });


export default AdminAttendance;

