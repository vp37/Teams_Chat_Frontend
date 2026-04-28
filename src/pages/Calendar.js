// Calendar.js (React Full Working Code with Multi-Hour Time Slot Event Support)
import React, { useState, useEffect } from "react";
import axios from "axios";
import style from "../component/css/Calendar.module.css";
import { useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";

const Calendar = () => {
  const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const today = new Date();

  const [month, setMonth] = useState(today.getMonth());
  const [year, setYear] = useState(today.getFullYear());
  const [viewMode, setViewMode] = useState("month");
  const [showMonthDropdown, setShowMonthDropdown] = useState(false);
  const [showYearPopup, setShowYearPopup] = useState(false);
  const [events, setEvents] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [selectedDate, setSelectedDate] = useState("");
  const [eventTitle, setEventTitle] = useState("");
  const [eventStartTime, setEventStartTime] = useState("");
  const [eventEndTime, setEventEndTime] = useState("");
  const [todayEvents, setTodayEvents] = useState([]);
  const [showTodayPopup, setShowTodayPopup] = useState(false);
  const [selectedDay, setSelectedDay] = useState(null);

  const user = useSelector((state) => state.auth.user);
  const token = useSelector((state) => state.auth.token);
  const navigate = useNavigate();

  const currentDate = today.getDate();
  const isCurrentMonth = month === today.getMonth() && year === today.getFullYear();

  const monthNames = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];

  const getDaysInMonth = (month, year) => new Date(year, month + 1, 0).getDate();
  const getStartDay = (month, year) => new Date(year, month, 1).getDay();

  const daysInMonth = getDaysInMonth(month, year);
  const startDay = getStartDay(month, year);

  useEffect(() => {
    if (!user || !token) navigate("/login");
    else axios.defaults.headers.common["Authorization"] = `Bearer ${token}`;
  }, [user, token, navigate]);

  useEffect(() => {
    if (user?.id && token) {
      axios.get(`http://127.0.0.1:8000/calendar-events/user/${user.id}/`)
        .then((res) => {
          setEvents(res.data);
          const todayStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(currentDate).padStart(2, "0")}`;
          const todays = res.data.filter(ev => ev.date === todayStr);
          if (todays.length > 0) {
            setTodayEvents(todays);
            setShowTodayPopup(true);
          }
        })
        .catch(console.error);
    }
  }, [month, year, user, token]);

  const handleAddEvent = () => {
    if (!user?.id || !eventTitle || !selectedDate || !eventStartTime || !eventEndTime) return;

    const payload = {
      user: user.id,
      title: eventTitle,
      date: selectedDate,
      start_time: eventStartTime,
      end_time: eventEndTime,
    };

    axios.post("http://127.0.0.1:8000/calendar-events/", payload)
      .then((res) => {
        setEvents((prev) => [...prev, res.data]);
        setEventTitle("");
        setEventStartTime("");
        setEventEndTime("");
        setShowModal(false);
      })
      .catch(console.error);
  };

  const handleDeleteEvent = (eventId) => {
    axios.delete(`http://127.0.0.1:8000/calendar-events/${eventId}/`)
      .then(() => setEvents((prev) => prev.filter(ev => ev.id !== eventId)))
      .catch(console.error);
  };

  const format12Hour = (h, m) => {
    const period = h >= 12 ? "PM" : "AM";
    const hour12 = h % 12 === 0 ? 12 : h % 12;
    return `${hour12}:${m} ${period}`;
  };

  return (
    <div className={style.calendarContainer}>
      <aside className={style.calendarSidebar}>
        <h2>Calendar</h2>
        <ul>
          <li className={viewMode === "month" ? style.active : ""} onClick={() => setViewMode("month")}>Month</li>
          <li className={viewMode === "week" ? style.active : ""} onClick={() => setViewMode("week")}>Week</li>
          <li className={viewMode === "day" ? style.active : ""} onClick={() => setViewMode("day")}>Day</li>
        </ul>
      </aside>

      <main className={style.calendarMain}>
        <div className={style.calendarHeader}>
          <div className={style.calendarHeaderTitle}>
            <h1 onClick={() => setShowMonthDropdown(!showMonthDropdown)}>{monthNames[month]}</h1>
            <h1 onClick={() => setShowYearPopup(true)}>{year}</h1>
          </div>
          <div className={style.calendarControls}>
            <button onClick={() => { setMonth(today.getMonth()); setYear(today.getFullYear()); }}>Today</button>
            <button onClick={() => month === 0 ? (setMonth(11), setYear(y => y - 1)) : setMonth(m => m - 1)}>&lt;</button>
            <button onClick={() => month === 11 ? (setMonth(0), setYear(y => y + 1)) : setMonth(m => m + 1)}>&gt;</button>
          </div>
        </div>

        {showMonthDropdown && (
          <div className={style.dropdown}>
            {monthNames.map((m, idx) => <div key={idx} onClick={() => { setMonth(idx); setShowMonthDropdown(false); }}>{m}</div>)}
          </div>
        )}

        {showYearPopup && (
          <div className={style.yearPopup}>
            <div className={style.yearPopupContent}>
              <h2>Select a Year</h2>
              <div className={style.yearGrid}>
                {[...Array(100)].map((_, i) => <div key={1970 + i} onClick={() => { setYear(1970 + i); setShowYearPopup(false); }}>{1970 + i}</div>)}
              </div>
              <button onClick={() => setShowYearPopup(false)}>Close</button>
            </div>
          </div>
        )}

        {viewMode === "month" && (
          <div className={style.calendarGrid}>
            {days.map(day => <div key={day} className={style.calendarDayName}>{day}</div>)}
            {Array.from({ length: startDay }).map((_, i) => <div key={`empty-${i}`} className={style.calendarCell}></div>)}
            {Array.from({ length: daysInMonth }).map((_, i) => {
              const date = i + 1;
              const fullDate = `${year}-${String(month + 1).padStart(2, "0")}-${String(date).padStart(2, "0")}`;
              const isToday = isCurrentMonth && date === currentDate;
              const dayEvents = events.filter(ev => ev.date === fullDate);
              return (
                <div
                  key={date}
                  className={`${style.calendarCell} ${isToday ? style.today : ""}`}
                  onClick={() => {
                    setSelectedDay(fullDate);
                    setViewMode("day");
                  }}
                >
                  <span>{date}</span>
                  {dayEvents.map((ev, idx) => (
                    <div key={idx} className={style.eventItem}>
                      <strong>{ev.start_time} - {ev.end_time}</strong> {ev.title}
                      <button className={style.deleteButton} onClick={e => { e.stopPropagation(); handleDeleteEvent(ev.id); }}>❌</button>
                    </div>
                  ))}
                </div>
              );
            })}
          </div>
        )}

        {viewMode === "day" && (
          <div className={style.dayView}>
            <h2>Time Slots for {selectedDay}</h2>
            <ul className={style.slotList}>
              {Array.from({ length: 48 }).map((_, idx) => {
                const h = Math.floor(idx / 2);
                const m = idx % 2 === 0 ? "00" : "30";
                const nh = Math.floor((idx + 1) / 2);
                const nm = (idx + 1) % 2 === 0 ? "00" : "30";
                return (
                  <li key={idx} className={style.slot} onClick={() => {
                    setEventStartTime(`${String(h).padStart(2, "0")}:${m}`);
                    setEventEndTime(`${String(nh).padStart(2, "0")}:${nm}`);
                    setEventTitle("");
                    setSelectedDate(selectedDay);
                    setShowModal(true);
                  }}>
                    {format12Hour(h, m)} - {format12Hour(nh, nm)}
                  </li>
                );
              })}
            </ul>
            <div className={style.eventsOfDay}>
              <h4>Events on {selectedDay}</h4>
              <ul>
                {events.filter(ev => ev.date === selectedDay).map((ev, idx) => (
                  <li key={idx}>🕒 {ev.start_time} - {ev.end_time} - {ev.title} <button onClick={() => handleDeleteEvent(ev.id)}>❌</button></li>
                ))}
              </ul>
            </div>
          </div>
        )}
      </main>

      {showModal && (
        <div className={style.modal}>
          <div className={style.modalContent}>
            <h3>Add Event for {selectedDate}</h3>
            <input type="text" value={eventTitle} onChange={(e) => setEventTitle(e.target.value)} placeholder="Event title" />
            <div>
              <label>Start Time: </label>
              <input type="time" value={eventStartTime} onChange={(e) => setEventStartTime(e.target.value)} />
            </div>
            <div>
              <label>End Time: </label>
              <input type="time" value={eventEndTime} onChange={(e) => setEventEndTime(e.target.value)} />
            </div>
            <button onClick={handleAddEvent}>Add</button>
            <button onClick={() => setShowModal(false)}>Cancel</button>
          </div>
        </div>
      )}

      {showTodayPopup && (
        <div className={style.modal}>
          <div className={style.modalContent}>
            <h3>📅 Events Today ({today.toISOString().split("T")[0]})</h3>
            <ul>
              {todayEvents.map((ev, i) => <li key={i}>🔹 {ev.start_time} - {ev.end_time} - {ev.title}</li>)}
            </ul>
            <button onClick={() => setShowTodayPopup(false)}>Close</button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Calendar;
