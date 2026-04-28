import React, { useEffect, useState } from "react";
import { Calendar, momentLocalizer } from "react-big-calendar";
import moment from "moment";
import axios from "axios";
import "react-big-calendar/lib/css/react-big-calendar.css";
import style from "../component/css/Call.module.css";
import { useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";

const localizer = momentLocalizer(moment);

const CalendarForm = () => {
  const navigate = useNavigate();
  const user = useSelector((state) => state.auth.user);
  const token = useSelector((state) => state.auth.token);

  const [events, setEvents] = useState([]);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(null);
  const [eventTitle, setEventTitle] = useState("");
  const [eventStartTime, setEventStartTime] = useState("");
  const [eventEndTime, setEventEndTime] = useState("");
  const [showModal, setShowModal] = useState(false);

  const days = ["S", "M", "T", "W", "T", "F", "S"];
  const monthName = currentDate.toLocaleString("default", {
    month: "long",
    year: "numeric",
  });

  useEffect(() => {
    if (!user || !token) navigate("/login");
    else axios.defaults.headers.common["Authorization"] = `Bearer ${token}`;
  }, [user, token, navigate]);

  useEffect(() => {
    if (user?.id && token) {
      axios
        .get(`http://127.0.0.1:8000/calendar-events/user/${user.id}/`)
        .then((res) =>
          setEvents(
            res.data.map((ev) => ({
              ...ev,
              start: new Date(`${ev.date}T${ev.start_time}`),
              end: new Date(`${ev.date}T${ev.end_time}`),
            }))
          )
        )
        .catch(console.error);
    }
  }, [currentDate, user, token]);

  const getCalendarDates = (date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const startDay = firstDay.getDay();
    const totalDays = lastDay.getDate();
    const prevMonthEnd = new Date(year, month, 0).getDate();

    const prev = Array.from({ length: startDay }, (_, i) => ({
      day: prevMonthEnd - startDay + i + 1,
      current: false,
    }));
    const curr = Array.from({ length: totalDays }, (_, i) => ({
      day: i + 1,
      current: true,
    }));
    const next = Array.from(
      { length: 42 - (prev.length + curr.length) },
      (_, i) => ({ day: i + 1, current: false })
    );

    return [...prev, ...curr, ...next];
  };

  const calendarDates = getCalendarDates(currentDate);

  const goToPreviousMonth = () =>
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));

  const goToNextMonth = () =>
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));

  const isToday = (dateObj) => {
    const today = new Date();
    return (
      dateObj.current &&
      dateObj.day === today.getDate() &&
      currentDate.getMonth() === today.getMonth() &&
      currentDate.getFullYear() === today.getFullYear()
    );
  };

  const handleDateClick = (dateObj) => {
    if (!dateObj.current) return;
    const fullDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), dateObj.day);
    const formatted = moment(fullDate).format("YYYY-MM-DD");
    setSelectedDate(formatted);
    setShowModal(true);
  };

  const handleAddEvent = () => {
    if (!user?.id || !eventTitle || !selectedDate || !eventStartTime || !eventEndTime) return;

    const payload = {
      user: user.id,
      title: eventTitle,
      date: selectedDate,
      start_time: eventStartTime,
      end_time: eventEndTime,
    };

    axios
      .post("http://127.0.0.1:8000/calendar-events/", payload)
      .then((res) => {
        setEvents((prev) => [
          ...prev,
          {
            ...res.data,
            start: new Date(`${res.data.date}T${res.data.start_time}`),
            end: new Date(`${res.data.date}T${res.data.end_time}`),
          },
        ]);
        setShowModal(false);
        setEventTitle("");
        setEventStartTime("");
        setEventEndTime("");
      })
      .catch(console.error);
  };

  const handleDeleteEvent = (eventId) => {
    axios
      .delete(`http://127.0.0.1:8000/calendar-events/${eventId}/`)
      .then(() => setEvents((prev) => prev.filter((ev) => ev.id !== eventId)))
      .catch(console.error);
  };

  const eventStyleGetter = (event) => ({
    style: {
      backgroundColor: "#8f85ff",
      borderRadius: "6px",
      color: "white",
      padding: "4px",
    },
  });

  const customEventComponent = ({ event }) => (
    <div>
      {event.title}
      <span
        onClick={() => handleDeleteEvent(event.id)}
        style={{
          marginLeft: 8,
          cursor: "pointer",
          color: "#ff6b6b",
          fontWeight: "bold",
          fontSize:"10px",
          background:"#666"
        }}
        title="Delete Event"
      >
        ❌
      </span>
    </div>
  );

  return (
    <div className={style.calendarWrapper}>
      <div className={style.calendarSidebar}>
        <div className={style.monthHeader}>
          <button onClick={goToPreviousMonth}>⬇</button>
          <span>{monthName}</span>
          <button onClick={goToNextMonth}>⬆</button>
        </div>
        <div className={style.dayHeaders}>
          {days.map((day, idx) => (
            <div key={idx} className={style.dayHeader}>
              {day}
            </div>
          ))}
        </div>
        <div className={style.dateGrid}>
          {calendarDates.map((dateObj, idx) => (
            <div
              key={idx}
              className={`${style.dateCell} ${
                dateObj.current ? style.activeMonth : style.inactiveMonth
              } ${isToday(dateObj) ? style.todayDate : ""}`}
              onClick={() => handleDateClick(dateObj)}
            >
              {dateObj.day}
            </div>
          ))}
        </div>
      </div>

      <div className={style.calendarMain}>
        <Calendar
          localizer={localizer}
          events={events}
          startAccessor="start"
          endAccessor="end"
          defaultView="week"
          style={{ height: 600 }}
          eventPropGetter={eventStyleGetter}
          components={{
            event: customEventComponent,
          }}
        />
      </div>

      {showModal && (
        <div className={style.modalOverlay}>
          <div className={style.modalContent}>
            <h3>Add Event on {selectedDate}</h3>
            <input
              type="text"
              placeholder="Title"
              value={eventTitle}
              onChange={(e) => setEventTitle(e.target.value)}
            />
            <input
              type="time"
              value={eventStartTime}
              onChange={(e) => setEventStartTime(e.target.value)}
            />
            <input
              type="time"
              value={eventEndTime}
              onChange={(e) => setEventEndTime(e.target.value)}
            />
            <button onClick={handleAddEvent}>Save</button>
            <button onClick={() => setShowModal(false)}>Cancel</button>
          </div>
        </div>
      )}
    </div>
  );
};

export default CalendarForm;
