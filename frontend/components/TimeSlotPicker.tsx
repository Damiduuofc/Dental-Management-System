"use client";

import React, { useEffect, useState } from "react";
import { TIME_SLOTS, isSlotInPast } from "@/lib/timeSlots";

interface TimeSlotPickerProps {
  dentistId?: string;
  date: string;
  value: string;
  onChange: (slot: string) => void;
  // When rescheduling, the appointment's own current slot should not count as booked
  ignoreSlot?: { date: string; time: string };
}

export default function TimeSlotPicker({ dentistId, date, value, onChange, ignoreSlot }: TimeSlotPickerProps) {
  const [bookedSlots, setBookedSlots] = useState<string[]>([]);

  useEffect(() => {
    if (!dentistId || !date) {
      setBookedSlots([]);
      return;
    }

    const fetchBookedSlots = async () => {
      try {
        const token = localStorage.getItem("token");
        const res = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:5009"}/api/admin/appointments/booked-slots?dentistId=${dentistId}&date=${date}`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        if (res.ok) {
          const data: string[] = await res.json();
          setBookedSlots(
            ignoreSlot && ignoreSlot.date === date ? data.filter((slot) => slot !== ignoreSlot.time) : data
          );
        }
      } catch (err) {
        console.error("Error fetching booked slots:", err);
      }
    };

    fetchBookedSlots();
  }, [dentistId, date, ignoreSlot?.date, ignoreSlot?.time]);

  // Drop the selection if it becomes unavailable for the chosen date
  useEffect(() => {
    if (value && (bookedSlots.includes(value) || isSlotInPast(date, value))) {
      onChange("");
    }
  }, [bookedSlots, date]);

  if (!date) {
    return <p className="text-xs text-slate-400 font-medium">Select a date to see available time slots.</p>;
  }

  return (
    <div className="flex flex-wrap gap-2">
      {TIME_SLOTS.map((slot) => {
        const isSelected = value === slot;
        const isDisabled = bookedSlots.includes(slot) || isSlotInPast(date, slot);

        return (
          <button
            type="button"
            key={slot}
            disabled={isDisabled}
            onClick={() => onChange(slot)}
            className={`px-4 py-2.5 rounded-full text-xs font-bold border transition ${
              isSelected
                ? "bg-blue-600 border-blue-600 text-white shadow-md shadow-blue-100"
                : isDisabled
                ? "bg-gray-100 border-gray-200 text-gray-400 cursor-not-allowed opacity-50"
                : "bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100 cursor-pointer"
            }`}
          >
            {slot}
          </button>
        );
      })}
    </div>
  );
}
