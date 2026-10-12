import { describe, it, expect } from "vitest";
import {
  isWithinQuietHours,
  processNotificationDelivery,
  type NotificationPayload,
} from "@/lib/notifications/service";

describe("Notifications Service", () => {
  it("detects overnight quiet hours correctly", () => {
    // 22:00 to 07:00
    const timeAtNight = new Date("2026-10-12T23:30:00");
    const timeAtEarlyMorning = new Date("2026-10-12T05:00:00");
    const timeDuringDay = new Date("2026-10-12T14:00:00");

    expect(isWithinQuietHours(timeAtNight, "22:00", "07:00")).toBe(true);
    expect(isWithinQuietHours(timeAtEarlyMorning, "22:00", "07:00")).toBe(true);
    expect(isWithinQuietHours(timeDuringDay, "22:00", "07:00")).toBe(false);
  });

  it("suppresses notifications during active quiet hours", async () => {
    const payload: NotificationPayload = {
      userId: "user-1",
      title: "Task Reminder",
      message: "Assignment due tomorrow",
      channel: "in_app",
      scheduledFor: new Date().toISOString(),
      idempotencyKey: "idem-1",
    };

    const res = await processNotificationDelivery(payload, true);
    expect(res.status).toBe("cancelled");
  });

  it("honestly marks missing push credentials as unconfigured", async () => {
    const payload: NotificationPayload = {
      userId: "user-1",
      title: "Push Reminder",
      message: "Study block starting",
      channel: "browser_push",
      scheduledFor: new Date().toISOString(),
      idempotencyKey: "idem-2",
    };

    const res = await processNotificationDelivery(payload, false);
    // Since VAPID keys are not provided in testing environment:
    expect(res.status).toBe("unconfigured");
    expect(res.errorMessage).toContain("Web Push (VAPID)");
  });
});
