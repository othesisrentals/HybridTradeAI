"use client";

import { useCallback, useEffect, useState } from "react";

interface AdTaskResponse {
  id: string;
  title: string;
  description: string | null;
  type: string;
  rewardAmount: string;
  userShare: string;
  canComplete: boolean;
  metadata?: Record<string, unknown> | null;
}

interface StartTaskResponse {
  completionId: string;
  instructions: string;
  adUnitId?: string;
}

export function AdTasksDashboard() {
  const [tasks, setTasks] = useState<AdTaskResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTask, setActiveTask] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const loadTasks = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/user/ads/tasks", { cache: "no-store" });
      if (!response.ok) {
        throw new Error("Failed to load tasks");
      }
      const data = await response.json();
      setTasks(data.tasks ?? []);
    } catch (err) {
      console.error("Failed to load tasks", err);
      setError("Unable to load tasks at the moment. Please try again later.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadTasks();
  }, [loadTasks]);

  const startTask = useCallback(
    async (taskId: string) => {
      setActiveTask(taskId);
      setError(null);

      try {
        const response = await fetch(`/api/user/ads/tasks/${taskId}/start`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ platform: "WEB" }),
        });

        const data: StartTaskResponse & { error?: string } = await response.json();

        if (!response.ok) {
          throw new Error(data.error ?? "Unable to start task");
        }

        initializeTaskSession(data);
      } catch (err) {
        console.error("Failed to start task", err);
        setError(err instanceof Error ? err.message : "Failed to start task");
      } finally {
        setActiveTask(null);
      }
    },
    [],
  );

  const initializeTaskSession = (result: StartTaskResponse) => {
    console.info("Starting ad session", result);

    // Simulate completion acknowledgement for demo purposes.
    setTimeout(() => {
      simulateCompletion(result.completionId).catch((error) =>
        console.error("Simulated completion failed", error),
      );
    }, 4000);
  };

  const simulateCompletion = async (completionId: string) => {
    await fetch("/api/webhooks/ads/complete", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ completion_id: completionId, success: true }),
    });

    await loadTasks();
  };

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-blue-500 border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="rounded-lg border border-blue-100 bg-gradient-to-r from-blue-50 to-purple-50 p-6">
        <h2 className="text-2xl font-semibold text-gray-900">Earn Extra Rewards</h2>
        <p className="mt-2 text-sm text-gray-600">
          Complete partner tasks to earn additional cash rewards. All verified earnings are paid directly to your withdrawal balance.
        </p>
      </div>

      {error ? (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {error}
        </div>
      ) : null}

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {tasks.map((task) => {
          const reward = Number(task.userShare ?? task.rewardAmount);
          const formattedReward = Number.isFinite(reward) ? reward.toFixed(2) : task.rewardAmount;

          return (
            <div key={task.id} className="flex h-full flex-col rounded-lg border border-gray-200 bg-white p-5 shadow-sm">
              <div className="flex items-start justify-between">
                <span className="rounded-full bg-blue-100 px-2 py-1 text-xs font-medium text-blue-700">
                  {task.type.replace(/_/g, " ")}
                </span>
                <span className="text-lg font-semibold text-green-600">${formattedReward}</span>
              </div>

              <h3 className="mt-3 text-base font-semibold text-gray-900">{task.title}</h3>
              {task.description ? (
                <p className="mt-2 flex-1 text-sm text-gray-600">{task.description}</p>
              ) : (
                <p className="mt-2 flex-1 text-sm text-gray-500">Complete this task to earn extra rewards.</p>
              )}

              <div className="mt-4 flex items-center justify-between">
                <span className="text-xs text-gray-500">{task.canComplete ? "Available now" : "On cooldown"}</span>
                <button
                  type="button"
                  onClick={() => startTask(task.id)}
                  disabled={!task.canComplete || activeTask === task.id}
                  className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {activeTask === task.id ? "Starting..." : task.canComplete ? "Start Task" : "Unavailable"}
                </button>
              </div>
              {!task.canComplete ? (
                <p className="mt-2 text-xs text-orange-600">Daily limit reached or cooldown in effect.</p>
              ) : null}
            </div>
          );
        })}
      </div>

      {tasks.length === 0 && !error ? (
        <div className="rounded-lg border border-dashed border-gray-200 p-8 text-center text-sm text-gray-500">
          No tasks are currently available. Please check back later.
        </div>
      ) : null}
    </div>
  );
}
