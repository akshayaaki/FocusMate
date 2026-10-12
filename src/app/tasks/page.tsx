"use client";

import * as React from "react";
import { AppShell } from "@/components/layout/app-shell";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { createClient } from "@/lib/supabase/client";
import {
  CheckSquare,
  Plus,
  Search,
  Filter,
  Trash2,
  Clock,
  CheckCircle2,
  Calendar,
  AlertCircle,
} from "lucide-react";
import type { TaskCategory, TaskPriority, TaskStatus } from "@/types/database";

interface TaskItem {
  id: string;
  title: string;
  description: string | null;
  category: TaskCategory;
  priority: TaskPriority;
  status: TaskStatus;
  due_date: string | null;
  estimated_duration_minutes: number | null;
  actual_duration_minutes: number;
  created_at: string;
}

export default function TasksPage() {
  const [tasks, setTasks] = React.useState<TaskItem[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [searchQuery, setSearchQuery] = React.useState("");
  const [selectedCategory, setSelectedCategory] = React.useState<string>("all");
  const [selectedStatus, setSelectedStatus] = React.useState<string>("all");
  const [showCreateModal, setShowCreateModal] = React.useState(false);

  // Form State
  const [newTitle, setNewTitle] = React.useState("");
  const [newDescription, setNewDescription] = React.useState("");
  const [newCategory, setNewCategory] = React.useState<TaskCategory>("study");
  const [newPriority, setNewPriority] = React.useState<TaskPriority>("medium");
  const [newDueDate, setNewDueDate] = React.useState("");
  const [newDuration, setNewDuration] = React.useState("");
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [formError, setFormError] = React.useState<string | null>(null);

  const fetchTasks = React.useCallback(async () => {
    setLoading(true);
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      setTasks([]);
      setLoading(false);
      return;
    }

    const { data, error } = await supabase
      .from("tasks")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    if (!error && data) {
      setTasks(data as TaskItem[]);
    }
    setLoading(false);
  }, []);

  React.useEffect(() => {
    fetchTasks();
  }, [fetchTasks]);

  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setFormError(null);

    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      setFormError("Authentication required.");
      setIsSubmitting(false);
      return;
    }

    try {
      const { error } = await supabase.from("tasks").insert({
        user_id: user.id,
        title: newTitle.trim(),
        description: newDescription.trim() || null,
        category: newCategory,
        priority: newPriority,
        status: "pending",
        due_date: newDueDate ? new Date(newDueDate).toISOString() : null,
        estimated_duration_minutes: newDuration ? parseInt(newDuration, 10) : null,
      });

      if (error) {
        setFormError(error.message);
      } else {
        // Reset form
        setNewTitle("");
        setNewDescription("");
        setNewDueDate("");
        setNewDuration("");
        setShowCreateModal(false);
        fetchTasks();
      }
    } catch (err: unknown) {
      setFormError(err instanceof Error ? err.message : "Failed to create task");
    } finally {
      setIsSubmitting(false);
    }
  };

  const toggleTaskStatus = async (task: TaskItem) => {
    const supabase = createClient();
    const nextStatus: TaskStatus = task.status === "completed" ? "pending" : "completed";
    const completedAt = nextStatus === "completed" ? new Date().toISOString() : null;

    // Optimistic UI update
    setTasks((prev) =>
      prev.map((t) =>
        t.id === task.id ? { ...t, status: nextStatus } : t
      )
    );

    const { error } = await supabase
      .from("tasks")
      .update({ status: nextStatus, completed_at: completedAt })
      .eq("id", task.id);

    if (error) {
      fetchTasks(); // rollback
    }
  };

  const deleteTask = async (taskId: string) => {
    const supabase = createClient();
    setTasks((prev) => prev.filter((t) => t.id !== taskId));
    await supabase.from("tasks").delete().eq("id", taskId);
  };

  // Filter tasks
  const filteredTasks = tasks.filter((t) => {
    const matchesSearch =
      t.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (t.description && t.description.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesCategory = selectedCategory === "all" || t.category === selectedCategory;
    const matchesStatus = selectedStatus === "all" || t.status === selectedStatus;
    return matchesSearch && matchesCategory && matchesStatus;
  });

  return (
    <AppShell>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-border/70 pb-6">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-brand-charcoal dark:text-brand-mist">
              Task Management
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Organize academic assignments, exam preparation, and daily routines
            </p>
          </div>
          <Button variant="sage" onClick={() => setShowCreateModal(true)}>
            <Plus className="h-4 w-4 mr-2" /> Add Task
          </Button>
        </div>

        {/* Filter & Search Bar */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search tasks..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>

          <div className="flex items-center gap-2">
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="h-10 rounded-lg border border-border bg-background px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <option value="all">All Categories</option>
              <option value="study">Study</option>
              <option value="assignment">Assignment</option>
              <option value="exam_prep">Exam Prep</option>
              <option value="personal">Personal</option>
              <option value="routine">Routine</option>
            </select>

            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="h-10 rounded-lg border border-border bg-background px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <option value="all">All Statuses</option>
              <option value="pending">Pending</option>
              <option value="in_progress">In Progress</option>
              <option value="completed">Completed</option>
            </select>
          </div>
        </div>

        {/* Task List */}
        <Card>
          <CardContent className="p-6">
            {loading ? (
              <div className="py-12 text-center text-sm text-muted-foreground">Loading tasks...</div>
            ) : filteredTasks.length === 0 ? (
              <EmptyState
                icon={CheckSquare}
                title={tasks.length === 0 ? "No tasks yet" : "No matching tasks"}
                description={
                  tasks.length === 0
                    ? "Add your first assignment, exam revision, or routine to stay ahead."
                    : "Try adjusting your search query or filter settings."
                }
                actionLabel="Create Task"
                onAction={() => setShowCreateModal(true)}
              />
            ) : (
              <div className="space-y-3">
                {filteredTasks.map((task) => (
                  <div
                    key={task.id}
                    className="flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-xl border border-border/70 hover:border-border transition-colors gap-3"
                  >
                    <div className="flex items-start gap-3 min-w-0">
                      <button
                        type="button"
                        onClick={() => toggleTaskStatus(task)}
                        className="mt-0.5 text-muted-foreground hover:text-foreground shrink-0"
                      >
                        {task.status === "completed" ? (
                          <CheckCircle2 className="h-5 w-5 text-emerald-600" />
                        ) : (
                          <div className="h-5 w-5 rounded border border-border" />
                        )}
                      </button>
                      <div className="min-w-0 space-y-1">
                        <p
                          className={`text-sm font-medium leading-snug break-words ${
                            task.status === "completed"
                              ? "line-through text-muted-foreground"
                              : "text-foreground"
                          }`}
                        >
                          {task.title}
                        </p>
                        {task.description && (
                          <p className="text-xs text-muted-foreground line-clamp-2">
                            {task.description}
                          </p>
                        )}
                        <div className="flex flex-wrap items-center gap-3 pt-1 text-xs text-muted-foreground">
                          {task.due_date && (
                            <span className="flex items-center gap-1">
                              <Calendar className="h-3.5 w-3.5" />
                              Due: {new Date(task.due_date).toLocaleDateString()}
                            </span>
                          )}
                          {task.estimated_duration_minutes && (
                            <span className="flex items-center gap-1">
                              <Clock className="h-3.5 w-3.5" />
                              {task.estimated_duration_minutes}m est
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center justify-between sm:justify-end gap-2 shrink-0 pt-2 sm:pt-0 border-t sm:border-0 border-border/50">
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="capitalize text-[11px]">
                          {task.category.replace("_", " ")}
                        </Badge>
                        <Badge
                          variant={
                            task.priority === "urgent"
                              ? "destructive"
                              : task.priority === "high"
                              ? "warning"
                              : "outline"
                          }
                          className="capitalize text-[11px]"
                        >
                          {task.priority}
                        </Badge>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => deleteTask(task.id)}
                        className="h-8 w-8 text-muted-foreground hover:text-destructive"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Create Task Modal */}
        {showCreateModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs">
            <div className="w-full max-w-lg rounded-xl border border-border bg-card p-6 shadow-xl animate-in zoom-in-95">
              <div className="flex items-center justify-between border-b border-border/70 pb-4">
                <h3 className="text-lg font-semibold text-brand-charcoal dark:text-brand-mist">
                  Create New Task
                </h3>
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="text-muted-foreground hover:text-foreground text-sm"
                >
                  ✕
                </button>
              </div>

              {formError && (
                <div className="mt-4 p-3 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-sm flex items-center gap-2">
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  <span>{formError}</span>
                </div>
              )}

              <form onSubmit={handleCreateTask} className="mt-4 space-y-4">
                <div className="space-y-1.5">
                  <Label htmlFor="taskTitle">Task Title *</Label>
                  <Input
                    id="taskTitle"
                    placeholder="e.g. Complete Discrete Math Assignment 3"
                    required
                    value={newTitle}
                    onChange={(e) => setNewTitle(e.target.value)}
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="taskDesc">Description / Notes</Label>
                  <Input
                    id="taskDesc"
                    placeholder="Chapters 4 & 5 practice questions"
                    value={newDescription}
                    onChange={(e) => setNewDescription(e.target.value)}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="taskCategory">Category</Label>
                    <select
                      id="taskCategory"
                      value={newCategory}
                      onChange={(e) => setNewCategory(e.target.value as TaskCategory)}
                      className="w-full h-10 rounded-lg border border-border bg-background px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    >
                      <option value="study">Study</option>
                      <option value="assignment">Assignment</option>
                      <option value="exam_prep">Exam Prep</option>
                      <option value="personal">Personal</option>
                      <option value="routine">Routine</option>
                      <option value="custom">Custom</option>
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="taskPriority">Priority</Label>
                    <select
                      id="taskPriority"
                      value={newPriority}
                      onChange={(e) => setNewPriority(e.target.value as TaskPriority)}
                      className="w-full h-10 rounded-lg border border-border bg-background px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    >
                      <option value="low">Low</option>
                      <option value="medium">Medium</option>
                      <option value="high">High</option>
                      <option value="urgent">Urgent</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="taskDue">Due Date</Label>
                    <Input
                      id="taskDue"
                      type="date"
                      value={newDueDate}
                      onChange={(e) => setNewDueDate(e.target.value)}
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="taskDuration">Est. Minutes</Label>
                    <Input
                      id="taskDuration"
                      type="number"
                      placeholder="e.g. 45"
                      min="0"
                      value={newDuration}
                      onChange={(e) => setNewDuration(e.target.value)}
                    />
                  </div>
                </div>

                <div className="flex items-center justify-end gap-3 pt-4 border-t border-border/70">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setShowCreateModal(false)}
                    disabled={isSubmitting}
                  >
                    Cancel
                  </Button>
                  <Button type="submit" variant="sage" disabled={isSubmitting}>
                    {isSubmitting ? "Creating..." : "Save Task"}
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
