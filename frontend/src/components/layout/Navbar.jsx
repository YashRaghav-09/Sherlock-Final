import { Search, Bell, CalendarDays, Clock3, LogOut, X } from "lucide-react";
import { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../services/api";
import { useLanguage } from "../../context/LanguageContext";

function timeAgo(dateString) {
  if (!dateString) return "";
  const diffMs = Date.now() - new Date(dateString).getTime();
  const minutes = Math.floor(diffMs / 60000);
  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

export default function Navbar() {
  const [time, setTime] = useState("");
  const navigate = useNavigate();
  const { t } = useLanguage();
  const officer = JSON.parse(localStorage.getItem("sherlock_officer") || "null");

  useEffect(() => {
    const update = () => {
      setTime(
        new Date().toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
        })
      );
    };
    update();
    const interval = setInterval(update, 1000);
    return () => clearInterval(interval);
  }, []);

  const date = new Date().toLocaleDateString([], {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  const handleLogout = () => {
    localStorage.removeItem("sherlock_token");
    localStorage.removeItem("sherlock_officer");
    navigate("/login");
  };

  const [notifications, setNotifications] = useState([]);
  const [notifOpen, setNotifOpen] = useState(false);
  const notifRef = useRef(null);

  useEffect(() => {
    async function buildNotifications() {
      const items = [];

      try {
        const casesRes = await api.get("/api/cases");
        const cases = Array.isArray(casesRes.data) ? casesRes.data : [];
        cases
          .filter((c) => c.priority === "Critical" || c.priority === "High")
          .forEach((c) => {
            items.push({
              id: `case-${c.id}`,
              text: t("newCaseNotif"),
              date: c.updated_at || c.date_filed,
              path: `/cases/${c.id}`,
            });
          });
      } catch {
        // skip silently
      }

      try {
        const vehiclesRes = await api.get("/api/vehicles");
        const vehicles = Array.isArray(vehiclesRes.data) ? vehiclesRes.data : [];
        vehicles
          .filter((v) => v.status === "Stolen" || v.status === "Flagged")
          .forEach((v) => {
            items.push({
              id: `vehicle-${v.id}`,
              text: t("vehicleNotif"),
              date: v.reported_date,
              path: `/vehicle/${v.id}`,
            });
          });
      } catch {
        // skip silently
      }

      items.sort((a, b) => new Date(b.date || 0) - new Date(a.date || 0));
      setNotifications(items.slice(0, 6));
    }

    buildNotifications();
  }, [t]);

  useEffect(() => {
    const handleClick = (e) => {
      if (notifRef.current && !notifRef.current.contains(e.target)) {
        setNotifOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const goToNotification = (item) => {
    setNotifOpen(false);
    if (item.path) navigate(item.path);
  };

  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const searchRef = useRef(null);

  useEffect(() => {
    const text = query.trim().toLowerCase();
    if (text.length < 2) {
      setResults([]);
      setSearchOpen(false);
      return;
    }

    const timeout = setTimeout(async () => {
      setSearching(true);
      const found = [];

      const tryFetch = async (url, mapFn) => {
        try {
          const res = await api.get(url);
          const list = Array.isArray(res.data) ? res.data : res.data?.items ?? [];
          list.forEach((item) => {
            const mapped = mapFn(item);
            if (mapped && mapped.toLowerCase().includes(text)) {
              found.push(mapped.result);
            }
          });
        } catch {
          // skip silently
        }
      };

      await Promise.all([
        tryFetch("/api/cases", (c) => ({
          toLowerCase: () => (c.title + " " + c.case_number).toLowerCase(),
          result: { type: "Case", label: c.title, path: `/cases/${c.id}` },
        })),
        tryFetch("/api/vehicles", (v) => ({
          toLowerCase: () => (v.plate_number + " " + (v.owner_name || "")).toLowerCase(),
          result: { type: "Vehicle", label: v.plate_number, path: `/vehicle/${v.id}` },
        })),
        tryFetch("/api/missing-persons", (p) => ({
          toLowerCase: () => (p.name || "").toLowerCase(),
          result: { type: "Missing Person", label: p.name, path: `/missing/${p.id}` },
        })),
      ]);

      setResults(found.slice(0, 8));
      setSearchOpen(found.length > 0);
      setSearching(false);
    }, 400);

    return () => clearTimeout(timeout);
  }, [query]);

  useEffect(() => {
    const handleClick = (e) => {
      if (searchRef.current && !searchRef.current.contains(e.target)) {
        setSearchOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const goToResult = (path) => {
    setQuery("");
    setResults([]);
    setSearchOpen(false);
    navigate(path);
  };

  return (
    <header className="h-24 px-8 bg-[#08101d] border-b border-slate-800 flex items-center justify-between shrink-0">

      <div ref={searchRef} className="relative w-full max-w-[430px] min-w-[200px] flex items-center">
        <Search
          className="absolute left-4 text-slate-400 pointer-events-none z-10"
          size={18}
        />

        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => results.length > 0 && setSearchOpen(true)}
          placeholder={t("search")}
          style={{ paddingLeft: "2.75rem" }}
          className="w-full h-12 md:h-14 rounded-2xl bg-slate-900 border border-slate-700 pr-9 text-sm md:text-base text-white placeholder:text-slate-500 outline-none focus:border-cyan-500 transition"
        />

        {query && (
          <button
            onClick={() => setQuery("")}
            className="absolute right-3 text-slate-500 hover:text-white z-10"
          >
            <X size={16} />
          </button>
        )}

        {searchOpen && (
          <div className="absolute top-full left-0 mt-2 w-full bg-slate-900 border border-slate-700 rounded-xl overflow-hidden shadow-xl z-50 max-h-80 overflow-y-auto">
            {searching && (
              <div className="px-4 py-3 text-slate-400 text-sm">{t("loading")}</div>
            )}
            {!searching && results.length === 0 && (
              <div className="px-4 py-3 text-slate-500 text-sm">No results</div>
            )}
            {results.map((r, i) => (
              <button
                key={i}
                onClick={() => goToResult(r.path)}
                className="w-full text-left px-4 py-3 hover:bg-slate-800 transition flex items-center justify-between"
              >
                <span className="text-sm">{r.label}</span>
                <span className="text-xs text-cyan-400">{r.type}</span>
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="flex items-center gap-5">
        <div className="hidden xl:flex items-center gap-2 text-slate-300">
          <CalendarDays size={18} className="text-cyan-400" />
          {date}
        </div>

        <div className="flex items-center gap-2 bg-slate-900 border border-slate-800 rounded-xl px-4 py-3">
          <Clock3 size={18} className="text-cyan-400" />
          {time}
        </div>

        <div ref={notifRef} className="relative">
          <button
            onClick={() => setNotifOpen((v) => !v)}
            className="relative bg-slate-900 border border-slate-800 rounded-xl p-3 hover:border-cyan-500 transition-colors"
          >
            <Bell
              size={20}
              className={`transition-transform duration-300 ${notifOpen ? "rotate-12" : ""}`}
            />
            {notifications.length > 0 && (
              <span className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-red-500 animate-pulse" />
            )}
          </button>

          <div
            className={`absolute right-0 top-full mt-2 w-72 bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl z-50 overflow-hidden origin-top-right transition-all duration-200 ease-out ${
              notifOpen
                ? "opacity-100 scale-100 translate-y-0 pointer-events-auto"
                : "opacity-0 scale-95 -translate-y-2 pointer-events-none"
            }`}
          >
            <div className="max-h-72 overflow-y-auto py-1">
              {notifications.length === 0 && (
                <p className="text-slate-500 text-sm text-center py-6">
                  {t("nothingNew")}
                </p>
              )}

              {notifications.map((item, i) => (
                <button
                  key={item.id}
                  onClick={() => goToNotification(item)}
                  style={{ transitionDelay: notifOpen ? `${i * 30}ms` : "0ms" }}
                  className={`w-full flex items-center justify-between gap-3 px-4 py-2.5 hover:bg-slate-800/60 transition-all duration-200 text-left ${
                    notifOpen ? "opacity-100 translate-x-0" : "opacity-0 translate-x-2"
                  }`}
                >
                  <span className="text-sm text-slate-200 truncate">{item.text}</span>
                  <span className="text-slate-500 text-xs shrink-0">{timeAgo(item.date)}</span>
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3 bg-slate-900 border border-slate-800 rounded-2xl px-4 py-2">
          <div className="w-12 h-12 rounded-full bg-gradient-to-br from-cyan-400 to-blue-700 flex items-center justify-center font-bold text-lg">
            {officer?.name ? officer.name.charAt(0) : "?"}
          </div>
          <div>
            <h3 className="font-semibold">{officer?.name || "Unknown Officer"}</h3>
            <p className="text-green-400 text-xs">● {t("online")}</p>
          </div>
        </div>

        <button
          onClick={handleLogout}
          className="bg-slate-900 border border-slate-800 rounded-xl p-3 hover:border-red-500 hover:text-red-400 transition"
          title={t("logout")}
        >
          <LogOut size={20} />
        </button>
      </div>

    </header>
  );
}