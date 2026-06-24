"use client";

import { useState, useCallback, useMemo } from "react";
import { Calendar as BigCalendar, dateFnsLocalizer, View, Views } from "react-big-calendar";
import withDragAndDrop, { EventInteractionArgs } from "react-big-calendar/lib/addons/dragAndDrop";
import { format, parse, startOfWeek, getDay } from "date-fns";
import { enUS } from "date-fns/locale/en-US";
import { Calendar } from "@/components/ui/calendar";
import { toast } from "sonner";
import { Search, GripVertical, SlidersHorizontal, ChevronLeft, ChevronRight } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import "react-big-calendar/lib/addons/dragAndDrop/styles.css";

const locales = { "en-US": enUS };
const localizer = dateFnsLocalizer({ format, parse, startOfWeek, getDay, locales });
const DnDCalendar = withDragAndDrop(BigCalendar);

interface ScheduleClientProps {
  initialEvents: any[];
  unscheduledMissions: any[];
}

const EVENT_COLORS: Record<string, { bg: string; text: string; dot: string }> = {
  "Deep Work": { bg: "bg-violet-100", text: "text-violet-800", dot: "bg-violet-500" },
  "Focus":     { bg: "bg-violet-100", text: "text-violet-800", dot: "bg-violet-500" },
  "Meeting":   { bg: "bg-blue-100",   text: "text-blue-800",   dot: "bg-blue-500" },
  "Health":    { bg: "bg-green-100",  text: "text-green-800",  dot: "bg-green-500" },
  "Learning":  { bg: "bg-yellow-100", text: "text-yellow-800", dot: "bg-yellow-500" },
  "Admin":     { bg: "bg-slate-100",  text: "text-slate-700",  dot: "bg-slate-400" },
  "Personal":  { bg: "bg-orange-100", text: "text-orange-800", dot: "bg-orange-500" },
};

function getColor(type: string) {
  return EVENT_COLORS[type] ?? { bg: "bg-primary/10", text: "text-primary", dot: "bg-primary" };
}

export function ScheduleClient({ initialEvents, unscheduledMissions }: ScheduleClientProps) {
  const [events, setEvents] = useState(initialEvents);
  const [view, setView] = useState<View>(Views.WEEK);
  const [date, setDate] = useState<Date>(new Date());
  const [search, setSearch] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<any>(null);

  const handleSelectEvent = useCallback((event: any) => {
    setSelectedEvent({ ...event, isNew: false });
    setIsModalOpen(true);
  }, []);

  const handleSelectSlot = useCallback(({ start, end }: { start: Date; end: Date }) => {
    setSelectedEvent({ title: "", start, end, type: "Meeting", isNew: true });
    setIsModalOpen(true);
  }, []);

  const onEventDrop = useCallback(({ event, start, end }: EventInteractionArgs<any>) => {
    setEvents(prev => prev.map(ev => ev.id === event.id ? { ...ev, start, end } : ev));
    toast.success(`"${event.title}" rescheduled`);
  }, []);

  const onEventResize = useCallback(({ event, start, end }: EventInteractionArgs<any>) => {
    setEvents(prev => prev.map(ev => ev.id === event.id ? { ...ev, start, end } : ev));
    toast.success(`"${event.title}" resized`);
  }, []);

  const handleSaveEvent = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedEvent.title.trim()) { toast.error("Event title is required"); return; }
    if (selectedEvent.isNew) {
      setEvents(prev => [...prev, { ...selectedEvent, id: `local-${Date.now()}` }]);
      toast.success("Event created");
    } else {
      setEvents(prev => prev.map(ev => ev.id === selectedEvent.id ? selectedEvent : ev));
      toast.success("Event updated");
    }
    setIsModalOpen(false);
  };

  const handleDeleteEvent = () => {
    setEvents(prev => prev.filter(ev => ev.id !== selectedEvent.id));
    setIsModalOpen(false);
    toast.success("Event deleted");
  };

  const eventPropGetter = (event: any) => {
    const c = getColor(event.type);
    return {
      className: `!${c.bg} !${c.text} border-0 rounded-md text-xs font-medium px-1.5 py-0.5 shadow-none`,
      style: { backgroundColor: "transparent" }
    };
  };

  const filteredEvents = useMemo(() => {
    if (!search) return events;
    return events.filter(e => e.title?.toLowerCase().includes(search.toLowerCase()));
  }, [events, search]);

  const navigate = (dir: "prev" | "next" | "today") => {
    if (dir === "today") { setDate(new Date()); return; }
    const d = new Date(date);
    const delta = dir === "next" ? 1 : -1;
    if (view === Views.DAY) d.setDate(d.getDate() + delta);
    else if (view === Views.WEEK) d.setDate(d.getDate() + delta * 7);
    else if (view === Views.MONTH) d.setMonth(d.getMonth() + delta);
    setDate(d);
  };

  return (
    <div className="flex h-screen bg-background">
      {/* Left Sidebar */}
      <div className="w-64 shrink-0 border-r border-border flex flex-col overflow-hidden">
        {/* Mini Calendar */}
        <div className="p-3 border-b border-border">
          <Calendar
            mode="single"
            selected={date}
            onSelect={d => d && setDate(d)}
            className="w-full rounded-lg"
          />
        </div>

        {/* Unscheduled */}
        <div className="flex-1 overflow-y-auto p-3 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Unscheduled</h3>
            {unscheduledMissions.length > 0 && (
              <span className="text-[10px] font-bold bg-primary/10 text-primary px-1.5 py-0.5 rounded-full">
                {unscheduledMissions.length}
              </span>
            )}
          </div>
          <div className="space-y-1.5">
            {unscheduledMissions.length === 0 ? (
              <p className="text-[11px] text-muted-foreground text-center py-4">All missions scheduled!</p>
            ) : unscheduledMissions.map(m => (
              <div key={m.id} className="flex items-start gap-2 p-2 rounded-lg border border-border bg-card hover:border-primary/40 cursor-grab group transition-colors">
                <GripVertical className="w-3.5 h-3.5 text-muted-foreground mt-0.5 shrink-0 group-hover:text-primary" />
                <div className="overflow-hidden min-w-0">
                  <p className="text-xs font-semibold truncate">{m.title}</p>
                  <p className="text-[10px] text-muted-foreground">{m.estimatedMinutes ?? 60}m · {m.priority}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Category Legend */}
          <div className="border-t border-border pt-3 mt-3">
            <h3 className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-2">Categories</h3>
            <div className="space-y-1">
              {Object.entries(EVENT_COLORS).filter(([k]) => k !== "Focus").map(([type, colors]) => (
                <div key={type} className="flex items-center gap-2">
                  <div className={`w-2 h-2 rounded-full ${colors.dot}`} />
                  <span className="text-[11px] text-muted-foreground">{type}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Main Calendar */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Toolbar */}
        <div className="h-14 border-b border-border flex items-center justify-between px-4 gap-4 shrink-0 bg-background">
          {/* Nav */}
          <div className="flex items-center gap-1">
            <button
              onClick={() => navigate("prev")}
              className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={() => navigate("today")}
              className="px-3 py-1 text-xs font-semibold rounded-lg border border-border hover:bg-muted transition-colors"
            >
              Today
            </button>
            <button
              onClick={() => navigate("next")}
              className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
            <span className="text-sm font-semibold ml-2">
              {format(date, view === Views.MONTH ? "MMMM yyyy" : "MMMM do, yyyy")}
            </span>
          </div>

          {/* Search */}
          <div className="relative flex-1 max-w-xs">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search events..."
              className="pl-9 h-8 text-xs bg-muted/50 border-border"
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>

          {/* Views */}
          <div className="flex items-center bg-muted/60 rounded-lg p-0.5 border border-border">
            {(["Day", "Week", "Month", "Agenda"] as const).map(v => (
              <button
                key={v}
                onClick={() => setView(v.toLowerCase() as View)}
                className={`px-3 py-1 rounded-md text-xs font-semibold transition-all ${
                  view === v.toLowerCase()
                    ? "bg-background shadow-sm text-foreground"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {v}
              </button>
            ))}
          </div>
        </div>

        {/* Calendar Grid */}
        <div className="flex-1 overflow-hidden p-2">
          <DnDCalendar
            localizer={localizer}
            events={filteredEvents}
            startAccessor="start"
            endAccessor="end"
            view={view}
            onView={v => setView(v)}
            date={date}
            onNavigate={setDate}
            selectable
            onSelectEvent={handleSelectEvent}
            onSelectSlot={handleSelectSlot}
            onEventDrop={onEventDrop}
            onEventResize={onEventResize}
            eventPropGetter={eventPropGetter}
            className="h-full font-sans chiefos-calendar"
            step={15}
            timeslots={4}
            style={{ height: "100%" }}
          />
        </div>
      </div>

      {/* Create / Edit Modal */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{selectedEvent?.isNew ? "Create Event" : "Edit Event"}</DialogTitle>
          </DialogHeader>
          {selectedEvent && (
            <form onSubmit={handleSaveEvent} className="space-y-4 pt-2">
              <div className="space-y-1.5">
                <Label htmlFor="ev-title" className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Title</Label>
                <Input
                  id="ev-title"
                  value={selectedEvent.title}
                  onChange={e => setSelectedEvent({ ...selectedEvent, title: e.target.value })}
                  placeholder="Event title"
                  autoFocus
                  required
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Start</Label>
                  <Input
                    type="time"
                    value={format(new Date(selectedEvent.start), "HH:mm")}
                    onChange={e => {
                      const [h, m] = e.target.value.split(":").map(Number);
                      const d = new Date(selectedEvent.start);
                      d.setHours(h, m);
                      setSelectedEvent({ ...selectedEvent, start: d });
                    }}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">End</Label>
                  <Input
                    type="time"
                    value={format(new Date(selectedEvent.end), "HH:mm")}
                    onChange={e => {
                      const [h, m] = e.target.value.split(":").map(Number);
                      const d = new Date(selectedEvent.end);
                      d.setHours(h, m);
                      setSelectedEvent({ ...selectedEvent, end: d });
                    }}
                  />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Category</Label>
                <select
                  className="w-full h-9 rounded-md border border-input bg-transparent px-3 py-1 text-sm"
                  value={selectedEvent.type}
                  onChange={e => setSelectedEvent({ ...selectedEvent, type: e.target.value })}
                >
                  {Object.keys(EVENT_COLORS).filter(k => k !== "Focus").map(t => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </select>
              </div>
              <DialogFooter className="flex justify-between pt-2">
                {!selectedEvent.isNew ? (
                  <button
                    type="button"
                    onClick={handleDeleteEvent}
                    className="px-3 py-1.5 text-sm font-medium text-destructive hover:bg-destructive/10 rounded-lg transition-colors"
                  >
                    Delete
                  </button>
                ) : <div />}
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="px-3 py-1.5 text-sm font-medium text-muted-foreground hover:bg-muted rounded-lg transition-colors border border-border"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-1.5 text-sm font-semibold bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors"
                  >
                    Save
                  </button>
                </div>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
