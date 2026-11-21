"use client";

import React, { useState, useMemo } from "react";
import {
  CheckSquare,
  Plus,
  Save,
  Trash2,
  Edit3,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Truck,
  User,
  Route,
  Calendar,
  Filter,
  Wrench,
  FileCheck2,
  PackageCheck,
  Building2,
} from "lucide-react";
import {
  DriverEcoRecord,
  FleetOperationalTask,
  Locale,
  MapTruck,
  MOROCCO_CITY_COORDS,
} from "@/lib/supabase/database";
import {
  ConfirmDeleteModal,
  DeleteConfirmationRequest,
} from "./ConfirmDeleteModal";

interface TasksOperationsPageProps {
  locale: Locale;
  tasks: FleetOperationalTask[];
  trucks: MapTruck[];
  drivers: DriverEcoRecord[];
  onAddTask: (task: FleetOperationalTask) => void;
  onUpdateTask: (task: FleetOperationalTask) => void;
  onDeleteTask: (taskId: string) => void;
  onExplicitSaveToCloud?: () => Promise<void> | void;
}

const TASK_CATEGORIES: {
  id: FleetOperationalTask["category"];
  label: string;
  badgeClass: string;
}[] = [
  {
    id: "delivery",
    label: "Delivery & Dispatch",
    badgeClass:
      "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/50 dark:text-blue-300 dark:border-blue-800/60",
  },
  {
    id: "maintenance",
    label: "Vehicle Maintenance",
    badgeClass:
      "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/50 dark:text-amber-300 dark:border-amber-800/60",
  },
  {
    id: "customs",
    label: "Customs & Port Clearance",
    badgeClass:
      "bg-indigo-50 text-indigo-700 border-indigo-200 dark:bg-indigo-950/50 dark:text-indigo-300 dark:border-indigo-800/60",
  },
  {
    id: "compliance",
    label: "Compliance (Visite Technique / Permis)",
    badgeClass:
      "bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-950/50 dark:text-purple-300 dark:border-purple-800/60",
  },
  {
    id: "admin",
    label: "Administration & Billing",
    badgeClass:
      "bg-slate-100 text-slate-700 border-slate-200 dark:bg-zinc-800 dark:text-zinc-300 dark:border-zinc-700",
  },
];

export function TasksOperationsPage({
  locale,
  tasks,
  trucks,
  drivers,
  onAddTask,
  onUpdateTask,
  onDeleteTask,
  onExplicitSaveToCloud,
}: TasksOperationsPageProps) {
  const [editingTaskId, setEditingTaskId] = useState<string | null>(null);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] =
    useState<FleetOperationalTask["category"]>("delivery");
  const [priority, setPriority] =
    useState<FleetOperationalTask["priority"]>("medium");
  const [status, setStatus] =
    useState<FleetOperationalTask["status"]>("pending");
  const [dueDate, setDueDate] = useState(() =>
    new Date().toISOString().slice(0, 10)
  );
  const [assignedTruckCode, setAssignedTruckCode] = useState("");
  const [assignedDriverName, setAssignedDriverName] = useState("");
  const [routeCorridor, setRouteCorridor] = useState("");
  const [costEstimateMad, setCostEstimateMad] = useState("0");

  const [filterStatus, setFilterStatus] = useState<
    "all" | FleetOperationalTask["status"]
  >("all");
  const [filterCategory, setFilterCategory] = useState<
    "all" | FleetOperationalTask["category"]
  >("all");

  const [saveToast, setSaveToast] = useState<string | null>(null);
  const [deleteRequest, setDeleteRequest] =
    useState<DeleteConfirmationRequest | null>(null);

  const triggerToast = (msg: string) => {
    setSaveToast(msg);
    setTimeout(() => setSaveToast(null), 4000);
  };

  const resetForm = () => {
    setEditingTaskId(null);
    setTitle("");
    setDescription("");
    setCategory("delivery");
    setPriority("medium");
    setStatus("pending");
    setDueDate(new Date().toISOString().slice(0, 10));
    setAssignedTruckCode("");
    setAssignedDriverName("");
    setRouteCorridor("");
    setCostEstimateMad("0");
  };

  const handleLoadTaskForEdit = (task: FleetOperationalTask) => {
    setEditingTaskId(task.id);
    setTitle(task.title);
    setDescription(task.description || "");
    setCategory(task.category);
    setPriority(task.priority);
    setStatus(task.status);
    setDueDate(task.dueDate);
    setAssignedTruckCode(task.assignedTruckCode || "");
    setAssignedDriverName(task.assignedDriverName || "");
    setRouteCorridor(task.routeCorridor || "");
    setCostEstimateMad(String(task.costEstimateMad || 0));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    const payload: FleetOperationalTask = {
      id: editingTaskId || `task-${Date.now()}`,
      title: title.trim(),
      description: description.trim(),
      category,
      priority,
      status,
      dueDate: dueDate || new Date().toISOString().slice(0, 10),
      assignedTruckCode: assignedTruckCode.trim() || undefined,
      assignedDriverName: assignedDriverName.trim() || undefined,
      routeCorridor: routeCorridor.trim() || undefined,
      costEstimateMad: Math.max(0, parseFloat(costEstimateMad) || 0),
      createdAt: new Date().toISOString().slice(0, 10),
    };

    if (editingTaskId) {
      onUpdateTask(payload);
      triggerToast(`Task "${payload.title}" updated and staged.`);
    } else {
      onAddTask(payload);
      triggerToast(`Task "${payload.title}" added.`);
    }

    if (onExplicitSaveToCloud) {
      await onExplicitSaveToCloud();
    }
    resetForm();
  };

  const handleQuickStatusChange = async (
    task: FleetOperationalTask,
    nextStatus: FleetOperationalTask["status"]
  ) => {
    onUpdateTask({ ...task, status: nextStatus });
    if (onExplicitSaveToCloud) {
      await onExplicitSaveToCloud();
    }
    triggerToast(`Task "${task.title}" marked as ${nextStatus.replace("_", " ")}.`);
  };

  const filteredTasks = useMemo(() => {
    return tasks.filter((t) => {
      if (filterStatus !== "all" && t.status !== filterStatus) return false;
      if (filterCategory !== "all" && t.category !== filterCategory)
        return false;
      return true;
    });
  }, [tasks, filterStatus, filterCategory]);

  const stats = useMemo(() => {
    const pending = tasks.filter((t) => t.status === "pending").length;
    const inProgress = tasks.filter((t) => t.status === "in_progress").length;
    const completed = tasks.filter((t) => t.status === "completed").length;
    const totalEstimatedCost = tasks.reduce(
      (sum, t) => sum + (t.costEstimateMad || 0),
      0
    );
    return { pending, inProgress, completed, totalEstimatedCost };
  }, [tasks]);

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="rounded-xl bg-white dark:bg-zinc-900 border border-slate-200/90 dark:border-zinc-800 p-5 shadow-sm flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-md bg-blue-50 dark:bg-blue-950/60 border border-blue-200 dark:border-blue-800/60 px-2.5 py-0.5 text-[11px] font-mono font-semibold text-blue-700 dark:text-blue-300">
              <CheckSquare className="h-3.5 w-3.5" />
              DISPATCH, MAINTENANCE & COMPLIANCE TASKS
            </span>
          </div>
          <h1 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-zinc-100 mt-1">
            Fleet Tasks & Operational Checklist
          </h1>
          <p className="text-xs text-slate-500 dark:text-zinc-400 mt-0.5">
            Assign delivery tasks, vehicle maintenance, customs paperwork, or compliance renewals to specific trucks and drivers.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {onExplicitSaveToCloud && (
            <button
              type="button"
              onClick={async () => {
                await onExplicitSaveToCloud();
                triggerToast("All tasks saved to Supabase PostgreSQL.");
              }}
              className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 text-xs font-bold shadow-sm transition-colors"
            >
              <Save className="h-3.5 w-3.5" />
              <span>Save All Tasks to Supabase</span>
            </button>
          )}
        </div>
      </div>

      {/* Confirmation Toast */}
      {saveToast && (
        <div className="rounded-xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800/80 px-4 py-3 flex items-center justify-between text-xs font-semibold text-emerald-800 dark:text-emerald-200 shadow-sm">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
            <span>{saveToast}</span>
          </div>
          <button
            type="button"
            onClick={() => setSaveToast(null)}
            className="text-[11px] underline"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* KPI Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
        <div className="rounded-xl bg-white dark:bg-zinc-900 border border-slate-200/80 dark:border-zinc-800 p-4 shadow-sm">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
            Total Tasks
          </span>
          <p className="text-xl font-bold font-mono text-slate-900 dark:text-zinc-100 mt-1">
            {tasks.length}
          </p>
        </div>
        <div className="rounded-xl bg-white dark:bg-zinc-900 border border-slate-200/80 dark:border-zinc-800 p-4 shadow-sm">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-amber-600">
            Pending / In Progress
          </span>
          <p className="text-xl font-bold font-mono text-amber-600 dark:text-amber-400 mt-1">
            {stats.pending + stats.inProgress}
          </p>
        </div>
        <div className="rounded-xl bg-white dark:bg-zinc-900 border border-slate-200/80 dark:border-zinc-800 p-4 shadow-sm">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-emerald-600">
            Completed Tasks
          </span>
          <p className="text-xl font-bold font-mono text-emerald-600 dark:text-emerald-400 mt-1">
            {stats.completed}
          </p>
        </div>
        <div className="rounded-xl bg-white dark:bg-zinc-900 border border-slate-200/80 dark:border-zinc-800 p-4 shadow-sm">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
            Budget / Cost Estimate
          </span>
          <p className="text-xl font-bold font-mono text-slate-900 dark:text-zinc-100 mt-1">
            {stats.totalEstimatedCost.toLocaleString()} MAD
          </p>
        </div>
      </div>

      {/* Main Grid: Left Create/Edit Form + Right Task Board */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-5">
        <form
          onSubmit={handleSubmit}
          className="xl:col-span-4 rounded-xl bg-white dark:bg-zinc-900 border border-slate-200/90 dark:border-zinc-800 p-5 shadow-sm space-y-3.5 h-fit"
        >
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-900 dark:text-zinc-100 flex items-center gap-2">
              <Plus className="h-4 w-4 text-blue-600" />
              <span>
                {editingTaskId ? "Edit Operational Task" : "Add New Task"}
              </span>
            </h3>
            {editingTaskId && (
              <button
                type="button"
                onClick={resetForm}
                className="text-xs font-semibold text-slate-500 hover:text-slate-900 dark:hover:text-white"
              >
                Cancel Edit
              </button>
            )}
          </div>

          <div className="space-y-3 text-xs">
            <div>
              <label className="block font-semibold text-slate-700 dark:text-zinc-300 mb-1">
                Task Title *
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Visite Technique Renewal or Deliver 18 Pallets to Agadir"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full rounded-lg bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 px-3 py-2 font-semibold"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block font-medium mb-1">Category</label>
                <select
                  value={category}
                  onChange={(e) =>
                    setCategory(
                      e.target.value as FleetOperationalTask["category"]
                    )
                  }
                  className="w-full rounded-lg bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 px-2.5 py-2"
                >
                  {TASK_CATEGORIES.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.label}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block font-medium mb-1">Priority</label>
                <select
                  value={priority}
                  onChange={(e) =>
                    setPriority(
                      e.target.value as FleetOperationalTask["priority"]
                    )
                  }
                  className="w-full rounded-lg bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 px-2.5 py-2"
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                  <option value="urgent">Urgent / Critical</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block font-medium mb-1">Status</label>
                <select
                  value={status}
                  onChange={(e) =>
                    setStatus(e.target.value as FleetOperationalTask["status"])
                  }
                  className="w-full rounded-lg bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 px-2.5 py-2"
                >
                  <option value="pending">Pending</option>
                  <option value="in_progress">In Progress</option>
                  <option value="completed">Completed</option>
                </select>
              </div>
              <div>
                <label className="block font-medium mb-1">Due Date</label>
                <input
                  type="date"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                  className="w-full rounded-lg bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 px-2.5 py-1.5 font-mono"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block font-medium mb-1">
                  Assigned Truck (Optional)
                </label>
                <input
                  type="text"
                  list="instance-trucks-datalist"
                  placeholder="Select or type Truck..."
                  value={assignedTruckCode}
                  onChange={(e) => setAssignedTruckCode(e.target.value)}
                  className="w-full rounded-lg bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 px-2.5 py-1.5 font-mono"
                />
                <datalist id="instance-trucks-datalist">
                  {trucks.map((t) => (
                    <option key={t.id} value={t.code}>
                      {t.code} ({t.plate} • {t.model})
                    </option>
                  ))}
                </datalist>
              </div>

              <div>
                <label className="block font-medium mb-1">
                  Assigned Driver (Optional)
                </label>
                <input
                  type="text"
                  list="instance-drivers-datalist"
                  placeholder="Select or type Driver..."
                  value={assignedDriverName}
                  onChange={(e) => setAssignedDriverName(e.target.value)}
                  className="w-full rounded-lg bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 px-2.5 py-1.5"
                />
                <datalist id="instance-drivers-datalist">
                  {drivers.map((d) => (
                    <option key={d.id} value={d.name[locale]}>
                      {d.name[locale]} ({d.truckCode})
                    </option>
                  ))}
                </datalist>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block font-medium mb-1">
                  Hub / Corridor (Optional)
                </label>
                <input
                  type="text"
                  list="morocco-hubs-datalist"
                  placeholder="e.g. Casablanca Zenata / A3"
                  value={routeCorridor}
                  onChange={(e) => setRouteCorridor(e.target.value)}
                  className="w-full rounded-lg bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 px-2.5 py-1.5"
                />
                <datalist id="morocco-hubs-datalist">
                  {Object.keys(MOROCCO_CITY_COORDS).map((city) => (
                    <option key={city} value={city} />
                  ))}
                </datalist>
              </div>
              <div>
                <label className="block font-medium mb-1">
                  Estimated Cost (MAD)
                </label>
                <input
                  type="number"
                  min="0"
                  step="50"
                  value={costEstimateMad}
                  onChange={(e) => setCostEstimateMad(e.target.value)}
                  className="w-full rounded-lg bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 px-2.5 py-1.5 font-mono"
                />
              </div>
            </div>

            <div>
              <label className="block font-medium mb-1">
                Instructions / Notes
              </label>
              <textarea
                rows={3}
                placeholder="Details, contact phone, repair workshop name, or customs reference..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full rounded-lg bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 px-3 py-2"
              />
            </div>
          </div>

          <button
            type="submit"
            className="w-full inline-flex items-center justify-center gap-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white py-2.5 text-xs font-bold shadow-sm transition-colors"
          >
            <Save className="h-3.5 w-3.5" />
            <span>
              {editingTaskId
                ? "Save Task Changes to Supabase"
                : "Save New Task to Supabase"}
            </span>
          </button>
        </form>

        {/* Right: Tasks List & Filters */}
        <div className="xl:col-span-8 rounded-xl bg-white dark:bg-zinc-900 border border-slate-200/90 dark:border-zinc-800 p-5 shadow-sm space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h3 className="text-sm font-bold text-slate-900 dark:text-zinc-100">
              Active Instance Tasks ({filteredTasks.length})
            </h3>

            <div className="flex flex-wrap items-center gap-2 text-xs">
              <Filter className="h-3.5 w-3.5 text-slate-400" />
              <select
                value={filterStatus}
                onChange={(e) =>
                  setFilterStatus(
                    e.target.value as "all" | FleetOperationalTask["status"]
                  )
                }
                className="rounded-lg bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 px-2.5 py-1.5 font-semibold"
              >
                <option value="all">All Statuses</option>
                <option value="pending">Pending</option>
                <option value="in_progress">In Progress</option>
                <option value="completed">Completed</option>
              </select>

              <select
                value={filterCategory}
                onChange={(e) =>
                  setFilterCategory(
                    e.target.value as "all" | FleetOperationalTask["category"]
                  )
                }
                className="rounded-lg bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 px-2.5 py-1.5 font-semibold"
              >
                <option value="all">All Categories</option>
                {TASK_CATEGORIES.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {filteredTasks.length === 0 ? (
            <div className="rounded-xl border border-dashed border-slate-300 dark:border-zinc-800 p-12 text-center space-y-2">
              <CheckSquare className="h-8 w-8 text-slate-400 mx-auto" />
              <p className="text-sm font-bold text-slate-800 dark:text-zinc-200">
                No Operational Tasks Yet (0 Records)
              </p>
              <p className="text-xs text-slate-500 max-w-md mx-auto">
                Use the form on the left to add dispatch tasks, vehicle maintenance checks, customs clearances, or compliance reminders for this client.
              </p>
            </div>
          ) : (
            <div className="space-y-2.5">
              {filteredTasks.map((task) => {
                const catObj =
                  TASK_CATEGORIES.find((c) => c.id === task.category) ||
                  TASK_CATEGORIES[0];
                return (
                  <div
                    key={task.id}
                    className={`rounded-xl border p-4 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                      task.status === "completed"
                        ? "bg-slate-50/60 dark:bg-zinc-950/50 border-slate-200/70 dark:border-zinc-800/60 opacity-80"
                        : "bg-white dark:bg-zinc-950 border-slate-200 dark:border-zinc-800"
                    }`}
                  >
                    <div className="space-y-1.5">
                      <div className="flex flex-wrap items-center gap-2">
                        <span
                          className={`rounded-md border px-2 py-0.5 text-[10px] font-semibold ${catObj.badgeClass}`}
                        >
                          {catObj.label}
                        </span>
                        <span
                          className={`rounded-md px-2 py-0.5 text-[10px] font-mono font-bold uppercase ${
                            task.priority === "urgent"
                              ? "bg-red-100 text-red-700 dark:bg-red-950/70 dark:text-red-300"
                              : task.priority === "high"
                              ? "bg-amber-100 text-amber-700 dark:bg-amber-950/70 dark:text-amber-300"
                              : "bg-slate-100 text-slate-600 dark:bg-zinc-800 dark:text-zinc-400"
                          }`}
                        >
                          {task.priority}
                        </span>
                        <span className="inline-flex items-center gap-1 text-[11px] font-mono text-slate-500">
                          <Calendar className="h-3 w-3" />
                          Due: {task.dueDate}
                        </span>
                      </div>

                      <h4
                        className={`text-sm font-bold ${
                          task.status === "completed"
                            ? "line-through text-slate-500"
                            : "text-slate-900 dark:text-zinc-100"
                        }`}
                      >
                        {task.title}
                      </h4>

                      {task.description && (
                        <p className="text-xs text-slate-600 dark:text-zinc-400">
                          {task.description}
                        </p>
                      )}

                      <div className="flex flex-wrap items-center gap-3 pt-1 text-[11px] text-slate-500 dark:text-zinc-400">
                        {task.assignedTruckCode && (
                          <span className="inline-flex items-center gap-1 font-mono font-semibold text-slate-700 dark:text-zinc-300">
                            <Truck className="h-3 w-3 text-blue-600" />
                            {task.assignedTruckCode}
                          </span>
                        )}
                        {task.assignedDriverName && (
                          <span className="inline-flex items-center gap-1 font-semibold text-slate-700 dark:text-zinc-300">
                            <User className="h-3 w-3 text-emerald-600" />
                            {task.assignedDriverName}
                          </span>
                        )}
                        {task.routeCorridor && (
                          <span className="inline-flex items-center gap-1">
                            <Route className="h-3 w-3 text-amber-600" />
                            {task.routeCorridor}
                          </span>
                        )}
                        {(task.costEstimateMad || 0) > 0 && (
                          <span className="font-mono font-bold text-slate-800 dark:text-zinc-200">
                            Est: {task.costEstimateMad?.toLocaleString()} MAD
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="flex flex-wrap sm:flex-nowrap items-center gap-2 shrink-0">
                      <select
                        value={task.status}
                        onChange={(e) =>
                          handleQuickStatusChange(
                            task,
                            e.target.value as FleetOperationalTask["status"]
                          )
                        }
                        className={`rounded-lg border px-2.5 py-1.5 text-xs font-bold ${
                          task.status === "completed"
                            ? "bg-emerald-50 border-emerald-200 text-emerald-700 dark:bg-emerald-950/60 dark:border-emerald-800 dark:text-emerald-300"
                            : task.status === "in_progress"
                            ? "bg-blue-50 border-blue-200 text-blue-700 dark:bg-blue-950/60 dark:border-blue-800 dark:text-blue-300"
                            : "bg-amber-50 border-amber-200 text-amber-700 dark:bg-amber-950/60 dark:border-amber-800 dark:text-amber-300"
                        }`}
                      >
                        <option value="pending">⏳ Pending</option>
                        <option value="in_progress">🔄 In Progress</option>
                        <option value="completed">✓ Completed</option>
                      </select>

                      <button
                        type="button"
                        onClick={() => handleLoadTaskForEdit(task)}
                        className="rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 p-2 text-slate-700 dark:text-zinc-200"
                        title="Edit Task"
                      >
                        <Edit3 className="h-3.5 w-3.5" />
                      </button>

                      <button
                        type="button"
                        onClick={() =>
                          setDeleteRequest({
                            title: "Are you sure you want to delete this Task?",
                            itemName: task.title,
                            description: `${catObj.label} • Due ${task.dueDate}. This task will be removed from this client instance.`,
                            onConfirm: () => {
                              onDeleteTask(task.id);
                              triggerToast(`Task "${task.title}" deleted.`);
                            },
                          })
                        }
                        className="rounded-lg bg-red-50 hover:bg-red-100 dark:bg-red-950/50 dark:hover:bg-red-900/60 p-2 text-red-600 dark:text-red-300"
                        title="Delete Task"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      <ConfirmDeleteModal
        request={deleteRequest}
        onCancel={() => setDeleteRequest(null)}
      />
    </div>
  );
}
