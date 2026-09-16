import React, { useState, useCallback } from "react";
import {
  View, Text, ScrollView, TouchableOpacity,
  ActivityIndicator, Alert, StyleSheet,
} from "react-native";
import { useTheme } from "../context/ThemeContext";
import { useData } from "../context/DataContext";
import { useAuth } from "../context/AuthContext";
import { API_BASE_URL } from "../config";
import { File, Directory, Paths } from "expo-file-system";
import * as Sharing from "expo-sharing";
import * as Print from "expo-print";
import {
  FileDown, FileText, Share2, ChevronDown,
  Calendar, Users, BarChart2, AlertCircle, CheckCircle,
} from "lucide-react-native";

const pad = (n) => String(n).padStart(2, "0");
const toDateStr = (d) => `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}`;
const todayStr  = () => toDateStr(new Date());
const daysAgo   = (n) => { const d=new Date(); d.setDate(d.getDate()-n); return toDateStr(d); };
const startOfWeek  = () => { const d=new Date(); const day=d.getDay(); d.setDate(d.getDate()-day+(day===0?-6:1)); return toDateStr(d); };
const startOfMonth = () => { const d=new Date(); d.setDate(1); return toDateStr(d); };

const fmtDate = (iso) => {
  const d = new Date(iso + "T00:00:00");
  return d.toLocaleDateString(undefined, { day:"2-digit", month:"short", year:"numeric" });
};

const csvCell = (v) => {
  if (v===null||v===undefined) return "";
  const s=String(v);
  if (s.includes(",")||s.includes('"')||s.includes("\n")) return `"${s.replace(/"/g,'""')}"`;
  return s;
};

const buildCSV = (data, from, to) => {
  const rows=[
    "PRESENZA Attendance Report",
    `Period: ${fmtDate(from)} to ${fmtDate(to)}`,
    "",
    ["Employee Code","Name","Department","Position","Date","Check In","Check Out","Status","Hours","Late","---","Expected Days","Present","Late Days","Absent","Rate (%)","Total Hours"].map(csvCell).join(","),
  ];
  data.employees.forEach(emp=>{
    const s=emp.summary;
    emp.records.forEach((rec,i)=>{
      const sp=i===0?[s.expected_days,s.present_days,s.late_days,s.absent_days,s.attendance_rate,s.total_hours]:["","","","","",""];
      rows.push([emp.employee.employee_code,emp.employee.full_name,emp.employee.department??"",emp.employee.position??"",rec.date,rec.check_in??"",rec.check_out??"",rec.status,rec.total_hours??"",rec.is_late?"Yes":"No","",...sp].map(csvCell).join(","));
    });
    if(emp.records.length===0){
      rows.push([emp.employee.employee_code,emp.employee.full_name,emp.employee.department??"",emp.employee.position??"","","","","","","","",s.expected_days,s.present_days,s.late_days,s.absent_days,s.attendance_rate,s.total_hours].map(csvCell).join(","));
    }
  });
  return rows.join("\n");
};

const buildHTML = (data, from, to) => {
  const empBlocks=data.employees.map(emp=>{
    const s=emp.summary; const e=emp.employee;
    const recRows=emp.records.map(rec=>`<tr class="${rec.is_late?"late":rec.status==="absent"?"absent":""}"><td>${rec.date}</td><td>${rec.check_in??"\u2014"}</td><td>${rec.check_out??"\u2014"}</td><td><span class="badge badge-${rec.status}">${rec.status}</span></td><td>${rec.total_hours!=null?rec.total_hours+"h":"\u2014"}</td></tr>`).join("");
    return `<div class="eb"><h2>${e.full_name} <span class="code">(${e.employee_code})</span></h2><p class="meta">${[e.department,e.position].filter(Boolean).join(" \u00b7 ")}</p><div class="sg"><div class="stat"><span class="sv">${s.expected_days}</span><span class="sl">Expected</span></div><div class="stat"><span class="sv green">${s.present_days}</span><span class="sl">Present</span></div><div class="stat"><span class="sv amber">${s.late_days}</span><span class="sl">Late</span></div><div class="stat"><span class="sv red">${s.absent_days}</span><span class="sl">Absent</span></div><div class="stat"><span class="sv">${s.attendance_rate}%</span><span class="sl">Rate</span></div><div class="stat"><span class="sv blue">${s.total_hours}h</span><span class="sl">Hours</span></div></div><table><thead><tr><th>Date</th><th>Check In</th><th>Check Out</th><th>Status</th><th>Hours</th></tr></thead><tbody>${recRows}</tbody></table></div>`;
  }).join("");
  return `<!DOCTYPE html><html><head><meta charset="UTF-8"/><style>body{font-family:Arial,sans-serif;font-size:12px;color:#0f172a;margin:0;padding:20px}h1{font-size:20px;color:#9d174d;margin:0 0 4px}.sub{color:#64748b;font-size:13px;margin-bottom:24px}h2{font-size:15px;margin:0 0 2px;color:#1e293b}.code{font-size:12px;color:#64748b}.meta{color:#64748b;font-size:11px;margin:0 0 12px}.eb{margin-bottom:32px;page-break-inside:avoid}.sg{display:flex;gap:10px;margin-bottom:12px;flex-wrap:wrap}.stat{background:#f1f5f9;border-radius:6px;padding:8px 12px;text-align:center;min-width:64px}.sv{display:block;font-size:18px;font-weight:bold}.sl{font-size:10px;color:#64748b}.green{color:#16a34a}.amber{color:#d97706}.red{color:#dc2626}.blue{color:#2563eb}table{width:100%;border-collapse:collapse}th{background:#9d174d;color:#fff;padding:6px 8px;text-align:left;font-size:11px}td{padding:5px 8px;border-bottom:1px solid #e2e8f0;font-size:11px}tr.late td{background:#fffbeb}tr.absent td{background:#fff1f2}.badge{display:inline-block;padding:2px 6px;border-radius:99px;font-size:10px;text-transform:capitalize}.badge-present{background:#dcfce7;color:#166534}.badge-late{background:#fef9c3;color:#854d0e}.badge-absent{background:#fee2e2;color:#991b1b}.badge-pending{background:#e0e7ff;color:#3730a3}</style></head><body><h1>PRESENZA Attendance Report</h1><p class="sub">Period: ${fmtDate(from)} \u2013 ${fmtDate(to)}</p>${empBlocks}</body></html>`;
};

const PRESETS=[
  {label:"Today",         getRange:()=>({from:todayStr(),to:todayStr()})},
  {label:"This Week",     getRange:()=>({from:startOfWeek(),to:todayStr()})},
  {label:"This Month",    getRange:()=>({from:startOfMonth(),to:todayStr()})},
  {label:"Last 30 Days",  getRange:()=>({from:daysAgo(29),to:todayStr()})},
  {label:"Last 3 Months", getRange:()=>({from:daysAgo(89),to:todayStr()})},
];

export default function AdminReports() {
  const { isDark } = useTheme();
  const { employees } = useData();
  const { token } = useAuth();

  const [preset, setPreset] = useState(3);
  const [from, setFrom] = useState(daysAgo(29));
  const [to, setTo] = useState(todayStr());
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [showPicker, setShowPicker] = useState(false);
  const [status, setStatus] = useState("idle");
  const [error, setError] = useState(null);
  const [reportData, setReportData] = useState(null);

  const c = isDark ? dark : light;

  const selectPreset = (i) => {
    const r = PRESETS[i].getRange();
    setPreset(i); setFrom(r.from); setTo(r.to);
    setReportData(null); setStatus("idle");
  };

  const generate = useCallback(async () => {
    setStatus("generating"); setError(null); setReportData(null);
    try {
      const p = new URLSearchParams({ from, to });
      if (selectedEmployee) p.append("employee_id", selectedEmployee.id);
      const res = await fetch(`${API_BASE_URL}/admin/reports/attendance?${p}`, {
        headers: { Authorization: `Bearer ${token}`, Accept: "application/json" },
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.message ?? `Server error ${res.status}`);
      setReportData(json.data); setStatus("ready");
    } catch (e) { setError(e.message ?? "Failed to generate report"); setStatus("error"); }
  }, [from, to, selectedEmployee, token]);

  const downloadCSV = useCallback(async () => {
    try {
      const csv = buildCSV(reportData, from, to);
      const cacheDir = new Directory(Paths.cache);
      if (!cacheDir.exists) {
        cacheDir.create({ intermediates: true });
      }
      const file = new File(cacheDir, `presenza-report-${from}-to-${to}.csv`);
      file.create({ overwrite: true });
      file.write(csv);

      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(file.uri, {
          mimeType: "text/csv",
          dialogTitle: "Save / Share CSV",
        });
      } else {
        Alert.alert("Saved", file.uri);
      }
    } catch (e) {
      Alert.alert("Error", e.message ?? "Could not export CSV");
    }
  }, [reportData, from, to]);

  const downloadPDF = useCallback(async () => {
    try {
      const { uri: pdfUri } = await Print.printToFileAsync({
        html: buildHTML(reportData, from, to),
        base64: false,
      });

      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(pdfUri, {
          mimeType: "application/pdf",
          dialogTitle: "Save / Share PDF",
        });
      } else {
        Alert.alert("Saved", pdfUri);
      }
    } catch (e) {
      Alert.alert("Error", e.message ?? "Could not generate PDF");
    }
  }, [reportData, from, to]);

  const totals = reportData && reportData.employees.length > 1
    ? reportData.employees.reduce((a,e)=>({ expected:a.expected+e.summary.expected_days, present:a.present+e.summary.present_days, late:a.late+e.summary.late_days, absent:a.absent+e.summary.absent_days, hours:a.hours+e.summary.total_hours }),{expected:0,present:0,late:0,absent:0,hours:0})
    : null;

  return (
    <ScrollView style={[S.container,{backgroundColor:c.bg}]} contentContainerStyle={S.content}>
      <View style={S.hRow}><BarChart2 size={22} color="#9d174d" strokeWidth={2}/><Text style={[S.heading,{color:c.text}]}>Attendance Reports</Text></View>
      <Text style={[S.sub,{color:c.muted}]}>Generate, download and share attendance data.</Text>

      <Text style={[S.label,{color:c.muted}]}>DATE RANGE</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={S.pillRow}>
        {PRESETS.map((p,i)=>(
          <TouchableOpacity key={p.label} style={[S.pill,{backgroundColor:preset===i?"#9d174d":c.pill}]} onPress={()=>selectPreset(i)}>
            <Text style={[S.pillText,{color:preset===i?"#fff":c.text}]}>{p.label}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
      <Text style={[S.rangeText,{color:c.muted}]}>{fmtDate(from)} \u2014 {fmtDate(to)}</Text>

      <Text style={[S.label,{color:c.muted}]}>EMPLOYEE</Text>
      <TouchableOpacity style={[S.dropdown,{backgroundColor:c.card,borderColor:c.border}]} onPress={()=>setShowPicker(v=>!v)}>
        <Users size={16} color={c.muted}/>
        <Text style={[S.dropdownText,{color:c.text}]}>{selectedEmployee?selectedEmployee.name:"All Employees"}</Text>
        <ChevronDown size={16} color={c.muted}/>
      </TouchableOpacity>
      {showPicker&&(
        <View style={[S.pickerList,{backgroundColor:c.card,borderColor:c.border}]}>
          <TouchableOpacity style={S.pRow} onPress={()=>{setSelectedEmployee(null);setShowPicker(false);setStatus("idle");setReportData(null);}}>
            <Text style={[S.pText,{color:c.text},...(!selectedEmployee?[S.activeText]:[])]} >All Employees</Text>
          </TouchableOpacity>
          {employees.map(emp=>(
            <TouchableOpacity key={emp.id} style={S.pRow} onPress={()=>{setSelectedEmployee(emp);setShowPicker(false);setStatus("idle");setReportData(null);}}>
              <Text style={[S.pText,{color:c.text},...(selectedEmployee?.id===emp.id?[S.activeText]:[])]}>{emp.name}</Text>
              {emp.role?<Text style={[S.pSub,{color:c.muted}]}>{emp.role}</Text>:null}
            </TouchableOpacity>
          ))}
        </View>
      )}

      <TouchableOpacity style={[S.genBtn,status==="generating"&&S.genBtnOff]} onPress={generate} disabled={status==="generating"}>
        {status==="generating"
          ?<ActivityIndicator color="#fff" size="small"/>
          :<><Calendar size={18} color="#fff" strokeWidth={2.5}/><Text style={S.genBtnText}>Generate Report</Text></>
        }
      </TouchableOpacity>
      {status==="generating"&&<Text style={[S.hint,{color:c.muted}]}>Fetching data, please wait\u2026</Text>}

      {status==="error"&&(
        <View style={[S.errBox,{backgroundColor:isDark?"#3b0a12":"#fff1f2",borderColor:"#fca5a5"}]}>
          <AlertCircle size={18} color="#dc2626"/>
          <Text style={S.errText}>{error}</Text>
        </View>
      )}

      {status==="ready"&&reportData&&(<>
        <View style={[S.okBanner,{backgroundColor:isDark?"#052e16":"#f0fdf4",borderColor:"#86efac"}]}>
          <CheckCircle size={16} color="#16a34a"/>
          <Text style={[S.okText,{color:isDark?"#86efac":"#166534"}]}>
            Report ready \u00b7 {reportData.employees.length} employee{reportData.employees.length!==1?"s":""}
          </Text>
        </View>

        {totals&&(
          <View style={[S.totCard,{backgroundColor:c.card}]}>
            <Text style={[S.totTitle,{color:c.text}]}>Overall Summary</Text>
            <View style={S.totRow}>
              {[{l:"Expected",v:totals.expected,col:c.text},{l:"Present",v:totals.present,col:"#16a34a"},{l:"Late",v:totals.late,col:"#d97706"},{l:"Absent",v:totals.absent,col:"#dc2626"},{l:"Hours",v:totals.hours.toFixed(1)+"h",col:"#2563eb"}].map(st=>(
                <View key={st.l} style={S.totStat}><Text style={[S.totVal,{color:st.col}]}>{st.v}</Text><Text style={[S.totLbl,{color:c.muted}]}>{st.l}</Text></View>
              ))}
            </View>
          </View>
        )}

        {reportData.employees.map(emp=>{
          const s=emp.summary;
          const rc=s.attendance_rate>=80?"#16a34a":s.attendance_rate>=60?"#d97706":"#dc2626";
          return (
            <View key={emp.employee.id} style={[S.empCard,{backgroundColor:c.card}]}>
              <Text style={[S.empName,{color:c.text}]}>{emp.employee.full_name}</Text>
              <Text style={[S.empMeta,{color:c.muted}]}>{[emp.employee.employee_code,emp.employee.department,emp.employee.position].filter(Boolean).join(" \u00b7 ")}</Text>
              <View style={S.empStats}>
                {[{l:"Expected",v:s.expected_days,col:c.text},{l:"Present",v:s.present_days,col:"#16a34a"},{l:"Late",v:s.late_days,col:"#d97706"},{l:"Absent",v:s.absent_days,col:"#dc2626"},{l:"Rate",v:`${s.attendance_rate}%`,col:rc},{l:"Hours",v:`${s.total_hours}h`,col:"#2563eb"}].map(st=>(
                  <View key={st.l} style={[S.empStat,{backgroundColor:isDark?"#334155":"#f8fafc"}]}>
                    <Text style={[S.empStatV,{color:st.col}]}>{st.v}</Text>
                    <Text style={[S.empStatL,{color:c.muted}]}>{st.l}</Text>
                  </View>
                ))}
              </View>
            </View>
          );
        })}

        <Text style={[S.label,{color:c.muted,marginTop:20}]}>DOWNLOAD</Text>
        <TouchableOpacity style={[S.dlBtn,{backgroundColor:"#0f766e"}]} onPress={downloadCSV}>
          <FileDown size={18} color="#fff" strokeWidth={2}/><Text style={S.dlText}>Download CSV</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[S.dlBtn,{backgroundColor:"#9d174d"}]} onPress={downloadPDF}>
          <FileText size={18} color="#fff" strokeWidth={2}/><Text style={S.dlText}>Download PDF</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[S.dlBtn,{backgroundColor:c.shareBg,borderWidth:1,borderColor:c.border}]} onPress={downloadCSV}>
          <Share2 size={18} color={c.text} strokeWidth={2}/><Text style={[S.dlText,{color:c.text}]}>Share Report</Text>
        </TouchableOpacity>
      </>)}

      <View style={{height:60}}/>
    </ScrollView>
  );
}

const light={bg:"#f8fafc",card:"#ffffff",text:"#0f172a",muted:"#64748b",border:"#e2e8f0",pill:"#f1f5f9",shareBg:"#f1f5f9"};
const dark ={bg:"#0f172a",card:"#1e293b",text:"#f1f5f9",muted:"#94a3b8",border:"#334155",pill:"#1e293b",shareBg:"#1e293b"};

const S = StyleSheet.create({
  container:{flex:1}, content:{padding:16},
  hRow:{flexDirection:"row",alignItems:"center",gap:8,marginBottom:4},
  heading:{fontSize:22,fontWeight:"700"}, sub:{fontSize:13,marginBottom:20},
  label:{fontSize:11,fontWeight:"600",letterSpacing:0.8,marginBottom:8},
  pillRow:{flexDirection:"row",marginBottom:6},
  pill:{paddingHorizontal:14,paddingVertical:8,borderRadius:99,marginRight:8},
  pillText:{fontSize:13,fontWeight:"500"}, rangeText:{fontSize:12,marginBottom:18},
  dropdown:{flexDirection:"row",alignItems:"center",gap:8,padding:12,borderRadius:10,borderWidth:1,marginBottom:6},
  dropdownText:{flex:1,fontSize:14},
  pickerList:{borderRadius:10,borderWidth:1,marginBottom:16,overflow:"hidden"},
  pRow:{padding:12,borderBottomWidth:1,borderBottomColor:"#e2e8f0"},
  pText:{fontSize:14}, pSub:{fontSize:11,marginTop:2}, activeText:{fontWeight:"700",color:"#9d174d"},
  genBtn:{flexDirection:"row",alignItems:"center",justifyContent:"center",gap:8,backgroundColor:"#9d174d",padding:14,borderRadius:12,marginTop:8,marginBottom:4},
  genBtnOff:{opacity:0.7}, genBtnText:{color:"#fff",fontSize:16,fontWeight:"600"},
  hint:{textAlign:"center",fontSize:12,marginBottom:12},
  errBox:{flexDirection:"row",alignItems:"flex-start",gap:8,padding:12,borderRadius:10,borderWidth:1,marginTop:12},
  errText:{flex:1,color:"#dc2626",fontSize:13},
  okBanner:{flexDirection:"row",alignItems:"center",gap:8,padding:10,borderRadius:10,borderWidth:1,marginTop:16,marginBottom:12},
  okText:{fontSize:13,fontWeight:"500"},
  totCard:{borderRadius:12,padding:16,marginBottom:12},
  totTitle:{fontSize:14,fontWeight:"600",marginBottom:10},
  totRow:{flexDirection:"row",flexWrap:"wrap",gap:8},
  totStat:{alignItems:"center",minWidth:52}, totVal:{fontSize:18,fontWeight:"700"}, totLbl:{fontSize:10},
  empCard:{borderRadius:12,padding:16,marginBottom:10},
  empName:{fontSize:15,fontWeight:"600",marginBottom:2}, empMeta:{fontSize:11,marginBottom:10},
  empStats:{flexDirection:"row",flexWrap:"wrap",gap:6},
  empStat:{alignItems:"center",paddingVertical:6,paddingHorizontal:10,borderRadius:8,minWidth:56},
  empStatV:{fontSize:16,fontWeight:"700"}, empStatL:{fontSize:10},
  dlBtn:{flexDirection:"row",alignItems:"center",justifyContent:"center",gap:8,padding:14,borderRadius:12,marginBottom:10},
  dlText:{color:"#fff",fontSize:15,fontWeight:"600"},
});