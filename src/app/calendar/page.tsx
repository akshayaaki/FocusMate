"use client";

import * as React from "react";
import { AppShell } from "@/components/layout/app-shell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { createClient } from "@/lib/supabase/client";
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  Plus,
  Clock,
  Trash2,
} from "lucide-react";
import type { EventCategory } from "@/types/database";

interface CalendarEventItem {
  id: string;
  title: string;
  description: string | null;
  category: EventCategory;
  start_time: string;
  end_time: string;
  is_all_day: boolean;
  location: string | null;
}

export default function CalendarPage() {
  const [currentDate, setCurrentDate] = React.useState(new Date());
  const [events, setEvents] = React.useState<CalendarEventItem[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [activeView, setActiveView] = React.useState<"month" | "week" | "agenda">("month");
  const [showEventModal, setShowEventModal] = React.useState(false);

  // Form State
  const [title, setTitle] = React.useState("");
  const [description, setDescription] = React.useState("");
  const [category, setCategory] = React.useState<EventCategory>("class");
  const [startDateStr, setStartDateStr] = React.useState("");
  const [startTimeStr, setStartTimeStr] = React.useState("09:00");
  const [endTimeStr, setEndTimeStr] = React.useState("10:00");
  const [location, setLocation] = React.useState("");
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  const fetchEvents = React.useCallback(async () => {
    setLoading(true);
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      setEvents([]);
      setLoading(false);
      return;
    }

    const { data, error } = await supabase
      .from("calendar_events")
      .select("*")
      .eq("user_id", user.id)
      .order("start_time", { ascending: true });

    if (!error && data) {
      setEvents(data as CalendarEventItem[]);
    }
    setLoading(false);
  }, []);

  React.useEffect(() => {
    fetchEvents();
  }, [fetchEvents]);

  const handlePrev = () => {
    const next = new Date(currentDate);
    if (activeView === "month") next.setMonth(next.getMonth() - 1);
    else next.setDate(next.getDate() - 7);
    setCurrentDate(next);
  };

  const handleNext = () => {
    const next = new Date(currentDate);
    if (activeView === "month") next.setMonth(next.getMonth() + 1);
    else next.setDate(next.getDate() + 7);
    setCurrentDate(next);
  };

  const handleToday = () => {
    setCurrentDate(new Date());
  };

  const handleCreateEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      setIsSubmitting(false);
      return;
    }

    const startDateTime = new Date(`${startDateStr}T${startTimeStr}:00`).toISOString();
    const endDateTime = new Date(`${startDateStr}T${endTimeStr}:00`).toISOString();

    const { error } = await supabase.from("calendar_events").insert({
      user_id: user.id,
      title: title.trim(),
      description: description.trim() || null,
      category,
      start_time: startDateTime,
      end_time: endDateTime,
      location: location.trim() || null,
      is_all_day: false,
    });

    if (!error) {
      setTitle("");
      setDescription("");
      setLocation("");
      setShowEventModal(false);
      fetchEvents();
    }
    setIsSubmitting(false);
  };

  const handleDeleteEvent = async (id: string) => {
    const supabase = createClient();
    setEvents((prev) => prev.filter((e) => e.id !== id));
    await supabase.from("calendar_events").delete().eq("id", id);
  };

  // Month grid calculations
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const monthName = currentDate.toLocaleString("default", { month: "long" });

  return (
    <AppShell>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-border/70 pb-6">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-brand-charcoal dark:text-brand-mist">
              Calendar & Schedule
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Track classes, exams, focus blocks, and academic timelines
            </p>
          </div>

          <div className="flex items-center gap-2">
            <div className="flex rounded-lg border border-border p-1 bg-muted/40">
              <button
                type="button"
                onClick={() => setActiveView("month")}
                className={`px-3 py-1 rounded-md text-xs font-medium transition-colors ${
                  activeView === "month"
                    ? "bg-card text-foreground shadow-xs"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                Month
              </button>
              <button
                type="button"
                onClick={() => setActiveView("agenda")}
                className={`px-3 py-1 rounded-md text-xs font-medium transition-colors ${
                  activeView === "agenda"
                    ? "bg-card text-foreground shadow-xs"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                Agenda
              </button>
            </div>

            <Button variant="sage" size="sm" onClick={() => setShowEventModal(true)}>
              <Plus className="h-4 w-4 mr-1.5" /> Add Event
            </Button>
          </div>
        </div>

        {/* Calendar Navigation Bar */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold text-brand-charcoal dark:text-brand-mist">
              {monthName} {year}
            </h2>
            <Button variant="ghost" size="sm" onClick={handleToday} className="text-xs">
              Today
            </Button>
          </div>

          <div className="flex items-center gap-1">
            <Button variant="outline" size="icon" className="h-8 w-8" onClick={handlePrev}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="icon" className="h-8 w-8" onClick={handleNext}>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* View Switch */}
        {activeView === "month" ? (
          <Card>
            <CardContent className="p-4 sm:p-6">
              {/* Day headers */}
              <div className="grid grid-cols-7 gap-2 mb-2 text-center text-xs font-semibold text-muted-foreground">
                {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
                  <div key={day} className="py-1">
                    {day}
                  </div>
                ))}
              </div>

              {/* Month grid */}
              <div className="grid grid-cols-7 gap-2">
                {/* Empty cells before month start */}
                {Array.from({ length: firstDay }).map((_, idx) => (
                  <div key={`empty-${idx}`} className="min-h-[85px] sm:min-h-[110px] rounded-lg p-2 bg-muted/10 opacity-40" />
                ))}

                {/* Day cells */}
                {Array.from({ length: daysInMonth }).map((_, idx) => {
                  const dayNum = idx + 1;
                  const currentCellDate = new Date(year, month, dayNum);
                  const dateStr = currentCellDate.toISOString().split("T")[0];

                  const isToday =
                    new Date().toISOString().split("T")[0] === dateStr;

                  const dayEvents = events.filter((e) =>
                    e.start_time.startsWith(dateStr)
                  );

                  return (
                    <div
                      key={`day-${dayNum}`}
                      className={`min-h-[85px] sm:min-h-[110px] rounded-lg p-2 border transition-colors flex flex-col ${
                        isToday
                          ? "border-brand-charcoal bg-brand-mist/10 dark:border-brand-mist"
                          : "border-border/60 hover:bg-muted/20"
                      }`}
                    >
                      <span
                        className={`text-xs font-semibold self-end h-5 w-5 flex items-center justify-center rounded-full ${
                          isToday
                            ? "bg-brand-charcoal text-white dark:bg-brand-mist dark:text-brand-charcoal"
                            : "text-muted-foreground"
                        }`}
                      >
                        {dayNum}
                      </span>

                      <div className="mt-1 flex-1 space-y-1 overflow-y-auto max-h-[70px]">
                        {dayEvents.map((evt) => (
                          <div
                            key={evt.id}
                            className="rounded px-1.5 py-0.5 text-[10px] font-medium bg-brand-mist/50 dark:bg-brand-charcoal text-brand-charcoal dark:text-brand-mist truncate"
                            title={evt.title}
                          >
                            {evt.title}
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        ) : (
          /* Agenda / List View */
          <Card>
            <CardHeader>
              <CardTitle>Upcoming Scheduled Events</CardTitle>
            </CardHeader>
            <CardContent>
              {events.length === 0 ? (
                <EmptyState
                  icon={CalendarIcon}
                  title="No scheduled events"
                  description="Keep track of your classes, lectures, and exams in one place."
                  actionLabel="Schedule Event"
                  onAction={() => setShowEventModal(true)}
                />
              ) : (
                <div className="space-y-3">
                  {events.map((evt) => (
                    <div
                      key={evt.id}
                      className="flex items-center justify-between p-4 rounded-xl border border-border/70 hover:bg-muted/20 transition-colors"
                    >
                      <div className="space-y-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="font-semibold text-sm truncate">{evt.title}</p>
                          <Badge variant="outline" className="capitalize text-[10px]">
                            {evt.category}
                          </Badge>
                        </div>
                        <p className="text-xs text-muted-foreground flex items-center gap-2">
                          <Clock className="h-3.5 w-3.5" />
                          {new Date(evt.start_time).toLocaleString("en-IN", {
                            dateStyle: "medium",
                            timeStyle: "short",
                          })}
                        </p>
                        {evt.location && (
                          <p className="text-xs text-muted-foreground">
                            Location: {evt.location}
                          </p>
                        )}
                      </div>

                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDeleteEvent(evt.id)}
                        className="h-8 w-8 text-muted-foreground hover:text-destructive shrink-0"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Create Event Modal */}
        {showEventModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs">
            <div className="w-full max-w-lg rounded-xl border border-border bg-card p-6 shadow-xl animate-in zoom-in-95">
              <div className="flex items-center justify-between border-b border-border/70 pb-4">
                <h3 className="text-lg font-semibold text-brand-charcoal dark:text-brand-mist">
                  Schedule Event
                </h3>
                <button
                  type="button"
                  onClick={() => setShowEventModal(false)}
                  className="text-muted-foreground hover:text-foreground text-sm"
                >
                  ✕
                </button>
              </div>

              <form onSubmit={handleCreateEvent} className="mt-4 space-y-4">
                <div className="space-y-1.5">
                  <Label htmlFor="evtTitle">Title *</Label>
                  <Input
                    id="evtTitle"
                    placeholder="e.g. Data Structures Lecture"
                    required
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="evtCategory">Category</Label>
                    <select
                      id="evtCategory"
                      value={category}
                      onChange={(e) => setCategory(e.target.value as EventCategory)}
                      className="w-full h-10 rounded-lg border border-border bg-background px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    >
                      <option value="class">Class / Lecture</option>
                      <option value="study">Study Block</option>
                      <option value="exam">Exam</option>
                      <option value="assignment">Assignment</option>
                      <option value="personal">Personal</option>
                      <option value="routine">Routine</option>
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="evtDate">Date *</Label>
                    <Input
                      id="evtDate"
                      type="date"
                      required
                      value={startDateStr}
                      onChange={(e) => setStartDateStr(e.target.value)}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="startTime">Start Time</Label>
                    <Input
                      id="startTime"
                      type="time"
                      value={startTimeStr}
                      onChange={(e) => setStartTimeStr(e.target.value)}
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="endTime">End Time</Label>
                    <Input
                      id="endTime"
                      type="time"
                      value={endTimeStr}
                      onChange={(e) => setEndTimeStr(e.target.value)}
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="evtLocation">Location / Room</Label>
                  <Input
                    id="evtLocation"
                    placeholder="e.g. Science Block Room 204 or Zoom link"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                  />
                </div>

                <div className="flex items-center justify-end gap-3 pt-4 border-t border-border/70">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setShowEventModal(false)}
                    disabled={isSubmitting}
                  >
                    Cancel
                  </Button>
                  <Button type="submit" variant="sage" disabled={isSubmitting}>
                    {isSubmitting ? "Scheduling..." : "Save Event"}
                  </Button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </AppShell>
  );
}
