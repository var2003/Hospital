import React, { useState, useEffect, createContext, useContext } from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Link,
  useNavigate
} from "react-router-dom";
import "./App.css";

// ————— Global Time Context —————
const TimeContext = createContext(Date.now());
function TimeProvider({ children }) {
  const [now, setNow] = useState(Date.now());
  
  useEffect(() => {
    const iv = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(iv);
  }, []);
  return <TimeContext.Provider value={now}>{children}</TimeContext.Provider>;
}
const useNow = () => useContext(TimeContext);

// ————— In-Memory DBs & Beds —————
let usersDB = JSON.parse(localStorage.getItem("usersDB")) || [];
const appointmentsDB = [];
const hospitalNames = [
  "Vijaya Hospital",
  "Gayathri Hospital",
  "Orange Hospital",
  "Brain and Spine Expert Hospital",
  "Family doctor Clinic",
  "Prema Hospitals",
  "CareFirst",
  "BVR Hospitals",
  "Kamineni Hospitals",
  "Owasis Hospitals",
  "Vivek's Skin Clinic",
  "Swarna Neuro Vision Center"
];
const hospitalBeds = {};
hospitalNames.forEach((h) => {
  hospitalBeds[h] = Array.from({ length: 30 }, (_, i) => i + 1);
});

// ————— Maps —————
const symptomsToDiagnosis = {
  fever: "Flu",
  headache: "Migraine",
  cough: "Cold",
  chestpain: "CardiacIssue",
  rash: "Allergy"
};
const diagnosisToHospitals = {
  Flu: ["Vijaya Hospital", "Gayathri Hospital", "Orange Hospital"],
  Migraine: [
    "Brain and Spine Expert Hospital",
    "Vijaya Hospital",
    "Swarna Neuro Vision Center"
  ],
  Cold: ["Family doctor Clinic", "Prema Hospitals", "CareFirst"],
  CardiacIssue: ["BVR Hospitals", "Vijaya Hospital", "Kamineni Hospitals"],
  Allergy: ["Owasis Hospitals", "Vivek's Skin Clinic", "Swarna Neuro Vision Center"]
};

// ————— BedSelector —————
function BedSelector({ hospital, onSelect, onClose }) {
  const beds = hospitalBeds[hospital];
  const [bed, setBed] = useState(null);
  const [dur, setDur] = useState({ days: 0, hrs: 0, min: 0, sec: 0 });

  const confirm = () => {
    if (bed == null) return;
    const ms =
      (dur.days * 86400 + dur.hrs * 3600 + dur.min * 60 + dur.sec) * 1000;
    if (ms <= 0) return alert("Enter a positive duration");
    onSelect(bed, ms);
    onClose();
  };

  return (
    <div className="modal-overlay">
      <div className="modal slide-up">
        <h3>Select Bed in {hospital}</h3>
        <div className="bed-grid">
          {Array.from({ length: 30 }, (_, i) => i + 1).map((n) => {
            const occupied = !beds.includes(n);
            return (
              <button
                key={n}
                disabled={occupied}
                className={`bed-btn ${occupied ? "occupied" : ""} ${
                  bed === n ? "selected" : ""
                }`}
                onClick={() => setBed(n)}
              >
                {n}
              </button>
            );
          })}
        </div>
        <div className="duration-inputs">
          {["days", "hrs", "min", "sec"].map((k) => (
            <label key={k}>
              {k[0].toUpperCase() + k.slice(1)}:
              <input
                type="number"
                min="0"
                value={dur[k]}
                onChange={(e) =>
                  setDur((d) => ({ ...d, [k]: Number(e.target.value) }))
                }
              />
            </label>
          ))}
        </div>
        <div className="modal-actions">
          <button onClick={confirm} disabled={bed == null}>
            Confirm
          </button>
          <button onClick={onClose}>Cancel</button>
        </div>
      </div>
    </div>
  );
}

// ————— Auth & Role —————
function RoleSelect() {
  const navigate = useNavigate();
  return (
    <div className="role-select-container">
      <h1 className="role-select-title">Select Role</h1>
      <div className="role-buttons">
        <button
          className="role-btn twinkle"
          onClick={() => navigate("/auth?role=patient")}
        >
          Patient
        </button>
        <button
          className="role-btn twinkle"
          onClick={() => navigate("/auth?role=doctor")}
        >
          Doctor
        </button>
      </div>
    </div>
  );
}

function RegisterLogin({ setRole, setUser }) {
  const [u, setU] = useState(""), [p, setP] = useState(""), [login, setLogin] = useState(true);
  const nav = useNavigate();
  const role = new URLSearchParams(window.location.search).get("role");

  const submit = () => {
    let db = JSON.parse(localStorage.getItem("usersDB")) || [];
    const found = db.find((x) => x.username === u);
    if (login) {
      if (found && found.password === p) {
        setUser(found);
        setRole(found.role);
        localStorage.setItem("currentUser", JSON.stringify(found));
        nav(found.role === "patient" ? "/symptoms" : "/doctor");
      } else alert("Invalid");
    } else {
      if (found) return alert("Exists");
      if (!["patient", "doctor"].includes(role)) return alert("Bad role");
      const nu = { username: u, password: p, role };
      db.push(nu);
      localStorage.setItem("usersDB", JSON.stringify(db));
      setUser(nu);
      setRole(role);
      localStorage.setItem("currentUser", JSON.stringify(nu));
      nav(role === "patient" ? "/symptoms" : "/doctor");
    }
  };

  return (
    <div className="container fade-in">
      <div className="card auth-card">
        <h2>{login ? "Login" : "Register"} as {role}</h2>
        <input placeholder="Username" onChange={(e) => setU(e.target.value)} />
        <input type="password" placeholder="Password" onChange={(e) => setP(e.target.value)} />
        <button onClick={submit}>{login ? "Login" : "Register"}</button>
        <p className="link-text" onClick={() => setLogin((l) => !l)}>
          {login ? "New user? Register" : "Have an account? Login"}
        </p>
      </div>
    </div>
  );
}

// ————— Symptoms —————
function Symptoms({ user }) {
  const [sel, setSel] = useState([]);
  const nav = useNavigate();
  const toggle = (s) =>
    setSel((a) => (a.includes(s) ? a.filter((x) => x !== s) : [...a, s]));
  const go = () => {
    const diag = [...new Set(sel.map((s) => symptomsToDiagnosis[s]))];
    const hosp = diag.flatMap((d) => diagnosisToHospitals[d]);
    localStorage.setItem("diagnosis", JSON.stringify(diag));
    localStorage.setItem("hospitals", JSON.stringify(hosp));
    nav("/hospitals");
  };
  return (
    <div className="container fade-in">
      <h2>Select Symptoms</h2>
      {Object.keys(symptomsToDiagnosis).map((s) => (
        <label key={s}><input type="checkbox" onChange={() => toggle(s)} /> {s}</label>
      ))}
      <div className="button-row">
        <button onClick={go}>Diagnose</button>
        <button onClick={() => nav("/appointments")}>Appointments</button>
        <button onClick={() => nav("/reports")}>Reports</button>
      </div>
    </div>
  );
}

// ————— HospitalList —————
function HospitalList({ user }) {
  const now = useNow();
  const nav = useNavigate();
  const diag = JSON.parse(localStorage.getItem("diagnosis") || "[]");
  const hosp = JSON.parse(localStorage.getItem("hospitals") || "[]");
  const request = (h) => {
    appointmentsDB.push({
      patient: user.username,
      hospital: h,
      status: "Pending",
      report: "",
      bedAllocated: false,
      bedNumber: null,
      startAt: null,
      expireAt: null
    });
    alert("Requested!");
    nav("/symptoms");
  };

  return (
    <div className="container fade-in">
      <h3>Diagnosis: {diag.join(", ")}</h3>
      <h2>Hospitals</h2>
      {hosp.map((h) => (
        <div key={h} className="card">
          <p><strong>{h}</strong></p>
          <p><strong>Available Beds:</strong> {hospitalBeds[h].length} / 30</p>
          <button onClick={() => request(h)}>Request Appointment</button>
        </div>
      ))}
    </div>
  );
}

// ————— AppointmentStatus —————
function AppointmentStatus({ user }) {
  const now = useNow();
  const apps = appointmentsDB.filter((a) => a.patient === user.username);
  return (
    <div className="container fade-in">
      <h2>Your Appointments</h2>
      {apps.length === 0 ? (
        <p>No appointments.</p>
      ) : (
        apps.map((a, i) => (
          <div key={i} className="card">
            <p><strong>Hospital:</strong> {a.hospital}</p>
            <p><strong>Status:</strong> {a.status}</p>
            <p><strong>Bed:</strong> {a.bedAllocated ? `#${a.bedNumber}` : "N/A"}</p>
            {a.expireAt && (
              <p><strong>Time Left:</strong> {Math.max(0, Math.floor((a.expireAt - now) / 1000))}s</p>
            )}
          </div>
        ))
      )}
    </div>
  );
}

// ————— ReportView —————
function ReportView({ user }) {
  const rpt = appointmentsDB.filter((a) => a.patient === user.username && a.report);
  return (
    <div className="container fade-in">
      <h2>Your Reports</h2>
      {rpt.length === 0 ? (
        <p>No reports.</p>
      ) : (
        rpt.map((r, i) => (
          <div key={i} className="card">
            <p><strong>{r.hospital}</strong></p>
            <p>{r.report}</p>
          </div>
        ))
      )}
    </div>
  );
}

// ————— DoctorView —————
function DoctorView({ user }) {
  const now = useNow();
  const [apps, setApps] = useState(appointmentsDB);
  const [sel, setSel] = useState({ show: false, idx: null });
  const refresh = () => setApps([...appointmentsDB]);

  // Auto-deallocate
  useEffect(() => {
    appointmentsDB.forEach((a) => {
      if (a.bedAllocated && a.expireAt <= now) {
        hospitalBeds[a.hospital].push(a.bedNumber);
        Object.assign(a, {
          bedAllocated: false,
          bedNumber: null,
          startAt: null,
          expireAt: null,
          status: "Completed"
        });
      }
    });
    refresh();
  }, [now]);

  const accept = (i) => { apps[i].status = "Accepted"; refresh(); };
  const decline = (i) => { apps[i].status = "Declined"; refresh(); };
  const report = (i) => { apps[i].report = prompt("Notes:"); refresh(); };
  const openSel = (i) => setSel({ show: true, idx: i });
  const closeSel = () => setSel({ show: false, idx: null });
  const allocate = (b, ms) => {
    const a = apps[sel.idx], t = Date.now();
    hospitalBeds[a.hospital] = hospitalBeds[a.hospital].filter((x) => x !== b);
    Object.assign(a, {
      bedAllocated: true,
      bedNumber: b,
      startAt: t,
      expireAt: t + ms,
      status: "Bed Allocated"
    });
    closeSel(); refresh();
  };

  return (
    <div className="container fade-in">
      <h2>Doctor Dashboard</h2>
      {apps.length === 0 ? (
        <p>No appointments.</p>
      ) : (
        apps.map((a, i) => (
          <div key={i} className="card">
            <p><strong>Patient:</strong> {a.patient}</p>
            <p><strong>Hospital:</strong> {a.hospital}</p>
            <p><strong>Status:</strong> {a.status}</p>
            <p><strong>Bed:</strong> {a.bedAllocated ? `#${a.bedNumber}` : "None"}</p>
            {a.expireAt && (
              <p><strong>Time Left:</strong> {Math.max(0, Math.floor((a.expireAt - now) / 1000))}s</p>
            )}
            <p><strong>Report:</strong> {a.report || "N/A"}</p>
            {a.status === "Pending" && (
              <>
                <button onClick={() => accept(i)}>Accept</button>
                <button onClick={() => decline(i)}>Decline</button>
              </>
            )}
            <button onClick={() => report(i)}>Add Report</button>
            {!a.bedAllocated ? (
              <button onClick={() => openSel(i)}>Allocate Bed</button>
            ) : (
              <button
                onClick={() => {
                  hospitalBeds[a.hospital].push(a.bedNumber);
                  Object.assign(a, {
                    bedAllocated: false,
                    bedNumber: null,
                    startAt: null,
                    expireAt: null,
                    status: "Discharged"
                  });
                  refresh();
                }}
              >
                Discharge Now
              </button>
            )}
          </div>
        ))
      )}
      {sel.show && (
        <BedSelector
          hospital={apps[sel.idx].hospital}
          onSelect={allocate}
          onClose={closeSel}
        />
      )}
    </div>
  );
}

// ————— Main App & Routes —————
export default function App() {
  const [user, setUser] = useState(null);
  const [role, setRole] = useState(null);

  useEffect(() => {
    const cur = localStorage.getItem("currentUser");
    if (cur) {
      const u = JSON.parse(cur);
      setUser(u);
      setRole(u.role);
    }
  }, []);

  return (
    <TimeProvider>
      <Router>
        <header><h1>MedConnect Portal</h1></header>
        <nav>
          <Link to="/">Home</Link>
          {user && <Link to="/symptoms">Symptoms</Link>}
          {user && <Link to="/hospitals">Hospitals</Link>}
          {user && <Link to="/appointments">Appointments</Link>}
          {user && <Link to="/reports">Reports</Link>}
          {user && (
            <Link
              to="/"
              onClick={() => {
                localStorage.removeItem("currentUser");
                setUser(null);
                setRole(null);
              }}
            >
              Logout
            </Link>
          )}
        </nav>
        <Routes>
          <Route path="/" element={<RoleSelect />} />
          <Route path="/auth" element={<RegisterLogin setRole={setRole} setUser={setUser} />} />
          <Route path="/symptoms" element={user ? <Symptoms user={user} /> : <RoleSelect />} />
          <Route path="/hospitals" element={user ? <HospitalList user={user} /> : <RoleSelect />} />
          <Route path="/appointments" element={user ? <AppointmentStatus user={user} /> : <RoleSelect />} />
          <Route path="/reports" element={user ? <ReportView user={user} /> : <RoleSelect />} />
          <Route path="/doctor" element={user && role === "doctor" ? <DoctorView user={user} /> : <RoleSelect />} />
        </Routes>
      </Router>
    </TimeProvider>
  );
}
